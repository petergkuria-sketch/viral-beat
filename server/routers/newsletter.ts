/**
 * Newsletter Router
 * Handles subscription management, content generation, and delivery
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  newsletterSubscriptions,
  newsletterEditions,
  newsletterContent,
  newsletterDeliveries,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { sendDailyBriefing } from "../services/pushNotifications";

/**
 * Generate a unique unsubscribe token
 */
function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

export const newsletterRouter = router({
  /**
   * Subscribe to newsletter
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        frequency: z.enum(["weekly", "biweekly", "monthly"]).default("weekly"),
        nichePreferences: z.array(z.string()).optional(),
        platformPreferences: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if already subscribed
      const [existing] = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        // Reactivate if previously unsubscribed
        if (!existing.isActive) {
          await db
            .update(newsletterSubscriptions)
            .set({
              isActive: true,
              frequency: input.frequency,
              nichePreferences: input.nichePreferences ? JSON.stringify(input.nichePreferences) : null,
              platformPreferences: input.platformPreferences ? JSON.stringify(input.platformPreferences) : null,
              unsubscribedAt: null,
            })
            .where(eq(newsletterSubscriptions.id, existing.id));

          return { success: true, message: "Newsletter subscription reactivated" };
        }

        // Update preferences if already active
        await db
          .update(newsletterSubscriptions)
          .set({
            frequency: input.frequency,
            nichePreferences: input.nichePreferences ? JSON.stringify(input.nichePreferences) : null,
            platformPreferences: input.platformPreferences ? JSON.stringify(input.platformPreferences) : null,
          })
          .where(eq(newsletterSubscriptions.id, existing.id));

        return { success: true, message: "Newsletter preferences updated" };
      }

      // Create new subscription
      await db.insert(newsletterSubscriptions).values({
        userId: ctx.user.id,
        frequency: input.frequency,
        nichePreferences: input.nichePreferences ? JSON.stringify(input.nichePreferences) : null,
        platformPreferences: input.platformPreferences ? JSON.stringify(input.platformPreferences) : null,
        unsubscribeToken: generateUnsubscribeToken(),
      });

      return { success: true, message: "Successfully subscribed to newsletter" };
    }),

  /**
   * Unsubscribe from newsletter
   */
  unsubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [subscription] = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.userId, ctx.user.id))
      .limit(1);

    if (!subscription) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No active subscription found" });
    }

    await db
      .update(newsletterSubscriptions)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscriptions.id, subscription.id));

    return { success: true, message: "Successfully unsubscribed from newsletter" };
  }),

  /**
   * Get current subscription status
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [subscription] = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.userId, ctx.user.id))
      .limit(1);

    if (!subscription) return null;

    return {
      ...subscription,
      nichePreferences: subscription.nichePreferences ? JSON.parse(subscription.nichePreferences) : [],
      platformPreferences: subscription.platformPreferences ? JSON.parse(subscription.platformPreferences) : [],
    };
  }),

  /**
   * Update newsletter preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        frequency: z.enum(["weekly", "biweekly", "monthly"]),
        nichePreferences: z.array(z.string()).optional(),
        platformPreferences: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [subscription] = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.userId, ctx.user.id))
        .limit(1);

      if (!subscription) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No subscription found" });
      }

      await db
        .update(newsletterSubscriptions)
        .set({
          frequency: input.frequency,
          nichePreferences: input.nichePreferences ? JSON.stringify(input.nichePreferences) : null,
          platformPreferences: input.platformPreferences ? JSON.stringify(input.platformPreferences) : null,
        })
        .where(eq(newsletterSubscriptions.id, subscription.id));

      return { success: true, message: "Preferences updated successfully" };
    }),

  /**
   * Get latest newsletter editions (for archive)
   */
  getEditions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const editions = await db
        .select()
        .from(newsletterEditions)
        .where(eq(newsletterEditions.generationStatus, "completed"))
        .orderBy(desc(newsletterEditions.weekStartDate))
        .limit(input.limit);

      return editions;
    }),

  /**
   * Get newsletter content for a specific edition
   */
  getEditionContent: protectedProcedure
    .input(
      z.object({
        editionId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [edition] = await db
        .select()
        .from(newsletterEditions)
        .where(eq(newsletterEditions.id, input.editionId))
        .limit(1);

      if (!edition) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
      }

      const content = await db
        .select()
        .from(newsletterContent)
        .where(eq(newsletterContent.editionId, input.editionId))
        .orderBy(newsletterContent.displayOrder);

      return {
        edition,
        content: content.map((c) => ({
          ...c,
          data: c.data ? JSON.parse(c.data) : null,
          personalizationMetadata: c.personalizationMetadata ? JSON.parse(c.personalizationMetadata) : null,
        })),
      };
    }),

  /**
   * Get delivery status for current user's latest newsletters
   */
  getMyDeliveries: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const deliveries = await db
        .select({
          delivery: newsletterDeliveries,
          edition: newsletterEditions,
        })
        .from(newsletterDeliveries)
        .leftJoin(newsletterEditions, eq(newsletterDeliveries.editionId, newsletterEditions.id))
        .where(eq(newsletterDeliveries.userId, ctx.user.id))
        .orderBy(desc(newsletterDeliveries.sentAt))
        .limit(input.limit);

      return deliveries;
    }),

  /**
   * Admin: Get all subscriptions
   */
  getAllSubscriptions: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const subscriptions = await db
        .select()
        .from(newsletterSubscriptions)
        .orderBy(desc(newsletterSubscriptions.subscribedAt))
        .limit(input.limit);

      return subscriptions.map((sub) => ({
        ...sub,
        nichePreferences: sub.nichePreferences ? JSON.parse(sub.nichePreferences) : [],
        platformPreferences: sub.platformPreferences ? JSON.parse(sub.platformPreferences) : [],
      }));
    }),

  /**
   * Admin: Send push notification for a newsletter edition
   */
  sendPushForEdition: adminProcedure
    .input(z.object({ editionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get all active newsletter subscribers
      const subscribers = await db
        .select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.isActive, true));

      let sent = 0;
      for (const sub of subscribers) {
        try {
          await sendDailyBriefing(sub.userId, {
            trendCount: 5,
            topTrend: "Check your new newsletter edition",
            contentIdeas: 3,
          });
          sent += 1;
        } catch (e) {
          // Non-fatal: continue to next subscriber
        }
      }

      return { success: true, sent, total: subscribers.length };
    }),

  /**
   * Admin: Manually generate newsletter edition
   */
  generateEdition: adminProcedure
    .input(
      z.object({
        editionNumber: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { generateNewsletterEdition } = await import("../services/newsletterGeneration");
      
      try {
        const editionId = await generateNewsletterEdition(input.editionNumber);
        return {
          success: true,
          message: "Newsletter edition generated successfully",
          editionId,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate newsletter: ${error.message}`,
        });
      }
    }),

  /**
   * Admin: Get newsletter statistics
   */
  getStatistics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalSubscribers: 0,
        activeSubscribers: 0,
        totalEditions: 0,
        totalDeliveries: 0,
        openRate: 0,
        clickRate: 0,
      };
    }

    const [totalSubs] = await db
      .select({ count: newsletterSubscriptions.id })
      .from(newsletterSubscriptions);

    const [activeSubs] = await db
      .select({ count: newsletterSubscriptions.id })
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.isActive, true));

    const [totalEds] = await db
      .select({ count: newsletterEditions.id })
      .from(newsletterEditions)
      .where(eq(newsletterEditions.generationStatus, "completed"));

    const [totalDels] = await db
      .select({ count: newsletterDeliveries.id })
      .from(newsletterDeliveries);

    const [openedDels] = await db
      .select({ count: newsletterDeliveries.id })
      .from(newsletterDeliveries)
      .where(eq(newsletterDeliveries.deliveryStatus, "opened"));

    const [clickedDels] = await db
      .select({ count: newsletterDeliveries.id })
      .from(newsletterDeliveries)
      .where(eq(newsletterDeliveries.deliveryStatus, "clicked"));

    const totalDeliveries = totalDels?.count || 0;
    const openedCount = openedDels?.count || 0;
    const clickedCount = clickedDels?.count || 0;

    return {
      totalSubscribers: totalSubs?.count || 0,
      activeSubscribers: activeSubs?.count || 0,
      totalEditions: totalEds?.count || 0,
      totalDeliveries,
      openRate: totalDeliveries > 0 ? (openedCount / totalDeliveries) * 100 : 0,
      clickRate: totalDeliveries > 0 ? (clickedCount / totalDeliveries) * 100 : 0,
    };
  }),
});
