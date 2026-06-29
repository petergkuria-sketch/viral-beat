import type { AIRequest, ProviderName } from "../types";
import {
  ROUTING_POLICY,
  DEFAULT_PROVIDER,
  DEFAULT_FALLBACK,
  type TaskType,
  type RouteRule,
} from "./routing.policy";

export type { TaskType } from "./routing.policy";

export interface RoutingDecision {
  provider: ProviderName;
  /** Provider to retry with if the primary fails. */
  fallback: ProviderName;
  /** Optional model hint from the policy; undefined ⇒ provider default. */
  model?: string;
  taskType: TaskType;
  /** How the decision was reached — for telemetry/debugging. */
  reason: string;
}

interface AIRouterOptions {
  /** Override individual policy rules at runtime (merged over the policy file). */
  policy?: Partial<Record<TaskType, RouteRule>>;
  /** Provider used when no task can be determined. */
  defaultProvider?: ProviderName;
  /** Word count above which untyped prose is treated as long-form/creative. */
  longFormWordThreshold?: number;
}

/** Keyword → task inference, evaluated in order (first match wins). */
const KEYWORD_RULES: Array<{ task: TaskType; re: RegExp }> = [
  { task: "CODING",       re: /\b(review|refactor|debug|fix|optimi[sz]e)\b.*\b(code|function|class|pr|pull request|bug|stack trace)\b|```/i },
  { task: "ARCHITECTURE", re: /\b(architect(ure)?|system design|design (a|the|this) system|scalab|microservice|data model|schema design|orchestrat)/i },
  { task: "STRATEGY",     re: /\b(strateg(y|ic)|go-to-market|gtm|business model|roadmap|competitive|positioning|pricing strategy|investment thesis)\b/i },
  { task: "RESEARCH",     re: /\b(research|literature|survey|in-depth analysis|comprehensive (analysis|report)|cite|sources?|evidence)\b/i },
  { task: "CREATIVE",     re: /\b(write|draft|compose|essay|article|story|narrative|poem|report|brief|memo|whitepaper|blog post)\b.*\b(long|detailed|comprehensive|full|in-depth|creative)\b|\b(long-form|creative writing)\b/i },
  { task: "REASONING",    re: /\b(reason (through|carefully)|step[- ]by[- ]step|prove|derive|trade[- ]?offs?|analy[sz]e (deeply|rigorously)|think hard)\b/i },
  { task: "SHORT_QA",     re: /^\s*(what|who|when|where|which|how many|is|are|does|do|can)\b.{0,160}\?\s*$/i },
];

export class AIRouter {
  private policy: Record<TaskType, RouteRule>;
  private defaultProvider: ProviderName;
  private longFormWordThreshold: number;

  constructor(opts: AIRouterOptions = {}) {
    this.policy = { ...ROUTING_POLICY, ...(opts.policy ?? {}) } as Record<TaskType, RouteRule>;
    this.defaultProvider = opts.defaultProvider ?? DEFAULT_PROVIDER;
    this.longFormWordThreshold = opts.longFormWordThreshold ?? 220;
  }

  /** Inspect a request and decide which provider should handle it. */
  route(request: AIRequest): RoutingDecision {
    const forced = request.metadata?.provider as ProviderName | undefined;
    const taskType = this.resolveTaskType(request);
    const rule = this.policy[taskType];

    const provider = forced ?? rule?.provider ?? this.defaultProvider;
    const fallback = rule?.fallback ?? DEFAULT_FALLBACK[provider] ?? "openai";

    return {
      provider,
      fallback,
      model: rule?.model,
      taskType,
      reason: forced
        ? `forced provider=${forced}`
        : (request.metadata?.taskType ? `explicit taskType=${taskType}` : `inferred taskType=${taskType}`),
    };
  }

  /** Explicit taskType wins; otherwise infer from request shape + content. */
  private resolveTaskType(request: AIRequest): TaskType {
    const explicit = request.metadata?.taskType as TaskType | undefined;
    if (explicit && explicit in this.policy) return explicit;

    const lastUser = [...request.messages].reverse().find(m => m.role === "user")?.content ?? "";
    const corpus = `${request.system ?? ""}\n${request.messages.map(m => m.content).join("\n")}`;
    const words = corpus.trim().split(/\s+/).filter(Boolean).length;

    for (const { task, re } of KEYWORD_RULES) {
      if (re.test(lastUser) || re.test(corpus)) return task;
    }

    if (request.tools && request.tools.length > 0) return "REASONING";
    if (words >= this.longFormWordThreshold) return "CREATIVE";
    if (words <= 40) return "CHAT";
    return "EVERYDAY";
  }
}
