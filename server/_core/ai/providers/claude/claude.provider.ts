import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ProviderCapabilities } from "../provider.interface";
import {
  AIProviderError,
  type AIRequest,
  type AIResponse,
  type AIToolCall,
} from "../../types";

interface ClaudeProviderOptions {
  apiKey?: string;
  defaultModel?: string;
}

const SYNTHETIC_SCHEMA_TOOL = "structured_output";

/**
 * Wraps the Anthropic SDK behind the uniform AIProvider interface.
 * Hides Claude-specific details: system is a top-level param (not a message),
 * structured JSON is emulated via a forced tool call, usage uses input/output
 * token names, and content arrives as typed blocks.
 */
export class ClaudeProvider implements AIProvider {
  readonly name = "claude" as const;
  readonly defaultModel: string;
  private client: Anthropic;

  constructor(opts: ClaudeProviderOptions = {}) {
    const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    if (!apiKey) throw new AIProviderError("claude", "ANTHROPIC_API_KEY is not configured");
    this.client = new Anthropic({ apiKey });
    this.defaultModel = opts.defaultModel ?? "claude-opus-4-8";
  }

  capabilities(): ProviderCapabilities {
    return { tools: true, jsonMode: true, streaming: true, vision: true };
  }

  /** Low-level SDK access for the legacy invokeLLM mapper. Prefer generate(). */
  getSdkClient(): Anthropic {
    return this.client;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const model = request.model ?? this.defaultModel;

    // System: explicit field wins; otherwise lift any leading system message.
    const systemFromMessages = request.messages
      .filter(m => m.role === "system")
      .map(m => m.content)
      .join("\n\n");
    const system = request.system ?? (systemFromMessages || undefined);

    const messages: Anthropic.MessageParam[] = request.messages
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    let tools: Anthropic.Tool[] | undefined = request.tools?.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters as Anthropic.Tool["input_schema"],
    }));

    let toolChoice: Anthropic.MessageCreateParams["tool_choice"];
    if (request.toolChoice === "required") toolChoice = { type: "any" };
    else if (request.toolChoice && typeof request.toolChoice === "object") toolChoice = { type: "tool", name: request.toolChoice.name };
    else if (request.toolChoice === "auto") toolChoice = { type: "auto" };

    // Structured JSON: force a synthetic tool whose schema is the desired output.
    const wantsSchema = request.responseFormat?.type === "json_schema";
    if (wantsSchema && request.responseFormat?.type === "json_schema") {
      const schemaTool: Anthropic.Tool = {
        name: SYNTHETIC_SCHEMA_TOOL,
        description: "Respond only by calling this tool with the structured result.",
        input_schema: request.responseFormat.schema as Anthropic.Tool["input_schema"],
      };
      tools = [schemaTool, ...(tools ?? [])];
      toolChoice = { type: "tool", name: SYNTHETIC_SCHEMA_TOOL };
    }

    const start = Date.now();
    let resp: Anthropic.Message;
    try {
      resp = await this.client.messages.create({
        model,
        max_tokens: request.maxTokens ?? 2048,
        ...(request.temperature != null ? { temperature: request.temperature } : {}),
        ...(system ? { system } : {}),
        messages,
        ...(tools ? { tools } : {}),
        ...(toolChoice ? { tool_choice: toolChoice } : {}),
        // Provider-specific passthrough (e.g. thinking: { type: "adaptive" })
        ...(request.providerOptions ?? {}),
      } as Anthropic.MessageCreateParamsNonStreaming);
    } catch (e: any) {
      throw new AIProviderError("claude", e?.message ?? "Claude request failed", {
        status: e?.status,
        retryable: isRetryable(e?.status),
        cause: e,
      });
    }
    const latencyMs = Date.now() - start;

    let text = "";
    const toolCalls: AIToolCall[] = [];
    for (const block of resp.content) {
      if (block.type === "text") {
        text += block.text;
      } else if (block.type === "tool_use") {
        if (wantsSchema && block.name === SYNTHETIC_SCHEMA_TOOL) {
          text = JSON.stringify(block.input);
        } else {
          toolCalls.push({ id: block.id, name: block.name, arguments: JSON.stringify(block.input) });
        }
      }
    }

    return {
      provider: this.name,
      model: resp.model,
      text,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      finishReason: mapStop(resp.stop_reason),
      usage: {
        promptTokens: resp.usage.input_tokens,
        completionTokens: resp.usage.output_tokens,
        totalTokens: resp.usage.input_tokens + resp.usage.output_tokens,
      },
      latencyMs,
      raw: resp,
    };
  }
}

function mapStop(s: string | null): string | null {
  if (s === "end_turn") return "stop";
  if (s === "tool_use") return "tool_calls";
  if (s === "max_tokens") return "length";
  return s;
}

function isRetryable(status?: number): boolean {
  return status === 429 || (typeof status === "number" && status >= 500);
}
