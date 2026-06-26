/**
 * GIaaS tRPC router
 *
 * Public:
 *   projects.list     — paginated project directory
 *   projects.get      — single project with latest validation + submission counts
 *   submissions.list  — approved submissions for a project
 *   validations.latest — latest validation result for a project
 *
 * Protected (any authenticated user):
 *   submissions.submit — citizen field observation
 *
 * Analyst+:
 *   projects.create   — register a new green project
 *   validations.run   — trigger AI validation for a project
 *   submissions.approve / reject — moderate citizen data
 */

import { z } from "zod";
import { randomUUID } from "crypto";
import { router, publicProcedure, protectedProcedure, analystProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  greenProjects, greenSubmissions, greenValidations,
} from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { runValidation, approveSubmission } from "../services/giaasEngine";
import { runGiaasAgentCycle, runGiaasCountryCycle } from "../services/giaasProjectAgent";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("DB unavailable");
  return d;
}

export const giaasRouter = router({

  // ── Projects ─────────────────────────────────────────────────────────────

  projectsList: publicProcedure
    .input(z.object({
      sector:      z.enum(["renewable_energy", "reit", "agriculture"]).optional(),
      countryCode: z.string().length(3).toUpperCase().optional(),
      status:      z.enum(["pending", "active", "validated", "flagged"]).optional(),
      limit:       z.number().min(1).max(50).default(20),
      offset:      z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const d = await db();
      const conditions = [];
      if (input.sector)      conditions.push(eq(greenProjects.sector, input.sector));
      if (input.countryCode) conditions.push(eq(greenProjects.countryCode, input.countryCode));
      if (input.status)      conditions.push(eq(greenProjects.status, input.status));

      const rows = await d
        .select()
        .from(greenProjects)
        .where(conditions.length === 1 ? conditions[0] : conditions.length > 1 ? and(...conditions as [any, ...any[]]) : undefined)
        .orderBy(desc(greenProjects.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows;
    }),

  projectsGet: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const d = await db();

      const [project] = await d
        .select()
        .from(greenProjects)
        .where(eq(greenProjects.projectId, input.projectId))
        .limit(1);

      if (!project) return null;

      const [latestValidation] = await d
        .select()
        .from(greenValidations)
        .where(eq(greenValidations.projectId, input.projectId))
        .orderBy(desc(greenValidations.runAt))
        .limit(1);

      const [counts] = await d
        .select({
          total:    sql<number>`COUNT(*)`,
          confirms: sql<number>`SUM(CASE WHEN ${greenSubmissions.confirms} = 1 THEN 1 ELSE 0 END)`,
          disputes: sql<number>`SUM(CASE WHEN ${greenSubmissions.confirms} = 0 THEN 1 ELSE 0 END)`,
        })
        .from(greenSubmissions)
        .where(and(
          eq(greenSubmissions.projectId, input.projectId),
          eq(greenSubmissions.status, "approved")
        ));

      return { project, latestValidation: latestValidation ?? null, submissionCounts: counts };
    }),

  projectsCreate: analystProcedure
    .input(z.object({
      title:               z.string().min(5).max(255),
      developer:           z.string().min(2).max(255),
      sector:              z.enum(["renewable_energy", "reit", "agriculture"]),
      countryCode:         z.string().length(3),
      countryName:         z.string().min(2).max(100),
      description:         z.string().min(20),
      claimedCo2Reduction: z.number().positive().optional(),
      claimedJobsCreated:  z.number().int().positive().optional(),
      claimedCapacityMw:   z.number().positive().optional(),
      budget:              z.number().positive().optional(),
      startDate:           z.string().optional(),
      endDate:             z.string().optional(),
      certifications:      z.array(z.string()).optional(),
      sectorMetrics:       z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const d = await db();
      const projectId = randomUUID();
      await d.insert(greenProjects).values({
        projectId,
        title:               input.title,
        developer:           input.developer,
        sector:              input.sector,
        countryCode:         input.countryCode.toUpperCase(),
        countryName:         input.countryName,
        description:         input.description,
        claimedCo2Reduction: input.claimedCo2Reduction?.toString(),
        claimedJobsCreated:  input.claimedJobsCreated,
        claimedCapacityMw:   input.claimedCapacityMw?.toString(),
        budget:              input.budget?.toString(),
        startDate:           input.startDate,
        endDate:             input.endDate,
        certifications:      input.certifications ?? [],
        sectorMetrics:       (input.sectorMetrics ?? {}) as Record<string, string | number>,
        status:              "active",
        submittedBy:         ctx.user?.id,
      });
      return { projectId };
    }),

  // ── Citizen Submissions ──────────────────────────────────────────────────

  submissionsSubmit: protectedProcedure
    .input(z.object({
      projectId:       z.string(),
      observationType: z.enum(["site_visit", "photo", "community_report", "sensor"]),
      content:         z.string().min(20).max(2000),
      photoUrls:       z.array(z.string().url()).max(5).optional(),
      geoLat:          z.number().optional(),
      geoLng:          z.number().optional(),
      confirms:        z.boolean(),
      confidenceLevel: z.enum(["low", "medium", "high"]).default("medium"),
    }))
    .mutation(async ({ input, ctx }) => {
      const d = await db();

      // Verify project exists
      const [project] = await d
        .select({ projectId: greenProjects.projectId })
        .from(greenProjects)
        .where(eq(greenProjects.projectId, input.projectId))
        .limit(1);

      if (!project) throw new Error("Project not found");

      const submissionId = randomUUID();
      await d.insert(greenSubmissions).values({
        submissionId,
        projectId:       input.projectId,
        userId:          ctx.user!.id,
        observationType: input.observationType,
        content:         input.content,
        photoUrls:       input.photoUrls ?? [],
        geoLat:          input.geoLat?.toString(),
        geoLng:          input.geoLng?.toString(),
        confirms:        input.confirms,
        confidenceLevel: input.confidenceLevel,
        status:          "pending",
      });

      return { submissionId, message: "Submission received. VBT will be awarded once reviewed." };
    }),

  submissionsList: publicProcedure
    .input(z.object({
      projectId: z.string(),
      limit:     z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const d = await db();
      return d
        .select()
        .from(greenSubmissions)
        .where(and(
          eq(greenSubmissions.projectId, input.projectId),
          eq(greenSubmissions.status, "approved")
        ))
        .orderBy(desc(greenSubmissions.createdAt))
        .limit(input.limit);
    }),

  submissionsApprove: analystProcedure
    .input(z.object({
      submissionId: z.string(),
      qualityScore: z.number().min(0).max(1).default(0.8),
    }))
    .mutation(async ({ input }) => {
      await approveSubmission(input.submissionId, input.qualityScore);
      return { ok: true };
    }),

  submissionsReject: analystProcedure
    .input(z.object({ submissionId: z.string() }))
    .mutation(async ({ input }) => {
      const d = await db();
      await d
        .update(greenSubmissions)
        .set({ status: "rejected" })
        .where(eq(greenSubmissions.submissionId, input.submissionId));
      return { ok: true };
    }),

  submissionsPending: analystProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      const d = await db();
      return d
        .select()
        .from(greenSubmissions)
        .where(eq(greenSubmissions.status, "pending"))
        .orderBy(desc(greenSubmissions.createdAt))
        .limit(input.limit);
    }),

  // ── Validations ──────────────────────────────────────────────────────────

  validationsRun: analystProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await runValidation(input.projectId, ctx.user?.id);
      if (!result) throw new Error("Project not found");
      return result;
    }),

  validationsLatest: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const d = await db();
      const [row] = await d
        .select()
        .from(greenValidations)
        .where(eq(greenValidations.projectId, input.projectId))
        .orderBy(desc(greenValidations.runAt))
        .limit(1);
      return row ?? null;
    }),

  // ── Agent controls ────────────────────────────────────────────────────────

  agentRun: analystProcedure
    .mutation(async () => {
      return runGiaasAgentCycle();
    }),

  agentRunCountry: analystProcedure
    .input(z.object({ countryCode: z.string().length(3).toUpperCase() }))
    .mutation(async ({ input }) => {
      return runGiaasCountryCycle(input.countryCode);
    }),

  // ── Dashboard stats (admin) ───────────────────────────────────────────────

  adminStats: adminProcedure.query(async () => {
    const d = await db();
    const [projectStats] = await d
      .select({
        total:     sql<number>`COUNT(*)`,
        validated: sql<number>`SUM(CASE WHEN ${greenProjects.status} = 'validated' THEN 1 ELSE 0 END)`,
        flagged:   sql<number>`SUM(CASE WHEN ${greenProjects.status} = 'flagged' THEN 1 ELSE 0 END)`,
        active:    sql<number>`SUM(CASE WHEN ${greenProjects.status} = 'active' THEN 1 ELSE 0 END)`,
      })
      .from(greenProjects);

    const [subStats] = await d
      .select({
        total:   sql<number>`COUNT(*)`,
        pending: sql<number>`SUM(CASE WHEN ${greenSubmissions.status} = 'pending' THEN 1 ELSE 0 END)`,
      })
      .from(greenSubmissions);

    return { projects: projectStats, submissions: subStats };
  }),
});
