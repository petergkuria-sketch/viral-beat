import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { userTokens, tokenTransactions, tokenEarningRules, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { awardTokens, spendTokens } from "./routers/tokens";

describe("Token Economy System", () => {
  let testUserId: number;
  
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Create a test user
    const result: any = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });
    
    testUserId = Number(result.insertId || 0);
  });

  it("should create user token record with welcome bonus", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Award tokens (this will create the record if it doesn't exist)
    await awardTokens(testUserId, 100, "earn_admin_grant", "Welcome bonus");
    
    const [userToken] = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, testUserId))
      .limit(1);
    
    expect(userToken).toBeDefined();
    expect(userToken.balance).toBeGreaterThanOrEqual(100);
    expect(userToken.totalEarned).toBeGreaterThanOrEqual(100);
  });

  it("should award tokens correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const [beforeToken] = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, testUserId))
      .limit(1);
    
    const beforeBalance = beforeToken.balance;
    
    // Award 50 tokens
    await awardTokens(testUserId, 50, "earn_thread_creation", "Created a thread");
    
    const [afterToken] = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, testUserId))
      .limit(1);
    
    expect(afterToken.balance).toBe(beforeBalance + 50);
    expect(afterToken.totalEarned).toBe(beforeToken.totalEarned + 50);
  });

  it("should record token transaction when awarding", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await awardTokens(testUserId, 20, "earn_post_reply", "Posted a reply");
    
    const transactions = await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.userId, testUserId));
    
    const replyTransaction = transactions.find(t => t.type === "earn_post_reply");
    
    expect(replyTransaction).toBeDefined();
    expect(replyTransaction?.amount).toBe(20);
    expect(replyTransaction?.description).toBe("Posted a reply");
  });

  it("should spend tokens correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const [beforeToken] = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, testUserId))
      .limit(1);
    
    const beforeBalance = beforeToken.balance;
    
    // Spend 30 tokens
    await spendTokens(testUserId, 30, "spend_ai_agent", "Used AI Agent");
    
    const [afterToken] = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, testUserId))
      .limit(1);
    
    expect(afterToken.balance).toBe(beforeBalance - 30);
    expect(afterToken.totalSpent).toBe(beforeToken.totalSpent + 30);
  });

  it("should prevent spending more tokens than balance", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const [userToken] = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, testUserId))
      .limit(1);
    
    const excessiveAmount = userToken.balance + 1000;
    
    await expect(
      spendTokens(testUserId, excessiveAmount, "spend_ai_agent", "Trying to overspend")
    ).rejects.toThrow("Insufficient tokens");
  });

  it("should have earning rules seeded in database", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const rules = await db
      .select()
      .from(tokenEarningRules)
      .where(eq(tokenEarningRules.isActive, true));
    
    expect(rules.length).toBeGreaterThan(0);
    
    const threadCreationRule = rules.find(r => r.actionType === "thread_creation");
    expect(threadCreationRule).toBeDefined();
    expect(threadCreationRule?.tokenAmount).toBe(50);
    
    const postReplyRule = rules.find(r => r.actionType === "post_reply");
    expect(postReplyRule).toBeDefined();
    expect(postReplyRule?.tokenAmount).toBe(20);
  });

  it("should record negative amount for spending transactions", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await spendTokens(testUserId, 15, "spend_ai_agent", "Used Content Repurposer");
    
    const transactions = await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.userId, testUserId));
    
    const spendTransaction = transactions.find(
      t => t.type === "spend_ai_agent" && t.description === "Used Content Repurposer"
    );
    
    expect(spendTransaction).toBeDefined();
    expect(spendTransaction?.amount).toBe(-15);
  });
});
