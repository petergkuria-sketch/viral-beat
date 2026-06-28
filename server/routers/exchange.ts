import { z } from "zod";
import { randomBytes } from "crypto";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { smeListings, listingTransfers } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail, appBaseUrl } from "../services/email";

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

  /**
   * Initiate transfer of a listing to the SME owner by email. Owner-scoped.
   * Sends an invite (best-effort) and returns a shareable claim link.
   */
  initiateTransfer: protectedProcedure
    .input(z.object({ listingId: z.number().int(), ownerEmail: z.string().email().max(200) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, input.listingId));
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (listing.contributorId !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only transfer your own listing" });
      }

      // Cancel any existing pending transfer for this listing
      await db.update(listingTransfers)
        .set({ status: "cancelled" })
        .where(and(eq(listingTransfers.listingId, input.listingId), eq(listingTransfers.status, "pending")));

      const token = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
      await db.insert(listingTransfers).values({
        listingId: input.listingId,
        fromContributorId: String(ctx.user.id),
        toEmail: input.ownerEmail,
        token,
        status: "pending",
        expiresAt,
      });

      const claimUrl = `${appBaseUrl()}/exchange/claim/${token}`;
      const by = listing.listedByOrg || "An incubator/accelerator";
      const email = await sendEmail({
        to: input.ownerEmail,
        subject: `Take over management of ${listing.name} on ViralBeat`,
        html: `
          <p>Hello,</p>
          <p><strong>${by}</strong> has listed <strong>${listing.name}</strong> on the ViralBeat SME Exchange and is inviting you, the owner, to take over its management.</p>
          <p>To accept, sign in to ViralBeat and confirm the transfer:</p>
          <p><a href="${claimUrl}">${claimUrl}</a></p>
          <p>This link expires in 14 days. If you weren't expecting this, you can ignore this email.</p>
          <p>— ViralBeat</p>`,
        text: `${by} invited you to take over management of ${listing.name} on ViralBeat. Sign in and accept: ${claimUrl} (expires in 14 days).`,
      });

      return { ok: true, claimUrl, emailSent: email.sent };
    }),

  /** Cancel a pending transfer. Owner-scoped. */
  cancelTransfer: protectedProcedure
    .input(z.object({ transferId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [tr] = await db.select().from(listingTransfers).where(eq(listingTransfers.id, input.transferId));
      if (!tr) throw new TRPCError({ code: "NOT_FOUND", message: "Transfer not found" });
      if (tr.fromContributorId !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your transfer" });
      }
      await db.update(listingTransfers).set({ status: "cancelled" }).where(eq(listingTransfers.id, input.transferId));
      return { ok: true };
    }),

  /** Pending transfers for the caller's listings (to show status / claim link). */
  myTransfers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(listingTransfers)
      .where(and(eq(listingTransfers.fromContributorId, String(ctx.user.id)), eq(listingTransfers.status, "pending")))
      .orderBy(desc(listingTransfers.createdAt));
  }),

  /** Look up a transfer by token (for the claim page). Public — token is the secret. */
  getTransfer: publicProcedure
    .input(z.object({ token: z.string().min(10).max(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [tr] = await db.select().from(listingTransfers).where(eq(listingTransfers.token, input.token));
      if (!tr) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid transfer link" });
      const expired = tr.status === "pending" && tr.expiresAt.getTime() < Date.now();
      const [listing] = await db.select().from(smeListings).where(eq(smeListings.id, tr.listingId));
      return {
        status: expired ? "expired" : tr.status,
        toEmail: tr.toEmail,
        listingName: listing?.name ?? "this SME",
        listedByOrg: listing?.listedByOrg ?? null,
      };
    }),

  /** Accept a transfer — reassigns the listing to the signed-in user. */
  claimTransfer: protectedProcedure
    .input(z.object({ token: z.string().min(10).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [tr] = await db.select().from(listingTransfers).where(eq(listingTransfers.token, input.token));
      if (!tr) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid transfer link" });
      if (tr.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: `Transfer already ${tr.status}` });
      if (tr.expiresAt.getTime() < Date.now()) {
        await db.update(listingTransfers).set({ status: "expired" }).where(eq(listingTransfers.id, tr.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: "This transfer link has expired" });
      }

      // Enforce email match — the invite is bound to the SME owner's address.
      const userEmail = (ctx.user.email ?? "").trim().toLowerCase();
      const invitedEmail = tr.toEmail.trim().toLowerCase();
      if (!userEmail) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Your account has no email on file. Sign in with the invited email address to accept." });
      }
      if (userEmail !== invitedEmail) {
        throw new TRPCError({ code: "FORBIDDEN", message: `This invitation was sent to ${tr.toEmail}. Sign in with that email address to take over this listing.` });
      }

      const uid = String(ctx.user.id);
      // Reassign listing ownership and mark this listing self-listed by the new owner.
      await db.update(smeListings)
        .set({ contributorId: uid, listedByType: "self", listedByOrg: null })
        .where(eq(smeListings.id, tr.listingId));
      await db.update(listingTransfers)
        .set({ status: "accepted", acceptedByContributorId: uid, acceptedAt: new Date() })
        .where(eq(listingTransfers.id, tr.id));

      return { ok: true, listingId: tr.listingId };
    }),
});
