/**
 * VB Report Memory Service
 *
 * Handles the pipeline that turns archived reports into institutional memory:
 *   1. qualityScore   — computed from engagement signals
 *   2. memoryWeight   — eligibility for context injection
 *   3. Entity extract — named entities → reportEntities table
 *   4. Context inject — top-k relevant reports prepended to a session
 *   5. Signal boost   — archived reports accelerate field signal corroboration
 */

import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import {
  reportArchive, reportEntities, memoryInjections,
  type InsertReportEntity, type InsertMemoryInjection,
} from "../../drizzle/schema";
import { eq, and, desc, gte, inArray, sql } from "drizzle-orm";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database unavailable");
  return d;
}

const client = new Anthropic({ apiKey: ENV.anthropicApiKey });

// ── Quality score ──────────────────────────────────────────────────────────────
// Weighted composite of engagement signals. Called after every view/download/cite.

export async function recomputeQualityScore(reportId: string): Promise<void> {
  const d = await db();
  const [row] = await d
    .select({
      viewCount:     reportArchive.viewCount,
      downloadCount: reportArchive.downloadCount,
      saveCount:     reportArchive.saveCount,
      citedByCount:  reportArchive.citedByCount,
      wordCount:     reportArchive.wordCount,
    })
    .from(reportArchive)
    .where(eq(reportArchive.reportId, reportId))
    .limit(1);

  if (!row) return;

  // Logarithmic normalisation so viral outliers don't dominate
  const viewScore     = Math.min(Math.log10((row.viewCount || 0) + 1) / 4, 1);
  const downloadScore = Math.min(Math.log10((row.downloadCount || 0) + 1) / 3, 1);
  const saveScore     = Math.min(Math.log10((row.saveCount || 0) + 1) / 2.5, 1);
  const citeScore     = Math.min(Math.log10((row.citedByCount || 0) + 1) / 2, 1);
  const depthBonus    = Math.min((row.wordCount || 0) / 3000, 0.15); // depth up to +15%

  const quality = Number(
    (viewScore * 0.15 + downloadScore * 0.25 + saveScore * 0.3 + citeScore * 0.3 + depthBonus).toFixed(3)
  );
  const weight = quality >= 0.4 ? quality : 0; // below threshold: excluded from memory

  await d
    .update(reportArchive)
    .set({ qualityScore: String(quality), memoryWeight: String(weight), updatedAt: new Date() })
    .where(eq(reportArchive.reportId, reportId))
    .catch(() => null);
}

// ── Entity extraction ──────────────────────────────────────────────────────────
// Extracts named entities from a report body using the LLM.

export async function extractEntities(reportId: string): Promise<void> {
  const d = await db();
  const [row] = await d
    .select({ bodyMd: reportArchive.bodyMd, countryCodes: reportArchive.countryCodes })
    .from(reportArchive)
    .where(eq(reportArchive.reportId, reportId))
    .limit(1);

  if (!row) return;

  const prompt = `Extract named entities from this intelligence report. Return ONLY a JSON array.
Each item: { "entityType": "person|organisation|policy|event|place", "entityName": "exact name", "pestelDim": "P|E|S|T|En|L|IR", "sentiment": "positive|negative|neutral", "confidence": 0.0-1.0 }
Limit to the 20 most significant entities. Skip generic terms.

REPORT:
${row.bodyMd.slice(0, 4000)}`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content.find(b => b.type === "text")?.text ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return;

    const entities: Array<{
      entityType: string; entityName: string;
      pestelDim?: string; sentiment?: string; confidence?: number;
    }> = JSON.parse(match[0]);

    const countryCodes = (row.countryCodes as string[]) ?? [];
    const rows: InsertReportEntity[] = entities.slice(0, 20).map(e => ({
      reportId,
      countryCode: countryCodes[0] ?? undefined,
      entityType: e.entityType as InsertReportEntity["entityType"],
      entityName: e.entityName.slice(0, 200),
      pestelDim: (e.pestelDim as InsertReportEntity["pestelDim"]) ?? undefined,
      sentiment: (e.sentiment as InsertReportEntity["sentiment"]) ?? "neutral",
      confidence: String(Math.min(Math.max(e.confidence ?? 0.7, 0), 1)),
    }));

    if (rows.length > 0) {
      await d.insert(reportEntities).values(rows).catch(() => null);
    }

    await d
      .update(reportArchive)
      .set({ usedForMemory: true, lastIndexedAt: new Date(), updatedAt: new Date() })
      .where(eq(reportArchive.reportId, reportId))
      .catch(() => null);
  } catch {
    // Non-fatal — entity extraction is best-effort
  }
}

// ── Context injection ──────────────────────────────────────────────────────────
// Returns the top-k most relevant archived reports for a given country + session.
// In production, replace the recency/quality heuristic with a pgvector ANN query.

export async function getMemoryContext(
  sessionId: string,
  countryCodes: string[],
  limit = 5,
): Promise<{ reportId: string; title: string; summaryText: string; citationKey: string | null }[]> {
  const d = await db();

  // Skip reports already injected into this session
  const injected = await d
    .select({ reportId: memoryInjections.reportId })
    .from(memoryInjections)
    .where(eq(memoryInjections.sessionId, sessionId));
  const injectedIds = injected.map(r => r.reportId);

  const rows = await d
    .select({
      reportId:    reportArchive.reportId,
      title:       reportArchive.title,
      summaryText: reportArchive.summaryText,
      citationKey: reportArchive.citationKey,
      memoryWeight: reportArchive.memoryWeight,
    })
    .from(reportArchive)
    .where(
      and(
        eq(reportArchive.isArchived, true),
        eq(reportArchive.usedForMemory, true),
        gte(reportArchive.memoryWeight, "0.4"),
        countryCodes.length > 0
          ? sql`JSON_OVERLAPS(${reportArchive.countryCodes}, ${JSON.stringify(countryCodes)})`
          : undefined,
        injectedIds.length > 0
          ? sql`${reportArchive.reportId} NOT IN (${sql.join(injectedIds.map(id => sql`${id}`), sql`, `)})`
          : undefined,
      )
    )
    .orderBy(desc(reportArchive.memoryWeight), desc(reportArchive.createdAt))
    .limit(limit);

  // Log injections
  if (rows.length > 0) {
    const injectionRows: InsertMemoryInjection[] = rows.map(r => ({
      sessionId,
      reportId: r.reportId,
      countryCode: countryCodes[0] ?? undefined,
    }));
    await d.insert(memoryInjections).values(injectionRows).catch(() => null);
  }

  return rows.map(r => ({
    reportId:    r.reportId,
    title:       r.title,
    summaryText: r.summaryText ?? "",
    citationKey: r.citationKey,
  }));
}

// ── Signal corroboration boost ─────────────────────────────────────────────────
// Returns entity names from past reports for a country — used by the agent
// to boost corroboration weight for new field signals.

export async function getCorroborationContext(countryCode: string): Promise<string[]> {
  const d = await db();
  const rows = await d
    .select({ entityName: reportEntities.entityName })
    .from(reportEntities)
    .where(eq(reportEntities.countryCode, countryCode))
    .orderBy(desc(reportEntities.extractedAt))
    .limit(100);
  return Array.from(new Set(rows.map(r => r.entityName)));
}

// ── Citation key generator ─────────────────────────────────────────────────────
// Produces VB-KEN-2026-001 style keys.

export async function generateCitationKey(
  countryCode: string,
  year: number,
): Promise<string> {
  const d = await db();
  const [row] = await d
    .select({ count: sql<number>`COUNT(*)` })
    .from(reportArchive)
    .where(
      and(
        sql`JSON_CONTAINS(${reportArchive.countryCodes}, ${JSON.stringify(countryCode)})`,
        gte(reportArchive.createdAt, new Date(`${year}-01-01`)),
      )
    );
  const seq = String((Number(row?.count ?? 0) + 1)).padStart(3, "0");
  return `VB-${countryCode}-${year}-${seq}`;
}
