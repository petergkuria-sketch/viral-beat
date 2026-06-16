import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { viralSubmissions, submissionMetadata, submissionVotes, haaLeaderboard, userTokens, tokenTransactions } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Humans As Agents (HaA) Router
 * Crowdsourced viral content intelligence network
 */

// Helper: Detect platform from URL
function detectPlatform(url: string): string {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("reddit.com")) return "reddit";
  return "other";
}

// Helper: Validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper: Calculate VBT reward based on submission quality
function calculateReward(hasAnalysis: boolean, isVerified: boolean, isFirstDiscovery: boolean): number {
  let baseReward = hasAnalysis ? 200 : 100;
  if (isVerified) baseReward = 500;
  if (isFirstDiscovery) baseReward = 1000;
  return baseReward;
}

// Helper: Award tokens and update leaderboard
async function awardHaaTokens(userId: number, submissionId: number, amount: number, description: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  
  // Award tokens
  await db.update(userTokens)
    .set({
      balance: sql`${userTokens.balance} + ${amount}`,
      totalEarned: sql`${userTokens.totalEarned} + ${amount}`,
    })
    .where(eq(userTokens.userId, userId));

  // Record transaction
  await db.insert(tokenTransactions).values({
    userId,
    amount,
    type: "earn_haa",
    description,
    referenceId: submissionId,
    referenceType: "viral_submission",
  });

  // Update leaderboard
  const existingEntry = await db.select().from(haaLeaderboard).where(eq(haaLeaderboard.userId, userId)).limit(1);
  
  if (existingEntry.length > 0) {
    await db.update(haaLeaderboard)
      .set({
        totalVbtEarned: sql`${haaLeaderboard.totalVbtEarned} + ${amount}`,
        lastSubmissionAt: new Date(),
      })
      .where(eq(haaLeaderboard.userId, userId));
  } else {
    await db.insert(haaLeaderboard).values({
      userId,
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      rejectedSubmissions: 0,
      verifiedViralCount: 0,
      trendingDiscoveries: 0,
      totalVbtEarned: amount,
      acceptanceRate: 0,
      rank: 0,
      lastSubmissionAt: new Date(),
    });
  }
}

export const haaRouter = router({
  /**
   * Submit viral content link
   */
  submitViralContent: protectedProcedure
    .input(
      z.object({
        contentUrl: z.string().url(),
        platform: z.enum(["tiktok", "youtube", "twitter", "instagram", "facebook", "linkedin", "reddit", "other"]).optional(),
        category: z.enum(["entertainment", "education", "news", "tech", "lifestyle", "business", "art", "music", "gaming", "sports", "other"]),
        title: z.string().optional(),
        description: z.string().optional(),
        submitterAnalysis: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const userId = ctx.user.id;

      // Validate URL
      if (!isValidUrl(input.contentUrl)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid URL format",
        });
      }

      // Detect platform if not provided
      const platform = input.platform || detectPlatform(input.contentUrl);

      // Check for duplicate submission
      const existingSubmission = await db
        .select()
        .from(viralSubmissions)
        .where(eq(viralSubmissions.contentUrl, input.contentUrl))
        .limit(1);

      if (existingSubmission.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This content has already been submitted",
        });
      }

      // Create submission
      const [submission] = await db.insert(viralSubmissions).values({
        userId,
        contentUrl: input.contentUrl,
        platform: platform as any,
        category: input.category,
        title: input.title,
        description: input.description,
        submitterAnalysis: input.submitterAnalysis,
        viralityScore: 0,
        status: "pending",
        vbtAwarded: 0,
      });

      // Update leaderboard submission count
      const existingEntry = await db.select().from(haaLeaderboard).where(eq(haaLeaderboard.userId, userId)).limit(1);
      
      if (existingEntry.length > 0) {
        await db.update(haaLeaderboard)
          .set({
            totalSubmissions: sql`${haaLeaderboard.totalSubmissions} + 1`,
            lastSubmissionAt: new Date(),
          })
          .where(eq(haaLeaderboard.userId, userId));
      } else {
        await db.insert(haaLeaderboard).values({
          userId,
          totalSubmissions: 1,
          acceptedSubmissions: 0,
          rejectedSubmissions: 0,
          verifiedViralCount: 0,
          trendingDiscoveries: 0,
          totalVbtEarned: 0,
          acceptanceRate: 0,
          rank: 0,
          lastSubmissionAt: new Date(),
        });
      }

      // Calculate and award initial reward
      const hasAnalysis = !!input.submitterAnalysis && input.submitterAnalysis.length > 50;
      const baseReward = calculateReward(hasAnalysis, false, false);
      
      await awardHaaTokens(userId, submission.insertId, baseReward, `HaA submission: ${input.title || "Viral content"}`);

      // Update submission with awarded VBT
      await db.update(viralSubmissions)
        .set({ vbtAwarded: baseReward })
        .where(eq(viralSubmissions.id, submission.insertId));

      return {
        success: true,
        submissionId: submission.insertId,
        vbtAwarded: baseReward,
        message: `Submission successful! Earned ${baseReward} VBT`,
      };
    }),

  /**
   * Get all viral submissions (paginated, filtered)
   */
  getSubmissions: publicProcedure
    .input(
      z.object({
        status: z.enum(["pending", "accepted", "rejected", "verified_viral", "spam", "all"]).optional(),
        platform: z.enum(["tiktok", "youtube", "twitter", "instagram", "facebook", "linkedin", "reddit", "other", "all"]).optional(),
        category: z.enum(["entertainment", "education", "news", "tech", "lifestyle", "business", "art", "music", "gaming", "sports", "other", "all"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let query = db.select().from(viralSubmissions);

      if (input.status && input.status !== "all") {
        query = query.where(eq(viralSubmissions.status, input.status)) as any;
      }

      if (input.platform && input.platform !== "all") {
        query = query.where(eq(viralSubmissions.platform, input.platform)) as any;
      }

      if (input.category && input.category !== "all") {
        query = query.where(eq(viralSubmissions.category, input.category)) as any;
      }

      const submissions = await query
        .orderBy(desc(viralSubmissions.submittedAt))
        .limit(input.limit)
        .offset(input.offset);

      return submissions;
    }),

  /**
   * Get user's own submissions
   */
  getMySubmissions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const userId = ctx.user.id;

      const submissions = await db
        .select()
        .from(viralSubmissions)
        .where(eq(viralSubmissions.userId, userId))
        .orderBy(desc(viralSubmissions.submittedAt))
        .limit(input.limit)
        .offset(input.offset);

      return submissions;
    }),

  /**
   * Vote on submission quality
   */
  voteOnSubmission: protectedProcedure
    .input(
      z.object({
        submissionId: z.number(),
        vote: z.enum(["upvote", "downvote"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const userId = ctx.user.id;

      // Check if user already voted
      const existingVote = await db
        .select()
        .from(submissionVotes)
        .where(
          and(
            eq(submissionVotes.submissionId, input.submissionId),
            eq(submissionVotes.userId, userId)
          )
        )
        .limit(1);

      if (existingVote.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already voted on this submission",
        });
      }

      // Record vote
      await db.insert(submissionVotes).values({
        submissionId: input.submissionId,
        userId,
        vote: input.vote,
        reason: input.reason,
      });

      // Check if submission should be accepted (3+ upvotes)
      const votes = await db
        .select()
        .from(submissionVotes)
        .where(eq(submissionVotes.submissionId, input.submissionId));

      const upvotes = votes.filter((v) => v.vote === "upvote").length;
      const downvotes = votes.filter((v) => v.vote === "downvote").length;

      if (upvotes >= 3 && upvotes > downvotes) {
        // Auto-accept submission
        await db.update(viralSubmissions)
          .set({ status: "accepted" })
          .where(eq(viralSubmissions.id, input.submissionId));

        // Update leaderboard
        const submission = await db
          .select()
          .from(viralSubmissions)
          .where(eq(viralSubmissions.id, input.submissionId))
          .limit(1);

        if (submission.length > 0) {
          await db.update(haaLeaderboard)
            .set({
              acceptedSubmissions: sql`${haaLeaderboard.acceptedSubmissions} + 1`,
            })
            .where(eq(haaLeaderboard.userId, submission[0].userId));
        }
      }

      return { success: true, message: "Vote recorded successfully" };
    }),

  /**
   * Get HaA leaderboard
   */
  getHaaLeaderboard: publicProcedure
    .input(
      z.object({
        timeframe: z.enum(["weekly", "monthly", "all_time"]).default("all_time"),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const leaderboard = await db
        .select()
        .from(haaLeaderboard)
        .orderBy(desc(haaLeaderboard.totalVbtEarned))
        .limit(input.limit);

      return leaderboard;
    }),

  /**
   * Get user's HaA stats
   */
  getMyHaaStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const userId = ctx.user.id;

    const stats = await db
      .select()
      .from(haaLeaderboard)
      .where(eq(haaLeaderboard.userId, userId))
      .limit(1);

    if (stats.length === 0) {
      return {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        rejectedSubmissions: 0,
        verifiedViralCount: 0,
        trendingDiscoveries: 0,
        totalVbtEarned: 0,
        acceptanceRate: 0,
        rank: 0,
      };
    }

    return stats[0];
  }),

  // Simplified Viral Verification - Check submission metrics and award bonus
  verifyViralSubmission: protectedProcedure
    .input(z.object({ submissionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [submission] = await db
        .select()
        .from(viralSubmissions)
        .where(eq(viralSubmissions.id, input.submissionId))
        .limit(1);

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      // Simplified verification: check if virality score >= 0.7 (viral threshold)
      if (submission.viralityScore && submission.viralityScore >= 0.7 && submission.status === "accepted") {
        // Update status to verified_viral
        await db
          .update(viralSubmissions)
          .set({ status: "verified_viral" })
          .where(eq(viralSubmissions.id, input.submissionId));

        // Award 300 VBT bonus for verified viral content
        await awardHaaTokens(
          submission.userId,
          submission.id,
          300,
          `Viral verification bonus for "${submission.contentUrl.substring(0, 50)}..."`
        );

        return { success: true, message: "Submission verified as viral! +300 VBT bonus awarded." };
      }

      return { success: false, message: "Submission does not meet viral threshold (0.7+ virality score required)" };
    }),
});
