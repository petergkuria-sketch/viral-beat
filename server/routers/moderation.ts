import { z } from "zod";
import { randomBytes } from "crypto";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { ossSubmissions, greenSubmissions, viralSubmissions, creatorProfiles, smeListings, listingTransfers } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail, appBaseUrl } from "../services/email";

/**
 * Unified moderation surface — one place to review every kind of
 * user-submitted data (OSS records, green-investment field reports,
 * viral-content submissions, creator-verification requests).
 *
 * The frontend talks only to this router; it fans out to each source
 * table and normalizes results into a common shape.
 */

export type ModerationType = "oss" | "sme" | "green" | "viral" | "creator";

interface QueueItem {
  type: ModerationType;
  id: number;
  title: string;
  subtitle: string;
  body?: string;
  submittedBy: string;
  link?: string;
  createdAt: Date | null;
}

async function db() {
  const d = await getDb();
  if (!d) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return d;
}

export const moderationRouter = router({
  /** Pending counts for every submission type — drives the dashboard badges. */
  summary: adminProcedure.query(async () => {
    const d = await db();
    const [oss, sme, green, viral, creator] = await Promise.all([
      d.select().from(ossSubmissions).where(eq(ossSubmissions.status, "pending")),
      d.select().from(smeListings).where(eq(smeListings.status, "pending")),
      d.select().from(greenSubmissions).where(eq(greenSubmissions.status, "pending")),
      d.select().from(viralSubmissions).where(eq(viralSubmissions.status, "pending")),
      d.select().from(creatorProfiles).where(eq(creatorProfiles.verificationStatus, "pending")),
    ]);
    return {
      oss: oss.length,
      sme: sme.length,
      green: green.length,
      viral: viral.length,
      creator: creator.length,
      total: oss.length + sme.length + green.length + viral.length + creator.length,
    };
  }),

  /** Normalized pending queue for one submission type. */
  queue: adminProcedure
    .input(z.object({ type: z.enum(["oss", "sme", "green", "viral", "creator"]) }))
    .query(async ({ input }): Promise<QueueItem[]> => {
      const d = await db();

      if (input.type === "oss") {
        const rows = await d.select().from(ossSubmissions)
          .where(eq(ossSubmissions.status, "pending"))
          .orderBy(desc(ossSubmissions.createdAt));
        return rows.map(r => ({
          type: "oss" as const,
          id: r.id,
          title: r.acronym ? `${r.name} (${r.acronym})` : r.name,
          subtitle: `${r.countryName} · ${r.kind === "update" ? "Update" : "New OSS"}`,
          body: r.mandate ?? r.location ?? undefined,
          submittedBy: r.contributorName || r.contributorId || "Anonymous",
          link: r.sourceUrl || r.website || undefined,
          createdAt: r.createdAt,
        }));
      }

      if (input.type === "sme") {
        const rows = await d.select().from(smeListings)
          .where(eq(smeListings.status, "pending"))
          .orderBy(desc(smeListings.createdAt));
        return rows.map(r => ({
          type: "sme" as const,
          id: r.id,
          title: `${r.name} — ERS ${r.ers ?? 0}`,
          subtitle: `${r.sector} · ${r.countryName}${(r.ers ?? 0) >= 61 ? " · Capital-Ready" : " · Open board"}${r.listedByType !== "self" ? ` · via ${r.listedByType}` : ""}`,
          body: r.summary ?? r.products ?? undefined,
          submittedBy: r.listedByType !== "self" && r.listedByOrg
            ? `${r.listedByOrg} (${r.listedByType})`
            : (r.contactName || r.contributorId || "Owner"),
          link: r.website || undefined,
          createdAt: r.createdAt,
        }));
      }

      if (input.type === "green") {
        const rows = await d.select().from(greenSubmissions)
          .where(eq(greenSubmissions.status, "pending"))
          .orderBy(desc(greenSubmissions.createdAt));
        return rows.map(r => ({
          type: "green" as const,
          id: r.id,
          title: `${r.observationType.replace(/_/g, " ")} — project ${r.projectId.slice(0, 8)}`,
          subtitle: `${r.confirms ? "Confirms" : "Disputes"} claims · ${r.confidenceLevel} confidence`,
          body: r.content,
          submittedBy: `User #${r.userId}`,
          link: (r.photoUrls && r.photoUrls.length) ? r.photoUrls[0] : undefined,
          createdAt: r.createdAt,
        }));
      }

      if (input.type === "viral") {
        const rows = await d.select().from(viralSubmissions)
          .where(eq(viralSubmissions.status, "pending"))
          .orderBy(desc(viralSubmissions.submittedAt));
        return rows.map(r => ({
          type: "viral" as const,
          id: r.id,
          title: r.title || r.contentUrl,
          subtitle: `${r.platform} · ${r.category}`,
          body: r.submitterAnalysis ?? r.description ?? undefined,
          submittedBy: `User #${r.userId}`,
          link: r.contentUrl,
          createdAt: r.submittedAt,
        }));
      }

      // creator verification
      const rows = await d.select().from(creatorProfiles)
        .where(eq(creatorProfiles.verificationStatus, "pending"))
        .orderBy(desc(creatorProfiles.createdAt));
      return rows.map(r => ({
        type: "creator" as const,
        id: r.id,
        title: `Creator #${r.userId} — ${r.tier.replace(/_/g, " ")}`,
        subtitle: `${r.kycVerified ? "KYC verified" : "KYC pending"} · ${r.vouchCount} vouches`,
        body: r.bio ?? undefined,
        submittedBy: `User #${r.userId}`,
        link: r.portfolioUrl ?? undefined,
        createdAt: r.createdAt,
      }));
    }),

  /** Approve or reject a single item; dispatches to the right table. */
  act: adminProcedure
    .input(z.object({
      type: z.enum(["oss", "sme", "green", "viral", "creator"]),
      id: z.number().int(),
      action: z.enum(["approve", "reject"]),
      note: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const d = await db();
      const approve = input.action === "approve";

      switch (input.type) {
        case "oss":
          await d.update(ossSubmissions)
            .set({ status: approve ? "approved" : "rejected", reviewNote: input.note })
            .where(eq(ossSubmissions.id, input.id));
          break;
        case "sme":
          await d.update(smeListings)
            .set({ status: approve ? "approved" : "rejected", reviewNote: input.note })
            .where(eq(smeListings.id, input.id));
          break;
        case "green":
          await d.update(greenSubmissions)
            .set({ status: approve ? "approved" : "rejected" })
            .where(eq(greenSubmissions.id, input.id));
          break;
        case "viral":
          await d.update(viralSubmissions)
            .set({ status: approve ? "accepted" : "rejected" })
            .where(eq(viralSubmissions.id, input.id));
          break;
        case "creator":
          await d.update(creatorProfiles)
            .set({ verificationStatus: approve ? "verified" : "rejected" })
            .where(eq(creatorProfiles.id, input.id));
          break;
      }

      return { ok: true };
    }),

  // ── SME listing management (all statuses) + owner-claim invites ──────────────

  /** All SME listings with any pending claim-invite attached. */
  smeAll: adminProcedure.query(async () => {
    const d = await db();
    const [listings, pendingTransfers] = await Promise.all([
      d.select().from(smeListings).orderBy(desc(smeListings.createdAt)),
      d.select().from(listingTransfers).where(eq(listingTransfers.status, "pending")),
    ]);
    const tByListing = new Map<number, typeof pendingTransfers[number]>();
    pendingTransfers.forEach(t => tByListing.set(t.listingId, t));
    return listings.map(l => {
      const t = tByListing.get(l.id);
      return {
        id: l.id,
        name: l.name,
        sector: l.sector,
        countryName: l.countryName,
        ers: l.ers ?? 0,
        status: l.status,
        contactEmail: l.contactEmail,
        contributorId: l.contributorId,
        listedByType: l.listedByType,
        listedByOrg: l.listedByOrg,
        transfer: t ? { id: t.id, toEmail: t.toEmail, token: t.token, expiresAt: t.expiresAt } : null,
      };
    });
  }),

  /** Admin invites the SME owner to claim management of a listing. */
  inviteToClaim: adminProcedure
    .input(z.object({ listingId: z.number().int(), ownerEmail: z.string().email().max(200) }))
    .mutation(async ({ ctx, input }) => {
      const d = await db();
      const [listing] = await d.select().from(smeListings).where(eq(smeListings.id, input.listingId));
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });

      await d.update(listingTransfers)
        .set({ status: "cancelled" })
        .where(and(eq(listingTransfers.listingId, input.listingId), eq(listingTransfers.status, "pending")));

      const token = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      await d.insert(listingTransfers).values({
        listingId: input.listingId,
        fromContributorId: String(ctx.user.id),
        toEmail: input.ownerEmail,
        token,
        status: "pending",
        expiresAt,
      });

      const claimUrl = `${appBaseUrl()}/exchange/claim/${token}`;
      const email = await sendEmail({
        to: input.ownerEmail,
        subject: `Claim management of ${listing.name} on ViralBeat`,
        html: `
          <p>Hello,</p>
          <p><strong>${listing.name}</strong> is listed on the ViralBeat SME Exchange, and our team is inviting you, the owner, to take over its management.</p>
          <p>To accept, sign in to ViralBeat using this email address and confirm:</p>
          <p><a href="${claimUrl}">${claimUrl}</a></p>
          <p>This link expires in 14 days and only works when you sign in as ${input.ownerEmail}. If you weren't expecting this, you can ignore it.</p>
          <p>— ViralBeat</p>`,
        text: `You're invited to claim management of ${listing.name} on ViralBeat. Sign in as ${input.ownerEmail} and accept: ${claimUrl} (expires in 14 days).`,
      });

      return { ok: true, claimUrl, emailSent: email.sent };
    }),

  /** Admin cancels a pending claim-invite. */
  cancelClaim: adminProcedure
    .input(z.object({ transferId: z.number().int() }))
    .mutation(async ({ input }) => {
      const d = await db();
      await d.update(listingTransfers).set({ status: "cancelled" }).where(eq(listingTransfers.id, input.transferId));
      return { ok: true };
    }),
});
