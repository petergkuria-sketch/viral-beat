import Anthropic from "@anthropic-ai/sdk";
import { ClaudeProvider } from "./providers/claude/claude.provider";
import { OpenAIProvider } from "./providers/openai/openai.provider";
import { AIRouter } from "./routing/router";
import type { AIProvider } from "./providers/provider.interface";
import type { AIRequest, AIResponse, ProviderName } from "./types";

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
  return false;
}

/** Which provider a model string belongs to, so we never cross-feed models. */
function modelFamily(model?: string): ProviderName | null {
  if (!model) return null;
  if (/^claude/i.test(model)) return "claude";
  if (/^(gpt|o\d|chatgpt|text-|davinci)/i.test(model)) return "openai";
  if (/^gemini/i.test(model)) return "gemini";
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

  /** The single call all business logic should use. */
  async generate(request: AIRequest): Promise<AIResponse> {
    if (!ROUTING_ENABLED) {
      return this.provider("claude").generate(request);
    }

    const decision = this.router.route(request);

    // Build the attempt order: chosen provider, then fallback. Keep only
    // providers whose key is configured; if none are, fall back to Claude.
    const chain: ProviderName[] = [];
    for (const name of [decision.provider, decision.fallback]) {
      if (!chain.includes(name) && isConfigured(name)) chain.push(name);
    }
    if (chain.length === 0) chain.push("claude");

    let lastErr: unknown;
    for (const name of chain) {
      // Pick a model valid for THIS provider:
      //  • the requested model only if it belongs to this provider's family,
      //  • else the policy hint (only meaningful for the chosen provider),
      //  • else undefined → the provider's own default.
      const requestedFitsProvider = modelFamily(request.model) === name;
      const model = requestedFitsProvider
        ? request.model
        : (name === decision.provider ? decision.model : undefined);
      try {
        return await this.provider(name).generate({ ...request, model });
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  }

  /**
   * Low-level access to the managed Anthropic SDK client. Used only by the
   * legacy invokeLLM mapper so that no `new Anthropic()` lives outside the
   * orchestrator. New code should call generate().
   */
  anthropic(): Anthropic {
    return (this.provider("claude") as ClaudeProvider).getSdkClient();
  }
}

let singleton: AIOrchestrator | null = null;

/** Returns the process-wide orchestrator instance. */
export function getOrchestrator(): AIOrchestrator {
  if (!singleton) singleton = new AIOrchestrator();
  return singleton;
}

export type { AIOrchestrator };
