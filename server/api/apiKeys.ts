import { randomBytes } from "crypto";
import { eq, and, gte } from "drizzle-orm";
import { getDb } from "../db";
import { apiKeys } from "../../drizzle/schema";

export function generateApiKey(): string {
  return "vb_" + randomBytes(24).toString("hex");
}

export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; reason?: string; keyId?: number }> {
  const db = await getDb();
  if (!db) return { valid: false, reason: "Database unavailable" };

  const [record] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);

  if (!record) return { valid: false, reason: "Invalid API key" };
  if (!record.isActive) return { valid: false, reason: "API key is disabled" };

  // Reset daily counter if it's a new day
  const now = new Date();
  const resetAt = new Date(record.resetAt);
  const needsReset =
    now.getUTCFullYear() !== resetAt.getUTCFullYear() ||
    now.getUTCMonth() !== resetAt.getUTCMonth() ||
    now.getUTCDate() !== resetAt.getUTCDate();

  if (needsReset) {
    await db
      .update(apiKeys)
      .set({ requestsToday: 0, resetAt: now })
      .where(eq(apiKeys.id, record.id));
    record.requestsToday = 0;
  }

  if (record.requestsToday >= record.dailyLimit) {
    return { valid: false, reason: `Daily limit of ${record.dailyLimit} requests reached` };
  }

  // Increment counters
  await db
    .update(apiKeys)
    .set({
      requestsToday: record.requestsToday + 1,
      requestsTotal: record.requestsTotal + 1,
      lastUsedAt: now,
    })
    .where(eq(apiKeys.id, record.id));

  return { valid: true, keyId: record.id };
}

export async function createApiKey(
  userId: number,
  name: string,
  scopes: string[] = ["trends", "kenya", "ai"],
  dailyLimit = 1000
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const key = generateApiKey();
  await db.insert(apiKeys).values({ key, name, userId, scopes, dailyLimit });
  return key;
}
