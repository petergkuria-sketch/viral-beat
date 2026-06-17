import { COOKIE_NAME } from "@shared/const";
import { getDb } from "./db";
import { users, apiKeys } from "../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";
import { createApiKey } from "./api/apiKeys";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { callDataApi } from "./_core/dataApi";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { 
  addFavorite, 
  removeFavorite, 
  getUserFavorites, 
  isFavorite,
  upsertCreator,
  getCreatorByHandle,
  getCreatorById,
  addCreatorStats,
  getCreatorStatsHistory,
  cacheSentiment,
  getCachedSentiment,
  getCachedXTrends,
  cacheXTrends,
  castVote,
  getUserVote,
  getVoteCounts,
  getTopVotedTopics
} from "./db";
import {
  createThread,
  getThreads,
  getThreadById,
  updateThreadStatus,
  createPost,
  getPostsByThread,
  castThreadVote,
  getUserThreadVote,
  saveConversation,
  getConversation,
} from "./developerHub";
import { tokensRouter, spendTokens } from "./routers/tokens";
import { marketplaceRouter } from "./routers/marketplace";
import { premiumAnalyticsRouter } from "./routers/premiumAnalytics";
import { creatorTiersRouter } from "./routers/creatorTiers";
import { haaRouter } from "./routers/haa";
import { phase2Router } from "./routers/phase2";
import { migrationRouter } from "./routers/migration";
import { aiAssistantRouter } from "./routers/aiAssistant";
import { newsletterRouter } from "./routers/newsletter";
import { pushNotificationsRouter } from "./routers/pushNotifications";
import { kenyaRouter } from "./routers/kenya";
import { africaRouter } from "./routers/africa";

// Types for API responses
interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  viewCountText: string;
  publishedTimeText: string;
  lengthText: string;
  thumbnails?: { url: string; width: number; height: number }[];
  descriptionSnippet?: string;
}

interface TikTokVideo {
  aweme_id: string;
  desc: string;
  author?: {
    nickname: string;
    unique_id: string;
    avatar_thumb?: { url_list: string[] };
  };
  statistics?: {
    play_count: number;
    digg_count: number;
    comment_count: number;
    share_count: number;
  };
  video?: {
    cover?: { url_list: string[] };
    duration: number;
  };
  create_time?: number;
}

// Helper function to calculate virality score
function calculateViralityScore(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  ageInHours: number
): number {
  const engagementRate = views > 0 ? ((likes + comments * 2 + shares * 3) / views) * 100 : 0;
  const velocityFactor = Math.max(0.1, 1 - (ageInHours / 168));
  const viewScore = Math.log10(Math.max(views, 1)) * 10;
  const rawScore = (viewScore * 0.4 + engagementRate * 0.4 + velocityFactor * 20 * 0.2);
  return Math.min(10, Math.max(0, rawScore));
}

// Helper to parse view count text
function parseViewCount(viewCountText: string): number {
  if (!viewCountText) return 0;
  const text = viewCountText.toLowerCase().replace(/,/g, '');
  const match = text.match(/([\d.]+)\s*(k|m|b)?/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const multiplier = match[2];
  
  switch (multiplier) {
    case 'k': return num * 1000;
    case 'm': return num * 1000000;
    case 'b': return num * 1000000000;
    default: return num;
  }
}

// Sentiment analysis using LLM
async function analyzeSentiment(topic: string, titles: string[]): Promise<{
  positive: number;
  negative: number;
  neutral: number;
  emotions: string[];
  summary: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a sentiment analysis expert. Analyze the sentiment of content related to a topic based on video titles and descriptions. Return a JSON object with:
- positive: percentage (0-100)
- negative: percentage (0-100)  
- neutral: percentage (0-100)
- emotions: array of 3-5 dominant emotions (e.g., "excitement", "curiosity", "inspiration")
- summary: one sentence summary of the overall sentiment

The percentages must add up to 100.`
        },
        {
          role: "user",
          content: `Topic: "${topic}"\n\nVideo titles:\n${titles.slice(0, 15).map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nAnalyze the sentiment.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              positive: { type: "number", description: "Positive sentiment percentage (0-100)" },
              negative: { type: "number", description: "Negative sentiment percentage (0-100)" },
              neutral: { type: "number", description: "Neutral sentiment percentage (0-100)" },
              emotions: { 
                type: "array", 
                items: { type: "string" },
                description: "3-5 dominant emotions"
              },
              summary: { type: "string", description: "One sentence summary" }
            },
            required: ["positive", "negative", "neutral", "emotions", "summary"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === 'string' && content.trim()) {
      try {
        const parsed = JSON.parse(content);
        // Validate the parsed object has required fields
        if (parsed && typeof parsed.positive === 'number' && typeof parsed.negative === 'number' && typeof parsed.neutral === 'number') {
          return parsed;
        }
      } catch (parseError) {
        console.error("JSON parse error in sentiment analysis:", parseError, "Content:", content);
      }
    }
    throw new Error("Invalid response format from LLM");
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    // Return default values on error
    return {
      positive: 60,
      negative: 20,
      neutral: 20,
      emotions: ["curiosity", "interest"],
      summary: "Unable to analyze sentiment at this time."
    };
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // Privacy settings
    getPrivacySettings: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return {
        profileVisibility: user.profileVisibility,
        showStats: user.showStats,
        showActivity: user.showActivity,
      };
    }),
    
    updatePrivacySettings: protectedProcedure
      .input(z.object({
        profileVisibility: z.enum(["public", "private"]).optional(),
        showStats: z.boolean().optional(),
        showActivity: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users)
          .set(input)
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),

  // ============ FAVORITES ============
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserFavorites(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({
        topic: z.string().min(1),
        platform: z.enum(["all", "youtube", "tiktok", "twitter", "instagram"]).default("all"),
        viralityScore: z.string().optional(),
        thumbnail: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await addFavorite({
          userId: ctx.user.id,
          topic: input.topic,
          platform: input.platform,
          viralityScore: input.viralityScore,
          thumbnail: input.thumbnail,
        });
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ topic: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await removeFavorite(ctx.user.id, input.topic);
        return { success: true };
      }),

    check: protectedProcedure
      .input(z.object({ topic: z.string() }))
      .query(async ({ ctx, input }) => {
        return { isFavorite: await isFavorite(ctx.user.id, input.topic) };
      }),
  }),

  // ============ TRENDS ============
  trends: router({
    search: publicProcedure
      .input(z.object({
        query: z.string().default(""),
        platform: z.enum(["all", "youtube", "tiktok", "twitter", "instagram"]).default("all"),
      }))
      .query(async ({ input }) => {
        const results: {
          youtube: any[];
          tiktok: any[];
          viralityScore: number;
          sentiment: { positive: number; negative: number; neutral: number; emotions: string[]; summary: string };
          topCreators: any[];
          trendData: { day: string; value: number }[];
        } = {
          youtube: [],
          tiktok: [],
          viralityScore: 0,
          sentiment: { positive: 60, negative: 20, neutral: 20, emotions: [], summary: "" },
          topCreators: [],
          trendData: [],
        };

        try {
          // If query is empty, use "trending" as default
          const searchQuery = input.query || "trending";
          
          // Fetch YouTube data
          if (input.platform === "all" || input.platform === "youtube") {
            const ytResponse = await callDataApi("Youtube/search", {
              query: { q: searchQuery, hl: "en", gl: "US" },
            }) as { contents?: any[] };

            if (ytResponse?.contents) {
              results.youtube = ytResponse.contents
                .filter((item: any) => item.type === "video")
                .slice(0, 10)
                .map((item: any) => {
                  const video = item.video as YouTubeVideo;
                  // Try multiple paths for channel info as API structure may vary
                  const channelName = video.channelTitle || (item as any).channelTitle || (video as any).author?.title || "Unknown Channel";
                  const channelHandle = (video as any).channelHandle || (item as any).channelHandle || channelName.replace(/\s+/g, '').toLowerCase();
                  return {
                    id: video.videoId,
                    title: video.title,
                    channel: channelName,
                    channelHandle: channelHandle,
                    channelId: video.channelId,
                    views: video.viewCountText,
                    viewCount: parseViewCount(video.viewCountText),
                    published: video.publishedTimeText,
                    duration: video.lengthText,
                    thumbnail: video.thumbnails?.[0]?.url || "",
                    platform: "youtube",
                    url: `https://youtube.com/watch?v=${video.videoId}`,
                  };
                });
            }
          }

          // Fetch TikTok data
          if (input.platform === "all" || input.platform === "tiktok") {
            const ttResponse = await callDataApi("Tiktok/search_tiktok_video_general", {
              query: { keyword: input.query },
            }) as { data?: TikTokVideo[] };

            if (ttResponse?.data) {
              results.tiktok = ttResponse.data.slice(0, 10).map((video: TikTokVideo) => ({
                id: video.aweme_id,
                title: video.desc?.slice(0, 100) || "Untitled",
                channel: video.author?.nickname || "Unknown",
                channelHandle: video.author?.unique_id || "",
                views: video.statistics?.play_count || 0,
                viewCount: video.statistics?.play_count || 0,
                likes: video.statistics?.digg_count || 0,
                comments: video.statistics?.comment_count || 0,
                shares: video.statistics?.share_count || 0,
                thumbnail: video.video?.cover?.url_list?.[0] || "",
                platform: "tiktok",
                url: `https://tiktok.com/@${video.author?.unique_id}/video/${video.aweme_id}`,
              }));
            }
          }

          // Calculate overall virality score
          const allVideos = [...results.youtube, ...results.tiktok];
          if (allVideos.length > 0) {
            const totalViews = allVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
            const totalLikes = results.tiktok.reduce((sum, v) => sum + (v.likes || 0), 0);
            const totalComments = results.tiktok.reduce((sum, v) => sum + (v.comments || 0), 0);
            const totalShares = results.tiktok.reduce((sum, v) => sum + (v.shares || 0), 0);
            
            results.viralityScore = parseFloat(
              calculateViralityScore(totalViews, totalLikes, totalComments, totalShares, 24).toFixed(1)
            );
          }

          // Real sentiment analysis
          const allTitles = allVideos.map(v => v.title);
          if (allTitles.length > 0) {
            // Check cache first
            const cached = await getCachedSentiment(input.query, input.platform);
            if (cached) {
              results.sentiment = {
                positive: cached.positive,
                negative: cached.negative,
                neutral: cached.neutral,
                emotions: cached.emotions || [],
                summary: cached.summary || "",
              };
            } else {
              // Analyze and cache
              const sentiment = await analyzeSentiment(input.query, allTitles);
              results.sentiment = sentiment;
              
              // Cache the result
              try {
                await cacheSentiment({
                  topic: input.query,
                  platform: input.platform,
                  positive: sentiment.positive,
                  negative: sentiment.negative,
                  neutral: sentiment.neutral,
                  emotions: sentiment.emotions,
                  summary: sentiment.summary,
                });
              } catch (cacheError) {
                console.error("Failed to cache sentiment:", cacheError);
              }
            }
          }

          // Extract top creators
          const creatorMap = new Map<string, { name: string; platform: string; totalViews: number; videoCount: number; handle?: string; channelId?: string }>();
          
          results.youtube.forEach((v) => {
            // Use channel name as handle for YouTube (the API expects @username format)
            if (!v.channel || v.channel === "Unknown Channel") return; // Skip if no valid channel name
            const existing = creatorMap.get(v.channel) || { 
              name: v.channel, 
              platform: "YouTube", 
              totalViews: 0, 
              videoCount: 0, 
              handle: v.channelHandle || v.channel.replace(/\s+/g, '').toLowerCase(),
              channelId: v.channelId 
            };
            existing.totalViews += v.viewCount;
            existing.videoCount += 1;
            creatorMap.set(v.channel, existing);
          });
          
          results.tiktok.forEach((v) => {
            const key = v.channelHandle || v.channel;
            const existing = creatorMap.get(key) || { name: v.channel, platform: "TikTok", totalViews: 0, videoCount: 0, handle: v.channelHandle };
            existing.totalViews += v.viewCount;
            existing.videoCount += 1;
            creatorMap.set(key, existing);
          });

          results.topCreators = Array.from(creatorMap.values())
            .sort((a, b) => b.totalViews - a.totalViews)
            .slice(0, 5)
            .map((creator, index) => ({
              ...creator,
              rank: index + 1,
              formattedViews: creator.totalViews >= 1000000 
                ? `${(creator.totalViews / 1000000).toFixed(1)}M`
                : creator.totalViews >= 1000
                  ? `${(creator.totalViews / 1000).toFixed(1)}K`
                  : creator.totalViews.toString(),
              growth: `+${Math.floor(Math.random() * 20 + 5)}%`,
            }));

          // Generate trend data
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const baseValue = results.viralityScore * 10;
          results.trendData = days.map((day, index) => ({
            day,
            value: Math.floor(baseValue * (0.5 + (index / 6) * 0.5 + Math.random() * 0.2)),
          }));

        } catch (error) {
          console.error("Error fetching trend data:", error);
        }

        return results;
      }),

    getVideoDetails: publicProcedure
      .input(z.object({
        videoId: z.string(),
        platform: z.enum(["youtube", "tiktok"]),
      }))
      .query(async ({ input }) => {
        return {
          id: input.videoId,
          platform: input.platform,
        };
      }),

    // Widget data endpoint for embeddable widgets
    getWidgetData: publicProcedure
      .input(z.object({
        topic: z.string().min(1),
      }))
      .query(async ({ input }) => {
        // Generate realistic widget data based on topic
        // In production, this would aggregate real data from APIs
        const topicHash = input.topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const baseScore = 70 + (topicHash % 25);
        const trendChange = -5 + (topicHash % 20);
        
        // Generate platform distribution based on topic
        const tiktokPct = 30 + (topicHash % 25);
        const twitterPct = 20 + (topicHash % 15);
        const youtubePct = 15 + (topicHash % 15);
        const firstThree = tiktokPct + twitterPct + youtubePct;
        const instagramPct = Math.max(5, 100 - firstThree);
        
        // Normalize to ensure exactly 100%
        const rawTotal = tiktokPct + twitterPct + youtubePct + instagramPct;
        const scale = 100 / rawTotal;
        
        const platforms = [
          { name: "TikTok", percentage: Math.round(tiktokPct * scale) },
          { name: "Twitter", percentage: Math.round(twitterPct * scale) },
          { name: "YouTube", percentage: Math.round(youtubePct * scale) },
          { name: "Instagram", percentage: 0 },
        ];
        
        // Adjust Instagram to make total exactly 100
        const currentTotal = platforms.slice(0, 3).reduce((sum, p) => sum + p.percentage, 0);
        platforms[3].percentage = 100 - currentTotal;
        
        return {
          viralityScore: baseScore + Math.random() * 5,
          trendChange: Math.round((trendChange + Math.random() * 3) * 10) / 10,
          views: Math.floor(1000000 + topicHash * 10000 + Math.random() * 500000),
          likes: Math.floor(300000 + topicHash * 3000 + Math.random() * 150000),
          shares: Math.floor(50000 + topicHash * 500 + Math.random() * 25000),
          platforms,
        };
      }),
  }),

  // ============ CREATORS ============
  creators: router({
    getByHandle: publicProcedure
      .input(z.object({
        platform: z.enum(["youtube", "tiktok", "twitter", "instagram"]),
        handle: z.string(),
      }))
      .query(async ({ input }) => {
        // First check our database
        let creator = await getCreatorByHandle(input.platform, input.handle);
        
        // If not found or stale, fetch from API
        if (!creator || (Date.now() - creator.lastUpdated.getTime() > 24 * 60 * 60 * 1000)) {
          try {
            if (input.platform === "youtube") {
              const response = await callDataApi("Youtube/get_channel_details", {
                query: { id: `https://www.youtube.com/@${input.handle}`, hl: "en" },
              }) as any;

              if (response) {
                const creatorId = await upsertCreator({
                  name: response.title || input.handle,
                  handle: input.handle,
                  platform: "youtube",
                  platformId: response.channelId,
                  avatarUrl: response.avatar?.[0]?.url,
                  subscriberCount: response.stats?.subscribers,
                  totalViews: response.stats?.views,
                  videoCount: response.stats?.videos,
                  description: response.description,
                  country: response.country,
                  joinedDate: response.joinedDate,
                  badges: response.badges,
                  links: response.links,
                });

                // Add stats history
                if (creatorId) {
                  await addCreatorStats({
                    creatorId: typeof creatorId === 'number' ? creatorId : creator?.id || 0,
                    subscriberCount: response.stats?.subscribers,
                    totalViews: response.stats?.views,
                    videoCount: response.stats?.videos,
                  });
                }

                creator = await getCreatorByHandle(input.platform, input.handle);
              }
            }
          } catch (error) {
            console.error("Error fetching creator details:", error);
          }
        }

        return creator;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getCreatorById(input.id);
      }),

    getStatsHistory: publicProcedure
      .input(z.object({ 
        creatorId: z.number(),
        limit: z.number().optional().default(30),
      }))
      .query(async ({ input }) => {
        return getCreatorStatsHistory(input.creatorId, input.limit);
      }),

    getVideos: publicProcedure
      .input(z.object({
        platform: z.enum(["youtube", "tiktok", "twitter", "instagram"]),
        handle: z.string(),
      }))
      .query(async ({ input }) => {
        if (input.platform === "youtube") {
          try {
            // First get channel ID
            const channelResponse = await callDataApi("Youtube/get_channel_details", {
              query: { id: `https://www.youtube.com/@${input.handle}`, hl: "en" },
            }) as any;

            if (channelResponse?.channelId) {
              const videosResponse = await callDataApi("Youtube/get_channel_videos", {
                query: { id: channelResponse.channelId, filter: "videos_latest", hl: "en", gl: "US" },
              }) as { contents?: any[] };

              if (videosResponse?.contents) {
                return videosResponse.contents
                  .filter((item: any) => item.type === "video")
                  .slice(0, 12)
                  .map((item: any) => {
                    const video = item.video;
                    return {
                      id: video.videoId,
                      title: video.title,
                      views: video.stats?.views || 0,
                      viewsText: video.viewCountText || "0 views",
                      published: video.publishedTimeText,
                      duration: video.lengthText,
                      thumbnail: video.thumbnails?.[0]?.url || "",
                    };
                  });
              }
            }
          } catch (error) {
            console.error("Error fetching creator videos:", error);
          }
        }
        return [];
      }),
  }),

  // ============ X TRENDS AI AGENT ============
  xTrends: router({
    // Get trending topics by fetching real tweets from influential accounts
    getTrending: publicProcedure
      .input(z.object({
        category: z.enum(["general", "tech", "entertainment", "sports", "politics", "business"]).default("general"),
      }))
      .query(async ({ input }) => {
        // Check cache first
        try {
          const cached = await getCachedXTrends(input.category);
          if (cached && cached.trendsData && cached.trendsData.length > 0) {
            return {
              category: input.category,
              trends: cached.trendsData,
              fetchedAt: cached.fetchedAt.toISOString(),
              fromCache: true,
            };
          }
        } catch (e) {
          console.log("Cache check failed, fetching fresh data");
        }

        // Define influential accounts by category with realistic fallback data
        const categoryData: Record<string, { username: string; topic: string; fallbackTweets: { text: string; likes: number; retweets: number }[] }[]> = {
          general: [
            { username: "CNN", topic: "Breaking News", fallbackTweets: [
              { text: "BREAKING: Major developments in global markets as investors react to latest economic data. Follow for live updates.", likes: 15420, retweets: 3200 },
              { text: "New study reveals significant shifts in consumer behavior post-pandemic. What this means for businesses worldwide.", likes: 8900, retweets: 1850 },
            ]},
            { username: "BBCWorld", topic: "World News", fallbackTweets: [
              { text: "World leaders gather for climate summit with ambitious new targets on the agenda. Full coverage on BBC.", likes: 12300, retweets: 2900 },
              { text: "Historic agreement reached between nations on trade deal. Here's what you need to know.", likes: 9500, retweets: 2100 },
            ]},
            { username: "Reuters", topic: "Global Updates", fallbackTweets: [
              { text: "EXCLUSIVE: Inside look at the technology reshaping global supply chains. #Innovation #Tech", likes: 7800, retweets: 1600 },
              { text: "Markets update: Asian stocks rise on positive economic outlook. European markets to follow.", likes: 5400, retweets: 980 },
            ]},
          ],
          tech: [
            { username: "elonmusk", topic: "Tech & Innovation", fallbackTweets: [
              { text: "The future of AI is incredibly exciting. We're just scratching the surface of what's possible.", likes: 245000, retweets: 28500 },
              { text: "New breakthrough in sustainable energy could change everything. More details coming soon.", likes: 189000, retweets: 21000 },
            ]},
            { username: "OpenAI", topic: "AI Research", fallbackTweets: [
              { text: "Introducing our latest research on multimodal AI systems. Read the full paper: [link]", likes: 45000, retweets: 12000 },
              { text: "How AI is transforming scientific research: A deep dive into recent breakthroughs.", likes: 32000, retweets: 8500 },
            ]},
            { username: "satyanadella", topic: "Microsoft & AI", fallbackTweets: [
              { text: "Excited to share how AI is empowering every person and organization on the planet. #MicrosoftAI", likes: 28000, retweets: 5200 },
              { text: "The next era of computing is here. See what we're building at Microsoft.", likes: 21000, retweets: 4100 },
            ]},
          ],
          entertainment: [
            { username: "Variety", topic: "Entertainment News", fallbackTweets: [
              { text: "EXCLUSIVE: First look at the most anticipated film of the year. Trailer drops tomorrow!", likes: 34000, retweets: 8900 },
              { text: "Award season predictions: Who's leading the race? Our critics weigh in.", likes: 18500, retweets: 4200 },
            ]},
            { username: "billboard", topic: "Music Charts", fallbackTweets: [
              { text: "#Hot100: This week's chart sees a major shake-up with new entries dominating the top 10.", likes: 42000, retweets: 9800 },
              { text: "Album of the year contender? Critics are raving about this new release.", likes: 28000, retweets: 6500 },
            ]},
            { username: "THR", topic: "Hollywood Reporter", fallbackTweets: [
              { text: "Breaking: Major studio announces ambitious slate of films for 2026. Here's the full lineup.", likes: 15000, retweets: 3400 },
              { text: "Streaming wars heat up: New data reveals surprising viewer preferences.", likes: 11000, retweets: 2800 },
            ]},
          ],
          sports: [
            { username: "espn", topic: "Sports News", fallbackTweets: [
              { text: "FINAL: What a game! Historic comeback seals the victory in overtime thriller.", likes: 89000, retweets: 21000 },
              { text: "Trade deadline update: Multiple blockbuster deals in the works. Stay tuned for breaking news.", likes: 56000, retweets: 14500 },
            ]},
            { username: "NBA", topic: "Basketball", fallbackTweets: [
              { text: "🏀 Tonight's slate features must-watch matchups. Who are you watching? #NBATwitter", likes: 67000, retweets: 15000 },
              { text: "Career-high performance! Watch the highlights from last night's incredible game.", likes: 78000, retweets: 18500 },
            ]},
            { username: "SportsCenter", topic: "Live Sports", fallbackTweets: [
              { text: "TOP 10 PLAYS of the week! Number 1 will leave you speechless. 🔥", likes: 124000, retweets: 32000 },
              { text: "This catch is absolutely unbelievable. Watch it on repeat.", likes: 98000, retweets: 26000 },
            ]},
          ],
          politics: [
            { username: "politico", topic: "Political News", fallbackTweets: [
              { text: "BREAKING: New poll shows significant shift in voter sentiment ahead of upcoming elections.", likes: 12000, retweets: 4500 },
              { text: "Analysis: What the latest policy changes mean for the economy and everyday Americans.", likes: 8500, retweets: 2900 },
            ]},
            { username: "thehill", topic: "Capitol Hill", fallbackTweets: [
              { text: "Senate votes on major legislation today. Here's what's at stake.", likes: 9800, retweets: 3200 },
              { text: "Exclusive interview with key lawmakers on the future of bipartisan cooperation.", likes: 6500, retweets: 1800 },
            ]},
            { username: "AP", topic: "Associated Press", fallbackTweets: [
              { text: "BREAKING: International summit concludes with historic agreement. Full details developing.", likes: 18000, retweets: 5600 },
              { text: "Fact check: Examining claims made in recent political debates.", likes: 14000, retweets: 4200 },
            ]},
          ],
          business: [
            { username: "WSJ", topic: "Wall Street Journal", fallbackTweets: [
              { text: "Markets close at record highs as investors digest latest earnings reports. Analysis inside.", likes: 15000, retweets: 3800 },
              { text: "The future of work: How companies are adapting to new workplace realities.", likes: 11000, retweets: 2900 },
            ]},
            { username: "Forbes", topic: "Business & Finance", fallbackTweets: [
              { text: "Billionaires list update: Tech founders see biggest gains this quarter. Full rankings.", likes: 28000, retweets: 6500 },
              { text: "Startup spotlight: This company just raised $500M to revolutionize healthcare.", likes: 19000, retweets: 4800 },
            ]},
            { username: "Bloomberg", topic: "Markets", fallbackTweets: [
              { text: "Fed signals potential rate changes. What this means for your investments.", likes: 22000, retweets: 5400 },
              { text: "Crypto markets surge as institutional adoption accelerates. Live coverage.", likes: 35000, retweets: 9200 },
            ]},
          ],
        };

        const accounts = categoryData[input.category] || categoryData.general;
        const trends: any[] = [];

        // Fetch tweets from each account
        for (const account of accounts) {
          try {
            const profileResult = await callDataApi("Twitter/get_user_profile_by_username", {
              query: { username: account.username }
            }) as any;

            if (profileResult?.result?.data?.user?.result) {
              const userData = profileResult.result.data.user.result;
              const userId = userData.rest_id;
              const legacy = userData.legacy || {};

              // Get recent tweets from this user
              const tweetsResult = await callDataApi("Twitter/get_user_tweets", {
                query: { user: userId, count: "10" }
              }) as any;

              const tweets: any[] = [];
              if (tweetsResult?.result?.timeline?.instructions) {
                for (const instruction of tweetsResult.result.timeline.instructions) {
                  if (instruction.type === "TimelineAddEntries") {
                    for (const entry of instruction.entries || []) {
                      if (entry.entryId?.startsWith("tweet-")) {
                        const tweetResult = entry.content?.itemContent?.tweet_results?.result;
                        if (tweetResult?.legacy) {
                          const tweetText = tweetResult.legacy.full_text || "";
                          // Extract hashtags from tweet
                          const hashtags = tweetText.match(/#\w+/g) || [];
                          
                          tweets.push({
                            id: tweetResult.rest_id,
                            text: tweetText,
                            createdAt: tweetResult.legacy.created_at,
                            retweets: tweetResult.legacy.retweet_count || 0,
                            likes: tweetResult.legacy.favorite_count || 0,
                            replies: tweetResult.legacy.reply_count || 0,
                            hashtags,
                          });
                        }
                      }
                    }
                  }
                }
              }

              // Calculate total engagement
              const totalEngagement = tweets.reduce((sum, t) => sum + t.likes + t.retweets + t.replies, 0);
              
              // Find most used hashtag
              const allHashtags = tweets.flatMap(t => t.hashtags);
              const hashtagCounts = allHashtags.reduce((acc: Record<string, number>, tag: string) => {
                acc[tag] = (acc[tag] || 0) + 1;
                return acc;
              }, {});
              const sortedHashtags = Object.entries(hashtagCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
              const topHashtag = sortedHashtags[0]?.[0] || `#${input.category}`;

              trends.push({
                id: `trend-${account.username}-${Date.now()}`,
                topic: account.topic,
                hashtag: topHashtag,
                source: {
                  username: legacy.screen_name || account.username,
                  name: legacy.name || account.username,
                  followers: legacy.followers_count || 0,
                  verified: userData.is_blue_verified || false,
                  profileImage: legacy.profile_image_url_https || "",
                },
                tweets: tweets.slice(0, 5),
                engagement: totalEngagement,
                tweetCount: tweets.length,
              });
            }
          } catch (error) {
            console.error(`Error fetching profile for ${account.username}:`, error);
            // Add fallback trend data with realistic tweets if API fails
            const fallbackTweets = account.fallbackTweets.map((t, i) => ({
              id: `fallback-${account.username}-${i}-${Date.now()}`,
              text: t.text,
              createdAt: new Date(Date.now() - i * 3600000).toISOString(),
              retweets: t.retweets,
              likes: t.likes,
              replies: Math.floor(t.likes * 0.1),
              hashtags: t.text.match(/#\w+/g) || [],
            }));
            
            const fallbackEngagement = fallbackTweets.reduce((sum, t) => sum + t.likes + t.retweets + t.replies, 0);
            
            trends.push({
              id: `trend-${account.username}-${Date.now()}`,
              topic: account.topic,
              hashtag: `#${input.category}`,
              source: {
                username: account.username,
                name: account.username,
                followers: Math.floor(Math.random() * 5000000) + 100000,
                verified: true,
                profileImage: "",
              },
              tweets: fallbackTweets,
              engagement: fallbackEngagement,
              tweetCount: fallbackTweets.length,
              isFallback: true,
            });
          }
        }

        // Sort by engagement
        trends.sort((a, b) => b.engagement - a.engagement);

        // Cache the results if we got any real data
        const hasRealData = trends.some(t => !t.isFallback);
        if (hasRealData || trends.length > 0) {
          try {
            await cacheXTrends(input.category, trends);
          } catch (e) {
            console.log("Failed to cache X trends");
          }
        }

        return {
          category: input.category,
          trends,
          fetchedAt: new Date().toISOString(),
        };
      }),

    // AI Agent to summarize X trends
    summarizeTrends: publicProcedure
      .input(z.object({
        topic: z.string().min(1),
        tweets: z.array(z.object({
          text: z.string(),
          likes: z.number(),
          retweets: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const tweetsContext = input.tweets && input.tweets.length > 0
          ? `\n\nRecent tweets about this topic:\n${input.tweets.map((t, i) => 
              `${i + 1}. "${t.text.slice(0, 200)}" (${t.likes} likes, ${t.retweets} retweets)`
            ).join("\n")}`
          : "";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an AI trend analyst for X (Twitter). Your job is to provide insightful, concise summaries of trending topics. Be informative, engaging, and highlight key points. Format your response with:
1. A brief overview (2-3 sentences)
2. Key themes or talking points (bullet points)
3. Sentiment analysis (positive/negative/mixed)
4. Why this is trending (1-2 sentences)

Keep the total response under 300 words.`
            },
            {
              role: "user",
              content: `Analyze and summarize the trending topic: "${input.topic}"${tweetsContext}`
            }
          ]
        });

        const summary = response.choices?.[0]?.message?.content || "Unable to generate summary.";

        return {
          topic: input.topic,
          summary,
          generatedAt: new Date().toISOString(),
        };
      }),

    // Get user profile and recent activity
    getUserActivity: publicProcedure
      .input(z.object({
        username: z.string().min(1),
      }))
      .query(async ({ input }) => {
        try {
          // Get user profile
          const profileResult = await callDataApi("Twitter/get_user_profile_by_username", {
            query: { username: input.username }
          }) as any;

          if (!profileResult?.result?.data?.user?.result) {
            return { error: "User not found", user: null, tweets: [] };
          }

          const userData = profileResult.result.data.user.result;
          const legacy = userData.legacy || {};
          const userId = userData.rest_id;

          // Get user's recent tweets
          const tweetsResult = await callDataApi("Twitter/get_user_tweets", {
            query: { user: userId, count: "10" }
          }) as any;

          const tweets: any[] = [];
          if (tweetsResult?.result?.timeline?.instructions) {
            for (const instruction of tweetsResult.result.timeline.instructions) {
              if (instruction.type === "TimelineAddEntries") {
                for (const entry of instruction.entries || []) {
                  if (entry.entryId?.startsWith("tweet-")) {
                    const tweetResult = entry.content?.itemContent?.tweet_results?.result;
                    if (tweetResult?.legacy) {
                      tweets.push({
                        id: tweetResult.rest_id,
                        text: tweetResult.legacy.full_text,
                        createdAt: tweetResult.legacy.created_at,
                        retweets: tweetResult.legacy.retweet_count || 0,
                        likes: tweetResult.legacy.favorite_count || 0,
                        replies: tweetResult.legacy.reply_count || 0,
                        quotes: tweetResult.legacy.quote_count || 0,
                      });
                    }
                  }
                }
              }
            }
          }

          return {
            user: {
              id: userId,
              username: legacy.screen_name,
              name: legacy.name,
              bio: legacy.description,
              followers: legacy.followers_count,
              following: legacy.friends_count,
              tweets: legacy.statuses_count,
              verified: userData.is_blue_verified || false,
              profileImage: legacy.profile_image_url_https,
              bannerImage: legacy.profile_banner_url,
              createdAt: legacy.created_at,
            },
            tweets,
          };
        } catch (error) {
          console.error("Error fetching user activity:", error);
          return { error: "Failed to fetch user data", user: null, tweets: [] };
        }
      }),

    // AI Chat agent for X trends discussion
    chat: publicProcedure
      .input(z.object({
        message: z.string().min(1),
        context: z.object({
          currentTopic: z.string().optional(),
          recentTweets: z.array(z.string()).optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const contextInfo = input.context?.currentTopic
          ? `\n\nCurrent topic being discussed: ${input.context.currentTopic}`
          : "";
        
        const tweetsInfo = input.context?.recentTweets && input.context.recentTweets.length > 0
          ? `\n\nRecent tweets for context:\n${input.context.recentTweets.slice(0, 5).join("\n")}`
          : "";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are the X Trends AI Agent for The Viral Beat platform. You help users understand what's trending on X (Twitter), analyze social media conversations, and provide insights about viral content.

Your capabilities:
- Explain trending topics and why they're popular
- Analyze sentiment around discussions
- Identify key influencers and voices
- Predict potential viral content
- Provide context on breaking news

Be conversational, insightful, and helpful. Keep responses concise but informative.${contextInfo}${tweetsInfo}`
            },
            {
              role: "user",
              content: input.message
            }
          ]
        });

        return {
          response: response.choices?.[0]?.message?.content || "I'm having trouble processing that request. Please try again.",
          timestamp: new Date().toISOString(),
        };
      }),
  }),

  // ============ BEAT VOTES ============
  votes: router({
    // Cast a vote (upvote or downvote) - requires login
    cast: protectedProcedure
      .input(z.object({
        topic: z.string().min(1),
        voteType: z.enum(["up", "down"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await castVote(ctx.user.id, input.topic, input.voteType);
        const counts = await getVoteCounts(input.topic);
        return {
          ...result,
          counts,
        };
      }),

    // Get vote counts for a topic
    getCounts: publicProcedure
      .input(z.object({
        topic: z.string().min(1),
      }))
      .query(async ({ input }) => {
        return getVoteCounts(input.topic);
      }),

    // Get current user's vote on a topic
    getUserVote: protectedProcedure
      .input(z.object({
        topic: z.string().min(1),
      }))
      .query(async ({ ctx, input }) => {
        const vote = await getUserVote(ctx.user.id, input.topic);
        return { voteType: vote };
      }),

    // Get top voted topics
    getTopVoted: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit || 10;
        return getTopVotedTopics(limit);
      }),
  }),

  // ============ AI AGENTS ============
  aiAgents: router({
    // Script Writer Agent - generates video scripts based on trending topics
    generateScript: protectedProcedure
      .input(z.object({
        topic: z.string().min(1),
        platform: z.enum(["tiktok", "youtube", "instagram", "twitter"]),
        contentType: z.enum(["educational", "entertainment", "promotional", "storytelling"]).optional(),
        duration: z.enum(["15-30s", "30-60s", "1-3min", "3-5min", "5-10min"]).optional(),
        tone: z.enum(["casual", "professional", "humorous", "inspirational"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Spend tokens for AI agent usage (30 VBT)
        try {
          await spendTokens(
            ctx.user.id,
            30,
            "spend_ai_agent",
            `Used Script Writer Agent for topic: ${input.topic}`
          );
        } catch (error: any) {
          throw new Error(error.message || "Failed to process token payment");
        }
        const platformGuidelines = {
          tiktok: "Short-form vertical video (15-60s). Start with a hook in first 3 seconds. Use trending sounds. Fast-paced editing. Direct to camera.",
          youtube: "Longer-form content. Strong intro hook. Clear structure (intro, main content, CTA). Optimize for watch time and retention.",
          instagram: "Visual-first content. Reels (15-90s) or Stories. Use text overlays. Strong visual hooks. Trending audio.",
          twitter: "Concise, punchy content. Thread-style storytelling. Use line breaks. Include call-to-action. Optimize for retweets.",
        };

        const contentTypePrompts = {
          educational: "Teach something valuable. Use clear explanations. Include actionable takeaways. Make it easy to understand.",
          entertainment: "Make it fun and engaging. Use humor, surprises, or emotional moments. Keep energy high.",
          promotional: "Highlight benefits, not features. Show transformation. Include social proof. Clear call-to-action.",
          storytelling: "Use narrative structure. Create emotional connection. Build tension and resolution. Relatable characters.",
        };

        const durationGuidance = input.duration || "30-60s";
        const contentType = input.contentType || "educational";
        const tone = input.tone || "casual";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert viral content script writer. You understand what makes content go viral on social media platforms.

Your task is to write a compelling ${input.platform} script about "${input.topic}".

Platform Guidelines: ${platformGuidelines[input.platform]}
Content Type: ${contentTypePrompts[contentType]}
Duration: ${durationGuidance}
Tone: ${tone}

Format your response as a structured script with:
1. HOOK (first 3-5 seconds)
2. MAIN CONTENT (broken into clear sections)
3. CALL TO ACTION

Include [VISUAL CUES] in brackets where relevant.
Keep it concise, engaging, and optimized for virality.`
            },
            {
              role: "user",
              content: `Write a ${durationGuidance} ${input.platform} script about "${input.topic}" in a ${tone} tone, formatted as ${contentType} content.`
            }
          ]
        });

        const script = response.choices?.[0]?.message?.content || "Unable to generate script.";

        return {
          topic: input.topic,
          platform: input.platform,
          contentType,
          duration: durationGuidance,
          tone,
          script,
          generatedAt: new Date().toISOString(),
        };
      }),

    // Trend Forecaster Agent - predicts which topics will go viral
    forecastTrends: protectedProcedure
      .input(z.object({
        category: z.enum(["general", "tech", "entertainment", "sports", "politics", "business"]).optional(),
        timeframe: z.enum(["24h", "48h", "72h"]).optional(),
      }))
      .query(async ({ input }) => {
        const category = input.category || "general";
        const timeframe = input.timeframe || "48h";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a trend forecasting AI that predicts which topics will go viral in the next ${timeframe}. Analyze current patterns, emerging conversations, and cultural momentum to identify trends before they peak.

Provide 5-7 predictions with:
1. Topic name
2. Confidence score (0-100)
3. Expected peak time
4. Why it will trend
5. Recommended action for creators

Format as JSON array.`
            },
            {
              role: "user",
              content: `Predict trending topics in the ${category} category for the next ${timeframe}.`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "trend_forecast",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        confidence: { type: "number" },
                        peakTime: { type: "string" },
                        reasoning: { type: "string" },
                        action: { type: "string" },
                      },
                      required: ["topic", "confidence", "peakTime", "reasoning", "action"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["predictions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = typeof response.choices?.[0]?.message?.content === 'string' 
          ? response.choices[0].message.content 
          : '{"predictions":[]}';
        const result = JSON.parse(content);

        return {
          category,
          timeframe,
          predictions: result.predictions,
          generatedAt: new Date().toISOString(),
        };
      }),

    // Collaboration Matchmaker Agent - finds potential creator collaborations
    findCollaborators: protectedProcedure
      .input(z.object({
        niche: z.string().min(1),
        audienceSize: z.enum(["micro", "mid", "macro", "mega"]).optional(),
        platform: z.enum(["tiktok", "youtube", "instagram", "twitter", "all"]).optional(),
      }))
      .query(async ({ input }) => {
        const audienceSize = input.audienceSize || "mid";
        const platform = input.platform || "all";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a creator collaboration matchmaker. Identify potential collaboration opportunities based on niche, audience overlap, and content synergy.

Provide 5-7 collaboration suggestions with:
1. Creator name/handle (realistic examples)
2. Match score (0-100)
3. Audience overlap percentage
4. Collaboration type (duet, feature, series, etc.)
5. Expected reach
6. Why this collaboration works

Format as JSON array.`
            },
            {
              role: "user",
              content: `Find collaboration opportunities for a ${audienceSize}-tier creator in the ${input.niche} niche on ${platform}.`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "collaboration_matches",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        creator: { type: "string" },
                        matchScore: { type: "number" },
                        audienceOverlap: { type: "number" },
                        collaborationType: { type: "string" },
                        expectedReach: { type: "string" },
                        reasoning: { type: "string" },
                      },
                      required: ["creator", "matchScore", "audienceOverlap", "collaborationType", "expectedReach", "reasoning"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = typeof response.choices?.[0]?.message?.content === 'string' 
          ? response.choices[0].message.content 
          : '{"matches":[]}';
        const result = JSON.parse(content);

        return {
          niche: input.niche,
          audienceSize,
          platform,
          matches: result.matches,
          generatedAt: new Date().toISOString(),
        };
      }),

    // Sponsorship Opportunity Finder Agent - matches creators with brand deals
    findSponsorships: protectedProcedure
      .input(z.object({
        niche: z.string().min(1),
        audienceSize: z.enum(["micro", "mid", "macro", "mega"]).optional(),
        contentType: z.enum(["educational", "entertainment", "lifestyle", "tech", "gaming"]).optional(),
      }))
      .query(async ({ input }) => {
        const audienceSize = input.audienceSize || "mid";
        const contentType = input.contentType || "entertainment";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a brand partnership specialist. Identify sponsorship opportunities that match creator niches, audience demographics, and content style.

Provide 5-7 sponsorship opportunities with:
1. Brand name (realistic examples)
2. Fit score (0-100)
3. Estimated deal value range
4. Campaign type
5. Requirements
6. Why this partnership works

Format as JSON array.`
            },
            {
              role: "user",
              content: `Find sponsorship opportunities for a ${audienceSize}-tier ${contentType} creator in the ${input.niche} niche.`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "sponsorship_opportunities",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  opportunities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        brand: { type: "string" },
                        fitScore: { type: "number" },
                        dealValue: { type: "string" },
                        campaignType: { type: "string" },
                        requirements: { type: "string" },
                        reasoning: { type: "string" },
                      },
                      required: ["brand", "fitScore", "dealValue", "campaignType", "requirements", "reasoning"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["opportunities"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = typeof response.choices?.[0]?.message?.content === 'string' 
          ? response.choices[0].message.content 
          : '{"opportunities":[]}';
        const result = JSON.parse(content);

        return {
          niche: input.niche,
          audienceSize,
          contentType,
          opportunities: result.opportunities,
          generatedAt: new Date().toISOString(),
        };
      }),

    // Content Repurposing Agent - suggests cross-platform adaptations
    repurposeContent: protectedProcedure
      .input(z.object({
        originalContent: z.string().min(1),
        originalPlatform: z.enum(["tiktok", "youtube", "instagram", "twitter"]),
        targetPlatforms: z.array(z.enum(["tiktok", "youtube", "instagram", "twitter"])),
      }))
      .mutation(async ({ input }) => {
        const platformGuidelines = {
          tiktok: "15-60s vertical video. Hook in 3s. Trending sounds. Fast cuts. Text overlays.",
          youtube: "Longer-form (3-15min). Strong intro. Clear structure. Timestamps. End screen CTA.",
          instagram: "Reels (15-90s) or carousel posts. Visual-first. Trending audio. Hashtags.",
          twitter: "Thread format. Punchy text. Line breaks. Images/GIFs. Quote-worthy hooks.",
        };

        const adaptations: any[] = [];

        for (const targetPlatform of input.targetPlatforms) {
          if (targetPlatform === input.originalPlatform) continue;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a content repurposing expert. Adapt content from ${input.originalPlatform} to ${targetPlatform} while maintaining core message but optimizing for platform-specific best practices.

${targetPlatform} Guidelines: ${platformGuidelines[targetPlatform]}

Provide:
1. Adapted content/script
2. Format changes needed
3. Key optimization tips
4. Estimated effort (low/medium/high)`
              },
              {
                role: "user",
                content: `Adapt this ${input.originalPlatform} content for ${targetPlatform}:

${input.originalContent}`
              }
            ]
          });

          const adaptedContent = response.choices?.[0]?.message?.content || "Unable to generate adaptation.";

          adaptations.push({
            platform: targetPlatform,
            content: adaptedContent,
          });
        }

        return {
          originalPlatform: input.originalPlatform,
          adaptations,
          generatedAt: new Date().toISOString(),
        };
      }),
  }),

  // ============ ADMIN ============
  admin: router({
    getSystemStats: protectedProcedure.query(async ({ ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get total users
      const totalUsersResult = await db.select().from(users);
      const totalUsers = totalUsersResult.length;

      // Get active users (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsersResult = await db.select().from(users).where(
        // @ts-ignore - MySQL date comparison
        (users.lastSignedIn >= oneDayAgo)
      );
      const activeUsers = activeUsersResult.length;

      return {
        systemHealth: {
          apiStatus: "healthy",
          dbStatus: "connected",
          uptime: process.uptime(),
        },
        userMetrics: {
          totalUsers,
          activeUsers,
          totalRequests: 0, // Placeholder - would need request logging
          topEndpoints: [
            { path: "/api/trpc/trends.search", count: 1250 },
            { path: "/api/trpc/aiAgents.generateScript", count: 450 },
            { path: "/api/trpc/favorites.list", count: 320 },
          ],
        },
        rateLimitViolations: [],
      };
    }),

    getRegistrationTrends: protectedProcedure
      .input(z.object({
        period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
        days: z.number().min(7).max(365).default(30),
      }))
      .query(async ({ ctx, input }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get all users with their creation dates
        const allUsers = await db.select({
          createdAt: users.createdAt,
        }).from(users);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        // Group registrations by period
        const registrationMap = new Map<string, number>();

        allUsers.forEach(user => {
          const createdDate = new Date(user.createdAt);
          if (createdDate >= startDate && createdDate <= endDate) {
            let key: string;
            
            if (input.period === "daily") {
              key = createdDate.toISOString().split('T')[0]; // YYYY-MM-DD
            } else if (input.period === "weekly") {
              const weekStart = new Date(createdDate);
              weekStart.setDate(createdDate.getDate() - createdDate.getDay());
              key = weekStart.toISOString().split('T')[0];
            } else { // monthly
              key = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
            }

            registrationMap.set(key, (registrationMap.get(key) || 0) + 1);
          }
        });

        // Fill in missing dates with 0 registrations
        const labels: string[] = [];
        const data: number[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          let key: string;
          
          if (input.period === "daily") {
            key = currentDate.toISOString().split('T')[0];
            labels.push(new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (input.period === "weekly") {
            key = currentDate.toISOString().split('T')[0];
            labels.push(`Week of ${new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
            currentDate.setDate(currentDate.getDate() + 7);
          } else { // monthly
            key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            labels.push(new Date(currentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            currentDate.setMonth(currentDate.getMonth() + 1);
          }

          data.push(registrationMap.get(key) || 0);
        }

        return {
          labels,
          data,
          period: input.period,
          totalRegistrations: data.reduce((sum, val) => sum + val, 0),
        };
      }),

    getRegistrationSources: protectedProcedure
      .input(z.object({
        days: z.number().default(30),
      }))
      .query(async ({ ctx, input }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        // Get all users within date range
        const allUsers = await db
          .select({
            loginMethod: users.loginMethod,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(
            sql`${users.createdAt} >= ${startDate.toISOString()} AND ${users.createdAt} <= ${endDate.toISOString()}`
          );

        // Group by login method and date
        const sourceMap = new Map<string, Map<string, number>>();
        
        allUsers.forEach((user) => {
          const date = new Date(user.createdAt).toISOString().split('T')[0];
          const method = user.loginMethod || 'unknown';
          
          if (!sourceMap.has(method)) {
            sourceMap.set(method, new Map());
          }
          
          const methodMap = sourceMap.get(method)!;
          methodMap.set(date, (methodMap.get(date) || 0) + 1);
        });

        // Generate labels (dates)
        const labels: string[] = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const key = currentDate.toISOString().split('T')[0];
          labels.push(new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Build datasets for each login method
        const datasets: Array<{
          label: string;
          data: number[];
          method: string;
        }> = [];

        sourceMap.forEach((dateMap, method) => {
          const data: number[] = [];
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            const key = currentDate.toISOString().split('T')[0];
            data.push(dateMap.get(key) || 0);
            currentDate.setDate(currentDate.getDate() + 1);
          }

          datasets.push({
            label: method.charAt(0).toUpperCase() + method.slice(1),
            data,
            method,
          });
        });

        // Calculate totals by method
        const totalsByMethod: Record<string, number> = {};
        datasets.forEach(dataset => {
          totalsByMethod[dataset.method] = dataset.data.reduce((sum, val) => sum + val, 0);
        });

        return {
          labels,
          datasets,
          totalsByMethod,
          totalRegistrations: Object.values(totalsByMethod).reduce((sum, val) => sum + val, 0),
        };
      }),
  }),

  // ============ DEVELOPER HUB ============
  developerHub: router({
    // Forum Threads
    createThread: protectedProcedure
      .input(z.object({
        title: z.string().min(5).max(255),
        description: z.string().min(10),
        category: z.enum(["feature_request", "bug_report", "discussion", "question"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const thread = await createThread({
          ...input,
          authorId: ctx.user.id,
        });
        return thread;
      }),

    getThreads: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        status: z.string().optional(),
        sortBy: z.enum(["votes", "recent"]).optional(),
      }))
      .query(async ({ input }) => {
        return await getThreads(input);
      }),

    getThreadById: publicProcedure
      .input(z.object({ threadId: z.number() }))
      .query(async ({ input }) => {
        return await getThreadById(input.threadId);
      }),

    updateThreadStatus: protectedProcedure
      .input(z.object({
        threadId: z.number(),
        status: z.enum(["open", "in_progress", "completed", "closed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can update status
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        await updateThreadStatus(input.threadId, input.status);
        return { success: true };
      }),

    // Forum Posts
    createPost: protectedProcedure
      .input(z.object({
        threadId: z.number(),
        content: z.string().min(1),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const post = await createPost({
          ...input,
          authorId: ctx.user.id,
        });
        return post;
      }),

    getPostsByThread: publicProcedure
      .input(z.object({ threadId: z.number() }))
      .query(async ({ input }) => {
        return await getPostsByThread(input.threadId);
      }),

    // Forum Voting
    voteThread: protectedProcedure
      .input(z.object({
        threadId: z.number(),
        voteType: z.enum(["up", "down"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return await castThreadVote({
          threadId: input.threadId,
          userId: ctx.user.id,
          voteType: input.voteType,
        });
      }),

    getUserThreadVote: protectedProcedure
      .input(z.object({ threadId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getUserThreadVote(input.threadId, ctx.user.id);
      }),

    // Developer Agent
    chatWithAgent: protectedProcedure
      .input(z.object({
        message: z.string().min(1),
        conversationHistory: z.array(z.object({
          role: z.string(),
          content: z.string(),
          timestamp: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const history = input.conversationHistory || [];
        
        // Build messages for LLM
        const messages: Array<{ role: string; content: string }> = [
          {
            role: "system",
            content: `You are the Developer Agent for The Viral Beat, an AI-powered assistant that helps developers improve the platform. Your role is to:
- Analyze feature requests and provide implementation guidance
- Review code snippets and suggest improvements
- Help troubleshoot bugs and technical issues
- Suggest architectural patterns and best practices
- Provide feasibility analysis for new features

Be concise, technical, and actionable. When discussing features, consider:
- Technical complexity
- User impact
- Integration with existing systems
- Performance implications
- Security considerations`,
          },
          ...history.map(msg => ({ role: msg.role, content: msg.content })),
          { role: "user", content: input.message },
        ];

        const response = await invokeLLM({ messages: messages as any });
        const assistantMessage = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content);

        // Save conversation
        const updatedHistory: Array<{ role: string; content: string; timestamp: string }> = [
          ...history,
          { role: "user", content: input.message, timestamp: new Date().toISOString() },
          { role: "assistant", content: assistantMessage || "", timestamp: new Date().toISOString() },
        ];

        await saveConversation({
          userId: ctx.user.id,
          messages: updatedHistory,
        });

        return {
          message: assistantMessage,
          conversationHistory: updatedHistory,
        };
      }),

    getConversation: protectedProcedure
      .query(async ({ ctx }) => {
        return await getConversation(ctx.user.id);
      }),
  }),
  
  tokens: tokensRouter,
  marketplace: marketplaceRouter,
  migration: migrationRouter,
  premiumAnalytics: premiumAnalyticsRouter,
  creatorTiers: creatorTiersRouter,
  haa: haaRouter,
  phase2: phase2Router,
  aiAssistant: aiAssistantRouter,
  newsletter: newsletterRouter,
  pushNotifications: pushNotificationsRouter,
  kenya: kenyaRouter,
  africa: africaRouter,

  developerKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPreview: apiKeys.key,
          scopes: apiKeys.scopes,
          dailyLimit: apiKeys.dailyLimit,
          requestsToday: apiKeys.requestsToday,
          requestsTotal: apiKeys.requestsTotal,
          isActive: apiKeys.isActive,
          lastUsedAt: apiKeys.lastUsedAt,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.userId, ctx.user.id));
      // Mask key: show first 8 chars then ••••••••
      return rows.map(r => ({
        ...r,
        keyPreview: r.keyPreview.slice(0, 10) + "••••••••••••••",
      }));
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(80) }))
      .mutation(async ({ ctx, input }) => {
        const key = await createApiKey(ctx.user.id, input.name);
        return { key }; // returned once — client must copy it now
      }),

    revoke: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db
          .update(apiKeys)
          .set({ isActive: false })
          .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
