import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendPushToUser } from "../services/pushNotifications";

export const pushNotificationsRouter = router({
  /**
   * Register a push subscription for the current user
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if subscription already exists for this endpoint
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Reactivate if it was deactivated
        await db
          .update(pushSubscriptions)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(pushSubscriptions.id, existing[0].id));
        return { success: true, message: "Subscription reactivated" };
      }

      // Create new subscription
      await db.insert(pushSubscriptions).values({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent,
        isActive: true,
      });

      return { success: true, message: "Push notifications enabled" };
    }),

  /**
   * Unsubscribe / disable push notifications for a specific endpoint
   */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(pushSubscriptions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );

      return { success: true, message: "Push notifications disabled" };
    }),

  /**
   * Check if current user has an active push subscription
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { subscribed: false, count: 0 };

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.isActive, true)
        )
      );

    return { subscribed: subs.length > 0, count: subs.length };
  }),

  /**
   * Send a test push notification to the current user
   */
  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await sendPushToUser(ctx.user.id, {
      title: "🔥 Viral Beat Test Alert",
      body: "Push notifications are working! You'll receive trend alerts and ViralMind insights here.",
      icon: "/icons/icon-192x192.png",
      url: "/dashboard",
      tag: "test-notification",
      data: { type: "test" },
    });

    if (result.sent === 0) {
      throw new Error("No active push subscriptions found. Please enable notifications first.");
    }

    return { success: true, sent: result.sent };
  }),
});
