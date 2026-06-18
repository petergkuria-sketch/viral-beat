import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";

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

// Convert OpenAI-style messages to Anthropic format.
// Returns { system, messages } where system is the extracted system prompt.
function toAnthropicMessages(messages: Message[]): {
  system: string | undefined;
  messages: Anthropic.MessageParam[];
} {
  const systemParts: string[] = [];
  const result: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    const { role, content, tool_call_id } = msg;

    if (role === "system") {
      const text = ensureArray(content)
        .map(p => (typeof p === "string" ? p : "text" in p ? p.text : JSON.stringify(p)))
        .join("\n");
      systemParts.push(text);
      continue;
    }

    // tool/function results → Anthropic tool_result block inside a user message
    if (role === "tool" || role === "function") {
      const text = ensureArray(content)
        .map(p => (typeof p === "string" ? p : JSON.stringify(p)))
        .join("\n");
      result.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: tool_call_id ?? "unknown",
            content: text,
          } as Anthropic.ToolResultBlockParam,
        ],
      });
      continue;
    }

    // user / assistant
    const parts = ensureArray(content);
    const anthropicContent: Anthropic.ContentBlockParam[] = parts.map(p => {
      if (typeof p === "string") return { type: "text", text: p };
      if (p.type === "text") return { type: "text", text: p.text };
      if (p.type === "image_url") {
        const url = p.image_url.url;
        if (url.startsWith("data:")) {
          const [meta, data] = url.split(",");
          const mediaType = meta.split(":")[1].split(";")[0] as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp";
          return {
            type: "image",
            source: { type: "base64", media_type: mediaType, data },
          } as Anthropic.ImageBlockParam;
        }
        return {
          type: "image",
          source: { type: "url", url },
        } as Anthropic.ImageBlockParam;
      }
      // file_url — unsupported natively; pass as text reference
      return { type: "text", text: JSON.stringify(p) };
    });

    result.push({
      role: role as "user" | "assistant",
      content: anthropicContent.length === 1 && anthropicContent[0].type === "text"
        ? (anthropicContent[0] as Anthropic.TextBlockParam).text
        : anthropicContent,
    });
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    messages: result,
  };
}

function toAnthropicTools(tools: Tool[]): Anthropic.Tool[] {
  return tools.map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: (t.function.parameters ?? { type: "object", properties: {} }) as Anthropic.Tool["input_schema"],
  }));
}

function toAnthropicToolChoice(
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): Anthropic.ToolChoiceAuto | Anthropic.ToolChoiceTool | undefined {
  if (!toolChoice) return undefined;
  if (toolChoice === "none") return undefined;
  if (toolChoice === "auto") return { type: "auto" };
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) throw new Error("tool_choice required but no tools provided");
    return { type: "tool", name: tools[0].function.name };
  }
  if ("name" in toolChoice) return { type: "tool", name: toolChoice.name };
  if ("type" in toolChoice && toolChoice.type === "function") {
    return { type: "tool", name: toolChoice.function.name };
  }
  return undefined;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    maxTokens,
    max_tokens,
  } = params;

  const jsonSchema = resolveSchema(params);

  const { system, messages: anthropicMessages } = toAnthropicMessages(messages);

  // Build tools list — inject synthetic schema tool if response_format asks for structured JSON
  let anthropicTools: Anthropic.Tool[] | undefined = tools ? toAnthropicTools(tools) : undefined;
  let anthropicToolChoice: Anthropic.ToolChoiceAuto | Anthropic.ToolChoiceTool | undefined =
    toAnthropicToolChoice(toolChoice ?? tool_choice, tools);

  if (jsonSchema) {
    const schemaName = jsonSchema.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const syntheticTool: Anthropic.Tool = {
      name: schemaName,
      description: `Respond using the ${schemaName} schema`,
      input_schema: jsonSchema.schema as Anthropic.Tool["input_schema"],
    };
    anthropicTools = [syntheticTool, ...(anthropicTools ?? [])];
    anthropicToolChoice = { type: "tool", name: schemaName };
  }

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: maxTokens ?? max_tokens ?? 32768,
    thinking: { type: "adaptive" },
    ...(system ? { system } : {}),
    messages: anthropicMessages,
    ...(anthropicTools ? { tools: anthropicTools } : {}),
    ...(anthropicToolChoice ? { tool_choice: anthropicToolChoice } : {}),
  });

  // ── Map Anthropic response → OpenAI-shaped InvokeResult ─────────────────────
  let textContent = "";
  const toolCalls: ToolCall[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      textContent += block.text;
    } else if (block.type === "tool_use") {
      if (jsonSchema && block.name === jsonSchema.name.replace(/[^a-zA-Z0-9_-]/g, "_")) {
        // Structured JSON output — flatten tool input back to content string
        textContent = JSON.stringify(block.input);
      } else {
        toolCalls.push({
          id: block.id,
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }
  }

  const finishReason =
    response.stop_reason === "end_turn" ? "stop" :
    response.stop_reason === "tool_use" ? "tool_calls" :
    response.stop_reason ?? null;

  return {
    id: response.id,
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: textContent,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: finishReason,
      },
    ],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}
