import { z } from "zod";
import { randomBytes } from "crypto";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { smeListings, ersValidators } from "../../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail, appBaseUrl } from "../services/email";

const MIN_VALIDATORS = 3;   // independent validators required before Layer 2 counts
const MAX_VALIDATORS = 7;   // cap nominations per listing

const dim = z.number().int().min(0).max(100);

/**
 * Recompute a listing's weighted ERS from its validator consensus.
 * validatorErs = reputation-weighted mean of validators' 4-dimension averages × 0.30.
 * Only counts once ≥3 validators have submitted blind scores. Flags a >30pt spread.
 */
async function recompute(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, listingId: number) {
  const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, listingId));
  if (!listing) return;
  const selfErs = listing.selfErs ?? 0;
  const documentErs = listing.documentErs ?? 0;

  const vals = await db.select().from(ersValidators)
    .where(and(eq(ersValidators.listingId, listingId), eq(ersValidators.status, "scored")));
  const scored = vals.filter(v =>
    v.govScore != null && v.finScore != null && v.innScore != null && v.mktScore != null);

  if (scored.length >= MIN_VALIDATORS) {
    const rows = scored.map(v => ({
      avg: ((v.govScore! + v.finScore! + v.innScore! + v.mktScore!) / 4),
      rep: Math.max(1, v.reputation ?? 100),
    }));
    const wsum = rows.reduce((s, r) => s + r.rep, 0);
    const consensus = rows.reduce((s, r) => s + r.avg * r.rep, 0) / (wsum || 1); // 0–100
    const validatorErs = Math.round(consensus * 0.30);                            // 0–30
    const spread = Math.max(...rows.map(r => r.avg)) - Math.min(...rows.map(r => r.avg));
    // Documents are Layer 3 (final phase). Until then, validated listings are
    // "validator_verified"; they reach "fully_verified" only once documents clear.
    const level = documentErs > 0 ? "fully_verified" as const : "validator_verified" as const;
    const ers = Math.min(100, selfErs + validatorErs + documentErs);
    await db.update(smeListings).set({
      validatorErs, ers, verificationLevel: level,
      validatorFlag: spread > 30,
      provisional: level !== "fully_verified",
      ersVerifiedAt: new Date(),
    }).where(eq(smeListings.id, listingId));
  } else {
    // Not enough validators yet — Layer 2 stays at zero.
    await db.update(smeListings).set({
      validatorErs: 0,
      ers: Math.min(100, selfErs + documentErs),
      verificationLevel: documentErs > 0 ? "document_verified" as const : "unverified" as const,
      validatorFlag: false,
    }).where(eq(smeListings.id, listingId));
  }
}

const nomineeInput = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email().max(200),
  org: z.string().max(200).optional(),
  expertise: z.string().max(200).optional(),
  relationship: z.string().max(200).optional(),
});

export const ersValidationRouter = router({
  /** SME owner nominates arms-length validators (1–MAX, subject to the cap). */
  nominate: protectedProcedure
    .input(z.object({ listingId: z.number().int(), validators: z.array(nomineeInput).min(1).max(MAX_VALIDATORS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, input.listingId));
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (listing.contributorId !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only nominate validators for your own listing" });
      }

      const existing = await db.select().from(ersValidators)
        .where(and(eq(ersValidators.listingId, input.listingId),
          inArray(ersValidators.status, ["nominated", "approved", "scored"])));
      if (existing.length + input.validators.length > MAX_VALIDATORS) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `A listing can have at most ${MAX_VALIDATORS} validators.` });
      }

      const ownerEmail = (ctx.user.email ?? "").trim().toLowerCase();
      const takenEmails = new Set(existing.map(e => e.email.trim().toLowerCase()));
      for (const v of input.validators) {
        const e = v.email.trim().toLowerCase();
        if (e === ownerEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "A validator cannot be you — validators must be independent." });
        if (takenEmails.has(e)) throw new TRPCError({ code: "BAD_REQUEST", message: `${v.email} is already a validator on this listing.` });
        takenEmails.add(e);
      }

      await db.insert(ersValidators).values(input.validators.map(v => ({
        listingId: input.listingId,
        nominatedByUserId: String(ctx.user.id),
        name: v.name, email: v.email,
        org: v.org ?? null, expertise: v.expertise ?? null, relationship: v.relationship ?? null,
        token: randomBytes(24).toString("hex"),
        status: "nominated" as const,
      })));
      return { ok: true, count: input.validators.length };
    }),

  /** The caller's validators for one of their listings (owner-scoped, scores hidden). */
  myValidators: protectedProcedure
    .input(z.object({ listingId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { validators: [], scoredCount: 0, needed: MIN_VALIDATORS };
      const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, input.listingId));
      if (!listing || listing.contributorId !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your listing" });
      }
      const rows = await db.select().from(ersValidators)
        .where(eq(ersValidators.listingId, input.listingId)).orderBy(desc(ersValidators.createdAt));
      // Owner sees status + who, never individual scores (keeps review blind/unpressured).
      const validators = rows.map(r => ({
        id: r.id, name: r.name, org: r.org, expertise: r.expertise, status: r.status,
      }));
      return { validators, scoredCount: rows.filter(r => r.status === "scored").length, needed: MIN_VALIDATORS };
    }),

  /** Admin: validators awaiting approval, with their listing name. */
  adminPending: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(ersValidators)
      .where(eq(ersValidators.status, "nominated")).orderBy(desc(ersValidators.createdAt));
    const ids = Array.from(new Set(rows.map(r => r.listingId)));
    const listings = ids.length ? await db.select().from(smeListings).where(inArray(smeListings.id, ids)) : [];
    const nameOf = new Map(listings.map(l => [l.id, l.name]));
    return rows.map(r => ({
      id: r.id, listingId: r.listingId, listingName: nameOf.get(r.listingId) ?? `#${r.listingId}`,
      name: r.name, email: r.email, org: r.org, expertise: r.expertise, relationship: r.relationship,
      createdAt: r.createdAt,
    }));
  }),

  /** Admin: approve (→ invite to score) or reject a nominated validator. */
  adminSetStatus: adminProcedure
    .input(z.object({ id: z.number().int(), action: z.enum(["approve", "reject"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [v] = await db.select().from(ersValidators).where(eq(ersValidators.id, input.id));
      if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Validator not found" });

      if (input.action === "reject") {
        await db.update(ersValidators).set({ status: "rejected" }).where(eq(ersValidators.id, input.id));
        return { ok: true, scoreUrl: null, emailSent: false };
      }

      await db.update(ersValidators).set({ status: "approved" }).where(eq(ersValidators.id, input.id));
      const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, v.listingId));
      const scoreUrl = `${appBaseUrl()}/exchange/validate/${v.token}`;
      const email = await sendEmail({
        to: v.email,
        subject: `You've been asked to validate ${listing?.name ?? "an SME"} on ViralBeat`,
        text: `Hi ${v.name},\n\nYou've been nominated as an independent validator for ${listing?.name ?? "an SME"} on the ViralBeat SME Exchange. Please review their profile and score them across four dimensions — this is a blind review; you won't see their self-assessment.\n\nScore them here: ${scoreUrl}\n\nThank you for lending your expertise.`,
        html: `<p>Hi ${v.name},</p><p>You've been nominated as an independent validator for <b>${listing?.name ?? "an SME"}</b> on the ViralBeat SME Exchange. Please review their profile and score them across four dimensions — this is a <b>blind review</b>; you won't see their self-assessment.</p><p><a href="${scoreUrl}">Score this SME</a></p><p>Thank you for lending your expertise.</p>`,
      });
      return { ok: true, scoreUrl, emailSent: email.sent };
    }),

  /** Validator's blind view of the SME they were invited to score (token = credential). */
  task: publicProcedure
    .input(z.object({ token: z.string().min(10).max(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [v] = await db.select().from(ersValidators).where(eq(ersValidators.token, input.token));
      if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid validation link" });
      const [l] = await db.select().from(smeListings).where(eq(smeListings.id, v.listingId));
      // BLIND: expose only descriptive profile — never the self-assessment scores.
      return {
        status: v.status,
        validatorName: v.name,
        sme: l ? {
          name: l.name, sector: l.sector, countryName: l.countryName, location: l.location,
          foundedYear: l.foundedYear, employees: l.employees, ownership: l.ownership,
          summary: l.summary, products: l.products,
          certifications: (l.certifications as string[]) ?? [],
          exportMarkets: (l.exportMarkets as string[]) ?? [],
        } : null,
      };
    }),

  /** Validator submits their blind scores. Triggers consensus recompute. */
  submitScore: publicProcedure
    .input(z.object({
      token: z.string().min(10).max(64),
      governance: dim, financial: dim, innovation: dim, market: dim,
      comment: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [v] = await db.select().from(ersValidators).where(eq(ersValidators.token, input.token));
      if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid validation link" });
      if (v.status === "scored") throw new TRPCError({ code: "BAD_REQUEST", message: "You've already submitted your scores." });
      if (v.status !== "approved") throw new TRPCError({ code: "FORBIDDEN", message: "This validation isn't open for scoring." });

      await db.update(ersValidators).set({
        govScore: input.governance, finScore: input.financial,
        innScore: input.innovation, mktScore: input.market,
        comment: input.comment ?? null, status: "scored", scoredAt: new Date(),
      }).where(eq(ersValidators.id, v.id));

      await recompute(db, v.listingId);
      const [l] = await db.select().from(smeListings).where(eq(smeListings.id, v.listingId));
      return { ok: true, verificationLevel: l?.verificationLevel ?? "unverified", ers: l?.ers ?? 0 };
    }),
});
