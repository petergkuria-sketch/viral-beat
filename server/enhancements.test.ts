import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Settings & Admin Enhancements", () => {
  describe("Admin Dashboard", () => {
    it("should allow admin users to access system stats", async () => {
      const mockContext: TrpcContext = {
        user: {
          id: 1,
          openId: "test-admin",
          name: "Admin User",
          email: "admin@example.com",
          loginMethod: "google",
          role: "admin",
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
      const stats = await caller.admin.getSystemStats();

      expect(stats).toBeDefined();
      expect(stats.systemHealth).toBeDefined();
      expect(stats.userMetrics).toBeDefined();
      expect(stats.systemHealth.apiStatus).toBe("healthy");
      expect(stats.systemHealth.dbStatus).toBe("connected");
    });

    it("should deny non-admin users access to system stats", async () => {
      const mockContext: TrpcContext = {
        user: {
          id: 2,
          openId: "test-user",
          name: "Regular User",
          email: "user@example.com",
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
      
      await expect(caller.admin.getSystemStats()).rejects.toThrow("Unauthorized");
    });
  });

  describe("Settings Hub", () => {
    it("should retrieve privacy settings for authenticated users", async () => {
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

      expect(settings).toBeDefined();
      expect(settings).toHaveProperty("profileVisibility");
      expect(settings).toHaveProperty("showStats");
      expect(settings).toHaveProperty("showActivity");
      expect(["public", "private"]).toContain(settings.profileVisibility);
      expect(typeof settings.showStats).toBe("boolean");
      expect(typeof settings.showActivity).toBe("boolean");
    });
  });
});
