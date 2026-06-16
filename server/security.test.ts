import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Security Features", () => {
  describe("Privacy Settings", () => {
    it("should get default privacy settings for authenticated user", async () => {
      const mockContext: TrpcContext = {
        user: {
          id: 1,
          openId: "test-user",
          name: "Test User",
          email: "test@example.com",
          loginMethod: "google",
          role: "user",
          profileVisibility: "public",
          showStats: true,
          showActivity: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(mockContext);
      const settings = await caller.auth.getPrivacySettings();

      expect(settings).toEqual({
        profileVisibility: "public",
        showStats: true,
        showActivity: true,
      });
    });

    it("should update privacy settings", async () => {
      const mockContext: TrpcContext = {
        user: {
          id: 1,
          openId: "test-user",
          name: "Test User",
          email: "test@example.com",
          loginMethod: "google",
          role: "user",
          profileVisibility: "public",
          showStats: true,
          showActivity: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.auth.updatePrivacySettings({
        profileVisibility: "private",
        showStats: false,
      });

      expect(result.success).toBe(true);
    }, 10000);
  });

  describe("Content Access Control", () => {
    it("should allow authenticated users to access AI Agents", async () => {
      const mockContext: TrpcContext = {
        user: {
          id: 1,
          openId: "test-user",
          name: "Test User",
          email: "test@example.com",
          loginMethod: "google",
          role: "user",
          profileVisibility: "public",
          showStats: true,
          showActivity: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(mockContext);
      
      // This should not throw an error
      const result = await caller.aiAgents.generateScript({
        topic: "AI in Art",
        platform: "youtube",
      });

      expect(result.script).toBeDefined();
      expect(typeof result.script).toBe("string");
    }, 30000);

    it("should deny unauthenticated users access to AI Agents", async () => {
      const mockContext: TrpcContext = {
        user: null,
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(mockContext);
      
      await expect(
        caller.aiAgents.generateScript({
          topic: "AI in Art",
          platform: "youtube",
        })
      ).rejects.toThrow();
    });
  });
});
