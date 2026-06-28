import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { ossSubmissions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const submissionInput = z.object({
  countryCode: z.string().min(2).max(3),
  countryName: z.string().min(1).max(100),
  kind: z.enum(["new", "update"]).default("new"),
  name: z.string().min(2).max(200),
  acronym: z.string().max(40).optional(),
  mandate: z.string().max(2000).optional(),
  location: z.string().max(255).optional(),
  website: z.string().max(255).optional(),
  operatingHours: z.string().max(120).optional(),
  legalBasis: z.string().max(255).optional(),
  established: z.number().int().min(1900).max(2100).optional(),
  services: z.array(z.string()).optional(),
  offers: z.array(z.string()).optional(),
  linkedZones: z.array(z.string()).optional(),
  sourceUrl: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  contributorName: z.string().max(160).optional(),
  contributorEmail: z.string().email().max(200).optional(),
});

export const ossRouter = router({
  /**
   * Submit a new OSS record or an update for an existing one.
   * Authenticated contributors are attributed automatically; anonymous
   * submissions are accepted with optional name/email for follow-up.
   */
  submit: publicProcedure
    .input(submissionInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const uid = (ctx as any).user?.id;
      const contributorId = uid != null ? String(uid) : null;

      await db.insert(ossSubmissions).values({
        countryCode: input.countryCode.toUpperCase(),
        countryName: input.countryName,
        kind: input.kind,
        name: input.name,
        acronym: input.acronym,
        mandate: input.mandate,
        location: input.location,
        website: input.website,
        operatingHours: input.operatingHours,
        legalBasis: input.legalBasis,
        established: input.established,
        services: input.services ?? [],
        offers: input.offers ?? [],
        linkedZones: input.linkedZones ?? [],
        sourceUrl: input.sourceUrl,
        notes: input.notes,
        contributorId,
        contributorName: input.contributorName,
        contributorEmail: input.contributorEmail,
        status: "pending",
      });

      return { ok: true, message: "Thank you — your OSS contribution is pending review." };
    }),

  /** Approved + pending count for a country, to show contribution activity. */
  countByCountry: publicProcedure
    .input(z.object({ countryCode: z.string().min(2).max(3) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { pending: 0, approved: 0 };
      const rows = await db
        .select()
        .from(ossSubmissions)
        .where(eq(ossSubmissions.countryCode, input.countryCode.toUpperCase()));
      return {
        pending: rows.filter(r => r.status === "pending").length,
        approved: rows.filter(r => r.status === "approved").length,
      };
    }),

  /** The current contributor's own submissions. */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db
      .select()
      .from(ossSubmissions)
      .where(eq(ossSubmissions.contributorId, String(ctx.user.id)))
      .orderBy(desc(ossSubmissions.createdAt));
  }),

  /** Admin: pending queue for moderation. */
  listPending: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db
      .select()
      .from(ossSubmissions)
      .where(eq(ossSubmissions.status, "pending"))
      .orderBy(desc(ossSubmissions.createdAt));
  }),

  /** Admin: approve or reject a submission. */
  review: adminProcedure
    .input(z.object({
      id: z.number().int(),
      status: z.enum(["approved", "rejected"]),
      reviewNote: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .update(ossSubmissions)
        .set({ status: input.status, reviewNote: input.reviewNote })
        .where(eq(ossSubmissions.id, input.id));
      return { ok: true };
    }),
});
