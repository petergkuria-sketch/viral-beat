/**
 * scannerAgent tRPC router
 *
 * Public:
 *   ticker.list           — active ticker items for IntelligenceTicker component
 *   signals.byCountry     — latest signals for a country (CountryIntelProfile)
 *
 * Protected (analyst+):
 *   agent.run             — trigger a full cycle manually
 *   agent.runCountry      — trigger single-country refresh
 *   agent.runs            — recent run history
 *
 * Protected (admin):
 *   agent.ingestRating    — inject a rating event (webhook bridge)
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure, analystProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
async function db() { const d = await getDb(); if (!d) throw new Error("DB unavailable"); return d; }
import {
  tickerItems, scannerSignals, agentRuns,
} from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import {
  runAgentCycle,
  runCountryCycle,
  ingestRatingEvent,
  type RatingEvent,
} from "../services/africaScannerAgent";

export const scannerAgentRouter = router({

  // ── Ticker ──────────────────────────────────────────────────────────────────

  tickerList: publicProcedure.query(async () => {
    const d = await db();
    const now = new Date();
    const rows = await d
      .select()
      .from(tickerItems)
      .where(and(eq(tickerItems.active, true), gte(tickerItems.expiresAt, now)))
      .orderBy(desc(tickerItems.createdAt))
      .limit(50);

    // Breaking items first, then normal
    const breaking = rows.filter(r => r.severity === "breaking");
    const normal   = rows.filter(r => r.severity === "normal");
    return { breaking, normal, hasBreaking: breaking.length > 0 };
  }),

  // ── Signals by country ──────────────────────────────────────────────────────

  signalsByCountry: publicProcedure
    .input(z.object({ countryCode: z.string().min(2).max(3).toUpperCase() }))
    .query(async ({ input }) => {
      const d = await db();
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30d
      return d
        .select()
        .from(scannerSignals)
        .where(
          and(
            eq(scannerSignals.countryCode, input.countryCode),
            gte(scannerSignals.ingestedAt, cutoff),
          )
        )
        .orderBy(desc(scannerSignals.ingestedAt))
        .limit(30);
    }),

  // ── Agent controls (analyst+) ───────────────────────────────────────────────

  agentRun: analystProcedure
    .input(z.object({ trigger: z.enum(["manual", "scheduled"]).default("manual") }))
    .mutation(async ({ input }) => {
      return runAgentCycle(input.trigger);
    }),

  agentRunCountry: analystProcedure
    .input(z.object({ countryCode: z.string().min(2).max(3).toUpperCase() }))
    .mutation(async ({ input }) => {
      return runCountryCycle(input.countryCode);
    }),

  agentRuns: analystProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      const d = await db();
      return d
        .select()
        .from(agentRuns)
        .orderBy(desc(agentRuns.startedAt))
        .limit(input.limit);
    }),

  // ── Rating event ingestion (admin webhook bridge) ───────────────────────────

  agentIngestRating: adminProcedure
    .input(z.object({
      agency:          z.enum(["Moody's", "S&P", "Fitch"]),
      countryCode:     z.string().min(2).max(3),
      countryName:     z.string(),
      previousRating:  z.string(),
      newRating:       z.string(),
      outlook:         z.string().optional(),
      action:          z.enum(["upgrade", "downgrade", "affirm", "outlook_change"]),
      headline:        z.string(),
      url:             z.string().url().optional(),
      publishedAt:     z.string().datetime().optional(),
    }))
    .mutation(async ({ input }) => {
      const event: RatingEvent = {
        ...input,
        countryCode: input.countryCode.toUpperCase(),
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
      };
      await ingestRatingEvent(event);
      return { ok: true };
    }),
});
