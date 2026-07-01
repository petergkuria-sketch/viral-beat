import { z } from "zod";
import { randomBytes } from "crypto";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { smeListings, ersDocuments, ersAppeals } from "../../drizzle/schema";
import { eq, and, desc, inArray, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { recomputeErs, evaluateGateway, TIER1_TYPES, decayStaleErs } from "../services/ersScore";
import { getOrchestrator } from "../_core/ai/orchestrator";
import { isStorageConfigured, createUploadUrl, createDownloadUrl } from "../services/storage";

// Required documents per tier (labels shared with the client checklist).
export const DOC_TYPES = {
  foundation: [
    ["business_registration", "Business registration certificate"],
    ["tax_compliance", "Tax compliance certificate (last 2 years)"],
    ["bank_statements", "Bank statements (last 6 months)"],
    ["ownership", "Ownership / organisational structure"],
  ],
  verification: [
    ["certifications", "Industry certifications (NAFDAC / FDA / ISO…)"],
    ["customer_references", "Customer references (3+ letters)"],
    ["financial_statements", "Financial statements (audited / reviewed)"],
  ],
  compliance: [
    ["env_labor", "Environmental / labour compliance"],
    ["insurance", "Insurance certificates"],
    ["ip", "Intellectual property documentation"],
    ["export_license", "Export / import licenses"],
  ],
} as const;

const ALL_TYPES = new Set<string>(Object.values(DOC_TYPES).flat().map(([t]) => t));

async function ownedListing(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, listingId: number, userId: string) {
  const [l] = await db.select().from(smeListings).where(eq(smeListings.id, listingId));
  if (!l) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
  if (l.contributorId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "Not your listing" });
  return l;
}

export const ersDocumentsRouter = router({
  /** SME owner submits a document reference. Documents are the FINAL phase — the
   * listing must already be validator-verified. */
  submit: protectedProcedure
    .input(z.object({
      listingId: z.number().int(),
      tier: z.enum(["foundation", "verification", "compliance"]),
      docType: z.string().min(2).max(64),
      label: z.string().max(200).optional(),
      reference: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      if (!ALL_TYPES.has(input.docType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown document type" });
      const l = await ownedListing(db, input.listingId, String(ctx.user.id));
      if (l.verificationLevel !== "validator_verified" && l.verificationLevel !== "fully_verified") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Complete validator verification before submitting documents — documents are the final step." });
      }

      // Re-submitting a document type replaces the prior one and returns it to review.
      const [existing] = await db.select().from(ersDocuments)
        .where(and(eq(ersDocuments.listingId, input.listingId), eq(ersDocuments.docType, input.docType)));
      if (existing) {
        await db.update(ersDocuments).set({
          tier: input.tier, label: input.label ?? null, reference: input.reference ?? null,
          status: "pending", reviewNote: null, aiNote: null,
        }).where(eq(ersDocuments.id, existing.id));
      } else {
        await db.insert(ersDocuments).values({
          listingId: input.listingId, submittedByUserId: String(ctx.user.id),
          tier: input.tier, docType: input.docType,
          label: input.label ?? null, reference: input.reference ?? null, status: "pending",
        });
      }
      await recomputeErs(db, input.listingId);
      return { ok: true };
    }),

  /** Owner view — submitted documents + gateway checklist/status. */
  mine: protectedProcedure
    .input(z.object({ listingId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { docs: [], gateway: null, gateReady: false };
      const l = await ownedListing(db, input.listingId, String(ctx.user.id));
      const docs = await db.select().from(ersDocuments)
        .where(eq(ersDocuments.listingId, input.listingId)).orderBy(desc(ersDocuments.createdAt));
      const g = evaluateGateway(docs);
      return {
        docs: docs.map(d => ({ id: d.id, tier: d.tier, docType: d.docType, label: d.label, status: d.status, reviewNote: d.reviewNote })),
        gateway: { tier1Ok: g.tier1Ok, tier2Count: g.tier2Count, tier3Count: g.tier3Count, documentErs: g.documentErs, flagged: g.flagged },
        gateReady: l.verificationLevel === "validator_verified" || l.verificationLevel === "fully_verified",
        tier1Types: TIER1_TYPES,
      };
    }),

  /** Admin — documents awaiting review (pending or flagged), with listing name. */
  adminPending: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(ersDocuments)
      .where(ne(ersDocuments.status, "verified")).orderBy(desc(ersDocuments.createdAt));
    const ids = Array.from(new Set(rows.map(r => r.listingId)));
    const listings = ids.length ? await db.select().from(smeListings).where(inArray(smeListings.id, ids)) : [];
    const nameOf = new Map(listings.map(l => [l.id, l.name]));
    return rows.map(r => ({
      id: r.id, listingId: r.listingId, listingName: nameOf.get(r.listingId) ?? `#${r.listingId}`,
      tier: r.tier, docType: r.docType, label: r.label, reference: r.reference,
      status: r.status, aiNote: r.aiNote, createdAt: r.createdAt,
    }));
  }),

  /** Admin — verify / reject / flag (fraud) a document. Recomputes the gateway. */
  adminReview: adminProcedure
    .input(z.object({ id: z.number().int(), action: z.enum(["verify", "reject", "flag"]), note: z.string().max(1000).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [doc] = await db.select().from(ersDocuments).where(eq(ersDocuments.id, input.id));
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      const status = input.action === "verify" ? "verified" : input.action === "reject" ? "rejected" : "flagged";
      await db.update(ersDocuments).set({ status, reviewNote: input.note ?? null }).where(eq(ersDocuments.id, input.id));
      const res = await recomputeErs(db, doc.listingId);
      return { ok: true, verificationLevel: res?.level ?? "unverified" };
    }),

  /** Admin — AI authenticity assist: cross-checks the submitted references for
   * internal consistency (advisory only, never decisive). Uses the 3-tier router. */
  aiCheck: adminProcedure
    .input(z.object({ listingId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [l] = await db.select().from(smeListings).where(eq(smeListings.id, input.listingId));
      if (!l) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      const docs = await db.select().from(ersDocuments).where(eq(ersDocuments.listingId, input.listingId));
      if (docs.length === 0) return { summary: "No documents submitted yet." };

      const manifest = docs.map(d => `- [${d.tier}/${d.docType}] ${d.label ?? "(no label)"} — ref: ${d.reference ?? "(none)"}`).join("\n");
      try {
        const resp = await getOrchestrator().generate({
          system: "You are a due-diligence assistant reviewing a document manifest for an SME on an investment-readiness platform. Flag ONLY internal inconsistencies (mismatched ownership/company names, contradictory figures, missing issuer references, obviously placeholder or non-verifiable references). Be concise. You are advisory — a human verifies each document. Do not invent facts.",
          messages: [{ role: "user", content: `SME: ${l.name} (${l.sector}, ${l.countryName})\nStated ownership: ${l.ownership ?? "n/a"}\n\nDocument manifest:\n${manifest}\n\nList any authenticity or consistency concerns as short bullets, or reply "No inconsistencies detected in the manifest." if clean.` }],
          maxTokens: 400,
          metadata: { taskType: "ers_doc_authenticity", userId: null },
        });
        return { summary: resp.text?.trim() || "No response from authenticity check." };
      } catch (e: any) {
        return { summary: `Authenticity check unavailable: ${e?.message ?? "error"}` };
      }
    }),

  // ── Direct file upload (S3-compatible). Falls back to reference model if unset ──
  storageEnabled: publicProcedure.query(() => ({ enabled: isStorageConfigured() })),

  /** Owner requests a presigned URL to upload a document file directly. */
  uploadUrl: protectedProcedure
    .input(z.object({ listingId: z.number().int(), docType: z.string().min(2).max(64), contentType: z.string().max(120), ext: z.string().max(10).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStorageConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "File storage is not configured." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await ownedListing(db, input.listingId, String(ctx.user.id));
      const safeExt = (input.ext ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 8);
      const key = `ers-docs/${input.listingId}/${input.docType}-${randomBytes(8).toString("hex")}${safeExt ? "." + safeExt : ""}`;
      const uploadUrl = await createUploadUrl(key, input.contentType || "application/octet-stream");
      return { uploadUrl, reference: `s3:${key}` }; // store reference as s3:<key>
    }),

  /** Admin resolves an s3:<key> reference to a short-lived viewing URL. */
  docUrl: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [doc] = await db.select().from(ersDocuments).where(eq(ersDocuments.id, input.id));
      if (!doc?.reference?.startsWith("s3:")) throw new TRPCError({ code: "BAD_REQUEST", message: "No stored file for this document" });
      const url = await createDownloadUrl(doc.reference.slice(3));
      return { url };
    }),

  /** Admin: manually trigger the annual re-verification decay sweep. */
  adminRunDecay: adminProcedure.mutation(async () => decayStaleErs()),

  // ── Appeals ──────────────────────────────────────────────────────────────
  /** Owner contests a score or document decision. */
  submitAppeal: protectedProcedure
    .input(z.object({ listingId: z.number().int(), reason: z.string().min(10).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await ownedListing(db, input.listingId, String(ctx.user.id));
      await db.insert(ersAppeals).values({ listingId: input.listingId, submittedByUserId: String(ctx.user.id), reason: input.reason, status: "open" });
      return { ok: true };
    }),

  /** Owner's appeals for a listing. */
  myAppeals: protectedProcedure
    .input(z.object({ listingId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      await ownedListing(db, input.listingId, String(ctx.user.id));
      return db.select().from(ersAppeals).where(eq(ersAppeals.listingId, input.listingId)).orderBy(desc(ersAppeals.createdAt));
    }),

  /** Admin: open appeals across all listings. */
  adminAppeals: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(ersAppeals).where(eq(ersAppeals.status, "open")).orderBy(desc(ersAppeals.createdAt));
    const ids = Array.from(new Set(rows.map(r => r.listingId)));
    const listings = ids.length ? await db.select().from(smeListings).where(inArray(smeListings.id, ids)) : [];
    const nameOf = new Map(listings.map(l => [l.id, l.name]));
    return rows.map(r => ({ id: r.id, listingId: r.listingId, listingName: nameOf.get(r.listingId) ?? `#${r.listingId}`, reason: r.reason, createdAt: r.createdAt }));
  }),

  /** Admin: resolve or reject an appeal. */
  resolveAppeal: adminProcedure
    .input(z.object({ id: z.number().int(), action: z.enum(["resolve", "reject"]), resolution: z.string().max(1000).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.update(ersAppeals).set({ status: input.action === "resolve" ? "resolved" : "rejected", resolution: input.resolution ?? null }).where(eq(ersAppeals.id, input.id));
      return { ok: true };
    }),
});
