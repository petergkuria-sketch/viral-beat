// Provider-neutral AI contracts. No vendor SDK types appear here — every
// provider maps its own SDK shapes to/from these. Business logic and the
// orchestrator only ever speak in these types.

export type ProviderName = "claude" | "openai" | "gemini";

export type AIRole = "system" | "user" | "assistant" | "tool";

export interface AIMessage {
  role: AIRole;
  content: string;
  /** For role: "tool" — the id of the tool call this message answers. */
  toolCallId?: string;
  /** Optional tool/function name (tool results). */
  name?: string;
}

export interface AITool {
  name: string;
  description?: string;
  /** JSON Schema for the tool's parameters. */
  parameters: Record<string, unknown>;
}

export type AIToolChoice = "auto" | "required" | { name: string };

export type AIResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; name?: string; schema: Record<string, unknown> };

/** The single, uniform request every provider's generate() accepts. */
export interface AIRequest {
  /** Optional — provider uses its configured default when omitted. */
  model?: string;
  /** System / developer instruction. */
  system?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  tools?: AITool[];
  toolChoice?: AIToolChoice;
  responseFormat?: AIResponseFormat;
  /** Free-form metadata for observability (taskType, requestId, userId…). */
  metadata?: Record<string, unknown>;
}

export interface AIToolCall {
  id: string;
  name: string;
  /** JSON-encoded arguments. */
  arguments: string;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** The single, uniform response every provider's generate() returns. */
export interface AIResponse {
  provider: ProviderName;
  model: string;
  /** Assistant text (empty string if the turn was purely tool calls). */
  text: string;
  toolCalls?: AIToolCall[];
  finishReason: string | null;
  usage: AIUsage;
  latencyMs: number;
  /** Raw provider payload, for debugging/telemetry. Never relied on by callers. */
  raw?: unknown;
}

export class AIProviderError extends Error {
  provider: ProviderName;
  status?: number;
  retryable: boolean;
  constructor(provider: ProviderName, message: string, opts?: { status?: number; retryable?: boolean; cause?: unknown }) {
    super(message);
    this.name = "AIProviderError";
    this.provider = provider;
    this.status = opts?.status;
    this.retryable = opts?.retryable ?? false;
    if (opts?.cause) (this as any).cause = opts.cause;
  }
}
