import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("Trends Router", () => {
  it("should have a search procedure", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the procedure exists
    expect(caller.trends.search).toBeDefined();
  });

  it("should have a getVideoDetails procedure", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the procedure exists
    expect(caller.trends.getVideoDetails).toBeDefined();
  });
});

describe("Favorites Router", () => {
  it("should have list, add, remove, and check procedures", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify all procedures exist
    expect(caller.favorites.list).toBeDefined();
    expect(caller.favorites.add).toBeDefined();
    expect(caller.favorites.remove).toBeDefined();
    expect(caller.favorites.check).toBeDefined();
  });

  it("should require authentication for favorites operations", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Attempting to list favorites without auth should throw
    await expect(caller.favorites.list()).rejects.toThrow();
  });
});

describe("Creators Router", () => {
  it("should have getByHandle procedure", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the procedure exists
    expect(caller.creators.getByHandle).toBeDefined();
  });

  it("should have getById procedure", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the procedure exists
    expect(caller.creators.getById).toBeDefined();
  });

  it("should have getStatsHistory procedure", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the procedure exists
    expect(caller.creators.getStatsHistory).toBeDefined();
  });

  it("should have getVideos procedure", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the procedure exists
    expect(caller.creators.getVideos).toBeDefined();
  });
});

describe("Auth Router", () => {
  it("should return null for unauthenticated user", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("should return user for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Test User");
  });
});
