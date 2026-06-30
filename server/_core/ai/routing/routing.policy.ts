import type { ProviderName } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// AI ROUTING POLICY — cost-effective three-tier escalation ladder.
//
//   Tier 1 (Economy)  → Moonshot / Kimi K2     ← DEFAULT for all tasks
//   Tier 2 (Standard) → OpenAI GPT-5
//   Tier 3 (Premium)  → Anthropic Claude 4.6
//
// Directives:
//   • Default to Economy. Every task starts at Tier 1 unless complexity
//     triggers are detected, in which case it may start at Tier 2 — never Tier 3.
//   • Dynamic escalation: if a tier's output fails (provider error, refusal,
//     empty, or quality gate), escalate to the next tier with a contextual
//     handoff (original prompt + failed output + reason).
//
// This is the single source of truth — the router and orchestrator read it.
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical task categories used for complexity analysis + telemetry. */
export type TaskType =
  | "CHAT"
  | "SHORT_QA"
  | "EVERYDAY"
  | "RESEARCH"
  | "CODING"
  | "ARCHITECTURE"
  | "STRATEGY"
  | "CREATIVE"
  | "REASONING";

/** The escalation ladder, economy → premium. Index 0 is the default start. */
export const TIER_LADDER: ProviderName[] = ["moonshot", "openai", "claude"];

/** Preferred model per tier. Requested models in the same family override these. */
export const TIER_MODEL: Record<ProviderName, string> = {
  moonshot: "kimi-k2-0711-preview", // Tier 1 — Economy
  openai:   "gpt-5",                // Tier 2 — Standard
  claude:   "claude-opus-4-6",      // Tier 3 — Premium (Claude 4.6)
  gemini:   "gemini-1.5-pro",       // not in the ladder; only if explicitly forced
};

/**
 * Complexity triggers — tasks that may START at Tier 2 (Standard) instead of
 * Tier 1: multi-step reasoning, advanced code/architecture, deep research.
 * Never start above Tier 2.
 */
export const COMPLEX_TASKS: ReadonlySet<TaskType> = new Set<TaskType>([
  "CODING",
  "ARCHITECTURE",
  "REASONING",
  "RESEARCH",
]);

/** Word count above which a prompt counts as "exceptionally large / deep synthesis". */
export const LARGE_CONTEXT_WORDS = 1500;
