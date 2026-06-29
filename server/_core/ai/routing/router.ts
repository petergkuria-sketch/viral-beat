import type { AIRequest, ProviderName } from "../types";

/**
 * Task categories the router understands. Callers may set
 * `request.metadata.taskType` explicitly; otherwise the router infers one.
 */
export type TaskType =
  // → OpenAI
  | "general_chat"
  | "simple_qa"
  | "cost_sensitive"
  | "everyday_reasoning"
  // → Claude
  | "long_form_writing"
  | "deep_reasoning"
  | "code_review"
  | "architecture"
  | "business_strategy"
  | "research";

export interface RoutingDecision {
  provider: ProviderName;
  /** Provider to retry with if the primary fails. */
  fallback: ProviderName;
  /** Optional model hint; undefined ⇒ provider's default model. */
  model?: string;
  taskType: TaskType;
  /** How the decision was reached — for telemetry/debugging. */
  reason: string;
}

/** Initial policy: taskType → primary provider. */
const TASK_PROVIDER: Record<TaskType, ProviderName> = {
  general_chat:       "openai",
  simple_qa:          "openai",
  cost_sensitive:     "openai",
  everyday_reasoning: "openai",

  long_form_writing:  "claude",
  deep_reasoning:     "claude",
  code_review:        "claude",
  architecture:       "claude",
  business_strategy:  "claude",
  research:           "claude",
};

interface AIRouterOptions {
  /** Override the default primary per task. */
  taskProvider?: Partial<Record<TaskType, ProviderName>>;
  /** Optional model hints per task. */
  modelHints?: Partial<Record<TaskType, string>>;
  /** Provider used when nothing else applies. */
  defaultProvider?: ProviderName;
  /** Word count above which untyped prose is treated as long-form. */
  longFormWordThreshold?: number;
}

/** Keyword → task inference, evaluated in order (first match wins). */
const KEYWORD_RULES: Array<{ task: TaskType; re: RegExp }> = [
  { task: "code_review",       re: /\b(review|refactor|debug|fix|optimi[sz]e)\b.*\b(code|function|class|pr|pull request|bug|stack trace)\b|```/i },
  { task: "architecture",      re: /\b(architect(ure)?|system design|design (a|the|this) system|scalab|microservice|data model|schema design|orchestrat)/i },
  { task: "business_strategy", re: /\b(strateg(y|ic)|go-to-market|gtm|business model|roadmap|competitive|positioning|pricing strategy|investment thesis)\b/i },
  { task: "research",          re: /\b(research|literature|survey|in-depth analysis|comprehensive (analysis|report)|cite|sources?|evidence)\b/i },
  { task: "long_form_writing", re: /\b(write|draft|compose|essay|article|report|brief|memo|whitepaper|blog post)\b.*\b(long|detailed|comprehensive|full|in-depth)\b|\b(long-form)\b/i },
  { task: "deep_reasoning",    re: /\b(reason (through|carefully)|step[- ]by[- ]step|prove|derive|trade[- ]?offs?|analy[sz]e (deeply|rigorously)|think hard)\b/i },
  { task: "simple_qa",         re: /^\s*(what|who|when|where|which|how many|is|are|does|do|can)\b.{0,160}\?\s*$/i },
];

export class AIRouter {
  private taskProvider: Record<TaskType, ProviderName>;
  private modelHints: Partial<Record<TaskType, string>>;
  private defaultProvider: ProviderName;
  private longFormWordThreshold: number;

  constructor(opts: AIRouterOptions = {}) {
    this.taskProvider = { ...TASK_PROVIDER, ...(opts.taskProvider ?? {}) };
    this.modelHints = opts.modelHints ?? {};
    this.defaultProvider = opts.defaultProvider ?? "openai"; // cost-sensitive default
    this.longFormWordThreshold = opts.longFormWordThreshold ?? 220;
  }

  /** Inspect a request and decide which provider should handle it. */
  route(request: AIRequest): RoutingDecision {
    // 1. Hard override — caller forces a provider.
    const forced = request.metadata?.provider as ProviderName | undefined;
    const taskType = this.resolveTaskType(request);
    const provider = forced ?? this.taskProvider[taskType] ?? this.defaultProvider;
    const fallback: ProviderName = provider === "claude" ? "openai" : "claude";

    return {
      provider,
      fallback,
      model: this.modelHints[taskType],
      taskType,
      reason: forced
        ? `forced provider=${forced}`
        : (request.metadata?.taskType ? `explicit taskType=${taskType}` : `inferred taskType=${taskType}`),
    };
  }

  /** Explicit taskType wins; otherwise infer from request shape + content. */
  private resolveTaskType(request: AIRequest): TaskType {
    const explicit = request.metadata?.taskType as TaskType | undefined;
    if (explicit && explicit in this.taskProvider) return explicit;

    const lastUser = [...request.messages].reverse().find(m => m.role === "user")?.content ?? "";
    const corpus = `${request.system ?? ""}\n${request.messages.map(m => m.content).join("\n")}`;
    const words = corpus.trim().split(/\s+/).filter(Boolean).length;

    // Keyword signals first (most specific intent).
    for (const { task, re } of KEYWORD_RULES) {
      if (re.test(lastUser) || re.test(corpus)) return task;
    }

    // Tool-driven turns are usually agentic deep work → Claude.
    if (request.tools && request.tools.length > 0) return "deep_reasoning";

    // Bulk of prompt is long → long-form writing.
    if (words >= this.longFormWordThreshold) return "long_form_writing";

    // Short, single-turn → everyday/general chat (cheap path).
    if (words <= 40) return "general_chat";

    return "everyday_reasoning";
  }
}
