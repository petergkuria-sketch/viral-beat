import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  tokenStakes,
  tokenListings,
  tokenTrades,
  governanceProposals,
  governanceVotes,
  tokenSupplyEvents,
  userTokens,
  tokenTransactions,
} from "../../drizzle/schema";
import { eq, desc, and, sql, lt, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Phase 2: Advanced Token Features Router
 * Staking, P2P Trading, Governance, Supply Tracking, Login Streaks
 */

// Helper: Calculate staking rewards
function calculateStakingRewards(amount: number, apy: number, daysStaked: number): number {
  const annualReward = amount * (apy / 100);
  const dailyReward = annualReward / 365;
  return Math.floor(dailyReward * daysStaked);
}

// Helper: Track supply event
async function trackSupplyEvent(eventType: "mint" | "burn", amount: number, source: string, userId?: number, description?: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(tokenSupplyEvents).values({
    eventType,
    amount,
    source,
    userId,
    description,
  });
}

export const phase2Router = router({
  // ==================== STAKING SYSTEM ====================
  
  /**
   * Stake tokens for rewards
   */
  stakeTokens: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(100), // Minimum 100 VBT
        duration: z.enum(["30", "90", "180"]), // Days
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const userId = ctx.user.id;
      const durationDays = parseInt(input.duration);
      const apy = durationDays === 30 ? 5 : durationDays === 90 ? 10 : 15;
      
      // Check balance
      const userToken = await db.select().from(userTokens).where(eq(userTokens.userId, userId)).limit(1);
      if (!userToken[0] || userToken[0].balance < input.amount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }
      
      // Deduct tokens from balance
      await db.update(userTokens)
        .set({ balance: sql`${userTokens.balance} - ${input.amount}` })
        .where(eq(userTokens.userId, userId));
      
      // Create stake
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      
      const [stake] = await db.insert(tokenStakes).values({
        userId,
        amount: input.amount,
        duration: durationDays,
        apy,
        endDate,
        status: "active",
      });
      
      return { success: true, stakeId: stake.insertId, apy, endDate };
    }),

  /**
   * Unstake tokens and claim rewards
   */
  unstakeTokens: protectedProcedure
    .input(z.object({ stakeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const userId = ctx.user.id;
      
      // Get stake
      const stakes = await db.select().from(tokenStakes)
        .where(and(eq(tokenStakes.id, input.stakeId), eq(tokenStakes.userId, userId)))
        .limit(1);
      
      if (!stakes[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stake not found" });
      }
      
      const stake = stakes[0];
      
      if (stake.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Stake already completed" });
      }
      
      // Calculate rewards
      const now = new Date();
      const daysStaked = Math.floor((now.getTime() - new Date(stake.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const rewards = calculateStakingRewards(stake.amount, stake.apy, daysStaked);
      
      // Early unstake penalty
      const isEarly = now < new Date(stake.endDate);
      const finalRewards = isEarly ? Math.floor(rewards * 0.5) : rewards;
      
      // Return tokens + rewards
      await db.update(userTokens)
        .set({
          balance: sql`${userTokens.balance} + ${stake.amount} + ${finalRewards}`,
          totalEarned: sql`${userTokens.totalEarned} + ${finalRewards}`,
        })
        .where(eq(userTokens.userId, userId));
      
      // Update stake status
      await db.update(tokenStakes)
        .set({ status: "completed", rewardsClaimed: finalRewards })
        .where(eq(tokenStakes.id, input.stakeId));
      
      // Track mint event
      await trackSupplyEvent("mint", finalRewards, "staking_rewards", userId, `Staking rewards for ${daysStaked} days`);
      
      return { success: true, rewards: finalRewards, penalty: isEarly };
    }),

  /**
   * Get user's active stakes
   */
  getMyStakes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const stakes = await db.select().from(tokenStakes)
      .where(eq(tokenStakes.userId, ctx.user.id))
      .orderBy(desc(tokenStakes.createdAt));
    
    return stakes;
  }),

  // ==================== P2P TRADING ====================
  
  /**
   * Create token listing
   */
  createListing: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(10),
        pricePerToken: z.number().min(0.01), // USD
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const userId = ctx.user.id;
      
      // Check balance
      const userToken = await db.select().from(userTokens).where(eq(userTokens.userId, userId)).limit(1);
      if (!userToken[0] || userToken[0].balance < input.amount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }
      
      // Lock tokens
      await db.update(userTokens)
        .set({ balance: sql`${userTokens.balance} - ${input.amount}` })
        .where(eq(userTokens.userId, userId));
      
      // Create listing
      const [listing] = await db.insert(tokenListings).values({
        sellerId: userId,
        amount: input.amount,
        pricePerToken: input.pricePerToken.toString(),
        status: "active",
      });
      
      return { success: true, listingId: listing.insertId };
    }),

  /**
   * Buy tokens from listing
   */
  buyTokens: protectedProcedure
    .input(z.object({ listingId: z.number(), amount: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const buyerId = ctx.user.id;
      
      // Get listing
      const listings = await db.select().from(tokenListings)
        .where(eq(tokenListings.id, input.listingId))
        .limit(1);
      
      if (!listings[0] || listings[0].status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found or inactive" });
      }
      
      const listing = listings[0];
      
      if (listing.amount < input.amount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient tokens in listing" });
      }
      
      // Calculate fees
      const platformFee = Math.floor(input.amount * 0.02); // 2%
      const buyerReceives = input.amount - platformFee;
      const totalPrice = parseFloat(listing.pricePerToken) * input.amount;
      
      // Transfer tokens to buyer
      await db.update(userTokens)
        .set({ balance: sql`${userTokens.balance} + ${buyerReceives}` })
        .where(eq(userTokens.userId, buyerId));
      
      // Return remaining tokens to seller or mark as sold
      const remaining = listing.amount - input.amount;
      if (remaining === 0) {
        await db.update(tokenListings)
          .set({ status: "sold" })
          .where(eq(tokenListings.id, input.listingId));
      } else {
        await db.update(tokenListings)
          .set({ amount: remaining })
          .where(eq(tokenListings.id, input.listingId));
      }
      
      // Record trade
      await db.insert(tokenTrades).values({
        listingId: input.listingId,
        buyerId,
        sellerId: listing.sellerId,
        amount: input.amount,
        pricePerToken: listing.pricePerToken,
        totalPrice: totalPrice.toString(),
        platformFee,
      });
      
      // Burn platform fee
      await trackSupplyEvent("burn", platformFee, "p2p_trading_fee", buyerId, "2% platform fee on P2P trade");
      
      return { success: true, received: buyerReceives, fee: platformFee };
    }),

  /**
   * Get active listings
   */
  getActiveListings: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const listings = await db.select().from(tokenListings)
      .where(eq(tokenListings.status, "active"))
      .orderBy(desc(tokenListings.createdAt))
      .limit(50);
    
    return listings;
  }),

  // ==================== GOVERNANCE ====================
  
  /**
   * Create governance proposal
   */
  createProposal: protectedProcedure
    .input(
      z.object({
        title: z.string().min(10).max(255),
        description: z.string().min(50),
        type: z.enum(["feature_request", "reward_rate_change", "policy_update", "other"]),
        options: z.array(z.string()).min(2).max(5),
        votingDays: z.number().min(3).max(14).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const votingEndsAt = new Date();
      votingEndsAt.setDate(votingEndsAt.getDate() + input.votingDays);
      
      const [proposal] = await db.insert(governanceProposals).values({
        creatorId: ctx.user.id,
        title: input.title,
        description: input.description,
        type: input.type,
        options: JSON.stringify(input.options),
        votingEndsAt,
        status: "active",
      });
      
      return { success: true, proposalId: proposal.insertId };
    }),

  /**
   * Vote on proposal
   */
  voteOnProposal: protectedProcedure
    .input(
      z.object({
        proposalId: z.number(),
        option: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const userId = ctx.user.id;
      
      // Check if already voted
      const existingVote = await db.select().from(governanceVotes)
        .where(and(eq(governanceVotes.proposalId, input.proposalId), eq(governanceVotes.voterId, userId)))
        .limit(1);
      
      if (existingVote[0]) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already voted on this proposal" });
      }
      
      // Get user's token balance (1 VBT = 1 vote)
      const userToken = await db.select().from(userTokens).where(eq(userTokens.userId, userId)).limit(1);
      const tokenWeight = userToken[0]?.balance || 0;
      
      // Record vote
      await db.insert(governanceVotes).values({
        proposalId: input.proposalId,
        voterId: userId,
        option: input.option,
        tokenWeight,
      });
      
      return { success: true, voteWeight: tokenWeight };
    }),

  /**
   * Get active proposals
   */
  getActiveProposals: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const proposals = await db.select().from(governanceProposals)
      .where(eq(governanceProposals.status, "active"))
      .orderBy(desc(governanceProposals.createdAt));
    
    return proposals;
  }),

  /**
   * Get proposal results
   */
  getProposalResults: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const votes = await db.select().from(governanceVotes)
        .where(eq(governanceVotes.proposalId, input.proposalId));
      
      // Aggregate votes by option
      const results: Record<string, number> = {};
      let totalWeight = 0;
      
      for (const vote of votes) {
        results[vote.option] = (results[vote.option] || 0) + vote.tokenWeight;
        totalWeight += vote.tokenWeight;
      }
      
      return { results, totalWeight, voteCount: votes.length };
    }),

  // ==================== SUPPLY TRACKING ====================
  
  /**
   * Get token supply metrics
   */
  getSupplyMetrics: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    // Get all supply events
    const events = await db.select().from(tokenSupplyEvents);
    
    let totalMinted = 0;
    let totalBurned = 0;
    
    for (const event of events) {
      if (event.eventType === "mint") totalMinted += event.amount;
      if (event.eventType === "burn") totalBurned += event.amount;
    }
    
    // Get locked in stakes
    const activeStakes = await db.select().from(tokenStakes)
      .where(eq(tokenStakes.status, "active"));
    
    const lockedInStakes = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);
    
    const circulatingSupply = totalMinted - totalBurned - lockedInStakes;
    
    return {
      circulatingSupply,
      totalMinted,
      totalBurned,
      lockedInStakes,
      burnRate: totalBurned > 0 ? ((totalBurned / totalMinted) * 100).toFixed(2) : "0",
    };
  }),

  /**
   * Get recent supply events
   */
  getSupplyEvents: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const events = await db.select().from(tokenSupplyEvents)
        .orderBy(desc(tokenSupplyEvents.timestamp))
        .limit(input.limit);
      
      return events;
    }),
});
