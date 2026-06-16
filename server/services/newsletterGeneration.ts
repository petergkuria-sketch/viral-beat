/**
 * Newsletter Generation Service
 * AI-powered weekly newsletter content generation
 */

import { getDb } from "../db";
import {
  newsletterEditions,
  newsletterContent,
  newsletterSubscriptions,
  contentSubmissions,
  xTrendsCache,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

interface WeeklyStats {
  topTrends: Array<{
    topic: string;
    platform: string;
    mentions: number;
    engagementScore: number;
  }>;
  topCreators: Array<{
    name: string;
    handle: string;
    platform: string;
    followers: number;
    topPost: string;
    engagement: number;
  }>;
  viralContent: Array<{
    title: string;
    creator: string;
    platform: string;
    views: number;
    shares: number;
  }>;
}

/**
 * Get the date range for the past week
 */
function getLastWeekRange(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return { start, end };
}

/**
 * Get the date range for the upcoming week
 */
function getUpcomingWeekRange(): { start: Date; end: Date } {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);
  return { start, end };
}

/**
 * Fetch weekly statistics from the database
 */
async function fetchWeeklyStats(): Promise<WeeklyStats> {
  const db = await getDb();
  if (!db) {
    return {
      topTrends: [],
      topCreators: [],
      viralContent: [],
    };
  }

  const { start, end } = getLastWeekRange();

  // Get top trending topics from X Trends cache
  const topTrendsData = await db
    .select()
    .from(xTrendsCache)
    .where(and(gte(xTrendsCache.fetchedAt, start), lte(xTrendsCache.fetchedAt, end)))
    .orderBy(desc(xTrendsCache.fetchedAt))
    .limit(5);

  // Parse trends data
  const topTrends = topTrendsData.flatMap((cache) => {
    const trends = cache.trendsData || [];
    return trends.slice(0, 5).map((trend: any) => ({
      topic: trend.name || trend.query || "Unknown",
      platform: "twitter",
      mentions: trend.tweet_volume || 0,
      engagementScore: trend.tweet_volume || 0,
    }));
  }).slice(0, 10);

  // Get top content submissions (using contentSubmissions for engagement tracking)
  const topContentData = await db
    .select({
      userId: contentSubmissions.userId,
      totalEngagement: sql<number>`SUM(${contentSubmissions.engagementScore})`,
      postCount: sql<number>`COUNT(*)`,
    })
    .from(contentSubmissions)
    .where(and(gte(contentSubmissions.createdAt, start), lte(contentSubmissions.createdAt, end)))
    .groupBy(contentSubmissions.userId)
    .orderBy(desc(sql`SUM(${contentSubmissions.engagementScore})`))
    .limit(5);

  // Get creator details (simplified - using engagement data)
  const topCreators = topContentData.map((data, i) => ({
    name: `Top Creator ${i + 1}`,
    handle: `@creator${data.userId}`,
    platform: "multi-platform",
    followers: data.totalEngagement * 10, // Estimate followers from engagement
    topPost: "High-performing content",
    engagement: data.totalEngagement,
  }));

  // Get viral content submissions (using engagement score)
  const viralContentData = await db
    .select()
    .from(contentSubmissions)
    .where(and(gte(contentSubmissions.createdAt, start), lte(contentSubmissions.createdAt, end)))
    .orderBy(desc(contentSubmissions.engagementScore))
    .limit(10);

  const viralContent = viralContentData.map((submission) => ({
    title: `${submission.contentType} content`,
    creator: `Creator ${submission.userId}`,
    platform: "multi-platform",
    views: submission.engagementScore * 100, // Estimate views from engagement
    shares: submission.engagementScore, // Using engagement as proxy
  }));

  return {
    topTrends,
    topCreators,
    viralContent,
  };
}

/**
 * Generate "Past Week Highlights" section using AI
 */
async function generatePastWeekHighlights(stats: WeeklyStats, niche?: string): Promise<string> {
  const prompt = `You are a content strategist writing the "Past Week Highlights" section for a weekly newsletter about viral content trends.

**Data from the past week:**
- Top trending topics: ${stats.topTrends.map((t) => `${t.topic} (${t.mentions} mentions)`).join(", ")}
- Top creators: ${stats.topCreators.map((c) => `${c.name} (@${c.handle}) - ${c.engagement} total engagement`).join(", ")}
- Viral content: ${stats.viralContent.map((v) => `"${v.title}" by ${v.creator} (${v.views} views)`).join(", ")}

${niche ? `**Personalization:** Focus on trends relevant to the "${niche}" niche.` : ""}

Write a compelling 3-paragraph summary (200-300 words) highlighting:
1. The biggest trending topics and why they went viral
2. Notable creators who had breakthrough moments
3. Key patterns and insights from the week's viral content

Use an engaging, informative tone. Include specific numbers and examples. Format as HTML with <p> tags.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert content strategist and viral trends analyst." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0].message.content;
  return typeof content === "string" ? content : "";
}

/**
 * Generate "Top Creators Spotlight" section using AI
 */
async function generateTopCreatorsSpotlight(stats: WeeklyStats, niche?: string): Promise<string> {
  const prompt = `You are a content strategist writing the "Top Creators Spotlight" section for a weekly newsletter.

**Top creators from the past week:**
${stats.topCreators
  .map(
    (c, i) =>
      `${i + 1}. ${c.name} (@${c.handle}) on ${c.platform}
   - Followers: ${c.followers.toLocaleString()}
   - Top post: ${c.topPost}
   - Total engagement: ${c.engagement.toLocaleString()}`
  )
  .join("\n\n")}

${niche ? `**Personalization:** Highlight creators in the "${niche}" niche and explain what made their content successful.` : ""}

Write a 2-3 paragraph feature (150-250 words) that:
1. Spotlights 2-3 standout creators
2. Explains what made their content successful
3. Provides actionable takeaways for other creators

Use an inspiring, educational tone. Format as HTML with <p> tags and <strong> for emphasis.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert content strategist and creator coach." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0].message.content;
  return typeof content === "string" ? content : "";
}

/**
 * Generate "Week Ahead Projections" section using AI
 */
async function generateWeekAheadProjections(stats: WeeklyStats, niche?: string, platform?: string): Promise<string> {
  const prompt = `You are a trend forecasting expert writing the "Week Ahead Projections" section for a weekly newsletter.

**Context from the past week:**
- Trending topics: ${stats.topTrends.map((t) => t.topic).join(", ")}
- Viral content themes: ${stats.viralContent.map((v) => v.title).join(", ")}

${niche ? `**Personalization:** Focus predictions on the "${niche}" niche.` : ""}
${platform ? `**Platform:** Tailor recommendations for ${platform}.` : ""}

Write a 3-paragraph forecast (200-300 words) that:
1. Predicts 3-5 topics likely to trend in the coming week
2. Suggests optimal content formats and posting times
3. Provides specific actionable recommendations for creators

Use a confident, forward-looking tone. Include specific dates/times if relevant. Format as HTML with <p> tags and <ul><li> for lists.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert trend forecaster and content strategist." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0].message.content;
  return typeof content === "string" ? content : "";
}

/**
 * Generate personalized tips based on user's niche and platform
 */
async function generatePersonalizedTips(niche?: string, platform?: string): Promise<string> {
  const prompt = `You are a content strategy coach writing personalized tips for a creator.

**Creator profile:**
- Niche: ${niche || "General content creation"}
- Primary platform: ${platform || "Multi-platform"}

Write 3-5 actionable tips (150-200 words) specifically tailored to this creator's niche and platform. Each tip should:
- Be specific and immediately actionable
- Include examples or best practices
- Reference current trends or platform features

Format as HTML with <ul><li> tags. Keep each tip concise (1-2 sentences).`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert content strategy coach." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0].message.content;
  return typeof content === "string" ? content : "";
}

/**
 * Generate a complete newsletter edition
 */
export async function generateNewsletterEdition(editionNumber: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const { start, end } = getLastWeekRange();

  // Create edition record
  const [edition] = await db
    .insert(newsletterEditions)
    .values({
      editionNumber,
      weekStartDate: start,
      weekEndDate: end,
      generationStatus: "generating",
    })
    .$returningId();

  try {
    // Fetch weekly stats
    const stats = await fetchWeeklyStats();

    // Generate base content (non-personalized)
    const pastWeekHighlights = await generatePastWeekHighlights(stats);
    const topCreatorsSpotlight = await generateTopCreatorsSpotlight(stats);
    const weekAheadProjections = await generateWeekAheadProjections(stats);

    // Save content to database
    await db.insert(newsletterContent).values([
      {
        editionId: edition.id,
        contentType: "past_week_highlights",
        title: "Past Week Highlights",
        content: pastWeekHighlights,
        data: JSON.stringify(stats),
        displayOrder: 1,
      },
      {
        editionId: edition.id,
        contentType: "top_creators_spotlight",
        title: "Top Creators Spotlight",
        content: topCreatorsSpotlight,
        data: JSON.stringify({ topCreators: stats.topCreators }),
        displayOrder: 2,
      },
      {
        editionId: edition.id,
        contentType: "week_ahead_projections",
        title: "Week Ahead Projections",
        content: weekAheadProjections,
        data: JSON.stringify({ topTrends: stats.topTrends }),
        displayOrder: 3,
      },
    ]);

    // Mark edition as completed
    await db
      .update(newsletterEditions)
      .set({
        generationStatus: "completed",
        generatedAt: new Date(),
      })
      .where(eq(newsletterEditions.id, edition.id));

    return edition.id;
  } catch (error: any) {
    // Mark edition as failed
    await db
      .update(newsletterEditions)
      .set({
        generationStatus: "failed",
        errorMessage: error.message,
      })
      .where(eq(newsletterEditions.id, edition.id));

    throw error;
  }
}

/**
 * Generate personalized content for a specific user
 */
export async function generatePersonalizedNewsletter(
  editionId: number,
  userId: number
): Promise<{
  baseContent: any[];
  personalizedTips: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Get user's subscription preferences
  const [subscription] = await db
    .select()
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.userId, userId))
    .limit(1);

  const nichePreferences = subscription?.nichePreferences ? JSON.parse(subscription.nichePreferences) : [];
  const platformPreferences = subscription?.platformPreferences ? JSON.parse(subscription.platformPreferences) : [];

  const niche = nichePreferences[0] || undefined;
  const platform = platformPreferences[0] || undefined;

  // Get base content
  const baseContent = await db
    .select()
    .from(newsletterContent)
    .where(eq(newsletterContent.editionId, editionId))
    .orderBy(newsletterContent.displayOrder);

  // Generate personalized tips
  const personalizedTips = await generatePersonalizedTips(niche, platform);

  return {
    baseContent,
    personalizedTips,
  };
}
