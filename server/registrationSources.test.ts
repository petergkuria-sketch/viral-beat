import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Admin Registration Sources Analytics", () => {
  it("should return registration source data for admin users", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-admin",
        name: "Admin User",
        email: "admin@test.com",
        role: "admin",
        loginMethod: "google",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    } as Context);

    const result = await caller.admin.getRegistrationSources({ days: 30 });

    expect(result).toBeDefined();
    expect(result.labels).toBeInstanceOf(Array);
    expect(result.datasets).toBeInstanceOf(Array);
    expect(result.totalsByMethod).toBeDefined();
    expect(result.totalRegistrations).toBeGreaterThanOrEqual(0);
    
    // Verify datasets structure
    if (result.datasets.length > 0) {
      const dataset = result.datasets[0];
      expect(dataset).toHaveProperty("label");
      expect(dataset).toHaveProperty("data");
      expect(dataset).toHaveProperty("method");
      expect(dataset.data).toBeInstanceOf(Array);
    }
    
    // Verify totals match
    const calculatedTotal = Object.values(result.totalsByMethod).reduce(
      (sum, count) => sum + count,
      0
    );
    expect(result.totalRegistrations).toBe(calculatedTotal);
  });

  it("should throw error for non-admin users", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 2,
        openId: "test-user",
        name: "Regular User",
        email: "user@test.com",
        role: "user",
        loginMethod: "google",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    } as Context);

    await expect(
      caller.admin.getRegistrationSources({ days: 30 })
    ).rejects.toThrow("Unauthorized: Admin access required");
  });

  it("should handle different time periods", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-admin",
        name: "Admin User",
        email: "admin@test.com",
        role: "admin",
        loginMethod: "google",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    } as Context);

    const result7Days = await caller.admin.getRegistrationSources({ days: 7 });
    const result30Days = await caller.admin.getRegistrationSources({ days: 30 });
    const result90Days = await caller.admin.getRegistrationSources({ days: 90 });

    expect(result7Days.labels.length).toBeLessThanOrEqual(result30Days.labels.length);
    expect(result30Days.labels.length).toBeLessThanOrEqual(result90Days.labels.length);
  });

  it("should group registrations by login method correctly", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-admin",
        name: "Admin User",
        email: "admin@test.com",
        role: "admin",
        loginMethod: "google",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    } as Context);

    const result = await caller.admin.getRegistrationSources({ days: 30 });

    // Verify each dataset has matching total in totalsByMethod
    result.datasets.forEach((dataset) => {
      const total = dataset.data.reduce((sum, val) => sum + val, 0);
      expect(result.totalsByMethod[dataset.method]).toBe(total);
    });
  });
});
