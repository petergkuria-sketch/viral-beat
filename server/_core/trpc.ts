import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { tierAtLeast, type Tier } from "./tiers";
import { getDb } from "../db";
import { llmCache as llmCacheTable } from "../../drizzle/schema";
import { eq, lt } from "drizzle-orm";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Returns a procedure that requires the user to be on `minTier` or above.
// Usage: analystProcedure = tieredProcedure("analyst")
export function tieredProcedure(minTier: Tier) {
  return t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;

      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      }

      const userTier = (ctx.user as any).subscriptionTier ?? "free";
      if (!tierAtLeast(userTier, minTier)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `This feature requires the ${minTier} plan. Upgrade at /pricing.`,
        });
      }

      return next({ ctx: { ...ctx, user: ctx.user } });
    }),
  );
}

export const analystProcedure = tieredProcedure("analyst");
export const enterpriseProcedure = tieredProcedure("enterprise");

// ── LLM cache helpers (used in routers) ─────────────────────────────────────

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db.select().from(llmCacheTable)
      .where(eq(llmCacheTable.cacheKey, key))
      .limit(1);
    if (!row) return null;
    if (row.expiresAt < new Date()) {
      await db.delete(llmCacheTable).where(eq(llmCacheTable.cacheKey, key));
      return null;
    }
    return row.payload as T;
  } catch {
    return null;
  }
}

export async function setCached(
  key: string,
  payload: Record<string, unknown>,
  ttlSeconds: number,
  model = "claude-opus-4-8",
  tokens?: { input: number; output: number },
) {
  try {
    const db = await getDb();
    if (!db) return;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await db.insert(llmCacheTable).values({
      cacheKey: key,
      payload,
      model,
      inputTokens: tokens?.input ?? 0,
      outputTokens: tokens?.output ?? 0,
      expiresAt,
    }).onDuplicateKeyUpdate({
      set: { payload, expiresAt, model, inputTokens: tokens?.input ?? 0, outputTokens: tokens?.output ?? 0 },
    });
  } catch {
    // cache write failure is non-fatal
  }
}

// Purge expired cache rows (call from a daily cron or on server start).
export async function purgeExpiredCache() {
  try {
    const db = await getDb();
    if (!db) return;
    await db.delete(llmCacheTable).where(lt(llmCacheTable.expiresAt, new Date()));
  } catch { /* non-fatal */ }
}
