import { describe, it, expect, beforeAll } from "vitest";

// AI agent tests require longer timeout due to LLM API calls
const AI_TEST_TIMEOUT = 30000; // 30 seconds
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";

// Mock context for protected procedures
const mockContext: TrpcContext = {
  user: {
    id: "test-user-123",
    name: "Test User",
    email: "test@example.com",
    avatar: "https://example.com/avatar.jpg",
    role: "user",
    openId: "test-open-id",
  },
};

describe("AI Agents", () => {
  describe("Script Writer Agent", () => {
    it("should generate a script for TikTok", { timeout: AI_TEST_TIMEOUT }, async () => {
      const caller = appRouter.createCaller(mockContext);
      
      const result = await caller.aiAgents.generateScript({
        topic: "AI in Art",
        platform: "tiktok",
        contentType: "educational",
        duration: "30-60s",
        tone: "casual",
      });

      expect(result).toHaveProperty("topic", "AI in Art");
      expect(result).toHaveProperty("platform", "tiktok");
      expect(result).toHaveProperty("script");
      expect(result.script).toBeTruthy();
      expect(typeof result.script).toBe("string");
      expect(result.script.length).toBeGreaterThan(50);
    });

    it("should generate different scripts for different platforms", { timeout: AI_TEST_TIMEOUT }, async () => {
      const caller = appRouter.createCaller(mockContext);
      
      const tiktokResult = await caller.aiAgents.generateScript({
        topic: "Sustainable Fashion",
        platform: "tiktok",
      });

      const youtubeResult = await caller.aiAgents.generateScript({
        topic: "Sustainable Fashion",
        platform: "youtube",
      });

      expect(tiktokResult.script).toBeTruthy();
      expect(youtubeResult.script).toBeTruthy();
      // Scripts should be different for different platforms
      expect(tiktokResult.script).not.toBe(youtubeResult.script);
    });
  });

  describe("Trend Forecaster Agent", () => {
    it("should forecast trends for a category", { timeout: AI_TEST_TIMEOUT }, async () => {
      const caller = appRouter.createCaller(mockContext);
      
      const result = await caller.aiAgents.forecastTrends({
        category: "tech",
        timeframe: "48h",
      });

      expect(result).toHaveProperty("category", "tech");
      expect(result).toHaveProperty("timeframe", "48h");
      expect(result).toHaveProperty("predictions");
      expect(Array.isArray(result.predictions)).toBe(true);
      expect(result.predictions.length).toBeGreaterThan(0);

      // Check prediction structure
      const firstPrediction = result.predictions[0];
      expect(firstPrediction).toHaveProperty("topic");
      expect(firstPrediction).toHaveProperty("confidence");
      expect(firstPrediction).toHaveProperty("peakTime");
      expect(firstPrediction).toHaveProperty("reasoning");
      expect(firstPrediction).toHaveProperty("action");
      expect(firstPrediction.confidence).toBeGreaterThanOrEqual(0);
      expect(firstPrediction.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe("Collaboration Matchmaker Agent", () => {
    it("should find collaboration matches", { timeout: AI_TEST_TIMEOUT }, async () => {
      const caller = appRouter.createCaller(mockContext);
      
      const result = await caller.aiAgents.findCollaborators({
        niche: "Tech Reviews",
        audienceSize: "mid",
        platform: "youtube",
      });

      expect(result).toHaveProperty("niche", "Tech Reviews");
      expect(result).toHaveProperty("audienceSize", "mid");
      expect(result).toHaveProperty("platform", "youtube");
      expect(result).toHaveProperty("matches");
      expect(Array.isArray(result.matches)).toBe(true);
      expect(result.matches.length).toBeGreaterThan(0);

      // Check match structure
      const firstMatch = result.matches[0];
      expect(firstMatch).toHaveProperty("creator");
      expect(firstMatch).toHaveProperty("matchScore");
      expect(firstMatch).toHaveProperty("audienceOverlap");
      expect(firstMatch).toHaveProperty("collaborationType");
      expect(firstMatch).toHaveProperty("expectedReach");
      expect(firstMatch).toHaveProperty("reasoning");
      expect(firstMatch.matchScore).toBeGreaterThanOrEqual(0);
      expect(firstMatch.matchScore).toBeLessThanOrEqual(100);
    });
  });

  describe("Sponsorship Opportunity Finder Agent", () => {
    it("should find sponsorship opportunities", { timeout: AI_TEST_TIMEOUT }, async () => {
      const caller = appRouter.createCaller(mockContext);
      
      const result = await caller.aiAgents.findSponsorships({
        niche: "Gaming",
        audienceSize: "macro",
        contentType: "gaming",
      });

      expect(result).toHaveProperty("niche", "Gaming");
      expect(result).toHaveProperty("audienceSize", "macro");
      expect(result).toHaveProperty("contentType", "gaming");
      expect(result).toHaveProperty("opportunities");
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(result.opportunities.length).toBeGreaterThan(0);

      // Check opportunity structure
      const firstOpp = result.opportunities[0];
      expect(firstOpp).toHaveProperty("brand");
      expect(firstOpp).toHaveProperty("fitScore");
      expect(firstOpp).toHaveProperty("dealValue");
      expect(firstOpp).toHaveProperty("campaignType");
      expect(firstOpp).toHaveProperty("requirements");
      expect(firstOpp).toHaveProperty("reasoning");
      expect(firstOpp.fitScore).toBeGreaterThanOrEqual(0);
      expect(firstOpp.fitScore).toBeLessThanOrEqual(100);
    });
  });

  describe("Content Repurposing Agent", () => {
    it("should repurpose content for multiple platforms", { timeout: AI_TEST_TIMEOUT }, async () => {
      const caller = appRouter.createCaller(mockContext);
      
      const result = await caller.aiAgents.repurposeContent({
        originalContent: "Check out this amazing new AI tool that can generate images from text! It's revolutionary and will change how we create content. Link in bio!",
        originalPlatform: "twitter",
        targetPlatforms: ["tiktok", "youtube"],
      });

      expect(result).toHaveProperty("originalPlatform", "twitter");
      expect(result).toHaveProperty("adaptations");
      expect(Array.isArray(result.adaptations)).toBe(true);
      expect(result.adaptations.length).toBe(2);

      // Check adaptation structure
      const tiktokAdaptation = result.adaptations.find(a => a.platform === "tiktok");
      const youtubeAdaptation = result.adaptations.find(a => a.platform === "youtube");
      
      expect(tiktokAdaptation).toBeTruthy();
      expect(youtubeAdaptation).toBeTruthy();
      expect(tiktokAdaptation?.content).toBeTruthy();
      expect(youtubeAdaptation?.content).toBeTruthy();
      expect(typeof tiktokAdaptation?.content).toBe("string");
      expect(typeof youtubeAdaptation?.content).toBe("string");
    });

    it("should not include original platform in adaptations", { timeout: AI_TEST_TIMEOUT }, async () => {
      const caller = appRouter.createCaller(mockContext);
      
      const result = await caller.aiAgents.repurposeContent({
        originalContent: "Test content",
        originalPlatform: "instagram",
        targetPlatforms: ["instagram", "tiktok"],
      });

      // Should only have TikTok adaptation, not Instagram (since that's the original)
      expect(result.adaptations.length).toBe(1);
      expect(result.adaptations[0].platform).toBe("tiktok");
    });
  });
});
