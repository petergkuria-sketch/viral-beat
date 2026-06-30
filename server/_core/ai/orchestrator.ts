import Anthropic from "@anthropic-ai/sdk";
import { ClaudeProvider } from "./providers/claude/claude.provider";
import { OpenAIProvider } from "./providers/openai/openai.provider";
import { MoonshotProvider } from "./providers/moonshot/moonshot.provider";
import { AIRouter } from "./routing/router";
import { TIER_LADDER, TIER_MODEL } from "./routing/routing.policy";
import type { AIProvider } from "./providers/provider.interface";
import type { AIRequest, AIResponse, ProviderName } from "./types";
import { recordUsage } from "./observability/metrics";
import { computeCost } from "./observability/cost";

/**
 * Single entry point for every AI request in the application.
 *
 *   Application → Orchestrator → Router → (OpenAI | Claude) Provider → LLMs
 *
 * Routing is ON by default and availability-aware: the router picks a provider
 * by task, but the orchestrator only dispatches to providers whose API key is
 * configured. With just ANTHROPIC_API_KEY set, every request still resolves to
 * Claude (behavior unchanged); add OPENAI_API_KEY and OpenAI-routed tasks start
 * flowing to OpenAI, with Claude as fallback. Set AI_ROUTING_ENABLED=false to
 * force Claude-only.
 */
const ROUTING_ENABLED = process.env.AI_ROUTING_ENABLED !== "false";

function isConfigured(name: ProviderName): boolean {
  if (name === "claude") return !!process.env.ANTHROPIC_API_KEY;
  if (name === "openai") return !!process.env.OPENAI_API_KEY;
  if (name === "gemini") return !!process.env.GOOGLE_API_KEY;
  if (name === "moonshot") return !!process.env.MOONSHOT_API_KEY;
  return false;
}

const REFUSAL_RE = /\b(i (cannot|can'?t|am unable to|won'?t)|i'?m (sorry|unable)|as an ai|i do not have the ability)\b/i;

/**
 * Quality gate for the escalation ladder. Conservative by design — it only
 * flags egregious failures (empty output, refusal) so we don't over-escalate
 * and erode the cost saving. Deeper "lacks depth / hallucination" judging would
 * require an LLM judge (an opt-in extension); this catches the clear cases.
 */
function evaluateQuality(resp: AIResponse): { ok: boolean; reason?: string } {
  const text = (resp.text ?? "").trim();
  if (!text && (!resp.toolCalls || resp.toolCalls.length === 0)) {
    return { ok: false, reason: "empty response" };
  }
  if (text && text.length < 400 && REFUSAL_RE.test(text)) {
    return { ok: false, reason: "model declined / refused the task" };
  }
  return { ok: true };
}

/**
 * Contextual handoff — when escalating, give the higher tier the original task,
 * the failed lower-tier output, and why it was inadequate.
 */
function withHandoff(
  request: AIRequest,
  prevTier: ProviderName | undefined,
  prevText: string | undefined,
  reason: string | undefined,
): AIRequest {
  const note = [
    `[Escalation] A lower-tier model${prevTier ? ` (${prevTier})` : ""} attempted this task and the result was inadequate: ${reason ?? "unspecified"}.`,
    prevText ? `\nIts attempt was:\n"""\n${prevText.slice(0, 4000)}\n"""` : "",
    `\nProduce a correct, complete, high-quality answer that fixes the specific deficiency above. The original task and context follow unchanged.`,
  ].join("");
  return { ...request, system: request.system ? `${request.system}\n\n${note}` : note };
}

/** Which provider a model string belongs to, so we never cross-feed models. */
function modelFamily(model?: string): ProviderName | null {
  if (!model) return null;
  if (/^claude/i.test(model)) return "claude";
  if (/^(gpt|o\d|chatgpt|text-|davinci)/i.test(model)) return "openai";
  if (/^gemini/i.test(model)) return "gemini";
  if (/^(kimi|moonshot)/i.test(model)) return "moonshot";
  return null;
}

class AIOrchestrator {
  private factories: Partial<Record<ProviderName, () => AIProvider>> = {};
  private instances = new Map<ProviderName, AIProvider>();
  private router = new AIRouter();

  constructor() {
    // Providers are instantiated lazily — a missing OPENAI_API_KEY never throws
    // while routing is off, because the OpenAI provider is never constructed.
    this.factories.claude = () => new ClaudeProvider();
    this.factories.openai = () => new OpenAIProvider();
    this.factories.moonshot = () => new MoonshotProvider();
  }

  private provider(name: ProviderName): AIProvider {
    const cached = this.instances.get(name);
    if (cached) return cached;
    const make = this.factories[name];
    if (!make) throw new Error(`No AI provider registered for "${name}"`);
    const instance = make();
    this.instances.set(name, instance);
    return instance;
  }

  /**
   * The single call all business logic should use. Implements the cost-effective
   * three-tier escalation ladder (Economy → Standard → Premium):
   *   1. Start at Tier 1 (Moonshot/Kimi) unless complexity triggers → Tier 2.
   *   2. Run the tier; evaluate the output (provider error, refusal, empty).
   *   3. On failure, escalate to the next configured tier with a contextual
   *      handoff (original prompt + failed output + reason).
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const userId = (request.metadata?.userId as string | undefined) ?? null;

    if (!ROUTING_ENABLED) {
      // Explicit override: skip the ladder, go straight to Premium.
      return this.run("claude", request.model ?? TIER_MODEL.claude, request, { userId, taskType: null });
    }

    const decision = this.router.route(request);

    // Build the escalation chain from the start tier upward, keeping only
    // providers whose key is configured. Fall back to any configured provider.
    let chain = TIER_LADDER.slice(decision.startTier).filter(isConfigured);
    if (chain.length === 0) chain = TIER_LADDER.filter(isConfigured);
    if (chain.length === 0) chain = ["claude"];

    let lastErr: unknown;
    let prevText: string | undefined;
    let prevTier: ProviderName | undefined;
    let prevReason: string | undefined;

    for (let i = 0; i < chain.length; i++) {
      const name = chain[i];
      const isLast = i === chain.length - 1;

      // Model: requested model if it belongs to this tier's family, else the
      // tier's preferred model.
      const model = modelFamily(request.model) === name ? request.model : TIER_MODEL[name];

      // On escalation, hand the higher tier the original task + the failed
      // attempt + why it failed.
      const req = prevText !== undefined || prevReason
        ? withHandoff(request, prevTier, prevText, prevReason)
        : request;

      try {
        const resp = await this.run(name, model, req, { userId, taskType: decision.taskType });
        const verdict = evaluateQuality(resp);
        if (verdict.ok || isLast) return resp;
        // Output inadequate — escalate with context.
        prevText = resp.text;
        prevTier = name;
        prevReason = verdict.reason;
      } catch (err) {
        lastErr = err;
        prevText = undefined;
        prevTier = name;
        prevReason = `provider error: ${(err as any)?.message ?? String(err)}`;
      }
    }
    if (lastErr) throw lastErr;
    throw new Error("All tiers exhausted without a usable response");
  }

  /** Runs one provider attempt and records telemetry (success or failure). */
  private async run(
    name: ProviderName,
    model: string | undefined,
    request: AIRequest,
    ctx: { userId: string | null; taskType: string | null },
  ): Promise<AIResponse> {
    const start = Date.now();
    try {
      const resp = await this.provider(name).generate({ ...request, model });
      void recordUsage({
        provider: resp.provider,
        model: resp.model,
        taskType: ctx.taskType,
        tokensIn: resp.usage.promptTokens,
        tokensOut: resp.usage.completionTokens,
        costUsd: computeCost(resp.provider, resp.model, resp.usage),
        latencyMs: resp.latencyMs,
        status: "success",
        userId: ctx.userId,
      });
      return resp;
    } catch (err) {
      void recordUsage({
        provider: name,
        model: model ?? null,
        taskType: ctx.taskType,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: Date.now() - start,
        status: "failure",
        errorMessage: (err as any)?.message ?? String(err),
        userId: ctx.userId,
      });
      throw err;
    }
  }

  /**
   * Low-level access to the managed Anthropic SDK client. Used only by the
   * legacy invokeLLM mapper so that no `new Anthropic()` lives outside the
   * orchestrator. New code should call generate().
   */
  anthropic(): Anthropic {
    return (this.provider("claude") as ClaudeProvider).getSdkClient();
  }

  /**
   * Health-check a single provider with a minimal request — NO routing, NO
   * fallback — so the result reflects that provider only. Distinguishes a bad
   * key from a missing-credits situation.
   */
  async pingProvider(name: ProviderName): Promise<{
    ok: boolean; provider: ProviderName; model?: string; latencyMs?: number;
    status?: number; error?: string; hint?: string;
  }> {
    if (!isConfigured(name)) {
      return { ok: false, provider: name, error: "API key not configured", hint: "Set the provider's API key in the environment." };
    }
    try {
      const r = await this.provider(name).generate({
        messages: [{ role: "user", content: "ping" }],
        maxTokens: 5,
      });
      return { ok: true, provider: r.provider, model: r.model, latencyMs: r.latencyMs };
    } catch (e: any) {
      const status: number | undefined = e?.status;
      const msg: string = e?.message ?? String(e);
      let hint: string | undefined;
      if (status === 401 || /invalid.*api key|incorrect api key|authentication/i.test(msg)) {
        hint = "Key appears INVALID — check the value.";
      } else if (status === 429 || /quota|insufficient_quota|billing|credit/i.test(msg)) {
        hint = "Key is VALID and wired — provider reports no credits/quota. Add billing.";
      } else {
        hint = "Key reached the provider but the call errored — see message.";
      }
      return { ok: false, provider: name, status, error: msg, hint };
    }
  }
}

let singleton: AIOrchestrator | null = null;

/** Returns the process-wide orchestrator instance. */
export function getOrchestrator(): AIOrchestrator {
  if (!singleton) singleton = new AIOrchestrator();
  return singleton;
}

export type { AIOrchestrator };
