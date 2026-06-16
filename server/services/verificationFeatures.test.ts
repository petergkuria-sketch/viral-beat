/**
 * Tests for Verification Features:
 * 1. Social Media API Integration
 * 2. Verified Creator Badges
 * 3. Verification-based Token Rewards
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { users, aiAssistantProfiles, tokenEarningRules, userTokens, tokenTransactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { isUserVerified, calculateReward, awardTokens, getVerificationBonus } from "./tokenRewards";
import { syncCreatorStats, aggregateStats } from "./socialMediaApi";

describe("Verification Features Integration Tests", () => {
  let testUserId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [testUser] = await db
      .insert(users)
      .values({
        openId: `test-verification-${Date.now()}`,
        name: "Test Verified Creator",
        email: `test-verified-${Date.now()}@example.com`,
      })
      .$returningId();

    testUserId = testUser.id;

    // Create AI assistant profile for the test user
    await db.insert(aiAssistantProfiles).values({
      userId: testUserId,
      niche: "Tech Reviews",
      primaryPlatform: "youtube",
      audienceSize: 10000,
      tone: "professional",
      format: "video",
      averageViews: 5000,
      onboardingCompleted: true,
      youtubeHandle: "@testcreator",
      youtubeVerified: false,
      tiktokHandle: null,
      tiktokVerified: false,
      instagramHandle: null,
      instagramVerified: false,
      twitterHandle: null,
      twitterVerified: false,
    });

    // Ensure token earning rules exist
    const [existingRule] = await db
      .select()
      .from(tokenEarningRules)
      .where(eq(tokenEarningRules.actionType, "test_action"))
      .limit(1);

    if (!existingRule) {
      await db.insert(tokenEarningRules).values({
        actionType: "test_action",
        tokenAmount: 100,
        description: "Test action reward",
        verifiedCreatorMultiplier: "1.50",
        isActive: true,
      });
    }
  });

  describe("Feature 1: Social Media API Integration", () => {
    it("should detect unverified creator", async () => {
      const verified = await isUserVerified(testUserId);
      expect(verified).toBe(false);
    });

    it("should sync stats for verified creator", async () => {
      // First verify the YouTube account
      await db!
        .update(aiAssistantProfiles)
        .set({ youtubeVerified: true })
        .where(eq(aiAssistantProfiles.userId, testUserId));

      const [profile] = await db!
        .select()
        .from(aiAssistantProfiles)
        .where(eq(aiAssistantProfiles.userId, testUserId))
        .limit(1);

      const stats = await syncCreatorStats(profile!);

      expect(stats).toHaveProperty("youtube");
      expect(stats.youtube).not.toBeNull();
      expect(stats.youtube?.platform).toBe("youtube");
      expect(stats.youtube?.handle).toBe("@testcreator");
    });

    it("should aggregate stats across platforms", () => {
      const mockStats = {
        youtube: {
          platform: "youtube" as const,
          handle: "@test",
          followers: 10000,
          engagementRate: 5.5,
          averageViews: 5000,
          totalPosts: 100,
          lastSyncedAt: new Date(),
        },
        tiktok: {
          platform: "tiktok" as const,
          handle: "@test",
          followers: 5000,
          engagementRate: 8.2,
          averageViews: 3000,
          totalPosts: 50,
          lastSyncedAt: new Date(),
        },
        instagram: null,
        twitter: null,
      };

      const aggregate = aggregateStats(mockStats);

      expect(aggregate.totalFollowers).toBe(15000);
      expect(aggregate.verifiedPlatforms).toBe(2);
      expect(aggregate.avgEngagementRate).toBeCloseTo(6.85, 1);
      expect(aggregate.totalPosts).toBe(150);
    });

    it("should handle platforms with errors gracefully", () => {
      const statsWithError = {
        youtube: {
          platform: "youtube" as const,
          handle: "@test",
          followers: 0,
          engagementRate: 0,
          averageViews: 0,
          totalPosts: 0,
          lastSyncedAt: new Date(),
          error: "API rate limit exceeded",
        },
        tiktok: null,
        instagram: null,
        twitter: null,
      };

      const aggregate = aggregateStats(statsWithError);

      expect(aggregate.totalFollowers).toBe(0);
      expect(aggregate.verifiedPlatforms).toBe(0); // Error platforms don't count
    });
  });

  describe("Feature 2: Verified Creator Badge System", () => {
    it("should detect verified creator after verification", async () => {
      const verified = await isUserVerified(testUserId);
      expect(verified).toBe(true); // YouTube was verified in previous test
    });

    it("should return verification status for all platforms", async () => {
      const bonusInfo = await getVerificationBonus(testUserId);

      expect(bonusInfo.isVerified).toBe(true);
      expect(bonusInfo.platforms).toContain("YouTube");
      expect(bonusInfo.platforms.length).toBe(1);
    });

    it("should detect multiple verified platforms", async () => {
      // Verify TikTok as well
      await db!
        .update(aiAssistantProfiles)
        .set({
          tiktokHandle: "@testcreator",
          tiktokVerified: true,
        })
        .where(eq(aiAssistantProfiles.userId, testUserId));

      const bonusInfo = await getVerificationBonus(testUserId);

      expect(bonusInfo.platforms).toContain("YouTube");
      expect(bonusInfo.platforms).toContain("TikTok");
      expect(bonusInfo.platforms.length).toBe(2);
    });
  });

  describe("Feature 3: Verification-based Token Rewards", () => {
    it("should calculate reward without verification multiplier for unverified user", async () => {
      // Create a new unverified user
      const [unverifiedUser] = await db!
        .insert(users)
        .values({
          openId: `test-unverified-${Date.now()}`,
          name: "Test Unverified Creator",
          email: `test-unverified-${Date.now()}@example.com`,
        })
        .$returningId();

      await db!.insert(aiAssistantProfiles).values({
        userId: unverifiedUser.id,
        niche: "Gaming",
        primaryPlatform: "youtube",
        audienceSize: 1000,
        tone: "casual",
        format: "video",
        averageViews: 500,
        onboardingCompleted: true,
        youtubeVerified: false,
        tiktokVerified: false,
        instagramVerified: false,
        twitterVerified: false,
      });

      const reward = await calculateReward(unverifiedUser.id, "test_action");

      expect(reward).not.toBeNull();
      expect(reward!.baseAmount).toBe(100);
      expect(reward!.multiplier).toBe(1.0);
      expect(reward!.bonusAmount).toBe(0);
      expect(reward!.totalAmount).toBe(100);
      expect(reward!.isVerified).toBe(false);
    });

    it("should calculate reward with 1.5x multiplier for verified user", async () => {
      const reward = await calculateReward(testUserId, "test_action");

      expect(reward).not.toBeNull();
      expect(reward!.baseAmount).toBe(100);
      expect(reward!.multiplier).toBe(1.5);
      expect(reward!.bonusAmount).toBe(50);
      expect(reward!.totalAmount).toBe(150);
      expect(reward!.isVerified).toBe(true);
      expect(reward!.verificationBonus).toBe(50);
    });

    it("should award tokens with verification bonus", async () => {
      const result = await awardTokens(
        testUserId,
        "test_action",
        "Test reward with verification bonus"
      );

      expect(result.success).toBe(true);
      expect(result.reward).not.toBeNull();
      expect(result.reward!.totalAmount).toBe(150);
      expect(result.newBalance).toBeGreaterThan(0);
    });

    it("should record verification bonus in transaction description", async () => {
      const transactions = await db!
        .select()
        .from(tokenTransactions)
        .where(eq(tokenTransactions.userId, testUserId))
        .limit(1);

      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].description).toContain("Verified Creator Bonus");
      expect(transactions[0].description).toContain("+50 VBT");
    });

    it("should display verification bonus percentage", async () => {
      const bonusInfo = await getVerificationBonus(testUserId);

      expect(bonusInfo.multiplier).toBe(1.5);
      expect(bonusInfo.potentialBonus).toBe("50%");
    });

    it("should update user token balance correctly", async () => {
      const [balance] = await db!
        .select()
        .from(userTokens)
        .where(eq(userTokens.userId, testUserId))
        .limit(1);

      expect(balance).toBeDefined();
      expect(balance.balance).toBeGreaterThan(0);
      expect(balance.totalEarned).toBeGreaterThan(0);
    });
  });

  describe("Integration: Full Verification Flow", () => {
    it("should complete full verification and reward flow", async () => {
      // Create new user
      const [newUser] = await db!
        .insert(users)
        .values({
          openId: `test-full-flow-${Date.now()}`,
          name: "Test Full Flow Creator",
          email: `test-full-flow-${Date.now()}@example.com`,
        })
        .$returningId();

      // Create profile (unverified)
      await db!.insert(aiAssistantProfiles).values({
        userId: newUser.id,
        niche: "Cooking",
        primaryPlatform: "instagram",
        audienceSize: 5000,
        tone: "friendly",
        format: "image",
        averageViews: 2000,
        onboardingCompleted: true,
        youtubeVerified: false,
        tiktokVerified: false,
        instagramHandle: "@testchef",
        instagramVerified: false,
        twitterVerified: false,
      });

      // Step 1: Check initial status (unverified)
      let verified = await isUserVerified(newUser.id);
      expect(verified).toBe(false);

      // Step 2: Award tokens (no bonus)
      let result = await awardTokens(newUser.id, "test_action", "Pre-verification reward");
      expect(result.reward!.totalAmount).toBe(100);

      // Step 3: Verify Instagram account
      await db!
        .update(aiAssistantProfiles)
        .set({ instagramVerified: true })
        .where(eq(aiAssistantProfiles.userId, newUser.id));

      // Step 4: Check verified status
      verified = await isUserVerified(newUser.id);
      expect(verified).toBe(true);

      // Step 5: Award tokens (with 1.5x bonus)
      result = await awardTokens(newUser.id, "test_action", "Post-verification reward");
      expect(result.reward!.totalAmount).toBe(150);
      expect(result.reward!.verificationBonus).toBe(50);

      // Step 6: Verify total balance (100 + 150 = 250)
      const [finalBalance] = await db!
        .select()
        .from(userTokens)
        .where(eq(userTokens.userId, newUser.id))
        .limit(1);

      expect(finalBalance.balance).toBe(250);
      expect(finalBalance.totalEarned).toBe(250);
    });
  });
});
