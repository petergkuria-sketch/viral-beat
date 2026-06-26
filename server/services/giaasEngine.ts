/**
 * GIaaS Validation Engine
 * Analyses citizen submissions against project ESG claims using LLM.
 * Awards VBT to approved submitters via the existing tokenRewards service.
 */

import { randomUUID } from "crypto";
import { getDb } from "../db";
import { greenProjects, greenSubmissions, greenValidations, scannerSignals } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM, type InvokeResult } from "../_core/llm";
import { awardTokens } from "./tokenRewards";
import { pushGreenTicker } from "./giaasProjectAgent";

const VBT_REWARD_APPROVED_CONFIRMS  = 25;  // VBT for approved supporting observation
const VBT_REWARD_APPROVED_DISPUTES  = 40;  // VBT for approved dispute (higher — ground-truth is harder)
const VBT_REWARD_HIGH_CONFIDENCE    = 15;  // bonus for high-confidence submission

export type ValidationVerdict = "verified" | "inconclusive" | "flagged" | "greenwashing";

interface ValidationResult {
  divergenceScore: number;   // 0–100, higher = more greenwashing risk
  confidenceScore: number;   // 0–100
  verdict: ValidationVerdict;
  verdictSummary: string;
  giaasScore: number;        // 0–100 composite
  claimsAnalysis: Record<string, any>;
}

async function db() {
  const d = await getDb();
  if (!d) throw new Error("DB unavailable");
  return d;
}

export async function runValidation(
  projectId: string,
  triggeredBy?: number
): Promise<typeof greenValidations.$inferSelect | null> {
  const d = await db();

  const [project] = await d
    .select()
    .from(greenProjects)
    .where(eq(greenProjects.projectId, projectId))
    .limit(1);

  if (!project) return null;

  const submissions = await d
    .select()
    .from(greenSubmissions)
    .where(and(
      eq(greenSubmissions.projectId, projectId),
      eq(greenSubmissions.status, "approved")
    ));

  const confirmsCount  = submissions.filter(s => s.confirms).length;
  const disputesCount  = submissions.filter(s => !s.confirms).length;
  const citizenDataPoints = submissions.length;

  const result = await runLLMValidation(project, submissions);

  const validationId = randomUUID();

  await d.insert(greenValidations).values({
    validationId,
    projectId,
    citizenDataPoints,
    confirmsCount,
    disputesCount,
    divergenceScore: result.divergenceScore.toString(),
    confidenceScore: result.confidenceScore.toString(),
    verdict: result.verdict,
    verdictSummary: result.verdictSummary,
    giaasScore: result.giaasScore.toString(),
    claimsAnalysis: result.claimsAnalysis,
    triggeredAlert: result.verdict === "greenwashing" || result.verdict === "flagged",
    triggeredBy: triggeredBy ?? null,
  });

  // Update project with new score and status
  const newStatus =
    result.verdict === "verified" ? "validated" :
    result.verdict === "greenwashing" ? "flagged" :
    result.verdict === "flagged" ? "flagged" : "active";

  // Pull political risk from latest scanner signal for this country
  const [latestSignal] = await d
    .select({ severity: scannerSignals.severity })
    .from(scannerSignals)
    .where(eq(scannerSignals.countryCode, project.countryCode))
    .orderBy(desc(scannerSignals.ingestedAt))
    .limit(1);

  const politicalRiskScore = latestSignal
    ? (latestSignal.severity === "breaking" ? 75 : latestSignal.severity === "alert" ? 50 : 25)
    : null;

  await d
    .update(greenProjects)
    .set({
      giaasScore: result.giaasScore.toString(),
      status: newStatus,
      ...(politicalRiskScore !== null ? { politicalRiskScore: politicalRiskScore.toString() } : {}),
    })
    .where(eq(greenProjects.projectId, projectId));

  // If greenwashing flagged, write a scanner signal and push to ticker
  if (result.verdict === "greenwashing" || result.verdict === "flagged") {
    const sigId = randomUUID();
    await d.insert(scannerSignals).values({
      signalId:    sigId,
      countryCode: project.countryCode,
      dim:         "En",
      severity:    result.verdict === "greenwashing" ? "breaking" : "alert",
      headline:    `GIaaS Alert: ${project.developer} — ${project.title}`,
      body:        result.verdictSummary,
      source:      "GIaaS Validation Engine",
      sourceType:  "field",
      ingestedAt:  new Date(),
    }).catch(e => console.warn("[GIaaS] failed to write scanner signal:", e));

    await pushGreenTicker({
      signalId:     sigId,
      countryCode:  project.countryCode,
      headline:     result.verdict === "greenwashing"
        ? `🚨 Greenwashing Alert: ${project.developer} — ${project.title}`
        : `⚠️ GIaaS Flag: ${project.developer} — ${project.title}`,
      severity:     result.verdict === "greenwashing" ? "breaking" : "normal",
      deltaLabel:   `Divergence ${Number(result.divergenceScore).toFixed(0)}%`,
      deltaDir:     "down",
      verdictKey:   result.verdict,
      verdictLabel: result.verdict === "greenwashing" ? "Greenwashing" : "Flagged",
      source:       "GIaaS Validation Engine",
    }).catch(e => console.warn("[GIaaS] ticker push failed:", e));
  }

  const [saved] = await d
    .select()
    .from(greenValidations)
    .where(eq(greenValidations.validationId, validationId))
    .limit(1);

  return saved ?? null;
}

export async function approveSubmission(
  submissionId: string,
  qualityScore: number
): Promise<void> {
  const d = await db();

  const [sub] = await d
    .select()
    .from(greenSubmissions)
    .where(eq(greenSubmissions.submissionId, submissionId))
    .limit(1);

  if (!sub || sub.status !== "pending") return;

  let vbt = sub.confirms ? VBT_REWARD_APPROVED_CONFIRMS : VBT_REWARD_APPROVED_DISPUTES;
  if (sub.confidenceLevel === "high") vbt += VBT_REWARD_HIGH_CONFIDENCE;

  await d
    .update(greenSubmissions)
    .set({ status: "approved", qualityScore: qualityScore.toString(), vbtRewarded: vbt, rewardedAt: new Date() })
    .where(eq(greenSubmissions.submissionId, submissionId));

  await awardTokens(
    sub.userId,
    "green_submission",
    `GIaaS field observation approved — ${sub.observationType}`,
    { submissionId, projectId: sub.projectId, vbt }
  ).catch(e => console.warn("[GIaaS] token award failed:", e));
}

async function runLLMValidation(
  project: typeof greenProjects.$inferSelect,
  submissions: (typeof greenSubmissions.$inferSelect)[]
): Promise<ValidationResult> {
  const confirmsTexts = submissions.filter(s => s.confirms).map(s => `- ${s.content}`).join("\n") || "None";
  const disputesTexts = submissions.filter(s => !s.confirms).map(s => `- ${s.content}`).join("\n") || "None";

  const sectorMetricsStr = project.sectorMetrics
    ? Object.entries(project.sectorMetrics as Record<string, string | number>)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join("\n")
    : "Not provided";

  const prompt = `You are a green investment validation analyst for Africa.

PROJECT CLAIMS:
- Title: ${project.title}
- Developer: ${project.developer}
- Sector: ${project.sector}
- Country: ${project.countryName} (${project.countryCode})
- Claimed CO2 reduction: ${project.claimedCo2Reduction ?? "not specified"} tonnes
- Claimed jobs created: ${project.claimedJobsCreated ?? "not specified"}
- Claimed capacity: ${project.claimedCapacityMw ?? "not specified"} MW
- Budget: $${project.budget ?? "not specified"} USD
- Sector metrics:
${sectorMetricsStr}
- Certifications: ${(project.certifications as string[])?.join(", ") || "none"}

CITIZEN GROUND-TRUTH DATA:
Supporting observations (${submissions.filter(s => s.confirms).length}):
${confirmsTexts}

Disputing observations (${submissions.filter(s => !s.confirms).length}):
${disputesTexts}

Analyse whether the developer's claims are consistent with ground-truth evidence.
Return ONLY valid JSON with this exact structure:
{
  "divergenceScore": <0-100, higher = more greenwashing risk>,
  "confidenceScore": <0-100, higher = more confident in verdict>,
  "verdict": <"verified"|"inconclusive"|"flagged"|"greenwashing">,
  "verdictSummary": "<2-3 sentence plain-English verdict>",
  "giaasScore": <0-100 composite project quality score>,
  "claimsAnalysis": {
    "co2Claim": "<verified|unverified|disputed|not_applicable>",
    "jobsClaim": "<verified|unverified|disputed|not_applicable>",
    "capacityClaim": "<verified|unverified|disputed|not_applicable>",
    "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"]
  }
}`;

  try {
    const result: InvokeResult = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1024,
    });
    const raw = result.choices[0]?.message?.content;
    const text = typeof raw === "string" ? raw : (raw as any[])?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]) as ValidationResult;
  } catch {
    // Fallback when LLM fails or no submissions yet
    const noData = submissions.length === 0;
    return {
      divergenceScore: noData ? 0 : 30,
      confidenceScore: noData ? 10 : 40,
      verdict: "inconclusive",
      verdictSummary: noData
        ? "No citizen submissions available yet. Score pending field data."
        : "Insufficient data to reach a confident verdict. More field observations needed.",
      giaasScore: 50,
      claimsAnalysis: { keyFindings: ["Insufficient data for automated analysis"] },
    };
  }
}

