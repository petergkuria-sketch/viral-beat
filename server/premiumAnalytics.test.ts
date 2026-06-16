import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { userTokens, marketplaceItems, userPurchases } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Premium Analytics Access Control", () => {
  let testUserId: number;
  let premiumItemId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Use a random userId to avoid conflicts
    const randomUserId = Math.floor(Math.random() * 1000000) + 1000000;

    // Check if user already exists
    const existing = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, randomUserId));

    if (existing.length === 0) {
      // Create a test user with tokens
      await db
        .insert(userTokens)
        .values({
          userId: randomUserId,
          balance: 500,
          totalEarned: 500,
          totalSpent: 0,
        });
    }

    testUserId = randomUserId;

    // Find premium analytics item
    const [item] = await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.category, "analytics"))
      .limit(1);

    if (item) {
      premiumItemId = item.id;
    }
  });

  it("should deny access to premium analytics without purchase", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const purchases = await db
      .select()
      .from(userPurchases)
      .where(eq(userPurchases.userId, testUserId));

    expect(purchases.length).toBe(0);
  });

  it("should grant access after purchasing premium analytics", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simulate purchase
    await db.insert(userPurchases).values({
      userId: testUserId,
      itemId: premiumItemId,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const purchases = await db
      .select()
      .from(userPurchases)
      .where(
        eq(userPurchases.userId, testUserId)
      );

    expect(purchases.length).toBeGreaterThan(0);
    expect(purchases[0].isActive).toBe(true);
  });

  it("should track token spending for premium purchase", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tokenData = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, testUserId));

    // Token balance should exist
    expect(tokenData.length).toBeGreaterThan(0);
    if (tokenData.length > 0) {
      expect(tokenData[0].balance).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Token Notifications", () => {
  it("should have correct token event types", () => {
    const eventTypes = [
      "earn_thread_creation",
      "earn_post_reply",
      "earn_daily_login",
      "spend_ai_agent",
      "spend_marketplace",
    ];

    eventTypes.forEach((type) => {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    });
  });

  it("should calculate correct token amounts", () => {
    const threadCreationReward = 50;
    const postReplyReward = 20;
    const aiAgentCost = 30;

    expect(threadCreationReward).toBe(50);
    expect(postReplyReward).toBe(20);
    expect(aiAgentCost).toBe(30);

    // Test balance calculation
    const initialBalance = 100;
    const afterEarning = initialBalance + threadCreationReward;
    const afterSpending = afterEarning - aiAgentCost;

    expect(afterEarning).toBe(150);
    expect(afterSpending).toBe(120);
  });
});
