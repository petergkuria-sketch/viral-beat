import { getOrchestrator } from "./ai/orchestrator";
import type {
  AIRequest, AIResponse, AIMessage, AITool, AIToolChoice, AIResponseFormat,
} from "./ai/types";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// ── Helpers ───────────────────────────────────────────────────────────────────

// Preferred model for this legacy path. It's a Claude model, so the
// orchestrator's model-family guard keeps Claude-routed calls on Haiku exactly
// as before (no cost change); OpenAI-routed tasks use the policy's gpt-4o-mini.
const PREFERRED_MODEL = "claude-haiku-4-5-20251001";

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const resolveSchema = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: Pick<InvokeParams, "responseFormat" | "response_format" | "outputSchema" | "output_schema">): JsonSchema | null => {
  const explicit = responseFormat || response_format;
  if (explicit?.type === "json_schema") return explicit.json_schema;
  const schema = outputSchema || output_schema;
  if (schema) return schema;
  return null;
};

const flattenContent = (content: MessageContent | MessageContent[]): string =>
  ensureArray(content)
    .map(p => (typeof p === "string" ? p : p.type === "text" ? p.text : JSON.stringify(p)))
    .join("\n");

// InvokeParams (OpenAI-shaped) → provider-neutral AIRequest.
function toAIRequest(params: InvokeParams): AIRequest {
  const systemParts: string[] = [];
  const messages: AIMessage[] = [];
  for (const m of params.messages) {
    if (m.role === "system") { systemParts.push(flattenContent(m.content)); continue; }
    messages.push({
      role: (m.role === "function" ? "tool" : m.role) as AIMessage["role"],
      content: flattenContent(m.content),
      toolCallId: m.tool_call_id,
      name: m.name,
    });
  }

  const tools: AITool[] | undefined = params.tools?.map(t => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters ?? { type: "object", properties: {} },
  }));

  const tc = params.toolChoice ?? params.tool_choice;
  let toolChoice: AIToolChoice | undefined;
  if (tc === "auto") toolChoice = "auto";
  else if (tc === "required") toolChoice = "required";
  else if (tc && typeof tc === "object") toolChoice = "name" in tc ? { name: tc.name } : { name: tc.function.name };
  // "none" → leave undefined

  const schema = resolveSchema(params);
  const explicit = params.responseFormat ?? params.response_format;
  let responseFormat: AIResponseFormat | undefined;
  if (schema) responseFormat = { type: "json_schema", name: schema.name, schema: schema.schema };
  else if (explicit?.type === "json_object") responseFormat = { type: "json_object" };

  return {
    model: PREFERRED_MODEL,
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    messages,
    maxTokens: params.maxTokens ?? params.max_tokens,
    tools,
    toolChoice,
    responseFormat,
  };
}

// Provider-neutral AIResponse → OpenAI-shaped InvokeResult (unchanged contract).
let _seq = 0;
function toInvokeResult(r: AIResponse): InvokeResult {
  const tool_calls: ToolCall[] | undefined = r.toolCalls?.map(tc => ({
    id: tc.id,
    type: "function",
    function: { name: tc.name, arguments: tc.arguments },
  }));
  return {
    id: `ai_${Date.now()}_${_seq++}`,
    created: Math.floor(Date.now() / 1000),
    model: r.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: r.text,
          ...(tool_calls && tool_calls.length > 0 ? { tool_calls } : {}),
        },
        finish_reason: r.finishReason,
      },
    ],
    usage: {
      prompt_tokens: r.usage.promptTokens,
      completion_tokens: r.usage.completionTokens,
      total_tokens: r.usage.totalTokens,
    },
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

// Routes through the AI Orchestrator (router → provider → fallback → telemetry).
// Signature and return shape are unchanged, so all callers are untouched.
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const response = await getOrchestrator().generate(toAIRequest(params));
  return toInvokeResult(response);
}
