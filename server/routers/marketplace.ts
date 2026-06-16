import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { marketplaceItems, userPurchases } from "../../drizzle/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { spendTokens } from "./tokens";

export const marketplaceRouter = router({
  /**
   * Get all active marketplace items
   */
  getItems: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const items = await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.isActive, true));

    return items;
  }),

  /**
   * Get user's purchased items
   */
  getUserPurchases: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const now = new Date();
    
    const purchases = await db
      .select({
        id: userPurchases.id,
        itemId: userPurchases.itemId,
        purchasedAt: userPurchases.purchasedAt,
        expiresAt: userPurchases.expiresAt,
        isActive: userPurchases.isActive,
        itemName: marketplaceItems.name,
        itemDescription: marketplaceItems.description,
        itemCategory: marketplaceItems.category,
      })
      .from(userPurchases)
      .leftJoin(marketplaceItems, eq(userPurchases.itemId, marketplaceItems.id))
      .where(
        and(
          eq(userPurchases.userId, ctx.user.id),
          eq(userPurchases.isActive, true)
        )
      )
      .orderBy(desc(userPurchases.purchasedAt));

    // Filter out expired items
    const activePurchases = purchases.filter(p => {
      if (!p.expiresAt) return true; // Permanent items
      return new Date(p.expiresAt) > now;
    });

    return activePurchases;
  }),

  /**
   * Purchase a marketplace item
   */
  purchaseItem: protectedProcedure
    .input(z.object({
      itemId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get the item
      const [item] = await db
        .select()
        .from(marketplaceItems)
        .where(eq(marketplaceItems.id, input.itemId))
        .limit(1);

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      if (!item.isActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This item is no longer available" });
      }

      // Check if user already owns this item (for permanent items)
      if (!item.duration) {
        const [existing] = await db
          .select()
          .from(userPurchases)
          .where(
            and(
              eq(userPurchases.userId, ctx.user.id),
              eq(userPurchases.itemId, input.itemId),
              eq(userPurchases.isActive, true)
            )
          )
          .limit(1);

        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already own this item",
          });
        }
      }

      // Spend tokens
      try {
        await spendTokens(
          ctx.user.id,
          item.cost,
          "spend_marketplace",
          `Purchased: ${item.name}`
        );
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to process payment",
        });
      }

      // Create purchase record
      const expiresAt = item.duration
        ? new Date(Date.now() + item.duration * 24 * 60 * 60 * 1000)
        : null;

      await db.insert(userPurchases).values({
        userId: ctx.user.id,
        itemId: input.itemId,
        expiresAt,
        isActive: true,
      });

      return {
        success: true,
        item: {
          name: item.name,
          description: item.description,
          expiresAt,
        },
      };
    }),

  /**
   * Check if user has access to a specific feature
   */
  hasFeature: protectedProcedure
    .input(z.object({
      category: z.enum(["analytics", "boost", "badge", "discount", "support"]),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const now = new Date();

      const purchases = await db
        .select({
          expiresAt: userPurchases.expiresAt,
          category: marketplaceItems.category,
        })
        .from(userPurchases)
        .leftJoin(marketplaceItems, eq(userPurchases.itemId, marketplaceItems.id))
        .where(
          and(
            eq(userPurchases.userId, ctx.user.id),
            eq(userPurchases.isActive, true),
            eq(marketplaceItems.category, input.category)
          )
        );

      // Check if any purchase is still active
      const hasAccess = purchases.some(p => {
        if (!p.expiresAt) return true; // Permanent
        return new Date(p.expiresAt) > now;
      });

      return { hasAccess };
    }),
});
