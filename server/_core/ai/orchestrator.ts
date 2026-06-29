import Anthropic from "@anthropic-ai/sdk";
import { ClaudeProvider } from "./providers/claude/claude.provider";
import { OpenAIProvider } from "./providers/openai/openai.provider";
import { AIRouter } from "./routing/router";
import type { AIProvider } from "./providers/provider.interface";
import type { AIRequest, AIResponse, ProviderName } from "./types";

/**
 * Single entry point for every AI request in the application.
 *
 * Routing is GATED OFF for now: `ROUTING_ENABLED = false` means every request
 * is served by Claude, preserving current behavior exactly. Flip the flag (or
 * set AI_ROUTING_ENABLED=true) to activate task-based routing + fallback via
 * the AIRouter — no caller changes required.
 */
const ROUTING_ENABLED = process.env.AI_ROUTING_ENABLED === "true";

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
      // Always Claude until routing is enabled.
      return this.provider("claude").generate(request);
    }

    const decision = this.router.route(request);
    const model = request.model ?? decision.model;
    try {
      return await this.provider(decision.provider).generate({ ...request, model });
    } catch (err) {
      if (decision.fallback && decision.fallback !== decision.provider) {
        return this.provider(decision.fallback).generate({ ...request, model: request.model });
      }
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
}

let singleton: AIOrchestrator | null = null;

/** Returns the process-wide orchestrator instance. */
export function getOrchestrator(): AIOrchestrator {
  if (!singleton) singleton = new AIOrchestrator();
  return singleton;
}

export type { AIOrchestrator };
