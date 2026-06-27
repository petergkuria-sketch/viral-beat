import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { agentMemory } from "../../drizzle/schema";
import { eq, like, and, isNull, or, gt, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const MemoryInput = z.object({
  key:       z.string().min(1).max(255),
  value:     z.string().min(1),
  category:  z.string().max(64).default("general"),
  tags:      z.array(z.string()).optional(),
  metadata:  z.record(z.string(), z.unknown()).optional(),
  source:    z.string().max(128).optional(),
  ttlDays:   z.number().int().positive().optional(), // null = permanent
});

export const memoryRouter = router({

  // ── Public read (used by Claude agent at runtime) ────────────────────────
  get: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const now = new Date();
      const [row] = await db
        .select()
        .from(agentMemory)
        .where(and(
          eq(agentMemory.key, input.key),
          or(isNull(agentMemory.expiresAt), gt(agentMemory.expiresAt, now)),
        ))
        .limit(1);
      return row ?? null;
    }),

  // search by category + optional keyword in key or value
  search: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      q:        z.string().optional(),
      limit:    z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const now = new Date();

      const conditions = [
        or(isNull(agentMemory.expiresAt), gt(agentMemory.expiresAt, now)),
      ];
      if (input.category) conditions.push(eq(agentMemory.category, input.category));
      if (input.q) {
        const pattern = `%${input.q}%`;
        conditions.push(
          or(like(agentMemory.key, pattern), like(agentMemory.value, pattern))!
        );
      }

      return db
        .select()
        .from(agentMemory)
        .where(and(...conditions))
        .orderBy(desc(agentMemory.updatedAt))
        .limit(input.limit);
    }),

  // ── Write (agent or admin) ───────────────────────────────────────────────
  set: publicProcedure
    .input(MemoryInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const expiresAt = input.ttlDays
        ? new Date(Date.now() + input.ttlDays * 86_400_000)
        : null;

      await db
        .insert(agentMemory)
        .values({
          key:      input.key,
          value:    input.value,
          category: input.category,
          tags:     input.tags ?? [],
          metadata: input.metadata ?? {},
          source:   input.source ?? "agent",
          expiresAt: expiresAt ?? undefined,
        })
        .onDuplicateKeyUpdate({
          set: {
            value:     input.value,
            category:  input.category,
            tags:      input.tags ?? [],
            metadata:  input.metadata ?? {},
            source:    input.source ?? "agent",
            expiresAt: expiresAt ?? undefined,
            updatedAt: sql`NOW()`,
          },
        });

      return { ok: true };
    }),

  // ── Admin-only ───────────────────────────────────────────────────────────
  adminList: adminProcedure
    .input(z.object({
      category: z.string().optional(),
      limit:    z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = input.category ? [eq(agentMemory.category, input.category)] : [];
      return db
        .select()
        .from(agentMemory)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(agentMemory.updatedAt))
        .limit(input.limit);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(agentMemory).where(eq(agentMemory.id, input.id));
      return { ok: true };
    }),

  purgeExpired: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const now = new Date();
      await db.delete(agentMemory).where(
        and(sql`${agentMemory.expiresAt} IS NOT NULL`, sql`${agentMemory.expiresAt} < ${now}`)
      );
      return { ok: true };
    }),

  // Category list (for filter UI)
  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .selectDistinct({ category: agentMemory.category })
      .from(agentMemory)
      .orderBy(agentMemory.category);
    return rows.map(r => r.category);
  }),
});
