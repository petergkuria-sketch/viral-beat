import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { intelligenceBulletins } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const SectionSchema = z.object({
  leadStory: z.object({
    country: z.string(),
    countryFlag: z.string(),
    headline: z.string(),
    body: z.string(),
    verdicts: z.array(z.string()),
    source: z.string(),
  }).optional(),
  signals: z.array(z.object({
    country: z.string(),
    countryFlag: z.string(),
    iso3: z.string(),
    headline: z.string(),
    verdict: z.enum(["go-market", "monitor", "caution", "no-go"]),
    source: z.string(),
    date: z.string(),
  })).optional(),
  verdictShifts: z.array(z.object({
    country: z.string(),
    countryFlag: z.string(),
    iso3: z.string(),
    delta: z.number(),
    from: z.string(),
    to: z.string(),
  })).optional(),
  fieldObservations: z.array(z.object({
    location: z.string(),
    headline: z.string(),
    body: z.string(),
    contributors: z.number(),
    date: z.string(),
    vbtAwarded: z.number(),
  })).optional(),
  giaasSpotlight: z.object({
    projectTitle: z.string(),
    country: z.string(),
    countryFlag: z.string(),
    iso3: z.string(),
    summary: z.string(),
    developer: z.string(),
    projectId: z.string().optional(),
  }).optional(),
});

const StatsSchema = z.object({
  breakingShifts: z.number().default(0),
  greenProjects: z.number().default(0),
  fieldSignals: z.number().default(0),
  verdictsChanged: z.number().default(0),
});

export const bulletinsRouter = router({

  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select({
          id: intelligenceBulletins.id,
          slug: intelligenceBulletins.slug,
          issueNumber: intelligenceBulletins.issueNumber,
          title: intelligenceBulletins.title,
          summary: intelligenceBulletins.summary,
          coverCountries: intelligenceBulletins.coverCountries,
          stats: intelligenceBulletins.stats,
          status: intelligenceBulletins.status,
          publishedAt: intelligenceBulletins.publishedAt,
        })
        .from(intelligenceBulletins)
        .where(eq(intelligenceBulletins.status, "published"))
        .orderBy(desc(intelligenceBulletins.publishedAt))
        .limit(input.limit);
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [row] = await db
        .select()
        .from(intelligenceBulletins)
        .where(and(
          eq(intelligenceBulletins.slug, input.slug),
          eq(intelligenceBulletins.status, "published"),
        ))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
      return row;
    }),

  // Admin: list all (draft + published)
  adminList: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(intelligenceBulletins)
        .orderBy(desc(intelligenceBulletins.createdAt));
    }),

  // Admin: create or update a bulletin
  upsert: adminProcedure
    .input(z.object({
      id:             z.number().optional(),
      slug:           z.string().regex(/^\d{4}-\d{2}$/),
      issueNumber:    z.number().int().positive(),
      title:          z.string().min(5).max(512),
      summary:        z.string().min(10).max(1000),
      htmlContent:    z.string().min(50),
      sections:       SectionSchema,
      coverCountries: z.array(z.string()).optional(),
      stats:          StatsSchema.optional(),
      status:         z.enum(["draft", "published"]).default("draft"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const publishedAt = input.status === "published" ? new Date() : null;
      const values = {
        slug:           input.slug,
        issueNumber:    input.issueNumber,
        title:          input.title,
        summary:        input.summary,
        htmlContent:    input.htmlContent,
        sections:       input.sections as any,
        coverCountries: input.coverCountries ?? [],
        stats:          input.stats ?? {},
        status:         input.status,
        publishedAt:    publishedAt ?? undefined,
      };

      if (input.id) {
        await db.update(intelligenceBulletins).set(values).where(eq(intelligenceBulletins.id, input.id));
        return { id: input.id };
      }
      const [result] = await db.insert(intelligenceBulletins).values(values);
      return { id: (result as any).insertId };
    }),

  // Admin: toggle status
  publish: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["draft", "published"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(intelligenceBulletins)
        .set({
          status: input.status,
          publishedAt: input.status === "published" ? new Date() : undefined,
        })
        .where(eq(intelligenceBulletins.id, input.id));
      return { ok: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(intelligenceBulletins).where(eq(intelligenceBulletins.id, input.id));
      return { ok: true };
    }),
});
