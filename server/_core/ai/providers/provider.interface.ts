import type { AIRequest, AIResponse, ProviderName } from "../types";

export interface ProviderCapabilities {
  tools: boolean;
  jsonMode: boolean;
  streaming: boolean;
  vision: boolean;
}

/**
 * The contract every provider wrapper implements. ClaudeProvider and
 * OpenAIProvider (and later GeminiProvider) expose exactly this — so callers
 * and the orchestrator can swap providers without any shape differences.
 */
export interface AIProvider {
  readonly name: ProviderName;
  readonly defaultModel: string;
  capabilities(): ProviderCapabilities;
  /** The single entry point — identical signature across all providers. */
  generate(request: AIRequest): Promise<AIResponse>;
}
