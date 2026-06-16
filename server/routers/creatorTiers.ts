import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  creatorProfiles, 
  contentSubmissions, 
  verificationVouches,
  contentAnalytics,
  userTokens
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const creatorTiersRouter = router({
  /**
   * Get creator profile for a user
   */
  getCreatorProfile: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const targetUserId = input.userId || ctx.user.id;

      let [profile] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, targetUserId));

      // Create profile if it doesn't exist
      if (!profile) {
        await db.insert(creatorProfiles).values({
          userId: targetUserId,
          tier: "ai_assisted",
          verificationStatus: "unverified",
          kycVerified: false,
        });

        [profile] = await db
          .select()
          .from(creatorProfiles)
          .where(eq(creatorProfiles.userId, targetUserId));
      }

      return profile;
    }),

  /**
   * Request verification (KYC or portfolio review)
   */
  requestVerification: protectedProcedure
    .input(z.object({
      portfolioUrl: z.string().url().optional(),
      bio: z.string().min(50).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Update or create creator profile
      const [existing] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, ctx.user.id));

      if (existing) {
        await db
          .update(creatorProfiles)
          .set({
            portfolioUrl: input.portfolioUrl,
            bio: input.bio,
            verificationStatus: "pending",
            updatedAt: new Date(),
          })
          .where(eq(creatorProfiles.userId, ctx.user.id));
      } else {
        await db.insert(creatorProfiles).values({
          userId: ctx.user.id,
          portfolioUrl: input.portfolioUrl,
          bio: input.bio,
          verificationStatus: "pending",
          tier: "ai_assisted",
          kycVerified: false,
        });
      }

      return { success: true, message: "Verification request submitted" };
    }),

  /**
   * Submit content with AI usage disclosure
   */
  submitContent: protectedProcedure
    .input(z.object({
      contentType: z.enum(["forum_thread", "forum_post", "article", "video_script", "social_post"]),
      contentId: z.number().optional(),
      aiUsageLevel: z.enum(["none", "minor", "moderate", "heavy", "full"]),
      aiToolsUsed: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get creator profile to determine tier
      let [profile] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, ctx.user.id));

      if (!profile) {
        // Create default profile
        await db.insert(creatorProfiles).values({
          userId: ctx.user.id,
          tier: "ai_assisted",
          verificationStatus: "unverified",
          kycVerified: false,
        });

        [profile] = await db
          .select()
          .from(creatorProfiles)
          .where(eq(creatorProfiles.userId, ctx.user.id));
      }

      // Determine reward tier based on AI usage and creator tier
      let rewardTier: "tier1" | "tier2" | "tier3" | "tier4";
      let multiplier: number;
      let baseReward = 20; // Base VBT

      if (input.aiUsageLevel === "full" || input.aiUsageLevel === "heavy") {
        rewardTier = "tier1";
        multiplier = 10; // 1.0x
      } else if (input.aiUsageLevel === "moderate" || input.aiUsageLevel === "minor") {
        rewardTier = "tier2";
        multiplier = 20; // 2.0x
      } else if (input.aiUsageLevel === "none" && profile.verificationStatus === "verified") {
        if (profile.tier === "premium_human") {
          rewardTier = "tier4";
          multiplier = 50; // 5.0x
        } else {
          rewardTier = "tier3";
          multiplier = 30; // 3.0x
        }
      } else {
        rewardTier = "tier2";
        multiplier = 20; // 2.0x
      }

      const totalVbtAwarded = Math.floor((baseReward * multiplier) / 10);

      // Create content submission record
      await db.insert(contentSubmissions).values({
        userId: ctx.user.id,
        contentType: input.contentType,
        contentId: input.contentId,
        aiUsageLevel: input.aiUsageLevel,
        aiToolsUsed: input.aiToolsUsed ? JSON.stringify(input.aiToolsUsed) : null,
        verificationStatus: "verified",
        rewardTier,
        baseReward,
        multiplier,
        bonusReward: 0,
        totalVbtAwarded,
        engagementScore: 0,
      });

      // Update creator profile stats
      await db
        .update(creatorProfiles)
        .set({
          totalContentSubmitted: profile.totalContentSubmitted + 1,
          humanContentCount: input.aiUsageLevel === "none" ? profile.humanContentCount + 1 : profile.humanContentCount,
          aiContentCount: input.aiUsageLevel !== "none" ? profile.aiContentCount + 1 : profile.aiContentCount,
          updatedAt: new Date(),
        })
        .where(eq(creatorProfiles.userId, ctx.user.id));

      return {
        rewardTier,
        multiplier: multiplier / 10,
        totalVbtAwarded,
        message: `Earned ${totalVbtAwarded} VBT (${multiplier / 10}x multiplier)`,
      };
    }),

  /**
   * Vouch for another creator (community vouching)
   */
  vouchForCreator: protectedProcedure
    .input(z.object({
      creatorId: z.number(),
      message: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Can't vouch for yourself
      if (input.creatorId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot vouch for yourself" });
      }

      // Check if voucher is verified
      const [voucherProfile] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, ctx.user.id));

      if (!voucherProfile || voucherProfile.verificationStatus !== "verified") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only verified creators can vouch for others" });
      }

      // Check if already vouched
      const [existing] = await db
        .select()
        .from(verificationVouches)
        .where(
          and(
            eq(verificationVouches.creatorId, input.creatorId),
            eq(verificationVouches.voucherId, ctx.user.id)
          )
        );

      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You have already vouched for this creator" });
      }

      // Create vouch
      await db.insert(verificationVouches).values({
        creatorId: input.creatorId,
        voucherId: ctx.user.id,
        status: "approved",
        message: input.message,
      });

      // Update vouch count
      const [creatorProfile] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, input.creatorId));

      if (creatorProfile) {
        const newVouchCount = creatorProfile.vouchCount + 1;

        await db
          .update(creatorProfiles)
          .set({
            vouchCount: newVouchCount,
            // Auto-verify if 3+ vouches
            verificationStatus: newVouchCount >= 3 ? "verified" : creatorProfile.verificationStatus,
            tier: newVouchCount >= 3 ? "verified_human" : creatorProfile.tier,
            updatedAt: new Date(),
          })
          .where(eq(creatorProfiles.userId, input.creatorId));
      }

      return { success: true, message: "Vouch submitted successfully" };
    }),

  /**
   * Get content analytics (platform-wide stats)
   */
  getContentAnalytics: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get or create analytics record
    let [analytics] = await db.select().from(contentAnalytics).limit(1);

    if (!analytics) {
      await db.insert(contentAnalytics).values({
        totalSubmissions: 0,
        humanContent: 0,
        aiContent: 0,
        humanPercentage: 0,
        tier1Count: 0,
        tier2Count: 0,
        tier3Count: 0,
        tier4Count: 0,
      });

      [analytics] = await db.select().from(contentAnalytics).limit(1);
    }

    // Recalculate from content submissions
    const submissions = await db.select().from(contentSubmissions);

    const totalSubmissions = submissions.length;
    const humanContent = submissions.filter(s => s.aiUsageLevel === "none").length;
    const aiContent = totalSubmissions - humanContent;
    const humanPercentage = totalSubmissions > 0 ? Math.round((humanContent / totalSubmissions) * 100) : 0;

    const tier1Count = submissions.filter(s => s.rewardTier === "tier1").length;
    const tier2Count = submissions.filter(s => s.rewardTier === "tier2").length;
    const tier3Count = submissions.filter(s => s.rewardTier === "tier3").length;
    const tier4Count = submissions.filter(s => s.rewardTier === "tier4").length;

    // Update analytics
    await db
      .update(contentAnalytics)
      .set({
        totalSubmissions,
        humanContent,
        aiContent,
        humanPercentage,
        tier1Count,
        tier2Count,
        tier3Count,
        tier4Count,
        lastUpdated: new Date(),
      })
      .where(eq(contentAnalytics.id, analytics.id));

    return {
      totalSubmissions,
      humanContent,
      aiContent,
      humanPercentage,
      tier1Count,
      tier2Count,
      tier3Count,
      tier4Count,
    };
  }),

  /**
   * Get top verified creators (leaderboard)
   */
  getTopCreators: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const profiles = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.verificationStatus, "verified"))
        .orderBy(desc(creatorProfiles.humanContentCount))
        .limit(input.limit);

      return profiles;
    }),
});
