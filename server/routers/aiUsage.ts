import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { aiUsageLog } from "../../drizzle/schema";
import { gte, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getOrchestrator } from "../_core/ai/orchestrator";

interface Bucket {
  requests: number;
  failures: number;
  cost: number;
  latencies: number[];
}
const emptyBucket = (): Bucket => ({ requests: 0, failures: 0, cost: 0, latencies: [] });

function p95(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function finalize(b: Bucket) {
  return {
    requests: b.requests,
    successRate: b.requests ? Math.round(((b.requests - b.failures) / b.requests) * 1000) / 10 : 0,
    cost: Math.round(b.cost * 1e6) / 1e6,
    p95LatencyMs: p95(b.latencies),
  };
}

export const aiUsageRouter = router({
  /** Aggregated AI telemetry for the admin dashboard. */
  overview: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const rows = await db
        .select()
        .from(aiUsageLog)
        .where(gte(aiUsageLog.createdAt, since))
        .orderBy(desc(aiUsageLog.createdAt))
        .limit(50000);

      const total = emptyBucket();
      const byProvider = new Map<string, Bucket>();
      const byModel = new Map<string, Bucket>();
      const byDay = new Map<string, Bucket>();

      const add = (m: Map<string, Bucket>, key: string, cost: number, fail: boolean, latency: number) => {
        const b = m.get(key) ?? emptyBucket();
        b.requests++; b.cost += cost; if (fail) b.failures++; if (!fail) b.latencies.push(latency);
        m.set(key, b);
      };

      for (const r of rows) {
        const cost = Number(r.costUsd ?? 0);
        const fail = r.status === "failure";
        const latency = r.latencyMs ?? 0;
        total.requests++; total.cost += cost; if (fail) total.failures++; if (!fail) total.latencies.push(latency);
        add(byProvider, r.provider, cost, fail, latency);
        add(byModel, r.model ?? "(unknown)", cost, fail, latency);
        add(byDay, r.createdAt.toISOString().slice(0, 10), cost, fail, latency);
      }

      return {
        days: input.days,
        total: finalize(total),
        avgLatencyMs: total.latencies.length
          ? Math.round(total.latencies.reduce((a, b) => a + b, 0) / total.latencies.length)
          : 0,
        byProvider: Array.from(byProvider, ([provider, b]) => ({ provider, ...finalize(b) }))
          .sort((a, b) => b.cost - a.cost),
        byModel: Array.from(byModel, ([model, b]) => ({ model, ...finalize(b) }))
          .sort((a, b) => b.cost - a.cost),
        byDay: Array.from(byDay, ([day, b]) => ({ day, ...finalize(b) }))
          .sort((a, b) => a.day.localeCompare(b.day)),
      };
    }),

  /** Health-check a provider (single provider, no fallback). */
  ping: adminProcedure
    .input(z.object({ provider: z.enum(["claude", "openai", "gemini", "moonshot"]) }))
    .mutation(async ({ input }) => {
      return getOrchestrator().pingProvider(input.provider);
    }),
});
