import { getDb } from "../db";
import { userTokens } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { awardTokens } from "./tokens";

const DAILY_LOGIN_BONUS = 5;

/**
 * Calculate streak bonus based on consecutive days
 */
function calculateStreakBonus(streak: number): number {
  if (streak >= 30) return 25; // 30-day streak
  if (streak >= 7) return 15; // 7-day streak
  if (streak >= 3) return 10; // 3-day streak
  return 5; // Default daily bonus
}

/**
 * Check if user should receive daily login bonus and award it with streak tracking
 * Returns awarded status, streak bonus amount, and current streak
 */
export async function checkAndAwardDailyLoginBonus(userId: number): Promise<{ awarded: boolean; streakBonus?: number; currentStreak?: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Get user's token record
  const [userToken] = await db
    .select()
    .from(userTokens)
    .where(eq(userTokens.userId, userId))
    .limit(1);

  if (!userToken) {
    // User doesn't have a token record yet, create one with welcome bonus
    await awardTokens(userId, 100, "earn_admin_grant", "Welcome bonus");
    
    // Get the newly created record
    const [newUserToken] = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, userId))
      .limit(1);
    
    if (!newUserToken) throw new Error("Failed to create user token record");
    
    // Award daily login bonus with streak = 1
    await db
      .update(userTokens)
      .set({ lastLoginDate: today, loginStreak: 1, lastStreakDate: today })
      .where(eq(userTokens.userId, userId));
    
    await awardTokens(userId, DAILY_LOGIN_BONUS, "earn_daily_login", "Daily login bonus (Day 1)");
    return { awarded: true, streakBonus: DAILY_LOGIN_BONUS, currentStreak: 1 };
  }

  // Check if user already claimed today's bonus
  if (userToken.lastLoginDate === today) {
    return { awarded: false, currentStreak: userToken.loginStreak || 0 };
  }

  // Calculate streak
  let currentStreak = userToken.loginStreak || 0;
  const lastStreakDate = userToken.lastStreakDate;
  
  if (lastStreakDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    if (lastStreakDate === yesterdayStr) {
      // Consecutive day - increment streak
      currentStreak += 1;
    } else {
      // Streak broken - reset to 1
      currentStreak = 1;
    }
  } else {
    // First time tracking streak
    currentStreak = 1;
  }

  // Calculate bonus based on streak
  const streakBonus = calculateStreakBonus(currentStreak);

  // Update user record with new streak
  await db
    .update(userTokens)
    .set({ 
      lastLoginDate: today,
      loginStreak: currentStreak,
      lastStreakDate: today
    })
    .where(eq(userTokens.userId, userId));

  // Award tokens with streak description
  let description = `Daily login bonus (Day ${currentStreak})`;
  if (currentStreak >= 30) description += " 🔥 30-Day Streak!";
  else if (currentStreak >= 7) description += " 🔥 7-Day Streak!";
  else if (currentStreak >= 3) description += " 🔥 3-Day Streak!";

  await awardTokens(userId, streakBonus, "earn_daily_login", description);
  return { awarded: true, streakBonus, currentStreak };
}

/**
 * Get user's current login streak
 */
export async function getLoginStreak(userId: number): Promise<{ streak: number; lastLoginDate: string | null }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [userToken] = await db
    .select()
    .from(userTokens)
    .where(eq(userTokens.userId, userId))
    .limit(1);

  return {
    streak: userToken?.loginStreak || 0,
    lastLoginDate: userToken?.lastLoginDate || null,
  };
}
