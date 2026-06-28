import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { smeListings } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
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
});

function composite(g = 0, f = 0, i = 0, m = 0) {
  return Math.round((g + f + i + m) / 4);
}

export const exchangeRouter = router({
  /** Submit an SME listing ("IPO"). Lands as pending for review. */
  submit: publicProcedure
    .input(listingInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const uid = (ctx as any).user?.id;
      const ers = composite(input.governance, input.financial, input.innovation, input.market);

      await db.insert(smeListings).values({
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
        ers,
        statusTags: input.statusTags ?? [],
        certifications: input.certifications ?? [],
        exportMarkets: input.exportMarkets ?? [],
        awards: input.awards ?? [],
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        contributorId: uid != null ? String(uid) : null,
        status: "pending",
      });

      return { ok: true, ers, message: "Listing submitted — pending review before it appears on the exchange." };
    }),

  /** Approved listings for the public exchange boards. */
  listApproved: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(smeListings)
      .where(eq(smeListings.status, "approved"))
      .orderBy(desc(smeListings.ers));
  }),

  /** The current user's own listings. */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db
      .select()
      .from(smeListings)
      .where(eq(smeListings.contributorId, String(ctx.user.id)))
      .orderBy(desc(smeListings.createdAt));
  }),
});
