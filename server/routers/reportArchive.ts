/**
 * Report Archive tRPC router
 *
 * Public:
 *   archive.list          — paginated list (respects visibility tier)
 *   archive.get           — single report (access-gated)
 *   archive.trending      — top reports by views + downloads, last 7 days
 *   archive.byCountry     — reports tagged to a country
 *   archive.byContributor — contributor portfolio (public reports only)
 *   archive.search        — full-text search on title + summary
 *
 * Authenticated (any logged-in user):
 *   archive.save          — save a report to personal archive
 *   archive.unsave        — remove from saved
 *   archive.savedList     — list user's saved reports
 *
 * Protected (owner or analyst+):
 *   archive.create        — persist a generated report to archive
 *   archive.setVisibility — change public/free/premium/private
 *   archive.delete        — soft-delete (sets isArchived=false, visibility=private)
 *
 * Memory (internal / analyst+):
 *   archive.memoryContext — top-k relevant reports for a session
 *   archive.triggerIndex  — kick off entity extraction + quality score
 */

import { z } from "zod";
import { randomUUID } from "crypto";
import { router, publicProcedure, protectedProcedure, analystProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  reportArchive, reportSaves, reportEntities, memoryInjections,
  type InsertReportArchive,
} from "../../drizzle/schema";
import { eq, and, desc, gte, or, sql, like } from "drizzle-orm";
import {
  recomputeQualityScore,
  extractEntities,
  getMemoryContext,
  generateCitationKey,
} from "../services/reportMemory";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database unavailable");
  return d;
}

// ── Access gate ────────────────────────────────────────────────────────────────
// Returns true if the requesting user can read a report at the given visibility.
function canRead(
  visibility: string,
  userTier: "guest" | "free" | "premium" | "analyst",
): boolean {
  if (visibility === "public") return true;
  if (visibility === "free")    return userTier !== "guest";
  if (visibility === "premium") return userTier === "premium" || userTier === "analyst";
  if (visibility === "private") return false; // checked separately by ownership
  return false;
}

// ── Shared select fields (no bodyMd — fetched separately on detail view) ───────
const listFields = {
  id:            reportArchive.id,
  reportId:      reportArchive.reportId,
  authorId:      reportArchive.authorId,
  reportType:    reportArchive.reportType,
  title:         reportArchive.title,
  summaryText:   reportArchive.summaryText,
  countryCodes:  reportArchive.countryCodes,
  pestelDims:    reportArchive.pestelDims,
  sector:        reportArchive.sector,
  verdictKey:    reportArchive.verdictKey,
  visibility:    reportArchive.visibility,
  viewCount:     reportArchive.viewCount,
  downloadCount: reportArchive.downloadCount,
  saveCount:     reportArchive.saveCount,
  citedByCount:  reportArchive.citedByCount,
  qualityScore:  reportArchive.qualityScore,
  citationKey:   reportArchive.citationKey,
  licenseType:   reportArchive.licenseType,
  contributorTier: reportArchive.contributorTier,
  wordCount:     reportArchive.wordCount,
  createdAt:     reportArchive.createdAt,
} as const;

// ─────────────────────────────────────────────────────────────────────────────

export const reportArchiveRouter = router({

  // ── Public: paginated list ────────────────────────────────────────────────
  list: publicProcedure
    .input(z.object({
      page:       z.number().int().min(1).default(1),
      pageSize:   z.number().int().min(1).max(50).default(20),
      reportType: z.enum(["document_analysis","signal_brief","go_no_go","agent_report","custom"]).optional(),
      verdictKey: z.string().optional(),
      sector:     z.string().optional(),
    }))
    .query(async ({ input }) => {
      const d = await db();
      const offset = (input.page - 1) * input.pageSize;

      const rows = await d
        .select(listFields)
        .from(reportArchive)
        .where(
          and(
            eq(reportArchive.isArchived, true),
            or(
              eq(reportArchive.visibility, "public"),
              eq(reportArchive.visibility, "free"),
            ),
            input.reportType ? eq(reportArchive.reportType, input.reportType) : undefined,
            input.verdictKey ? eq(reportArchive.verdictKey, input.verdictKey) : undefined,
            input.sector     ? eq(reportArchive.sector, input.sector)         : undefined,
          )
        )
        .orderBy(desc(reportArchive.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return { rows, page: input.page, pageSize: input.pageSize };
    }),

  // ── Public: single report (access-gated) ─────────────────────────────────
  get: publicProcedure
    .input(z.object({
      reportId:  z.string(),
      userTier:  z.enum(["guest","free","premium","analyst"]).default("guest"),
      requesterId: z.number().int().optional(),
    }))
    .query(async ({ input }) => {
      const d = await db();
      const [row] = await d
        .select()
        .from(reportArchive)
        .where(eq(reportArchive.reportId, input.reportId))
        .limit(1);

      if (!row) return null;

      const isOwner = input.requesterId != null && row.authorId === input.requesterId;
      const readable = isOwner || canRead(row.visibility, input.userTier);
      if (!readable) return { locked: true, title: row.title, summaryText: row.summaryText, visibility: row.visibility };

      // Increment view count asynchronously
      d.update(reportArchive)
        .set({ viewCount: sql`${reportArchive.viewCount} + 1`, updatedAt: new Date() })
        .where(eq(reportArchive.reportId, input.reportId))
        .catch(() => null);

      // Recompute quality score asynchronously
      recomputeQualityScore(input.reportId).catch(() => null);

      return { locked: false, ...row };
    }),

  // ── Public: trending ─────────────────────────────────────────────────────
  trending: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(10) }))
    .query(async ({ input }) => {
      const d = await db();
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return d
        .select(listFields)
        .from(reportArchive)
        .where(
          and(
            eq(reportArchive.isArchived, true),
            or(eq(reportArchive.visibility, "public"), eq(reportArchive.visibility, "free")),
            gte(reportArchive.createdAt, cutoff),
          )
        )
        .orderBy(
          desc(sql`(${reportArchive.viewCount} * 0.3 + ${reportArchive.downloadCount} * 0.5 + ${reportArchive.saveCount} * 0.2)`)
        )
        .limit(input.limit);
    }),

  // ── Public: by country ────────────────────────────────────────────────────
  byCountry: publicProcedure
    .input(z.object({
      countryCode: z.string().min(2).max(3).toUpperCase(),
      limit:       z.number().int().min(1).max(50).default(20),
      pestelDim:   z.enum(["P","E","S","T","En","L","IR"]).optional(),
    }))
    .query(async ({ input }) => {
      const d = await db();
      return d
        .select(listFields)
        .from(reportArchive)
        .where(
          and(
            eq(reportArchive.isArchived, true),
            or(eq(reportArchive.visibility, "public"), eq(reportArchive.visibility, "free")),
            sql`JSON_CONTAINS(${reportArchive.countryCodes}, ${JSON.stringify(input.countryCode)})`,
            input.pestelDim
              ? sql`JSON_CONTAINS(${reportArchive.pestelDims}, ${JSON.stringify(input.pestelDim)})`
              : undefined,
          )
        )
        .orderBy(desc(reportArchive.qualityScore), desc(reportArchive.createdAt))
        .limit(input.limit);
    }),

  // ── Public: contributor portfolio ────────────────────────────────────────
  byContributor: publicProcedure
    .input(z.object({
      authorId: z.number().int(),
      limit:    z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const d = await db();
      return d
        .select(listFields)
        .from(reportArchive)
        .where(
          and(
            eq(reportArchive.authorId, input.authorId),
            eq(reportArchive.isArchived, true),
            or(eq(reportArchive.visibility, "public"), eq(reportArchive.visibility, "free")),
          )
        )
        .orderBy(desc(reportArchive.createdAt))
        .limit(input.limit);
    }),

  // ── Public: search ────────────────────────────────────────────────────────
  search: publicProcedure
    .input(z.object({
      query:    z.string().min(2).max(200),
      limit:    z.number().int().min(1).max(30).default(15),
    }))
    .query(async ({ input }) => {
      const d = await db();
      const q = `%${input.query}%`;
      return d
        .select(listFields)
        .from(reportArchive)
        .where(
          and(
            eq(reportArchive.isArchived, true),
            or(eq(reportArchive.visibility, "public"), eq(reportArchive.visibility, "free")),
            or(
              like(reportArchive.title, q),
              like(reportArchive.summaryText, q),
            ),
          )
        )
        .orderBy(desc(reportArchive.qualityScore), desc(reportArchive.createdAt))
        .limit(input.limit);
    }),

  // ── Authenticated: save / unsave ──────────────────────────────────────────
  save: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const d = await db();
      await d.insert(reportSaves)
        .values({ userId: ctx.user.id, reportId: input.reportId })
        .onDuplicateKeyUpdate({ set: { savedAt: new Date() } })
        .catch(() => null);
      await d.update(reportArchive)
        .set({ saveCount: sql`${reportArchive.saveCount} + 1`, updatedAt: new Date() })
        .where(eq(reportArchive.reportId, input.reportId))
        .catch(() => null);
      recomputeQualityScore(input.reportId).catch(() => null);
      return { ok: true };
    }),

  unsave: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const d = await db();
      await d.delete(reportSaves)
        .where(and(eq(reportSaves.userId, ctx.user.id), eq(reportSaves.reportId, input.reportId)))
        .catch(() => null);
      await d.update(reportArchive)
        .set({ saveCount: sql`GREATEST(${reportArchive.saveCount} - 1, 0)`, updatedAt: new Date() })
        .where(eq(reportArchive.reportId, input.reportId))
        .catch(() => null);
      return { ok: true };
    }),

  savedList: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input, ctx }) => {
      const d = await db();
      const saves = await d
        .select({ reportId: reportSaves.reportId })
        .from(reportSaves)
        .where(eq(reportSaves.userId, ctx.user.id))
        .orderBy(desc(reportSaves.savedAt))
        .limit(input.limit);
      if (saves.length === 0) return [];
      const ids = saves.map(s => s.reportId);
      return d
        .select(listFields)
        .from(reportArchive)
        .where(sql`${reportArchive.reportId} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
    }),

  // ── Create: persist a generated report ───────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      reportType:    z.enum(["document_analysis","signal_brief","go_no_go","agent_report","custom"]),
      title:         z.string().min(3).max(300),
      bodyMd:        z.string().min(10),
      summaryText:   z.string().max(500).optional(),
      sourceDocName: z.string().max(255).optional(),
      countryCodes:  z.array(z.string()).default([]),
      pestelDims:    z.array(z.string()).default([]),
      sector:        z.string().max(100).optional(),
      verdictKey:    z.string().max(20).optional(),
      signalIds:     z.array(z.string()).default([]),
      visibility:    z.enum(["public","free","premium","private"]).default("private"),
      sessionId:     z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const d = await db();
      const reportId = randomUUID();
      const wordCount = input.bodyMd.split(/\s+/).length;

      // Generate citation key for public/free reports
      let citationKey: string | null = null;
      if (input.visibility !== "private" && input.countryCodes.length > 0) {
        citationKey = await generateCitationKey(input.countryCodes[0], new Date().getFullYear()).catch(() => null);
      }

      const row: InsertReportArchive = {
        reportId,
        authorId:      ctx.user.id,
        sessionId:     input.sessionId,
        reportType:    input.reportType,
        title:         input.title,
        bodyMd:        input.bodyMd,
        summaryText:   input.summaryText ?? input.bodyMd.slice(0, 480).replace(/#+\s/g, "").trim(),
        sourceDocName: input.sourceDocName,
        wordCount,
        countryCodes:  input.countryCodes,
        pestelDims:    input.pestelDims,
        sector:        input.sector,
        verdictKey:    input.verdictKey,
        signalIds:     input.signalIds,
        visibility:    input.visibility,
        isArchived:    input.visibility !== "private",
        archivedAt:    input.visibility !== "private" ? new Date() : undefined,
        contributorTier: (ctx.user as any).tier ?? "observer",
        citationKey,
        licenseType:   "vb_standard",
      };

      await d.insert(reportArchive).values(row);

      // Kick off memory pipeline asynchronously for non-private reports
      if (input.visibility !== "private") {
        extractEntities(reportId).catch(() => null);
      }

      return { reportId, citationKey };
    }),

  // ── Set visibility ────────────────────────────────────────────────────────
  setVisibility: protectedProcedure
    .input(z.object({
      reportId:   z.string(),
      visibility: z.enum(["public","free","premium","private"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const d = await db();
      const [row] = await d
        .select({ authorId: reportArchive.authorId })
        .from(reportArchive)
        .where(eq(reportArchive.reportId, input.reportId))
        .limit(1);

      if (!row || row.authorId !== ctx.user.id) throw new Error("Not authorised");

      const isArchived = input.visibility !== "private";
      await d.update(reportArchive)
        .set({
          visibility: input.visibility,
          isArchived,
          archivedAt: isArchived ? new Date() : undefined,
          updatedAt:  new Date(),
        })
        .where(eq(reportArchive.reportId, input.reportId));

      if (isArchived) extractEntities(input.reportId).catch(() => null);
      return { ok: true };
    }),

  // ── Delete (soft) ─────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const d = await db();
      const [row] = await d
        .select({ authorId: reportArchive.authorId })
        .from(reportArchive)
        .where(eq(reportArchive.reportId, input.reportId))
        .limit(1);

      if (!row || row.authorId !== ctx.user.id) throw new Error("Not authorised");

      await d.update(reportArchive)
        .set({ isArchived: false, visibility: "private", updatedAt: new Date() })
        .where(eq(reportArchive.reportId, input.reportId));

      return { ok: true };
    }),

  // ── Memory: context injection ─────────────────────────────────────────────
  memoryContext: protectedProcedure
    .input(z.object({
      sessionId:    z.string(),
      countryCodes: z.array(z.string()).default([]),
      limit:        z.number().int().min(1).max(10).default(5),
    }))
    .query(async ({ input }) => {
      return getMemoryContext(input.sessionId, input.countryCodes, input.limit);
    }),

  // ── Memory: trigger index ─────────────────────────────────────────────────
  triggerIndex: analystProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ input }) => {
      await Promise.all([
        extractEntities(input.reportId),
        recomputeQualityScore(input.reportId),
      ]);
      return { ok: true };
    }),

  // ── Download: record event ────────────────────────────────────────────────
  recordDownload: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ input }) => {
      const d = await db();
      await d.update(reportArchive)
        .set({ downloadCount: sql`${reportArchive.downloadCount} + 1`, updatedAt: new Date() })
        .where(eq(reportArchive.reportId, input.reportId))
        .catch(() => null);
      recomputeQualityScore(input.reportId).catch(() => null);
      return { ok: true };
    }),
});
