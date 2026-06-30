import type { AIRequest, ProviderName } from "../types";
import {
  TIER_LADDER,
  COMPLEX_TASKS,
  LARGE_CONTEXT_WORDS,
  type TaskType,
} from "./routing.policy";

export type { TaskType } from "./routing.policy";

export interface RoutingDecision {
  /** Index into TIER_LADDER to begin at (0 = Economy, 1 = Standard). Never 2. */
  startTier: number;
  /** A specific provider forced by the caller (metadata.provider), if any. */
  forced?: ProviderName;
  taskType: TaskType;
  /** How the decision was reached — for telemetry/debugging. */
  reason: string;
}

interface AIRouterOptions {
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
  private longFormWordThreshold: number;

  constructor(opts: AIRouterOptions = {}) {
    this.longFormWordThreshold = opts.longFormWordThreshold ?? 220;
  }

  /** Decide the starting tier via pre-execution complexity analysis. */
  route(request: AIRequest): RoutingDecision {
    const forced = request.metadata?.provider as ProviderName | undefined;
    const taskType = this.resolveTaskType(request);

    // Caller forced a provider → start at that provider's tier.
    if (forced) {
      const idx = TIER_LADDER.indexOf(forced);
      return { startTier: Math.max(0, idx), forced, taskType, reason: `forced provider=${forced}` };
    }

    // Complexity analysis: large context or complex task → start at Tier 2.
    const words = this.wordCount(request);
    const complex = COMPLEX_TASKS.has(taskType);
    const large = words >= LARGE_CONTEXT_WORDS;
    const startTier = complex || large ? 1 : 0; // never start above Tier 2

    const reason = startTier === 1
      ? `start Tier 2 — ${complex ? `complex task (${taskType})` : `large context (${words}w)`}`
      : `start Tier 1 — economy default (${taskType})`;

    return { startTier, taskType, reason };
  }

  private wordCount(request: AIRequest): number {
    const corpus = `${request.system ?? ""}\n${request.messages.map(m => m.content).join("\n")}`;
    return corpus.trim().split(/\s+/).filter(Boolean).length;
  }

  /** Explicit taskType wins; otherwise infer from request shape + content. */
  private resolveTaskType(request: AIRequest): TaskType {
    const explicit = request.metadata?.taskType as TaskType | undefined;
    const known: TaskType[] = ["CHAT","SHORT_QA","EVERYDAY","RESEARCH","CODING","ARCHITECTURE","STRATEGY","CREATIVE","REASONING"];
    if (explicit && known.includes(explicit)) return explicit;

    const lastUser = [...request.messages].reverse().find(m => m.role === "user")?.content ?? "";
    const corpus = `${request.system ?? ""}\n${request.messages.map(m => m.content).join("\n")}`;
    const words = this.wordCount(request);

    for (const { task, re } of KEYWORD_RULES) {
      if (re.test(lastUser) || re.test(corpus)) return task;
    }

    if (request.tools && request.tools.length > 0) return "REASONING";
    if (words >= this.longFormWordThreshold) return "CREATIVE";
    if (words <= 40) return "CHAT";
    return "EVERYDAY";
  }
}
