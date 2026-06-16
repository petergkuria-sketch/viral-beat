import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Registration Trends", () => {
  const adminContext: TrpcContext = {
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

  const userContext: TrpcContext = {
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

  describe("getRegistrationTrends", () => {
    it("should return daily registration trends for admin users", async () => {
      const caller = appRouter.createCaller(adminContext);
      const trends = await caller.admin.getRegistrationTrends({
        period: "daily",
        days: 30,
      });

      expect(trends).toBeDefined();
      expect(trends.labels).toBeInstanceOf(Array);
      expect(trends.data).toBeInstanceOf(Array);
      expect(trends.period).toBe("daily");
      expect(trends.totalRegistrations).toBeGreaterThanOrEqual(0);
      expect(trends.labels.length).toBe(trends.data.length);
    });

    it("should return weekly registration trends for admin users", async () => {
      const caller = appRouter.createCaller(adminContext);
      const trends = await caller.admin.getRegistrationTrends({
        period: "weekly",
        days: 84,
      });

      expect(trends).toBeDefined();
      expect(trends.period).toBe("weekly");
      expect(trends.labels).toBeInstanceOf(Array);
      expect(trends.data).toBeInstanceOf(Array);
    });

    it("should return monthly registration trends for admin users", async () => {
      const caller = appRouter.createCaller(adminContext);
      const trends = await caller.admin.getRegistrationTrends({
        period: "monthly",
        days: 365,
      });

      expect(trends).toBeDefined();
      expect(trends.period).toBe("monthly");
      expect(trends.labels).toBeInstanceOf(Array);
      expect(trends.data).toBeInstanceOf(Array);
    });

    it("should deny non-admin users access to registration trends", async () => {
      const caller = appRouter.createCaller(userContext);
      
      await expect(
        caller.admin.getRegistrationTrends({
          period: "daily",
          days: 30,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should respect the days parameter", async () => {
      const caller = appRouter.createCaller(adminContext);
      const trends = await caller.admin.getRegistrationTrends({
        period: "daily",
        days: 7,
      });

      expect(trends).toBeDefined();
      // Should have approximately 7 data points (one per day)
      expect(trends.data.length).toBeGreaterThanOrEqual(7);
      expect(trends.data.length).toBeLessThanOrEqual(8); // Allow for date boundary issues
    });
  });
});
