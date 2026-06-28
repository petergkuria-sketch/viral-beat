import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { smeListings } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const pillar = z.number().int().min(0).max(100);

const listingInput = z.object({
  name: z.string().min(2).max(200),
  sector: z.string().min(2).max(100),
  countryCode: z.string().min(2).max(3),
  countryName: z.string().min(1).max(100),
  location: z.string().max(255).optional(),
  website: z.string().max(255).optional(),
  foundedYear: z.number().int().min(1900).max(2100).optional(),
  ownership: z.string().max(120).optional(),
  employees: z.string().max(60).optional(),
  summary: z.string().max(2000).optional(),
  products: z.string().max(1000).optional(),
  governance: pillar.optional(),
  financial: pillar.optional(),
  innovation: pillar.optional(),
  market: pillar.optional(),
  statusTags: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  exportMarkets: z.array(z.string()).optional(),
  awards: z.array(z.string()).optional(),
  contactName: z.string().max(160).optional(),
  contactEmail: z.string().email().max(200).optional(),
  contactPhone: z.string().max(60).optional(),
  // attribution
  listedByType: z.enum(["self", "incubator", "accelerator"]).default("self"),
  listedByOrg: z.string().max(200).optional(),
}).refine(
  v => v.listedByType === "self" || (v.listedByOrg && v.listedByOrg.trim().length > 1),
  { message: "Incubator / accelerator name is required when listing on behalf of a client", path: ["listedByOrg"] },
);

function composite(g = 0, f = 0, i = 0, m = 0) {
  return Math.round((g + f + i + m) / 4);
}

function valuesFrom(input: z.infer<typeof listingInput>) {
  return {
    name: input.name,
    sector: input.sector,
    countryCode: input.countryCode.toUpperCase(),
    countryName: input.countryName,
    location: input.location,
    website: input.website,
    foundedYear: input.foundedYear,
    ownership: input.ownership,
    employees: input.employees,
    summary: input.summary,
    products: input.products,
    governance: input.governance ?? 0,
    financial: input.financial ?? 0,
    innovation: input.innovation ?? 0,
    market: input.market ?? 0,
    ers: composite(input.governance, input.financial, input.innovation, input.market),
    statusTags: input.statusTags ?? [],
    certifications: input.certifications ?? [],
    exportMarkets: input.exportMarkets ?? [],
    awards: input.awards ?? [],
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    listedByType: input.listedByType,
    listedByOrg: input.listedByType === "self" ? null : (input.listedByOrg ?? null),
  };
}

export const exchangeRouter = router({
  /** Submit a new SME listing ("IPO"). Requires sign-in so every listing has an owner. */
  submit: protectedProcedure
    .input(listingInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const v = valuesFrom(input);
      await db.insert(smeListings).values({
        ...v,
        contributorId: String(ctx.user.id),
        status: "pending",
      });
      return { ok: true, ers: v.ers, message: "Listing submitted — pending review before it appears on the exchange." };
    }),

  /**
   * Update an existing listing. Owner-scoped. Editing re-enters moderation:
   * any edit sets status back to "pending" so changes are re-verified before
   * (re)publishing — an approved listing can't be silently altered.
   */
  update: protectedProcedure
    .input(z.object({ id: z.number().int() }).and(listingInput))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [existing] = await db.select().from(smeListings).where(eq(smeListings.id, input.id));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (existing.contributorId !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own listing" });
      }

      const v = valuesFrom(input);
      await db.update(smeListings)
        .set({ ...v, status: "pending", reviewNote: null })
        .where(eq(smeListings.id, input.id));
      return { ok: true, ers: v.ers, message: "Listing updated — changes are pending re-review." };
    }),

  /** Approved listings for the public exchange boards. */
  listApproved: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(smeListings)
      .where(eq(smeListings.status, "approved"))
      .orderBy(desc(smeListings.ers));
  }),

  /** The current user's own listings. */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(smeListings)
      .where(eq(smeListings.contributorId, String(ctx.user.id)))
      .orderBy(desc(smeListings.createdAt));
  }),

  /** A single listing the caller owns (for edit prefill). */
  getOne: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [row] = await db.select().from(smeListings)
        .where(and(eq(smeListings.id, input.id), eq(smeListings.contributorId, String(ctx.user.id))));
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      return row;
    }),
});
