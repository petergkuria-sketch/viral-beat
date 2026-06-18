import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, subscriptionEvents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TIER_LIMITS, getTierLimits } from "../_core/tiers";
import type { Tier } from "../_core/tiers";
import { TRPCError } from "@trpc/server";

export const subscriptionRouter = router({
  // Current user's tier + limits
  getMyPlan: protectedProcedure.query(async ({ ctx }) => {
    const tier = ((ctx.user as any).subscriptionTier ?? "free") as Tier;
    const limits = getTierLimits(tier);
    const expiresAt = (ctx.user as any).subscriptionExpiresAt ?? null;
    return {
      tier,
      limits,
      expiresAt,
      isActive: expiresAt ? new Date(expiresAt) > new Date() : tier === "free",
    };
  }),

  // All available plans (public — shown on pricing page)
  getPlans: protectedProcedure.query(() => TIER_LIMITS),

  // Admin: manually set a user's tier (for comping early customers)
  setTier: adminProcedure
    .input(z.object({
      userId: z.number(),
      tier: z.enum(["free", "analyst", "enterprise"]),
      expiresAt: z.string().datetime().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [target] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const fromTier = ((target as any).subscriptionTier ?? "free") as Tier;

      await db.update(users).set({
        subscriptionTier: input.tier,
        subscriptionExpiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      } as any).where(eq(users.id, input.userId));

      await db.insert(subscriptionEvents).values({
        userId: input.userId,
        event: fromTier === "free" && input.tier !== "free" ? "upgraded" : "downgraded",
        fromTier,
        toTier: input.tier,
        metadata: { setBy: ctx.user.id, manual: true },
      } as any);

      return { success: true, userId: input.userId, tier: input.tier };
    }),
});
