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
//   CHAT          → Moonshot (Kimi)   fallback OpenAI
//   SHORT_QA      → Moonshot (Kimi)   fallback OpenAI
//   EVERYDAY      → Moonshot (Kimi)   fallback OpenAI   (cost-sensitive)
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
  moonshot: "openai",   // cost-effective primary → OpenAI → (OpenAI's fallback) Claude
};

/** THE POLICY. Task → provider (+ optional model / fallback). Edit freely. */
export const ROUTING_POLICY: Record<TaskType, RouteRule> = {
  // Cost-sensitive tasks → Moonshot (Kimi), the most cost-effective leg.
  // Fallback to OpenAI's lightweight model, then Claude, if Moonshot is
  // unconfigured or fails — the orchestrator only dispatches to configured keys.
  // Fallback to OpenAI if Moonshot is unconfigured or fails — the orchestrator
  // only dispatches to providers whose key is configured.
  CHAT:         { provider: "moonshot", model: "moonshot-v1-8k",  fallback: "openai" },
  SHORT_QA:     { provider: "moonshot", model: "moonshot-v1-8k",  fallback: "openai" },
  EVERYDAY:     { provider: "moonshot", model: "moonshot-v1-32k", fallback: "openai" },

  // High-value tasks → Claude (provider default model unless pinned here).
  RESEARCH:     { provider: "claude" },
  CODING:       { provider: "claude" },
  ARCHITECTURE: { provider: "claude" },
  STRATEGY:     { provider: "claude" },
  CREATIVE:     { provider: "claude" },
  REASONING:    { provider: "claude" },
};
