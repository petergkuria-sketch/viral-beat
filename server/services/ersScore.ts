import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { smeListings, ersValidators, ersDocuments } from "../../drizzle/schema";
import { sendEmail, appBaseUrl } from "./email";

export const MIN_VALIDATORS = 3;

// Tier-1 "Foundation" documents are mandatory — a gap or fraud flag here VETOES
// document verification entirely (my key change from the review, which made
// documents merely additive). Without a clean Tier-1, an SME cannot reach
// fully_verified / the Capital-Ready board however good its other layers are.
export const TIER1_TYPES = ["business_registration", "tax_compliance", "bank_statements", "ownership"] as const;

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Evaluate the document gateway → { tier1Ok (veto cleared), documentErs 0–20 }. */
export function evaluateGateway(docs: { tier: string; docType: string; status: string }[]) {
  const verified = docs.filter(d => d.status === "verified");
  const flagged = docs.some(d => d.status === "flagged"); // any fraud flag fails the gateway
  const tier1Verified = new Set(verified.filter(d => d.tier === "foundation").map(d => d.docType));
  const tier1Ok = !flagged && TIER1_TYPES.every(t => tier1Verified.has(t));
  const tier2Count = verified.filter(d => d.tier === "verification").length;
  const tier3Count = verified.filter(d => d.tier === "compliance").length;
  // Documents only score once the Tier-1 veto is cleared.
  const documentErs = tier1Ok ? (10 + (tier2Count >= 2 ? 5 : 0) + (tier3Count >= 1 ? 5 : 0)) : 0;
  return { tier1Ok, tier2Count, tier3Count, documentErs, flagged };
}

/**
 * Single source of truth for a listing's weighted ERS and verification level.
 * Combines Layer 1 (stored self), Layer 2 (validator consensus) and Layer 3
 * (document gateway), sets verificationLevel, and fires the graduation email
 * the first time a listing reaches fully_verified.
 */
export async function recomputeErs(db: Db, listingId: number) {
  const [l] = await db.select().from(smeListings).where(eq(smeListings.id, listingId));
  if (!l) return;
  const selfErs = l.selfErs ?? 0;

  // ── Layer 2: validators ──
  const scoredVals = (await db.select().from(ersValidators)
    .where(and(eq(ersValidators.listingId, listingId), eq(ersValidators.status, "scored"))))
    .filter(v => v.govScore != null && v.finScore != null && v.innScore != null && v.mktScore != null);
  const validatorsOk = scoredVals.length >= MIN_VALIDATORS;
  let validatorErs = 0, validatorFlag = false;
  if (validatorsOk) {
    const rows = scoredVals.map(v => ({
      avg: (v.govScore! + v.finScore! + v.innScore! + v.mktScore!) / 4,
      rep: Math.max(1, v.reputation ?? 100),
    }));
    const wsum = rows.reduce((s, r) => s + r.rep, 0);
    const consensus = rows.reduce((s, r) => s + r.avg * r.rep, 0) / (wsum || 1);
    validatorErs = Math.round(consensus * 0.30);
    validatorFlag = (Math.max(...rows.map(r => r.avg)) - Math.min(...rows.map(r => r.avg))) > 30;
  }

  // ── Layer 3: documents ──
  const docs = await db.select().from(ersDocuments).where(eq(ersDocuments.listingId, listingId));
  const gateway = evaluateGateway(docs);
  const documentErs = gateway.documentErs;
  const docsOk = gateway.tier1Ok;

  // ── Verification level (documents are the final gate to fully_verified) ──
  const level = validatorsOk && docsOk ? "fully_verified" as const
    : validatorsOk ? "validator_verified" as const
    : docsOk ? "document_verified" as const
    : "unverified" as const;
  const ers = Math.min(100, selfErs + validatorErs + documentErs);
  const wasFull = l.verificationLevel === "fully_verified";

  await db.update(smeListings).set({
    validatorErs, documentErs, ers,
    verificationLevel: level, validatorFlag,
    provisional: level !== "fully_verified",
    ersVerifiedAt: level === "fully_verified" ? new Date() : l.ersVerifiedAt,
  }).where(eq(smeListings.id, listingId));

  if (level === "fully_verified" && !wasFull) await sendGraduationEmail(l, ers);
  return { level, ers, validatorErs, documentErs };
}

/** Prompt 4 — graduation notification when an SME reaches Capital-Ready. */
async function sendGraduationEmail(listing: typeof smeListings.$inferSelect, ers: number) {
  const to = listing.contactEmail;
  if (!to) return;
  const url = `${appBaseUrl()}/exchange/sme/${listing.id}`;
  await sendEmail({
    to,
    subject: `🎉 ${listing.name} is now Capital-Ready on ViralBeat (ERS ${ers})`,
    text: `Congratulations!\n\n${listing.name} has reached an Enterprise Readiness Score of ${ers} and is fully verified — self-assessment, independent validators, and documents all cleared. You've graduated to the Capital-Ready board, where institutional investors and development finance institutions screen for partnership opportunities.\n\nView your profile: ${url}\n\nNext steps: highlight your strengths and investment ask, enable investor inquiries, and prepare for due diligence.`,
    html: `<p>Congratulations!</p><p><b>${listing.name}</b> has reached an Enterprise Readiness Score of <b>${ers}</b> and is <b>fully verified</b> — self-assessment, independent validators, and documents all cleared. You've graduated to the <b>Capital-Ready board</b>, where institutional investors and DFIs screen for partnership opportunities.</p><p><a href="${url}">View your profile</a></p><p>Next steps: highlight your strengths and investment ask, enable investor inquiries, and prepare for due diligence.</p>`,
  });
}
