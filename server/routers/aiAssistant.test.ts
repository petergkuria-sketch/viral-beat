import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import type { TrpcContext } from "../_core/trpc";

describe("AI Assistant Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testUserId: number;

  beforeEach(async () => {
    // Create test user context
    const mockUser = {
      id: 999999,
      openId: "test-openid-viralmind",
      name: "Test Creator",
      email: "test@viralmind.com",
      role: "user" as const,
    };

    const mockContext: TrpcContext = {
      user: mockUser,
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);
    testUserId = mockUser.id;

    // Clean up test data
    const db = await getDb();
    if (db) {
      await db.execute(`DELETE FROM aiAssistantProfiles WHERE userId = ${testUserId}`);
      await db.execute(`DELETE FROM assistantConversations WHERE userId = ${testUserId}`);
      await db.execute(`DELETE FROM contentAnalyses WHERE userId = ${testUserId}`);
      await db.execute(`DELETE FROM creatorGoals WHERE userId = ${testUserId}`);
    }
  });

  describe("Profile Management", () => {
    it("should create a new profile on first access", async () => {
      const profile = await caller.aiAssistant.getProfile();
      
      expect(profile).toBeDefined();
      expect(profile.userId).toBe(testUserId);
      expect(profile.onboardingCompleted).toBe(false);
    });

    it("should complete onboarding with valid data", async () => {
      const onboardingData = {
        niche: "Tech Reviews",
        primaryPlatform: "youtube" as const,
        audienceSize: 50000,
        averageViews: 10000,
        contentTopics: ["AI", "Gadgets", "Software"],
        tone: "Professional",
        format: "Long-form",
        goals: {
          shortTerm: "Reach 100K subscribers",
          longTerm: "Become top tech reviewer",
        },
        challenges: ["Consistency", "Engagement"],
      };

      const result = await caller.aiAssistant.completeOnboarding(onboardingData);
      
      expect(result.success).toBe(true);
      
      const profile = await caller.aiAssistant.getProfile();
      expect(profile.onboardingCompleted).toBe(true);
      expect(profile.niche).toBe("Tech Reviews");
      expect(profile.primaryPlatform).toBe("youtube");
    });

    it("should update existing profile", async () => {
      // First create profile
      await caller.aiAssistant.getProfile();

      // Then update it
      const result = await caller.aiAssistant.updateProfile({
        niche: "Gaming",
        primaryPlatform: "tiktok" as const,
        audienceSize: 75000,
      });

      expect(result.success).toBe(true);

      const profile = await caller.aiAssistant.getProfile();
      expect(profile.niche).toBe("Gaming");
      expect(profile.primaryPlatform).toBe("tiktok");
      expect(profile.audienceSize).toBe(75000);
    });
  });

  describe("Chat Functionality", () => {
    it("should send a message and receive AI response", async () => {
      // Ensure profile exists
      await caller.aiAssistant.getProfile();

      const response = await caller.aiAssistant.chat({
        message: "What are the top trending topics in tech right now?",
      });

      expect(response).toBeDefined();
      expect(response.message).toBeTruthy();
      expect(response.sessionId).toBeTruthy();
      expect(typeof response.message).toBe("string");
    });

    it("should maintain conversation context with sessionId", async () => {
      await caller.aiAssistant.getProfile();

      // First message
      const firstResponse = await caller.aiAssistant.chat({
        message: "Hello, I need help with content creation",
      });

      const sessionId = firstResponse.sessionId;

      // Second message in same session
      const secondResponse = await caller.aiAssistant.chat({
        message: "Can you suggest some video ideas?",
        sessionId,
      });

      expect(secondResponse.sessionId).toBe(sessionId);
      expect(secondResponse.message).toBeTruthy();
    });

    it("should retrieve conversation history", async () => {
      await caller.aiAssistant.getProfile();

      // Send a few messages
      const response1 = await caller.aiAssistant.chat({
        message: "First message",
      });

      await caller.aiAssistant.chat({
        message: "Second message",
        sessionId: response1.sessionId,
      });

      // Get conversation history
      const conversations = await caller.aiAssistant.getConversations({
        sessionId: response1.sessionId,
      });

      expect(conversations.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant messages
      expect(conversations.some((c) => c.role === "user")).toBe(true);
      expect(conversations.some((c) => c.role === "assistant")).toBe(true);
    });
  });

  describe("Content Analysis", () => {
    it("should analyze content and provide virality score", async () => {
      await caller.aiAssistant.getProfile();

      const analysis = await caller.aiAssistant.analyzeContent({
        title: "How AI is Revolutionizing Content Creation in 2026",
        contentUrl: "https://example.com/video",
        contentType: "video" as const,
        platform: "youtube" as const,
      });

      expect(analysis).toBeDefined();
      expect(analysis.id).toBeDefined();
    });

    it("should retrieve analysis history", async () => {
      await caller.aiAssistant.getProfile();

      // Create a few analyses
      await caller.aiAssistant.analyzeContent({
        title: "First video",
        contentType: "video" as const,
        platform: "youtube" as const,
      });

      await caller.aiAssistant.analyzeContent({
        title: "Second video",
        contentType: "video" as const,
        platform: "tiktok" as const,
      });

      const analyses = await caller.aiAssistant.getAnalyses({ limit: 10 });

      expect(analyses.length).toBeGreaterThanOrEqual(2);
      expect(analyses[0].contentTitle).toBeTruthy();
    });
  });

  describe("Goal Management", () => {
    it("should create a new goal", async () => {
      await caller.aiAssistant.getProfile();

      const result = await caller.aiAssistant.createGoal({
        goalType: "followers" as const,
        title: "Reach 100K Followers",
        description: "Grow audience to 100,000 followers",
        targetValue: 100000,
      });

      expect(result.success).toBe(true);
    });

    it("should retrieve active goals", async () => {
      await caller.aiAssistant.getProfile();

      await caller.aiAssistant.createGoal({
        goalType: "views" as const,
        title: "1M Views",
        targetValue: 1000000,
      });

      const goals = await caller.aiAssistant.getGoals();

      expect(goals.length).toBeGreaterThanOrEqual(1);
      expect(goals[0].title).toBe("1M Views");
      expect(goals[0].status).toBe("active");
    });

    it("should update goal progress", async () => {
      await caller.aiAssistant.getProfile();

      await caller.aiAssistant.createGoal({
        goalType: "engagement" as const,
        title: "Boost Engagement",
        targetValue: 10000,
      });

      const goals = await caller.aiAssistant.getGoals();
      const goalId = goals[0].id;

      const result = await caller.aiAssistant.updateGoalProgress({
        goalId,
        currentValue: 5000,
      });

      expect(result.success).toBe(true);

      const updatedGoals = await caller.aiAssistant.getGoals();
      expect(updatedGoals[0].currentValue).toBe(5000);
    });

    it("should mark goal as completed when target is reached", async () => {
      await caller.aiAssistant.getProfile();

      await caller.aiAssistant.createGoal({
        goalType: "revenue" as const,
        title: "Earn $1000",
        targetValue: 1000,
      });

      const goals = await caller.aiAssistant.getGoals();
      const goalId = goals[0].id;

      await caller.aiAssistant.updateGoalProgress({
        goalId,
        currentValue: 1000,
      });

      const updatedGoals = await caller.aiAssistant.getGoals();
      expect(updatedGoals[0].status).toBe("completed");
    });
  });

  describe("Error Handling", () => {
    it("should handle missing required fields in onboarding", async () => {
      await expect(
        caller.aiAssistant.completeOnboarding({
          niche: "",
          primaryPlatform: "youtube" as const,
          audienceSize: 0,
          averageViews: 0,
          contentTopics: [],
          tone: "",
          format: "",
          goals: { shortTerm: "", longTerm: "" },
          challenges: [],
        })
      ).rejects.toThrow();
    });

    it("should handle empty chat messages", async () => {
      await caller.aiAssistant.getProfile();

      await expect(
        caller.aiAssistant.chat({
          message: "",
        })
      ).rejects.toThrow();
    });

    it("should handle invalid goal ID in progress update", async () => {
      await caller.aiAssistant.getProfile();

      await expect(
        caller.aiAssistant.updateGoalProgress({
          goalId: 999999999,
          currentValue: 100,
        })
      ).rejects.toThrow();
    });
  });
});
