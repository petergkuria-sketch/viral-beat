import OpenAI from "openai";
import type { AIProvider, ProviderCapabilities } from "../provider.interface";
import {
  AIProviderError,
  type AIRequest,
  type AIResponse,
  type AIToolCall,
} from "../../types";

interface OpenAIProviderOptions {
  apiKey?: string;
  defaultModel?: string;
  baseURL?: string;
}

/**
 * Wraps the OpenAI SDK behind the uniform AIProvider interface.
 * Hides OpenAI-specific details: system is a message (role: "system"),
 * tools are { type: "function", function: {...} }, structured output uses
 * response_format, and usage uses prompt/completion token names.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  readonly defaultModel: string;
  private client: OpenAI;

  constructor(opts: OpenAIProviderOptions = {}) {
    const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    if (!apiKey) throw new AIProviderError("openai", "OPENAI_API_KEY is not configured");
    this.client = new OpenAI({ apiKey, ...(opts.baseURL ? { baseURL: opts.baseURL } : {}) });
    this.defaultModel = opts.defaultModel ?? process.env.OPENAI_MODEL ?? "gpt-4o";
  }

  capabilities(): ProviderCapabilities {
    return { tools: true, jsonMode: true, streaming: true, vision: true };
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const model = request.model ?? this.defaultModel;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (request.system) messages.push({ role: "system", content: request.system });
    for (const m of request.messages) {
      if (m.role === "tool") {
        messages.push({ role: "tool", content: m.content, tool_call_id: m.toolCallId ?? "" });
      } else {
        messages.push({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam);
      }
    }

    const tools: OpenAI.Chat.ChatCompletionTool[] | undefined = request.tools?.map(t => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    let toolChoice: OpenAI.Chat.ChatCompletionToolChoiceOption | undefined;
    if (request.toolChoice === "required") toolChoice = "required";
    else if (request.toolChoice === "auto") toolChoice = "auto";
    else if (request.toolChoice && typeof request.toolChoice === "object") {
      toolChoice = { type: "function", function: { name: request.toolChoice.name } };
    }

    let responseFormat: OpenAI.Chat.Completions.ChatCompletionCreateParams["response_format"];
    const rf = request.responseFormat;
    if (rf?.type === "json_object") responseFormat = { type: "json_object" };
    else if (rf?.type === "json_schema") {
      responseFormat = {
        type: "json_schema",
        json_schema: { name: rf.name ?? "structured_output", schema: rf.schema, strict: true },
      };
    }

    const start = Date.now();
    let resp: OpenAI.Chat.Completions.ChatCompletion;
    try {
      resp = await this.client.chat.completions.create({
        model,
        messages,
        ...(request.maxTokens != null ? { max_tokens: request.maxTokens } : {}),
        ...(request.temperature != null ? { temperature: request.temperature } : {}),
        ...(tools ? { tools } : {}),
        ...(toolChoice ? { tool_choice: toolChoice } : {}),
        ...(responseFormat ? { response_format: responseFormat } : {}),
      });
    } catch (e: any) {
      throw new AIProviderError("openai", e?.message ?? "OpenAI request failed", {
        status: e?.status,
        retryable: isRetryable(e?.status),
        cause: e,
      });
    }
    const latencyMs = Date.now() - start;

    const choice = resp.choices[0];
    const text = typeof choice?.message?.content === "string" ? choice.message.content : "";
    const toolCalls: AIToolCall[] = (choice?.message?.tool_calls ?? [])
      .filter((tc): tc is OpenAI.Chat.ChatCompletionMessageToolCall & { type: "function" } => (tc as any).type === "function")
      .map(tc => ({ id: tc.id, name: tc.function.name, arguments: tc.function.arguments }));

    return {
      provider: this.name,
      model: resp.model,
      text,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      finishReason: choice?.finish_reason ?? null,
      usage: {
        promptTokens: resp.usage?.prompt_tokens ?? 0,
        completionTokens: resp.usage?.completion_tokens ?? 0,
        totalTokens: resp.usage?.total_tokens ?? 0,
      },
      latencyMs,
      raw: resp,
    };
  }
}

function isRetryable(status?: number): boolean {
  return status === 429 || (typeof status === "number" && status >= 500);
}
