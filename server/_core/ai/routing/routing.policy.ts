import type { ProviderName } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// AI ROUTING POLICY — the single source of truth for "which provider per task".
//
// Adjust routing here only. The AIRouter and all application logic read from
// this file; they never hard-code a provider. Changing a task's provider, its
// model, or its fallback is a one-line edit below — no code changes elsewhere.
//
// Effective policy:
//
//   CHAT          → OpenAI
//   SHORT_QA      → OpenAI
//   EVERYDAY      → OpenAI      (everyday / cost-sensitive reasoning)
//   RESEARCH      → Claude
//   CODING        → Claude      (code review / refactor / debugging)
//   ARCHITECTURE  → Claude
//   STRATEGY      → Claude      (business strategy)
//   CREATIVE      → Claude      (long-form / creative writing)
//   REASONING     → Claude      (deep / rigorous reasoning)
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical task categories the router maps requests onto. */
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

export interface RouteRule {
  provider: ProviderName;
  /** Optional model override; omit to use the provider's default. */
  model?: string;
  /** Optional per-task fallback; omit to use DEFAULT_FALLBACK. */
  fallback?: ProviderName;
}

/** Used when no task can be determined. */
export const DEFAULT_PROVIDER: ProviderName = "openai"; // cost-sensitive default

/** Provider used to retry when a primary fails (per provider). */
export const DEFAULT_FALLBACK: Record<ProviderName, ProviderName> = {
  openai: "claude",
  claude: "openai",
  gemini: "openai",
};

/** THE POLICY. Task → provider (+ optional model / fallback). Edit freely. */
export const ROUTING_POLICY: Record<TaskType, RouteRule> = {
  // Cost-sensitive tasks → OpenAI's lightweight model.
  CHAT:         { provider: "openai", model: "gpt-4o-mini" },
  SHORT_QA:     { provider: "openai", model: "gpt-4o-mini" },
  EVERYDAY:     { provider: "openai", model: "gpt-4o-mini" },

  // High-value tasks → Claude (provider default model unless pinned here).
  RESEARCH:     { provider: "claude" },
  CODING:       { provider: "claude" },
  ARCHITECTURE: { provider: "claude" },
  STRATEGY:     { provider: "claude" },
  CREATIVE:     { provider: "claude" },
  REASONING:    { provider: "claude" },
};
