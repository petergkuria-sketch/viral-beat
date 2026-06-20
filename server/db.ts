import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  favorites, 
  InsertFavorite, 
  creators, 
  InsertCreator,
  creatorStats,
  InsertCreatorStats,
  sentimentCache,
  InsertSentimentCache,
  xTrendsCache,
  InsertXTrendsCache,
  beatVotes,
  InsertBeatVote
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ FAVORITES ============

export async function addFavorite(favorite: InsertFavorite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(favorites).values(favorite);
  return result;
}

export async function removeFavorite(userId: number, topic: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.topic, topic))
  );
}

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function isFavorite(userId: number, topic: string) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.topic, topic)))
    .limit(1);

  return result.length > 0;
}

// ============ CREATORS ============

export async function upsertCreator(creator: InsertCreator) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if creator exists
  const existing = await db.select().from(creators)
    .where(and(
      eq(creators.platform, creator.platform),
      eq(creators.handle, creator.handle || "")
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db.update(creators)
      .set({
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        subscriberCount: creator.subscriberCount,
        totalViews: creator.totalViews,
        videoCount: creator.videoCount,
        description: creator.description,
        country: creator.country,
        badges: creator.badges,
        links: creator.links,
      })
      .where(eq(creators.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new
    const result = await db.insert(creators).values(creator);
    return result[0].insertId;
  }
}

export async function getCreatorByHandle(platform: "youtube" | "tiktok" | "twitter" | "instagram", handle: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(creators)
    .where(and(eq(creators.platform, platform), eq(creators.handle, handle)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getCreatorById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(creators)
    .where(eq(creators.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function addCreatorStats(stats: InsertCreatorStats) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(creatorStats).values(stats);
}

export async function getCreatorStatsHistory(creatorId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(creatorStats)
    .where(eq(creatorStats.creatorId, creatorId))
    .orderBy(desc(creatorStats.recordedAt))
    .limit(limit);
}

// ============ SENTIMENT CACHE ============

export async function cacheSentiment(sentiment: InsertSentimentCache) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if we have a recent cache (within 1 hour)
  const allForTopic = await db.select().from(sentimentCache)
    .where(eq(sentimentCache.topic, sentiment.topic));
  
  const existing = allForTopic.filter(r => r.platform === sentiment.platform).slice(0, 1);

  if (existing.length > 0) {
    // Update existing
    await db.update(sentimentCache)
      .set({
        positive: sentiment.positive,
        negative: sentiment.negative,
        neutral: sentiment.neutral,
        emotions: sentiment.emotions,
        summary: sentiment.summary,
        analyzedAt: new Date(),
      })
      .where(eq(sentimentCache.id, existing[0].id));
  } else {
    // Insert new
    await db.insert(sentimentCache).values(sentiment);
  }
}

export async function getCachedSentiment(topic: string, platform: "all" | "youtube" | "tiktok" | "twitter" | "instagram" = "all") {
  const db = await getDb();
  if (!db) return null;

  // Filter by topic first, then check platform in JS to avoid type issues
  const results = await db.select().from(sentimentCache)
    .where(eq(sentimentCache.topic, topic));
  
  const result = results.filter(r => r.platform === platform).slice(0, 1);

  if (result.length === 0) return null;

  // Check if cache is still valid (within 1 hour)
  const cacheAge = Date.now() - result[0].analyzedAt.getTime();
  const ONE_HOUR = 60 * 60 * 1000;

  if (cacheAge > ONE_HOUR) return null;

  return result[0];
}


// X Trends caching functions
export async function getCachedXTrends(category: "general" | "tech" | "entertainment" | "sports" | "politics" | "business") {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select().from(xTrendsCache)
    .where(eq(xTrendsCache.category, category))
    .orderBy(desc(xTrendsCache.fetchedAt))
    .limit(1);

  if (results.length === 0) return null;

  // Check if cache is still valid (within 15 minutes)
  const cacheAge = Date.now() - results[0].fetchedAt.getTime();
  const FIFTEEN_MINUTES = 15 * 60 * 1000;

  if (cacheAge > FIFTEEN_MINUTES) return null;

  return results[0];
}

export async function cacheXTrends(category: "general" | "tech" | "entertainment" | "sports" | "politics" | "business", trendsData: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete old cache for this category
  await db.delete(xTrendsCache).where(eq(xTrendsCache.category, category));

  // Insert new cache
  await db.insert(xTrendsCache).values({
    category,
    trendsData,
  });
}

// ============ BEAT VOTES ============

export async function castVote(userId: number, topic: string, voteType: "up" | "down") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already voted on this topic
  const existing = await db.select().from(beatVotes)
    .where(and(eq(beatVotes.userId, userId), eq(beatVotes.topic, topic)))
    .limit(1);

  if (existing.length > 0) {
    // If same vote type, remove the vote (toggle off)
    if (existing[0].voteType === voteType) {
      await db.delete(beatVotes).where(eq(beatVotes.id, existing[0].id));
      return { action: "removed", voteType: null };
    }
    // Otherwise, update to new vote type
    await db.update(beatVotes)
      .set({ voteType })
      .where(eq(beatVotes.id, existing[0].id));
    return { action: "changed", voteType };
  }

  // Insert new vote
  await db.insert(beatVotes).values({ userId, topic, voteType });
  return { action: "added", voteType };
}

export async function getUserVote(userId: number, topic: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(beatVotes)
    .where(and(eq(beatVotes.userId, userId), eq(beatVotes.topic, topic)))
    .limit(1);

  return result.length > 0 ? result[0].voteType : null;
}

export async function getVoteCounts(topic: string) {
  const db = await getDb();
  if (!db) return { upvotes: 0, downvotes: 0, score: 0 };

  const votes = await db.select().from(beatVotes)
    .where(eq(beatVotes.topic, topic));

  const upvotes = votes.filter(v => v.voteType === "up").length;
  const downvotes = votes.filter(v => v.voteType === "down").length;

  return {
    upvotes,
    downvotes,
    score: upvotes - downvotes,
  };
}

export async function getTopVotedTopics(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const allVotes = await db.select().from(beatVotes);

  // Group by topic and calculate scores
  const topicScores: Record<string, { upvotes: number; downvotes: number }> = {};
  
  for (const vote of allVotes) {
    if (!topicScores[vote.topic]) {
      topicScores[vote.topic] = { upvotes: 0, downvotes: 0 };
    }
    if (vote.voteType === "up") {
      topicScores[vote.topic].upvotes++;
    } else {
      topicScores[vote.topic].downvotes++;
    }
  }

  // Convert to array and sort by score
  const sorted = Object.entries(topicScores)
    .map(([topic, counts]) => ({
      topic,
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      score: counts.upvotes - counts.downvotes,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return sorted;
}
