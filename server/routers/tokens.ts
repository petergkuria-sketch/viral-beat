import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { userTokens, tokenTransactions, tokenEarningRules } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { checkAndAwardDailyLoginBonus } from "./dailyLoginBonus";

/**
 * Helper function to get or create user token record
 */
async function getOrCreateUserTokens(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  
  const [userToken] = await db.select().from(userTokens).where(eq(userTokens.userId, userId)).limit(1);

  if (!userToken) {
    // Create initial token record with welcome bonus
    await db.insert(userTokens).values({
      userId,
      balance: 100, // Welcome bonus
      totalEarned: 100,
      totalSpent: 0,
    });
    
    // Record the welcome bonus transaction
    await db.insert(tokenTransactions).values({
      userId,
      amount: 100,
      type: "earn_admin_grant",
      description: "Welcome bonus! Start exploring The Viral Beat.",
    });

    const [newUserToken] = await db.select().from(userTokens).where(eq(userTokens.userId, userId)).limit(1);
    return newUserToken!;
  }

  return userToken!;
}

/**
 * Helper function to award tokens to a user
 */
export async function awardTokens(
  userId: number,
  amount: number,
  type: string,
  description: string,
  referenceId?: number,
  referenceType?: string
) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  
  // Get or create user token record
  const userToken = await getOrCreateUserTokens(userId);

  // Update balance and total earned
  await db
    .update(userTokens)
    .set({
      balance: sql`${userTokens.balance} + ${amount}`,
      totalEarned: sql`${userTokens.totalEarned} + ${amount}`,
    })
    .where(eq(userTokens.userId, userId));

  // Record transaction
  await db.insert(tokenTransactions).values({
    userId,
    amount,
    type: type as any,
    description,
    referenceId,
    referenceType,
  });

  return {
    success: true,
    newBalance: userToken.balance + amount,
    tokensAwarded: amount,
  };
}

/**
 * Helper function to spend tokens
 */
export async function spendTokens(
  userId: number,
  amount: number,
  type: string,
  description: string,
  referenceId?: number,
  referenceType?: string
) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  
  const userToken = await getOrCreateUserTokens(userId);

  // Check if user has enough tokens
  if (userToken.balance < amount) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Insufficient tokens. You have ${userToken.balance} VB Tokens, but need ${amount}.`,
    });
  }

  // Update balance and total spent
  await db
    .update(userTokens)
    .set({
      balance: sql`${userTokens.balance} - ${amount}`,
      totalSpent: sql`${userTokens.totalSpent} + ${amount}`,
    })
    .where(eq(userTokens.userId, userId));

  // Record transaction (negative amount for spending)
  await db.insert(tokenTransactions).values({
    userId,
    amount: -amount,
    type: type as any,
    description,
    referenceId,
    referenceType,
  });

  return {
    success: true,
    newBalance: userToken.balance - amount,
    tokensSpent: amount,
  };
}

export const tokensRouter = router({
  /**
   * Get current user's token balance
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const userToken = await getOrCreateUserTokens(ctx.user.id);
    return {
      balance: userToken.balance,
      totalEarned: userToken.totalEarned,
      totalSpent: userToken.totalSpent,
    };
  }),

  /**
   * Claim daily login bonus
   */
  claimDailyBonus: protectedProcedure.mutation(async ({ ctx }) => {
    const awarded = await checkAndAwardDailyLoginBonus(ctx.user.id);
    
    if (!awarded) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Daily bonus already claimed today. Come back tomorrow!",
      });
    }
    
    return {
      success: true,
      amount: 5,
      message: "Daily login bonus claimed! +5 VBT",
    };
  }),

  /**
   * Get transaction history with pagination
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        type: z.enum([
          "all",
          "earned",
          "spent",
        ]).default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      let whereClause = eq(tokenTransactions.userId, ctx.user.id);

      if (input.type === "earned") {
        whereClause = and(whereClause, sql`${tokenTransactions.amount} > 0`)!;
      } else if (input.type === "spent") {
        whereClause = and(whereClause, sql`${tokenTransactions.amount} < 0`)!;
      }

      const transactions = await db
        .select()
        .from(tokenTransactions)
        .where(whereClause)
        .orderBy(desc(tokenTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tokenTransactions)
        .where(whereClause);

      return {
        transactions,
        total: countResult.count,
        hasMore: input.offset + input.limit < countResult.count,
      };
    }),

  /**
   * Get earning rules - how users can earn tokens
   */
  getEarningRules: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const rules = await db
      .select()
      .from(tokenEarningRules)
      .where(eq(tokenEarningRules.isActive, true))
      .orderBy(desc(tokenEarningRules.tokenAmount));

    return rules;
  }),

  /**
   * Admin: Mint tokens for a user
   */
  adminMintTokens: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        amount: z.number().positive(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await awardTokens(
        input.userId,
        input.amount,
        "earn_admin_grant",
        input.description
      );
    }),

  /**
   * Admin: Burn tokens from a user
   */
  adminBurnTokens: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        amount: z.number().positive(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await spendTokens(
        input.userId,
        input.amount,
        "spend_premium_feature",
        input.description
      );
    }),

  /**
   * Admin: Get token economy statistics
   */
  getTokenStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const [stats] = await db
      .select({
        totalSupply: sql<number>`SUM(${userTokens.balance})`,
        totalEarned: sql<number>`SUM(${userTokens.totalEarned})`,
        totalSpent: sql<number>`SUM(${userTokens.totalSpent})`,
        totalUsers: sql<number>`COUNT(*)`,
      })
      .from(userTokens);

    const topEarners = await db
      .select()
      .from(userTokens)
      .orderBy(desc(userTokens.totalEarned))
      .limit(10);

    return {
      ...stats,
      topEarners,
    };
  }),

  /**
   * Admin: Create or update earning rule
   */
  setEarningRule: adminProcedure
    .input(
      z.object({
        actionType: z.string(),
        tokenAmount: z.number(),
        description: z.string(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Check if rule exists
      const [existing] = await db
        .select()
        .from(tokenEarningRules)
        .where(eq(tokenEarningRules.actionType, input.actionType))
        .limit(1);

      if (existing) {
        // Update existing rule
        await db
          .update(tokenEarningRules)
          .set({
            tokenAmount: input.tokenAmount,
            description: input.description,
            isActive: input.isActive,
          })
          .where(eq(tokenEarningRules.actionType, input.actionType));
      } else {
        // Create new rule
        await db.insert(tokenEarningRules).values(input);
      }

      return { success: true };
    }),

  /**
   * Get verification bonus information for current user
   */
  getVerificationBonus: protectedProcedure.query(async ({ ctx }) => {
    const { getVerificationBonus } = await import("../services/tokenRewards");
    return await getVerificationBonus(ctx.user.id);
  }),

  /**
   * Calculate potential reward with verification multiplier
   */
  calculateReward: protectedProcedure
    .input(z.object({
      actionType: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { calculateReward } = await import("../services/tokenRewards");
      return await calculateReward(ctx.user.id, input.actionType);
    }),
});
