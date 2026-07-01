import { z } from "zod";
import { randomBytes } from "crypto";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { smeListings, ersValidators } from "../../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail, appBaseUrl } from "../services/email";
import { recomputeErs, MIN_VALIDATORS } from "../services/ersScore";
import { users } from "../../drizzle/schema";
import { awardTokens } from "./tokens";

const MAX_VALIDATORS = 7;    // cap nominations per listing
const VALIDATOR_REWARD = 25; // VBT awarded for a completed validation (accurate, timely scoring)

const dim = z.number().int().min(0).max(100);

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

      await recomputeErs(db, v.listingId);
      const [l] = await db.select().from(smeListings).where(eq(smeListings.id, v.listingId));

      // Reward the validator in VBT if they have a platform account (contribution
      // reward — NOT commission tied to capital, which would bias scoring up).
      try {
        const [u] = await db.select().from(users).where(eq(users.email, v.email));
        if (u) await awardTokens(u.id, VALIDATOR_REWARD, "ers_validation", `Validated ${l?.name ?? "an SME"}`, v.listingId, "sme_listing");
      } catch { /* reward is best-effort, never blocks scoring */ }

      return { ok: true, verificationLevel: l?.verificationLevel ?? "unverified", ers: l?.ers ?? 0 };
    }),
});
