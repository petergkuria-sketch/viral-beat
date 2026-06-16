/**
 * Token Reward Service
 * Handles token earning calculations with verification multipliers
 */

import { getDb } from "../db";
import { 
  tokenEarningRules, 
  tokenTransactions, 
  userTokens, 
  aiAssistantProfiles 
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface RewardCalculation {
  baseAmount: number;
  multiplier: number;
  bonusAmount: number;
  totalAmount: number;
  isVerified: boolean;
  verificationBonus: number;
}

/**
 * Check if a user is verified (has at least one verified social media account)
 */
export async function isUserVerified(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [profile] = await db
    .select()
    .from(aiAssistantProfiles)
    .where(eq(aiAssistantProfiles.userId, userId))
    .limit(1);

  if (!profile) return false;

  return (
    profile.youtubeVerified ||
    profile.tiktokVerified ||
    profile.instagramVerified ||
    profile.twitterVerified
  );
}

/**
 * Calculate token reward with verification multiplier
 */
export async function calculateReward(
  userId: number,
  actionType: string
): Promise<RewardCalculation | null> {
  const db = await getDb();
  if (!db) return null;

  // Get earning rule for this action
  const [rule] = await db
    .select()
    .from(tokenEarningRules)
    .where(and(
      eq(tokenEarningRules.actionType, actionType),
      eq(tokenEarningRules.isActive, true)
    ))
    .limit(1);

  if (!rule) {
    console.warn(`[TokenRewards] No active earning rule found for action: ${actionType}`);
    return null;
  }

  // Check if user is verified
  const verified = await isUserVerified(userId);

  // Calculate reward
  const baseAmount = rule.tokenAmount;
  const multiplier = verified ? parseFloat(rule.verifiedCreatorMultiplier.toString()) : 1.0;
  const bonusAmount = verified ? Math.floor(baseAmount * (multiplier - 1.0)) : 0;
  const totalAmount = Math.floor(baseAmount * multiplier);

  return {
    baseAmount,
    multiplier,
    bonusAmount,
    totalAmount,
    isVerified: verified,
    verificationBonus: bonusAmount,
  };
}

/**
 * Award tokens to a user with verification multiplier
 */
export async function awardTokens(
  userId: number,
  actionType: string,
  description: string,
  metadata?: Record<string, any>
): Promise<{
  success: boolean;
  reward: RewardCalculation | null;
  newBalance: number;
  error?: string;
}> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      reward: null,
      newBalance: 0,
      error: "Database not available",
    };
  }

  try {
    // Calculate reward
    const reward = await calculateReward(userId, actionType);
    if (!reward) {
      return {
        success: false,
        reward: null,
        newBalance: 0,
        error: `No earning rule found for action: ${actionType}`,
      };
    }

    // Map actionType to transaction type
    const transactionType = actionType.startsWith("earn_") || actionType.startsWith("spend_") 
      ? actionType 
      : `earn_${actionType}`;
    
    // Record transaction
    await db.insert(tokenTransactions).values({
      userId,
      amount: reward.totalAmount,
      type: transactionType,
      description: reward.isVerified 
        ? `${description} (Verified Creator Bonus: +${reward.verificationBonus} VBT)`
        : description,
      referenceType: actionType,
    });

    // Update user balance
    const [existingBalance] = await db
      .select()
      .from(userTokens)
      .where(eq(userTokens.userId, userId))
      .limit(1);

    let newBalance: number;

    if (existingBalance) {
      newBalance = existingBalance.balance + reward.totalAmount;
      await db
        .update(userTokens)
        .set({
          balance: newBalance,
          totalEarned: existingBalance.totalEarned + reward.totalAmount,
        })
        .where(eq(userTokens.userId, userId));
    } else {
      newBalance = reward.totalAmount;
      await db.insert(userTokens).values({
        userId,
        balance: newBalance,
        totalEarned: reward.totalAmount,
        totalSpent: 0,
      });
    }

    return {
      success: true,
      reward,
      newBalance,
    };
  } catch (error: any) {
    console.error(`[TokenRewards] Error awarding tokens:`, error);
    return {
      success: false,
      reward: null,
      newBalance: 0,
      error: error.message,
    };
  }
}

/**
 * Get verification status and potential bonus for a user
 */
export async function getVerificationBonus(userId: number): Promise<{
  isVerified: boolean;
  multiplier: number;
  platforms: string[];
  potentialBonus: string;
}> {
  const db = await getDb();
  if (!db) {
    return {
      isVerified: false,
      multiplier: 1.0,
      platforms: [],
      potentialBonus: "0%",
    };
  }

  const [profile] = await db
    .select()
    .from(aiAssistantProfiles)
    .where(eq(aiAssistantProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return {
      isVerified: false,
      multiplier: 1.0,
      platforms: [],
      potentialBonus: "0%",
    };
  }

  const verifiedPlatforms: string[] = [];
  if (profile.youtubeVerified) verifiedPlatforms.push("YouTube");
  if (profile.tiktokVerified) verifiedPlatforms.push("TikTok");
  if (profile.instagramVerified) verifiedPlatforms.push("Instagram");
  if (profile.twitterVerified) verifiedPlatforms.push("Twitter");

  const isVerified = verifiedPlatforms.length > 0;

  // Get default multiplier from first earning rule
  const [rule] = await db
    .select()
    .from(tokenEarningRules)
    .where(eq(tokenEarningRules.isActive, true))
    .limit(1);

  const multiplier = rule ? parseFloat(rule.verifiedCreatorMultiplier.toString()) : 1.5;
  const bonusPercentage = isVerified ? Math.round((multiplier - 1.0) * 100) : 0;

  return {
    isVerified,
    multiplier: isVerified ? multiplier : 1.0,
    platforms: verifiedPlatforms,
    potentialBonus: `${bonusPercentage}%`,
  };
}
