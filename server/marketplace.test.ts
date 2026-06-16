import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { users, userTokens, marketplaceItems, userPurchases } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { checkAndAwardDailyLoginBonus } from "./routers/dailyLoginBonus";
import { awardTokens, spendTokens } from "./routers/tokens";

describe("Daily Login Bonus & Marketplace", () => {
  let testUserId: number;
  let testItemId: number;
  
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Create a test user
    const result: any = await db.insert(users).values({
      openId: `test-marketplace-${Date.now()}`,
      name: "Test Marketplace User",
      email: "marketplace@example.com",
      role: "user",
    });
    
    testUserId = Number(result.insertId || 0);
    
    // Get a marketplace item for testing
    const [item] = await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.name, "Content Boost"))
      .limit(1);
    
    if (item) {
      testItemId = item.id;
    }
  });

  describe("Daily Login Bonus", () => {
    it("should award bonus on first login or check existing", async () => {
      const awarded = await checkAndAwardDailyLoginBonus(testUserId);
      // Could be true (first time) or false (already awarded today)
      expect(typeof awarded).toBe("boolean");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [userToken] = await db
        .select()
        .from(userTokens)
        .where(eq(userTokens.userId, testUserId))
        .limit(1);
      
      expect(userToken).toBeDefined();
      expect(userToken.balance).toBeGreaterThanOrEqual(5);
      expect(userToken.lastLoginDate).toBeDefined();
    });

    it("should not award bonus twice on same day", async () => {
      const awarded = await checkAndAwardDailyLoginBonus(testUserId);
      expect(awarded).toBe(false);
    });

    it("should update lastLoginDate", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [userToken] = await db
        .select()
        .from(userTokens)
        .where(eq(userTokens.userId, testUserId))
        .limit(1);
      
      const today = new Date().toISOString().split("T")[0];
      expect(userToken.lastLoginDate).toBe(today);
    });
  });

  describe("Marketplace", () => {
    it("should have marketplace items seeded", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const items = await db
        .select()
        .from(marketplaceItems)
        .where(eq(marketplaceItems.isActive, true));
      
      expect(items.length).toBeGreaterThan(0);
      
      const premiumAnalytics = items.find(i => i.name === "Premium Analytics");
      expect(premiumAnalytics).toBeDefined();
      expect(premiumAnalytics?.cost).toBe(100);
      
      const contentBoost = items.find(i => i.name === "Content Boost");
      expect(contentBoost).toBeDefined();
      expect(contentBoost?.cost).toBe(50);
    });

    it("should allow purchasing an item with sufficient tokens", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (!testItemId) {
        throw new Error("No test item available");
      }
      
      // Give user enough tokens
      await awardTokens(testUserId, 100, "earn_admin_grant", "Test tokens for purchase");
      
      const [item] = await db
        .select()
        .from(marketplaceItems)
        .where(eq(marketplaceItems.id, testItemId))
        .limit(1);
      
      const [beforeToken] = await db
        .select()
        .from(userTokens)
        .where(eq(userTokens.userId, testUserId))
        .limit(1);
      
      const beforeBalance = beforeToken.balance;
      
      // Purchase the item
      await spendTokens(testUserId, item.cost, "spend_marketplace", `Purchased: ${item.name}`);
      
      const expiresAt = item.duration
        ? new Date(Date.now() + item.duration * 24 * 60 * 60 * 1000)
        : null;
      
      await db.insert(userPurchases).values({
        userId: testUserId,
        itemId: testItemId,
        expiresAt,
        isActive: true,
      });
      
      // Verify purchase
      const [purchase] = await db
        .select()
        .from(userPurchases)
        .where(
          and(
            eq(userPurchases.userId, testUserId),
            eq(userPurchases.itemId, testItemId)
          )
        )
        .limit(1);
      
      expect(purchase).toBeDefined();
      expect(purchase.isActive).toBe(true);
      
      // Verify token deduction
      const [afterToken] = await db
        .select()
        .from(userTokens)
        .where(eq(userTokens.userId, testUserId))
        .limit(1);
      
      expect(afterToken.balance).toBe(beforeBalance - item.cost);
    });

    it("should track user purchases", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const purchases = await db
        .select()
        .from(userPurchases)
        .where(eq(userPurchases.userId, testUserId));
      
      expect(purchases.length).toBeGreaterThan(0);
    });

    it("should prevent purchasing with insufficient tokens", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get an expensive item
      const [expensiveItem] = await db
        .select()
        .from(marketplaceItems)
        .where(eq(marketplaceItems.name, "Priority Support"))
        .limit(1);
      
      if (!expensiveItem) {
        throw new Error("Expensive item not found");
      }
      
      const [userToken] = await db
        .select()
        .from(userTokens)
        .where(eq(userTokens.userId, testUserId))
        .limit(1);
      
      // Try to purchase with insufficient balance
      if (userToken.balance < expensiveItem.cost) {
        await expect(
          spendTokens(testUserId, expensiveItem.cost, "spend_marketplace", "Test purchase")
        ).rejects.toThrow("Insufficient tokens");
      }
    });
  });
});
