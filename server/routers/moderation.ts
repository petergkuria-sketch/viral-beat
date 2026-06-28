import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { ossSubmissions, greenSubmissions, viralSubmissions, creatorProfiles, smeListings } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
});
