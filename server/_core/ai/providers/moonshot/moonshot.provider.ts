import OpenAI from "openai";
import type { AIProvider, ProviderCapabilities } from "../provider.interface";
import {
  AIProviderError,
  type AIRequest,
  type AIResponse,
  type AIToolCall,
} from "../../types";

interface MoonshotProviderOptions {
  apiKey?: string;
  defaultModel?: string;
  baseURL?: string;
}

/**
 * Moonshot AI (Kimi) provider. Moonshot exposes an OpenAI-compatible Chat
 * Completions API, so this wraps the OpenAI SDK pointed at Moonshot's
 * international endpoint. Reports as provider "moonshot" for routing/telemetry.
 *
 * Cost-effective leg of the router (CHAT / SHORT_QA / EVERYDAY) with OpenAI →
 * Claude as fallback. Default model is overridable via MOONSHOT_MODEL.
 */
export class MoonshotProvider implements AIProvider {
  readonly name = "moonshot" as const;
  readonly defaultModel: string;
  private client: OpenAI;

  constructor(opts: MoonshotProviderOptions = {}) {
    const apiKey = opts.apiKey ?? process.env.MOONSHOT_API_KEY ?? "";
    if (!apiKey) throw new AIProviderError("moonshot", "MOONSHOT_API_KEY is not configured");
    const baseURL = opts.baseURL ?? process.env.MOONSHOT_BASE_URL ?? "https://api.moonshot.ai/v1";
    this.client = new OpenAI({ apiKey, baseURL });
    this.defaultModel = opts.defaultModel ?? process.env.MOONSHOT_MODEL ?? "moonshot-v1-8k";
  }

  capabilities(): ProviderCapabilities {
    return { tools: true, jsonMode: true, streaming: true, vision: false };
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
      throw new AIProviderError("moonshot", e?.message ?? "Moonshot request failed", {
        status: e?.status,
        retryable: e?.status === 429 || (typeof e?.status === "number" && e.status >= 500),
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
