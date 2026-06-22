import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const intelligenceRouter = router({
  savePipelineRun: protectedProcedure
    .input(z.object({
      signalTopic: z.string(),
      geoLayer: z.string().optional(),
      geoScope: z.string().optional(),
      pestelCategory: z.string().optional(),
      pestelOutput: z.string().optional(),
      gtScore: z.number().optional(),
      gtDominantMove: z.string().optional(),
      gtAlignment: z.string().optional(),
      reportFormats: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const formatsStr = input.reportFormats?.join(",") ?? null;
      await db.execute(
        sql`INSERT INTO pipelineRuns
          (userId, signalTopic, geoLayer, geoScope, pestelCategory, pestelOutput, gtScore, gtDominantMove, gtAlignment, reportFormats)
          VALUES (
            ${ctx.user.id},
            ${input.signalTopic},
            ${input.geoLayer ?? null},
            ${input.geoScope ?? null},
            ${input.pestelCategory ?? null},
            ${input.pestelOutput ?? null},
            ${input.gtScore ?? null},
            ${input.gtDominantMove ?? null},
            ${input.gtAlignment ?? null},
            ${formatsStr}
          )`
      );
      return { success: true };
    }),

  getRelevantHistory: protectedProcedure
    .input(z.object({
      geoScope: z.string().optional(),
      pestelCategory: z.string().optional(),
      limit: z.number().default(3),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { runs: [] };

      try {
        let query: ReturnType<typeof sql>;
        const lim = input.limit;

        if (input.geoScope && input.pestelCategory) {
          query = sql`SELECT signalTopic, geoScope, pestelCategory, pestelOutput, gtScore, gtDominantMove, gtAlignment, completedAt
            FROM pipelineRuns WHERE geoScope = ${input.geoScope} AND pestelCategory = ${input.pestelCategory}
            ORDER BY completedAt DESC LIMIT ${lim}`;
        } else if (input.geoScope) {
          query = sql`SELECT signalTopic, geoScope, pestelCategory, pestelOutput, gtScore, gtDominantMove, gtAlignment, completedAt
            FROM pipelineRuns WHERE geoScope = ${input.geoScope}
            ORDER BY completedAt DESC LIMIT ${lim}`;
        } else if (input.pestelCategory) {
          query = sql`SELECT signalTopic, geoScope, pestelCategory, pestelOutput, gtScore, gtDominantMove, gtAlignment, completedAt
            FROM pipelineRuns WHERE pestelCategory = ${input.pestelCategory}
            ORDER BY completedAt DESC LIMIT ${lim}`;
        } else {
          query = sql`SELECT signalTopic, geoScope, pestelCategory, pestelOutput, gtScore, gtDominantMove, gtAlignment, completedAt
            FROM pipelineRuns ORDER BY completedAt DESC LIMIT ${lim}`;
        }

        const rows = await db.execute(query);
        return { runs: (rows as any[])[0] ?? [] };
      } catch {
        return { runs: [] };
      }
    }),
});
