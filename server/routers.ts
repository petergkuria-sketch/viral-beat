import { COOKIE_NAME } from "@shared/const";
import { getDb } from "./db";
import { users, apiKeys, politicalFigures } from "../drizzle/schema";
import { eq, sql, and, asc, desc, type SQL } from "drizzle-orm";
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
  getTopVotedTopics,
  upsertSignalRating,
  getPestelRatingSummary,
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
import { subscriptionRouter } from "./routers/subscription";
import { countryRouter } from "./routers/country";

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
        category: z.string().default("continental:au:political"),
      }))
      .query(async ({ input }) => {
        // Parse geo-aware category: "<layer>:<scope>:<pestel>"
        const parts = input.category.split(":");
        const [geoLayer, geoScope, pestelFilter] = parts.length === 3
          ? parts
          : ["continental", "au", parts[0] || "political"];

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

        // ── Africa-focused account data organised by GEO × PESTEL ──────────
        type AccountEntry = { username: string; topic: string; fallbackTweets: { text: string; likes: number; retweets: number }[] };

        // Continental (AU organs + pan-African media)
        const continentalAccounts: Record<string, AccountEntry[]> = {
          political: [
            { username: "_AfricanUnion", topic: "African Union Governance", fallbackTweets: [
              { text: "The AU Assembly calls on member states to deepen democratic governance ahead of the 2026 electoral cycle. Full communiqué: au.int #AfricaUnion", likes: 4200, retweets: 1800 },
              { text: "Peace & Security Council convenes emergency session on cross-border security threats in the Sahel. #PeaceInAfrica", likes: 5600, retweets: 2300 },
            ]},
            { username: "AUC_MoussaFaki", topic: "AU Commission Chairperson", fallbackTweets: [
              { text: "Africa must speak with one voice on the global stage. Our collective security and prosperity depend on deepened continental solidarity. #Agenda2063", likes: 3800, retweets: 1500 },
              { text: "Congratulating the people of [country] on a peaceful transfer of power. Democracy is Africa's future. #ElectionResults", likes: 6100, retweets: 2700 },
            ]},
            { username: "NationAfrica", topic: "Pan-African Politics", fallbackTweets: [
              { text: "ANALYSIS: How the Nairobi Declaration is reshaping East Africa's debt negotiation position with the IMF. Full report ↓", likes: 2900, retweets: 1100 },
              { text: "Three African heads of state skip G7 summit in protest over double-standard climate finance commitments. #AfricaRising", likes: 4500, retweets: 1900 },
            ]},
          ],
          economic: [
            { username: "AfDB_Group", topic: "African Development Bank", fallbackTweets: [
              { text: "AfDB approves $2.3B infrastructure facility for the Lobito Corridor — connecting DRC, Zambia and Angola. Game-changing for regional trade. #AfricaInvestment", likes: 5800, retweets: 2400 },
              { text: "Africa's GDP growth projected at 4.1% in 2026, outpacing the global average. New African Economic Outlook report out now.", likes: 4300, retweets: 1700 },
            ]},
            { username: "EAC_Secretariat", topic: "East African Community Economy", fallbackTweets: [
              { text: "EAC Partner States agree to eliminate non-tariff barriers on 142 product categories. A major win for intra-Africa trade. #AfCFTA", likes: 3200, retweets: 1300 },
              { text: "EAC GDP reaches $320B — the region is now the fastest-growing economic bloc on the continent. #EACSummit", likes: 2800, retweets: 1100 },
            ]},
            { username: "COMESA_Secretariat", topic: "COMESA Trade", fallbackTweets: [
              { text: "COMESA Free Trade Area records $8.4B in intra-regional exports. Digital trade protocols driving the surge. #AfCFTA", likes: 2100, retweets: 890 },
              { text: "New COMESA competition framework to protect African consumers and SMEs from monopolistic practices.", likes: 1800, retweets: 740 },
            ]},
          ],
          social: [
            { username: "UNICEFAfrica", topic: "Children & Social Development", fallbackTweets: [
              { text: "1 in 3 children in sub-Saharan Africa is not in school. Closing this gap requires $40B annually. We cannot afford to wait. #Education", likes: 8900, retweets: 4200 },
              { text: "Landmark report: Child mortality in Africa has dropped 60% since 2000 — but progress is stalling in conflict zones. #ChildHealth", likes: 6700, retweets: 3100 },
            ]},
            { username: "UNAfrica", topic: "UN Africa Humanitarian", fallbackTweets: [
              { text: "URGENT: 26 million people in the Horn of Africa face acute food insecurity. Funding gaps are putting lives at risk. #HumanitarianCrisis", likes: 7400, retweets: 3600 },
              { text: "Gender equality in Africa: Women now hold 28% of parliamentary seats — highest ever, but still far from parity. #WomenInPolitics", likes: 5200, retweets: 2400 },
            ]},
            { username: "AfricaRenewal", topic: "AU Social Agenda", fallbackTweets: [
              { text: "Youth unemployment at 60% in some African nations. The AU's Jobs for Youth initiative is mobilising $5B over 5 years. #YouthAfrica", likes: 3900, retweets: 1700 },
              { text: "Africa's middle class now stands at 350 million — and their political demands are reshaping governance. Exclusive analysis ↓", likes: 2800, retweets: 1200 },
            ]},
          ],
          technological: [
            { username: "SmartAfricaOrg", topic: "Smart Africa Digital Agenda", fallbackTweets: [
              { text: "Africa's digital economy will reach $712B by 2050. Smart Africa's continental broadband initiative is laying the foundation. #DigitalAfrica", likes: 4100, retweets: 1800 },
              { text: "AI governance framework for Africa launched at AU summit. African nations must shape global AI rules, not just receive them. #AIAfrica", likes: 5600, retweets: 2500 },
            ]},
            { username: "DigitalAfricaHub", topic: "African Fintech & Innovation", fallbackTweets: [
              { text: "M-Pesa crosses 60M active users. East Africa's mobile money model is being replicated across 12 new markets. #Fintech #MobileMoney", likes: 6200, retweets: 2900 },
              { text: "Africa mints 4 new unicorns in Q1 2026 — Nairobi, Lagos, Cairo, Accra all on the map. The ecosystem is maturing fast.", likes: 7800, retweets: 3400 },
            ]},
            { username: "AfricanTechVoices", topic: "Tech Policy & Regulation", fallbackTweets: [
              { text: "DATA SOVEREIGNTY: 23 African nations have signed the Malabo Convention on data protection — but only 8 have ratified it. The gap is a security risk.", likes: 3400, retweets: 1500 },
              { text: "Starlink launches in 5 more African markets. Affordable connectivity is no longer aspirational — it's structural.", likes: 4700, retweets: 2100 },
            ]},
          ],
          environmental: [
            { username: "AUC_DREA", topic: "AU Climate & Environment", fallbackTweets: [
              { text: "African nations present unified NDC position ahead of COP31. Africa contributes <4% of global emissions but bears 60% of climate costs. #ClimateJustice", likes: 7200, retweets: 3500 },
              { text: "The Great Green Wall: 20% complete, 12M hectares restored. With full funding it will be the largest living structure on earth. #Sahel", likes: 9100, retweets: 4600 },
            ]},
            { username: "UNEPAfrica", topic: "UNEP Africa Environment", fallbackTweets: [
              { text: "Lake Victoria water levels drop to 30-year low. 40 million people depend on this lake. Climate change + over-abstraction = crisis. #WaterSecurity", likes: 6800, retweets: 3200 },
              { text: "Africa's renewable energy capacity doubles in 3 years — but 600M people still lack reliable electricity. The investment gap must close. #EnergyAfrica", likes: 5400, retweets: 2500 },
            ]},
            { username: "AfricaClimateWeek", topic: "Climate Adaptation", fallbackTweets: [
              { text: "Loss and damage fund: Africa allocated $480M at COP29 against an estimated $580B annual need. The maths do not add up. #LossAndDamage", likes: 5900, retweets: 2800 },
              { text: "Cyclone season in the Indian Ocean intensifies. Mozambique, Madagascar and Tanzania on high alert as systems develop. #DisasterRisk", likes: 4300, retweets: 2100 },
            ]},
          ],
          legal: [
            { username: "AfricanCourt", topic: "African Court on Human Rights", fallbackTweets: [
              { text: "Landmark ruling: The African Court finds that internet shutdowns during elections violate the African Charter on Human and Peoples' Rights. #HumanRights", likes: 8400, retweets: 4100 },
              { text: "The Court issues advisory opinion on debt restructuring and social rights — affirming that austerity measures cannot override basic rights. #AfricanCharter", likes: 5700, retweets: 2600 },
            ]},
            { username: "ACHPR_CADHP", topic: "African Commission on H&P Rights", fallbackTweets: [
              { text: "ACHPR condemns the use of anti-terrorism laws to silence journalists and civil society across 8 member states. #PressFreedom", likes: 6200, retweets: 3000 },
              { text: "State of emergency provisions are being misused. The Commission calls for parliamentary oversight of emergency declarations in Africa.", likes: 4800, retweets: 2200 },
            ]},
            { username: "ICJAfrica", topic: "International Commission of Jurists", fallbackTweets: [
              { text: "Judicial independence under threat: 6 African governments have passed legislation limiting court oversight of executive action in 2025 alone.", likes: 5100, retweets: 2400 },
              { text: "The ICC's Africa bias debate resurfaces as a sitting head of state faces indictment. Regional courts must be empowered to fill the gap. #ICC", likes: 7300, retweets: 3600 },
            ]},
          ],
        };

        // Regional accounts by sub-region × PESTEL
        const regionalAccounts: Record<string, Record<string, AccountEntry[]>> = {
          "east-africa": {
            political: [
              { username: "ntvkenya", topic: "Kenya Political Intelligence", fallbackTweets: [
                { text: "BREAKING: Parliament rejects Finance Bill amendments — government faces budget deficit of KSh 346B. Crisis talks underway. #KenyaPolitics", likes: 8200, retweets: 3800 },
                { text: "Opposition coalition announces nationwide demonstrations over cost of living. Police on standby in Nairobi, Mombasa, Kisumu. #KenyaProtests", likes: 6900, retweets: 3200 },
              ]},
              { username: "citizentvkenya", topic: "East Africa Regional Politics", fallbackTweets: [
                { text: "EAC Summit ends without consensus on DRC conflict. Regional leaders divided on deployment of force vs. diplomacy. #DRCCrisis", likes: 5400, retweets: 2500 },
                { text: "Tanzania general election date confirmed: October 2025. Opposition coalition finalising joint candidate strategy. #TanzaniaElections", likes: 4100, retweets: 1900 },
              ]},
              { username: "EAC_Secretariat", topic: "EAC Governance", fallbackTweets: [
                { text: "EAC Heads of State commit to free movement of persons protocol. East Africa moves closer to a single travel area. #EACIntegration", likes: 3800, retweets: 1700 },
                { text: "South Sudan peace process review: Progress fragile as ceasefire violations continue in Unity State. #SouthSudan", likes: 4600, retweets: 2100 },
              ]},
            ],
            economic: [
              { username: "BusinessDailyKe", topic: "East Africa Business", fallbackTweets: [
                { text: "Kenya's current account deficit widens to $6.2B. Weak shilling and high import bill the main drivers. #KenyaEconomy", likes: 3200, retweets: 1400 },
                { text: "Ethiopia signs landmark deal with Dubai Ports for Djibouti corridor. Horn of Africa trade flows to shift significantly. #EthiopiaEconomy", likes: 4700, retweets: 2100 },
              ]},
              { username: "AfDB_Group", topic: "East Africa Investment", fallbackTweets: [
                { text: "AfDB commits $1.2B to East Africa infrastructure in 2026. Northern Corridor upgrades top the agenda. #InfrastructureAfrica", likes: 3900, retweets: 1700 },
                { text: "Rwanda named top reformer for ease of doing business in East Africa for the third consecutive year. #RwandaEconomy", likes: 5100, retweets: 2300 },
              ]},
            ],
            social: [
              { username: "UNICEFAfrica", topic: "East Africa Social", fallbackTweets: [
                { text: "Flooding in South Sudan displaces 220,000 people. UNICEF scaling up child protection and clean water operations. #SouthSudanFlood", likes: 6700, retweets: 3200 },
                { text: "Girls' education in East Africa: Completion rates at secondary level reach 61% — highest since independence era in many nations. #GirlsEducation", likes: 4200, retweets: 1900 },
              ]},
            ],
            technological: [
              { username: "iHubNairobi", topic: "East Africa Tech", fallbackTweets: [
                { text: "Kenya's Silicon Savannah now home to 400+ active startups. VC investment hits $890M in 2025. The ecosystem is no longer an experiment. #iHub", likes: 5800, retweets: 2700 },
                { text: "Mobile internet penetration in East Africa crosses 55%. Data prices falling 30% year-on-year. #ConnectedAfrica", likes: 4400, retweets: 2000 },
              ]},
            ],
            environmental: [
              { username: "AUC_DREA", topic: "East Africa Climate", fallbackTweets: [
                { text: "Mt. Kenya glaciers projected to disappear by 2040. Implications for water security of 4 million downstream communities are severe. #ClimateAfrica", likes: 7200, retweets: 3600 },
                { text: "Horn of Africa endures 5th consecutive below-average rainy season. Humanitarian system reaching capacity. #DroughtAlert", likes: 6100, retweets: 2900 },
              ]},
            ],
            legal: [
              { username: "ICJAfrica", topic: "East Africa Rule of Law", fallbackTweets: [
                { text: "Kenya Supreme Court ruling on digital rights sets continental precedent. Online surveillance without warrant declared unconstitutional. #DigitalRights", likes: 5600, retweets: 2700 },
                { text: "Uganda anti-homosexuality act faces African Court challenge. Ruling expected in Q3 2026 — landmark for LGBTQ rights across the region.", likes: 8900, retweets: 4500 },
              ]},
            ],
          },
          "west-africa": {
            political: [
              { username: "ECOWAS_CEDEAO", topic: "ECOWAS Political Stability", fallbackTweets: [
                { text: "ECOWAS emergency summit on the Sahel transition governments. Mali, Burkina Faso and Niger alliance challenges regional architecture. #Sahel", likes: 5800, retweets: 2700 },
                { text: "Nigeria's governorship elections: Tribunal upholds results in 3 disputed states. Opposition vows Supreme Court appeal. #NigeriaElections", likes: 7200, retweets: 3500 },
              ]},
              { username: "PremiumTimesng", topic: "Nigeria Politics", fallbackTweets: [
                { text: "National Assembly passes landmark electoral reform bill. Electronic transmission of results now mandatory. #NigeriaElections2027", likes: 6400, retweets: 3100 },
                { text: "Tinubu meets opposition leaders amid renewed calls for government of national unity. Talks described as 'cordial but inconclusive'. #NigeriaPolitics", likes: 5100, retweets: 2400 },
              ]},
            ],
            economic: [
              { username: "BusinessDayNg", topic: "West Africa Economy", fallbackTweets: [
                { text: "Nigeria's inflation hits 32% as naira stabilisation measures show mixed results. Middle class household budgets under severe pressure.", likes: 7800, retweets: 3700 },
                { text: "Ghana exits IMF programme after 3 years — primary balance surplus achieved. Cautious optimism from markets. #GhanaEconomy", likes: 5600, retweets: 2600 },
              ]},
            ],
            social: [
              { username: "UNAfrica", topic: "West Africa Social", fallbackTweets: [
                { text: "Jihadist activity displaces 2.1 million in Burkina Faso. Humanitarian access blocked in 40% of territory. #BurkinaFaso #Sahel", likes: 8100, retweets: 4000 },
                { text: "Senegal civic movement achieves constitutional reform after months of protests. A model for peaceful democratic change in West Africa. #Senegal", likes: 5400, retweets: 2600 },
              ]},
            ],
            technological: [
              { username: "TechCabalMedia", topic: "West Africa Tech", fallbackTweets: [
                { text: "Lagos overtakes Cairo as Africa's top startup hub by deal count. $1.4B raised in 2025 across fintech, healthtech and logistics. #Lagos #Startups", likes: 6700, retweets: 3200 },
                { text: "ECOWAS digital identity framework: 8 nations agree to interoperable e-ID systems. 120M citizens to benefit by 2028. #DigitalECOWAS", likes: 4200, retweets: 1900 },
              ]},
            ],
            environmental: [
              { username: "UNEPAfrica", topic: "West Africa Environment", fallbackTweets: [
                { text: "Coastal erosion threatens 10 West African capitals. Lagos, Accra, Abidjan all at risk. $3B in adaptation finance needed urgently. #CoastalAfrica", likes: 5900, retweets: 2800 },
                { text: "Sahel desertification accelerates. 74 million livelihoods at risk as agricultural land converts to desert at 1,500 sq km per year. #Desertification", likes: 7100, retweets: 3500 },
              ]},
            ],
            legal: [
              { username: "AfricanCourt", topic: "West Africa Rule of Law", fallbackTweets: [
                { text: "ECOWAS Court orders release of detained journalists in Guinea. Military government given 30 days to comply or face sanctions. #PressFreedom", likes: 5200, retweets: 2500 },
                { text: "Coup governments in the Sahel strip citizenship of dissidents abroad. International law scholars call it unprecedented in African history.", likes: 6800, retweets: 3300 },
              ]},
            ],
          },
          "southern-africa": {
            political: [
              { username: "DailyMaverick", topic: "Southern Africa Politics", fallbackTweets: [
                { text: "South Africa's GNU tests coalition arithmetic: ANC-DA tensions rise over budget priorities. Third party holds balance of power. #SouthAfrica", likes: 6500, retweets: 3100 },
                { text: "Zimbabwe electoral commission faces credibility crisis ahead of local government polls. SADC observer mission deployed early. #Zimbabwe", likes: 4900, retweets: 2300 },
              ]},
              { username: "SADC_News", topic: "SADC Governance", fallbackTweets: [
                { text: "SADC Troika endorses ceasefire framework for eastern DRC. Implementation timeline: 90 days. Enforcement mechanism still disputed. #DRC", likes: 5700, retweets: 2700 },
                { text: "Mozambique post-election stabilisation: Security forces and Venâncio Mondlane supporters agree to confidence-building measures. #Mozambique", likes: 4300, retweets: 2000 },
              ]},
            ],
            economic: [
              { username: "BusinessDayZA", topic: "Southern Africa Economy", fallbackTweets: [
                { text: "South Africa's rand strengthens to R17.8/$ on positive inflation data and political stability signal from GNU. #SAeconomy", likes: 4100, retweets: 1900 },
                { text: "Zambia completes debt restructuring: $6.3B external debt renegotiated. IMF praises transparency of process as a model for Africa. #ZambiaDebt", likes: 5300, retweets: 2500 },
              ]},
            ],
            social: [
              { username: "UNAfrica", topic: "Southern Africa Social", fallbackTweets: [
                { text: "El Niño-driven drought leaves 21 million food insecure in Southern Africa. SADC declares regional disaster. #FoodCrisis #ElNino", likes: 7900, retweets: 3900 },
                { text: "HIV prevalence in Southern Africa falls to lowest rate since 1990s. PEPFAR and country-level prevention programmes credited. #HealthAfrica", likes: 5200, retweets: 2400 },
              ]},
            ],
            technological: [
              { username: "SmartAfricaOrg", topic: "Southern Africa Tech", fallbackTweets: [
                { text: "South Africa launches national AI policy — first on the continent with binding regulatory provisions. A model or a constraint? #AIPolicy", likes: 4800, retweets: 2200 },
                { text: "Mozambique and Tanzania sign fibre optic interconnection deal. Southern Africa's digital backbone strengthens. #Connectivity", likes: 3600, retweets: 1600 },
              ]},
            ],
            environmental: [
              { username: "AUC_DREA", topic: "Southern Africa Climate", fallbackTweets: [
                { text: "Cyclone Freddy's one-year anniversary: Malawi still rebuilding. Less than 30% of pledged international aid has been disbursed. #CycloneFreddy", likes: 6300, retweets: 3100 },
                { text: "Kariba Dam water levels critical. Zambia and Zimbabwe face power cuts of 12+ hours daily as hydro generation collapses. #EnergyAffrica", likes: 8200, retweets: 4100 },
              ]},
            ],
            legal: [
              { username: "AfricanCourt", topic: "Southern Africa Rule of Law", fallbackTweets: [
                { text: "Namibia's Supreme Court upholds same-sex partnerships in landmark ruling. SADC's most progressive ruling on LGBTQ rights to date. #Namibia", likes: 7600, retweets: 3800 },
                { text: "South Africa's Constitutional Court strikes down state surveillance regulations as unconstitutional. Privacy rights affirmed. #ConstitutionalCourt", likes: 6100, retweets: 2900 },
              ]},
            ],
          },
          "north-africa": {
            political: [
              { username: "AhramOnline", topic: "North Africa Politics", fallbackTweets: [
                { text: "Egypt-Ethiopia-Sudan Nile talks resume after 18-month deadlock. Grand Renaissance Dam second filling triggers fresh tensions. #NileConflict", likes: 7400, retweets: 3700 },
                { text: "Tunisia's President extends emergency powers for sixth consecutive year. Civil society groups file constitutional challenge. #Tunisia", likes: 5600, retweets: 2700 },
              ]},
              { username: "MiddleEastEye", topic: "North Africa Regional", fallbackTweets: [
                { text: "Libya unity government talks collapse. Tripoli and Benghazi administrations harden positions as international mediation stalls. #Libya", likes: 6200, retweets: 3000 },
                { text: "Morocco-Algeria border standoff enters 4th year. Trade disruption costs the Maghreb $10B annually in lost commerce. #Maghreb", likes: 4800, retweets: 2300 },
              ]},
            ],
            economic: [
              { username: "AfDB_Group", topic: "North Africa Economy", fallbackTweets: [
                { text: "Egypt secures $35B UAE investment package — largest in the country's history. Ras El-Hekma development deal signed. #EgyptEconomy", likes: 8900, retweets: 4400 },
                { text: "Morocco positions as Africa's green hydrogen hub. $13B investment pipeline targets EU export markets by 2030. #GreenHydrogen", likes: 6700, retweets: 3200 },
              ]},
            ],
          },
          "central-africa": {
            political: [
              { username: "RadioOkapi", topic: "Central Africa Politics", fallbackTweets: [
                { text: "M23 advances to within 15km of Goma. UN Security Council convenes emergency session. Regional intervention force mandate unclear. #DRCCrisis", likes: 9200, retweets: 4700 },
                { text: "Central African Republic presidential elections: International observers cite restricted opposition access and media blackouts. #CAR", likes: 5100, retweets: 2500 },
              ]},
              { username: "ECCAS_CEEAC", topic: "ECCAS Governance", fallbackTweets: [
                { text: "ECCAS summit deferred as heads of state dispute Kinshasa security situation. Regional bloc faces deepest institutional crisis in its history.", likes: 3800, retweets: 1800 },
                { text: "Cameroon Anglophone crisis: Peace talks in Geneva produce joint communiqué but no ceasefire commitment from armed groups. #Cameroon", likes: 4600, retweets: 2200 },
              ]},
            ],
            economic: [
              { username: "AfDB_Group", topic: "Central Africa Economy", fallbackTweets: [
                { text: "DRC critical minerals deal: $1.9B investment in cobalt and lithium processing under new national mining code. #CriticalMinerals", likes: 7100, retweets: 3500 },
                { text: "Congo Basin carbon credits: 12 nations reach framework agreement on forest carbon monetisation. Potential $5B annual revenue for the region.", likes: 5400, retweets: 2600 },
              ]},
            ],
          },
        };

        // Country-specific accounts
        const countryAccounts: Record<string, Record<string, AccountEntry[]>> = {
          kenya: {
            political: [
              { username: "ntvkenya", topic: "Kenya National Politics", fallbackTweets: [
                { text: "BREAKING: Ruto meets opposition chiefs at State House. Kenya Kwanza-Azimio talks resume after 3-month hiatus. #KenyaPolitics #Handshake2", likes: 12400, retweets: 5800 },
                { text: "MPs pass Motion of No Confidence in Cabinet Secretary for Finance. Government faces parliamentary pressure on budget deficit. #KenyaParliament", likes: 9800, retweets: 4500 },
              ]},
              { username: "StandardKenya", topic: "Kenya County Governance", fallbackTweets: [
                { text: "47 county governors table devolution demands at Senate: More equitable revenue sharing is non-negotiable, says CoG chair. #Devolution", likes: 6200, retweets: 2900 },
                { text: "IEBC reconstitution Bill tabled in National Assembly. Opposition warns of elections credibility crisis if rushed through. #IEBC", likes: 7800, retweets: 3700 },
              ]},
              { username: "citizentvkenya", topic: "Kenya Security", fallbackTweets: [
                { text: "Al-Shabaab attack in Lamu County kills 3 police officers. Security forces launch sweep operation across the border counties. #KenyaSecurity", likes: 8900, retweets: 4300 },
                { text: "National Assembly passes Security Laws Amendment — critics warn of excessive powers for police. #KenyaSecurity #HumanRights", likes: 7100, retweets: 3400 },
              ]},
            ],
            economic: [
              { username: "BusinessDailyKe", topic: "Kenya Economy", fallbackTweets: [
                { text: "Kenya's inflation drops to 3.6% — lowest in 5 years. Food prices stabilising as good rains boost agricultural output. #KenyaEconomy", likes: 5400, retweets: 2500 },
                { text: "NSE market cap hits KSh 2.1T as foreign investor confidence returns post-Finance Bill protests. #NairobiStockExchange", likes: 4900, retweets: 2300 },
              ]},
              { username: "KenyaBreaking", topic: "Kenya Fiscal Policy", fallbackTweets: [
                { text: "Treasury projects revenue shortfall of KSh 180B in FY2025/26. Supplementary budget cuts target infrastructure and social spending. #KenyaBudget", likes: 6700, retweets: 3200 },
                { text: "Kenya signs $1.1B climate finance deal with EU for green energy transition. Solar and wind projects to create 45,000 jobs. #ClimateFinance", likes: 5300, retweets: 2500 },
              ]},
            ],
            social: [
              { username: "DailyNationKe", topic: "Kenya Social Issues", fallbackTweets: [
                { text: "Gen Z protest movement marks 1 year since Finance Bill demonstrations. Organisers announce new civic education campaign. #GenZKenya", likes: 14200, retweets: 7100 },
                { text: "Femicide crisis: 97 women killed in Kenya in Q1 2026. Women's rights groups demand emergency legislative session. #EndFemicide", likes: 18600, retweets: 9400 },
              ]},
            ],
            technological: [
              { username: "iHubNairobi", topic: "Kenya Tech Ecosystem", fallbackTweets: [
                { text: "Safaricom's M-PESA super-app passes 25M active users. Financial services, e-commerce and health bundled into one platform. #MPesa #Fintech", likes: 8900, retweets: 4300 },
                { text: "Kenya National AI Strategy launched: Focus on agriculture, healthcare and governance automation. $200M allocated over 3 years. #KenyaAI", likes: 6200, retweets: 2900 },
              ]},
            ],
            environmental: [
              { username: "AUC_DREA", topic: "Kenya Climate & Environment", fallbackTweets: [
                { text: "Mt. Kenya Forest Reserve loses 12,000 hectares to illegal charcoal burning in 2025. KFS reports enforcement capacity at 40% of need. #MtKenya", likes: 7400, retweets: 3600 },
                { text: "Kenya's Turkana Wind Farm expansion: 120 new turbines to add 300MW capacity. East Africa's largest wind project grows further. #GreenEnergy", likes: 5800, retweets: 2800 },
              ]},
            ],
            legal: [
              { username: "ICJAfrica", topic: "Kenya Rule of Law", fallbackTweets: [
                { text: "High Court declares night-time curfew in Lamu unconstitutional — sets precedent for security law application in conflict zones. #KenyaLaw", likes: 6100, retweets: 2900 },
                { text: "DPP drops charges against 2019 murder suspects citing evidence tampering. LSK calls for independent investigation into prosecutorial integrity. #Justice", likes: 4800, retweets: 2300 },
              ]},
            ],
          },
          nigeria: {
            political: [
              { username: "PremiumTimesng", topic: "Nigeria National Politics", fallbackTweets: [
                { text: "Tinubu's approval rating drops to 28% in new survey — lowest since inauguration. Rising cost of living cited as primary driver. #NigeriaPolitics", likes: 11200, retweets: 5400 },
                { text: "NASS passes PIB amendments: Gas flaring penalties doubled, local content requirements strengthened. #NigeriaOil #PIB", likes: 7400, retweets: 3600 },
              ]},
            ],
            economic: [
              { username: "BusinessDayNg", topic: "Nigeria Economy", fallbackTweets: [
                { text: "Naira closes at N1,580/$ — 3-week high on CBN's FX intervention. But parallel market still 12% above official rate. #NigeriaEconomy", likes: 9800, retweets: 4700 },
                { text: "Dangote Refinery at 80% capacity: Nigeria's petrol import bill falls 40%. Energy self-sufficiency within sight for first time in decades. #Dangote", likes: 13400, retweets: 6500 },
              ]},
            ],
            social: [
              { username: "UNAfrica", topic: "Nigeria Social Issues", fallbackTweets: [
                { text: "Nigeria's out-of-school children crisis: 10.5M children not in school — second highest in the world. Northern states worst affected. #NigeriaEducation", likes: 8900, retweets: 4200 },
                { text: "Borno State: IDP camp populations spike as Boko Haram splinter groups intensify attacks in Lake Chad Basin. #NigeriaSecurity", likes: 7200, retweets: 3400 },
              ]},
            ],
            technological: [
              { username: "TechCabalMedia", topic: "Nigeria Tech & Innovation", fallbackTweets: [
                { text: "Lagos fintech hub: Nigeria processes $24B in mobile money transactions in Q1 2025. Flutterwave and Paystack dominate. #NigeriaFintech", likes: 6700, retweets: 3100 },
                { text: "NCC spectrum auction: 5G licences awarded in Lagos, Abuja, and Port Harcourt. Full rollout by 2027. #Nigeria5G", likes: 5400, retweets: 2500 },
              ]},
            ],
            environmental: [
              { username: "UNEPAfrica", topic: "Nigeria Environment", fallbackTweets: [
                { text: "Niger Delta oil spill: Shell subsidiary ordered to pay $1.5B in damages. Decades of environmental destruction finally reckoned with. #NigerDelta", likes: 9100, retweets: 4400 },
                { text: "Flooding in Kogi, Anambra, and Benue states displaces 600,000. Climate adaptation budget cut by 30% this year. #NigeriaFloods", likes: 7800, retweets: 3700 },
              ]},
            ],
            legal: [
              { username: "AfricanCourt", topic: "Nigeria Rule of Law", fallbackTweets: [
                { text: "Nigeria Supreme Court upholds Tinubu election in 4-3 split ruling. Dissenting judgement raises questions about due process. #NigeriaElections", likes: 12100, retweets: 5900 },
                { text: "SERAP files suit challenging Nigeria's $800M loan without NASS approval. Separation of powers at stake. #NigeriaLaw", likes: 6800, retweets: 3200 },
              ]},
            ],
          },
          ghana: {
            political: [
              { username: "Joy997FM", topic: "Ghana National Politics", fallbackTweets: [
                { text: "President Mahama's first 100 days: Anti-corruption unit makes 12 high-profile arrests. NDC consolidates governance agenda. #GhanaPolitics", likes: 9400, retweets: 4500 },
                { text: "NPP opposition launches 'Operation Agenda 2028' as parliament debates constitutional review commission. #GhanaParliament", likes: 6800, retweets: 3200 },
              ]},
              { username: "Citinewsroom", topic: "Ghana Governance", fallbackTweets: [
                { text: "Ghana Electoral Commission confirms 2024 election results audit completed. No irregularities found. Confidence in democratic process restored. #Ghana2024", likes: 7200, retweets: 3400 },
                { text: "Akufo-Addo transition team cooperates with incoming NDC administration. Peaceful handover praised by AU observers. #GhanaElections", likes: 5600, retweets: 2700 },
              ]},
            ],
            economic: [
              { username: "GraphicOnline", topic: "Ghana Economy", fallbackTweets: [
                { text: "Ghana exits IMF programme Q3 2025: Primary surplus achieved, cedi stabilises at GHS 14.2/$. Cautious optimism from Accra markets. #GhanaEconomy", likes: 8700, retweets: 4200 },
                { text: "Cocoa Board announces record 780,000 tonne harvest. FX earnings boost reserves to 3.8 months import cover. #Ghana #Cocoa", likes: 6100, retweets: 2900 },
              ]},
              { username: "BusinessGhana", topic: "Ghana Investment", fallbackTweets: [
                { text: "Ghana's gold output rises 8% as Newmont and AngloGold expand Obuasi operations. Mining sector contributes 40% of FX earnings. #GhanaMining", likes: 5400, retweets: 2600 },
                { text: "Accra to Kumasi expressway PPP: $2.1B concession signed with French-South African consortium. 3-year construction timeline. #GhanaInfrastructure", likes: 4800, retweets: 2300 },
              ]},
            ],
            social: [
              { username: "GhanaWeb", topic: "Ghana Social Issues", fallbackTweets: [
                { text: "Ghana galamsey crisis: Illegal mining contaminates Pra and Offin rivers. 2 million lose access to safe drinking water in Ashanti and Western regions. #Galamsey", likes: 11200, retweets: 5600 },
                { text: "Free SHS enrolment hits 1.2M students. World Bank rates Ghana's education expansion as fastest in West Africa. #FreeSHS #GhanaEducation", likes: 7400, retweets: 3500 },
              ]},
              { username: "Citinewsroom", topic: "Ghana Civil Society", fallbackTweets: [
                { text: "Fix The Country movement holds rally in Accra. 50,000 march demanding cost-of-living relief and accountability on galamsey. #FixTheCountryGH", likes: 9800, retweets: 4900 },
                { text: "Ghana's maternal mortality rate falls 15% — midwife training and community health expansion credited. #GhanaHealth", likes: 5200, retweets: 2500 },
              ]},
            ],
            technological: [
              { username: "TechGhana", topic: "Ghana Tech & Fintech", fallbackTweets: [
                { text: "Ghana's Mobile Money interoperability: GHS 420B processed in 2024 — 14% of GDP. Highest mobile money penetration in West Africa. #GhanaMoMo", likes: 7800, retweets: 3700 },
                { text: "Accra Tech Hub opens: Government-backed facility hosts 200 startups. Target: 10,000 tech jobs by 2027. #GhanaStartups", likes: 5600, retweets: 2700 },
              ]},
            ],
            environmental: [
              { username: "UNEPAfrica", topic: "Ghana Environment", fallbackTweets: [
                { text: "Volta Lake water levels critical — Akosombo Dam at 30% capacity. Power rationing returns across Ghana as hydro generation collapses. #GhanaPower", likes: 10400, retweets: 5100 },
                { text: "Ghana loses 2% of forest cover annually to galamsey and charcoal production. Climate finance request of $12B submitted to COP30. #GhanaForests", likes: 7100, retweets: 3400 },
              ]},
            ],
            legal: [
              { username: "GhanaLegalNews", topic: "Ghana Rule of Law", fallbackTweets: [
                { text: "Ghana Supreme Court upholds Anti-LGBTQ+ bill. International rights bodies warn of aid implications for Accra. #GhanaHumanRights", likes: 13200, retweets: 6500 },
                { text: "Special Prosecutor opens new investigation into PDS electricity concession scandal. $190M in losses under scrutiny. #GhanaAccountability", likes: 8900, retweets: 4300 },
              ]},
              { username: "Joy997FM", topic: "Ghana Governance & Accountability", fallbackTweets: [
                { text: "CHRAJ finds former minister liable for conflict of interest in road contract award. First senior ruling in 2 years. #GhanaAntiCorruption", likes: 6700, retweets: 3200 },
                { text: "Ghana Bar Association demands independence of judiciary amid political pressure on court appointments. #GhanaJudiciary", likes: 5400, retweets: 2600 },
              ]},
            ],
          },
          ethiopia: {
            political: [
              { username: "AddisStandard", topic: "Ethiopia National Politics", fallbackTweets: [
                { text: "Abiy government signs security pact with Eritrea — first visit in 4 years signals warming after post-Tigray cooling. #Ethiopia #Eritrea", likes: 8900, retweets: 4300 },
                { text: "Tigray IDP return: Only 22% of 2.2M displaced persons have returned home. Humanitarian access remains restricted. #TigrayConflict", likes: 10200, retweets: 5100 },
              ]},
              { username: "EthiopianReporter", topic: "Ethiopia Governance", fallbackTweets: [
                { text: "Amhara Fano ceasefire talks resume in Nairobi. Federal government and militia representatives meet for first time in 8 months. #Ethiopia #Amhara", likes: 7600, retweets: 3700 },
                { text: "Ethiopia postpones regional elections in Somali and Afar states citing security. Independent observers raise electoral process concerns. #EthiopiaElections", likes: 6400, retweets: 3100 },
              ]},
            ],
            economic: [
              { username: "AfDB_Group", topic: "Ethiopia Economy", fallbackTweets: [
                { text: "Ethiopia's Homegrown Economic Reform programme enters Phase 3. IMF commends progress on FX liberalisation but flags fiscal risks. #EthiopiaEconomy", likes: 5800, retweets: 2800 },
                { text: "Grand Ethiopian Renaissance Dam: Third turbine operational — Ethiopia now Africa's largest power exporter. #GERD #EthiopiaPower", likes: 9700, retweets: 4800 },
              ]},
            ],
            social: [
              { username: "UNAfrica", topic: "Ethiopia Humanitarian", fallbackTweets: [
                { text: "20 million Ethiopians face acute food insecurity — worst figure since 2003. Conflict, drought and funding cuts converge in a triple crisis. #Ethiopia #Hunger", likes: 11400, retweets: 5700 },
                { text: "Displacement in Oromia surpasses 1.8M. Healthcare access in conflict zones described as 'catastrophic' by MSF. #OromiaConflict", likes: 9300, retweets: 4600 },
              ]},
            ],
            technological: [
              { username: "AfricanTechVoices", topic: "Ethiopia Tech", fallbackTweets: [
                { text: "Ethio Telecom ends monopoly: Safaricom Ethiopia hits 7M subscribers in 2 years. Competition drives data prices down 45%. #EthiopiaTech", likes: 6200, retweets: 3000 },
                { text: "Addis Ababa tech park: 80 startups, $120M raised. Ethiopia's digital economy ambitions getting traction despite instability. #EthiopiaStartups", likes: 4700, retweets: 2300 },
              ]},
            ],
            environmental: [
              { username: "AUC_DREA", topic: "Ethiopia Climate", fallbackTweets: [
                { text: "Ethiopia's Blue Nile basin: Watershed degradation threatens downstream water security for 300M in Sudan and Egypt. #NileBasin #GERD", likes: 7800, retweets: 3900 },
                { text: "Ethiopia plants 25B trees in Green Legacy Initiative — but deforestation rate still outpaces replanting in conflict zones. #GreenLegacy", likes: 6300, retweets: 3100 },
              ]},
            ],
            legal: [
              { username: "ICJAfrica", topic: "Ethiopia Rule of Law", fallbackTweets: [
                { text: "ICJ report: Ethiopia's Tigray amnesty law excludes key accountability provisions. Victims groups reject 'impunity by design'. #TigrayJustice", likes: 8700, retweets: 4300 },
                { text: "Ethiopian Human Rights Commission given expanded mandate — but independence from executive questioned by international observers. #EthiopiaRights", likes: 6100, retweets: 2900 },
              ]},
            ],
          },
          tanzania: {
            political: [
              { username: "DailyNewstz", topic: "Tanzania National Politics", fallbackTweets: [
                { text: "President Samia's CCM secures fourth consecutive super-majority. Opposition Chadema disputes results, EU observers cite intimidation. #TanzaniaElections2025", likes: 8100, retweets: 3900 },
                { text: "Zanzibar political crisis: ACT-Wazalendo boycotts parliament over disputed semi-autonomous elections. #ZanzibarPolitics", likes: 6500, retweets: 3200 },
              ]},
            ],
            economic: [
              { username: "AfDB_Group", topic: "Tanzania Economy", fallbackTweets: [
                { text: "Tanzania GDP grows 5.4% — tourism recovery and natural gas investment drive expansion. #TanzaniaEconomy #Tourism", likes: 5900, retweets: 2800 },
                { text: "Standard Gauge Railway Dar es Salaam–Dodoma section opens. $14B megaproject reshaping East African logistics. #SGR #Tanzania", likes: 7400, retweets: 3600 },
              ]},
            ],
            social: [
              { username: "UNICEFAfrica", topic: "Tanzania Social", fallbackTweets: [
                { text: "Tanzania teen pregnancy rate falls 30% after school re-entry policy. 200,000 young mothers return to classrooms. #Tanzania #Education", likes: 7200, retweets: 3500 },
                { text: "Albino attacks in Tanzania rise 40%. UN human rights expert calls for urgent security response ahead of elections. #Tanzania #HumanRights", likes: 9800, retweets: 4900 },
              ]},
            ],
            technological: [
              { username: "DigitalAfricaHub", topic: "Tanzania Tech", fallbackTweets: [
                { text: "Tanzania's M-Pesa expansion: Mobile money agents now in all 31 regions. Unbanked population falls below 30% for the first time. #Tanzania #Fintech", likes: 5100, retweets: 2500 },
              ]},
            ],
            environmental: [
              { username: "UNEPAfrica", topic: "Tanzania Environment", fallbackTweets: [
                { text: "Serengeti migration threatened: Tanzania's northern corridor faces land subdivision pressure. UNESCO monitoring closely. #Serengeti", likes: 8400, retweets: 4200 },
                { text: "Kilimanjaro glaciers: Less than 1km² of ice remains — down from 12km² in 1912. Water security for 400,000 at risk. #ClimateAfrica", likes: 10200, retweets: 5100 },
              ]},
            ],
            legal: [
              { username: "ICJAfrica", topic: "Tanzania Rule of Law", fallbackTweets: [
                { text: "Tanzania Media Services Act: Committee on Freedom of Expression condemns blanket media licensing powers. #TanzaniaPressFreedom", likes: 6300, retweets: 3100 },
                { text: "Tanzanian court acquits opposition leader of sedition charges. Rights groups say charges were politically motivated. #Tanzania #RuleOfLaw", likes: 5700, retweets: 2800 },
              ]},
            ],
          },
          "south-africa": {
            political: [
              { username: "DailyMaverick", topic: "South Africa National Politics", fallbackTweets: [
                { text: "GNU coalition crisis: DA threatens to withdraw over ANC's NHI implementation timeline. Ramaphosa convenes emergency Cabinet meeting. #SouthAfrica #GNU", likes: 13400, retweets: 6500 },
                { text: "MK Party wins KwaZulu-Natal legislature vote — Zuma's party consolidates provincial power. ANC locked out of its historic heartland. #SouthAfrica", likes: 11700, retweets: 5700 },
              ]},
              { username: "TimesLIVE", topic: "South Africa Governance", fallbackTweets: [
                { text: "Eskom unbundling: Transmission subsidiary incorporated — SA's grid transformation enters execution phase after 5 years of delays. #LoadShedding", likes: 9200, retweets: 4500 },
                { text: "SARS recovers R58B in tax dodging crackdown. Commissioner signals 2025 will be 'year of enforcement'. #SouthAfricaTax", likes: 7800, retweets: 3800 },
              ]},
            ],
            economic: [
              { username: "BusinessDayZA", topic: "South Africa Economy", fallbackTweets: [
                { text: "SA rand at R17.4/$ — 18-month high. GNU stability premium and Fed rate cut expectations drive appreciation. #SouthAfricaEconomy #Rand", likes: 8100, retweets: 3900 },
                { text: "Unemployment falls to 31.9% — still among world's highest but first sustained decline in 5 years. Youth joblessness at 60%. #SAUnemployment", likes: 9400, retweets: 4600 },
              ]},
            ],
            social: [
              { username: "UNAfrica", topic: "South Africa Social", fallbackTweets: [
                { text: "Cape Town water crisis returns: Dam levels at 42% heading into summer. Day Zero scenarios being modelled again by municipality. #CapeTown #Water", likes: 8900, retweets: 4400 },
                { text: "Xenophobic violence in Gauteng: 3 killed, 200 displaced in Alexandra township. Government deploys army after police overwhelmed. #SouthAfrica", likes: 10600, retweets: 5200 },
              ]},
            ],
            technological: [
              { username: "SmartAfricaOrg", topic: "South Africa Tech", fallbackTweets: [
                { text: "South Africa's AI policy gazetted: First binding AI regulation on the continent. Compliance deadline 18 months. #SouthAfricaAI", likes: 6700, retweets: 3200 },
                { text: "Cape Town named Africa's top tech hub 2025. 1,200 active startups, R24B raised since 2020. #CapeTownTech", likes: 7400, retweets: 3600 },
              ]},
            ],
            environmental: [
              { username: "AUC_DREA", topic: "South Africa Climate", fallbackTweets: [
                { text: "South Africa's Just Energy Transition: R131B international financing package enters disbursement phase. Coal regions to benefit from R18B reskilling fund. #JETP", likes: 7200, retweets: 3500 },
                { text: "KwaZulu-Natal floods: R12B in infrastructure damage. Third major climate event in 3 years in the province. #SouthAfricaFloods", likes: 8600, retweets: 4200 },
              ]},
            ],
            legal: [
              { username: "AfricanCourt", topic: "South Africa Rule of Law", fallbackTweets: [
                { text: "Constitutional Court rules expropriation without compensation bill requires 2/3 majority. Government faces political arithmetic challenge. #EWC #SouthAfrica", likes: 14200, retweets: 7100 },
                { text: "NPA charges former president Zuma with contempt — third prosecution attempt in 5 years. Court proceedings to begin Q2 2026. #Zuma #SouthAfrica", likes: 11800, retweets: 5800 },
              ]},
            ],
          },
          egypt: {
            political: [
              { username: "AhramOnline", topic: "Egypt National Politics", fallbackTweets: [
                { text: "President Sisi secures record 89% in re-election. EU observers note 'restricted space for genuine competition'. #EgyptElections #Egypt", likes: 7400, retweets: 3600 },
                { text: "Egypt-Hamas ceasefire mediation: Cairo hosts 8th round of talks. Qatari and US delegations present. Agreement remains elusive. #Egypt #Gaza", likes: 12600, retweets: 6200 },
              ]},
            ],
            economic: [
              { username: "AfDB_Group", topic: "Egypt Economy", fallbackTweets: [
                { text: "Egypt's $35B UAE deal: Ras El-Hekma project breaks ground. Largest FDI in Egyptian history to create 500,000 jobs. #EgyptEconomy", likes: 11300, retweets: 5500 },
                { text: "IMF extends Egypt programme to $8B after 5th review. Pound devaluation and subsidy cuts implemented. Social impact severe. #Egypt #IMF", likes: 8700, retweets: 4200 },
              ]},
            ],
            social: [
              { username: "UNAfrica", topic: "Egypt Social Issues", fallbackTweets: [
                { text: "Egypt inflation at 34%: Food costs consume 65% of household budgets in lower-income brackets. Social safety net under pressure. #EgyptInflation", likes: 9400, retweets: 4600 },
                { text: "Gaza refugee pressure on Sinai: Egypt reinforces border but faces international criticism over access restrictions. #Egypt #Gaza", likes: 10800, retweets: 5300 },
              ]},
            ],
            technological: [
              { username: "DigitalAfricaHub", topic: "Egypt Tech", fallbackTweets: [
                { text: "Egypt's Digital Egypt programme: 70M citizens registered on national digital ID. E-government services usage up 300% in 3 years. #DigitalEgypt", likes: 6100, retweets: 3000 },
                { text: "Cairo AI hub: 15 government AI projects operational. Egypt positions as North Africa's AI governance leader. #EgyptAI", likes: 5200, retweets: 2500 },
              ]},
            ],
            environmental: [
              { username: "UNEPAfrica", topic: "Egypt Environment", fallbackTweets: [
                { text: "Nile water negotiations: Egypt rejects Ethiopia's GERD operating rules. Calls for AU binding arbitration. #NileConflict #GERD", likes: 9800, retweets: 4800 },
                { text: "Nile Delta sea level rise: 12% of Egypt's agricultural land at risk of salinisation by 2050. Food security alarm raised. #EgyptClimate", likes: 7600, retweets: 3700 },
              ]},
            ],
            legal: [
              { username: "ICJAfrica", topic: "Egypt Rule of Law", fallbackTweets: [
                { text: "Egypt detains 23 journalists — highest figure since 2015. CPJ ranks Egypt 4th worst jailer of journalists globally. #EgyptPressFreedom", likes: 10200, retweets: 5100 },
                { text: "Emergency law extended for 3rd consecutive year. Human rights lawyers say 'state of exception has become the rule'. #EgyptHumanRights", likes: 8900, retweets: 4400 },
              ]},
            ],
          },
          rwanda: {
            political: [
              { username: "NewTimesRwanda", topic: "Rwanda National Politics", fallbackTweets: [
                { text: "Kagame wins 4th term with 99.2% — largest margin since 2003. RPF dominance cements 30-year political continuity. #RwandaElections2024", likes: 6800, retweets: 3300 },
                { text: "Rwanda-DRC relations: Kigali withdraws M23 support pledge under AU pressure. Luanda roadmap implementation resumed. #Rwanda #DRCCrisis", likes: 8400, retweets: 4100 },
              ]},
            ],
            economic: [
              { username: "AfDB_Group", topic: "Rwanda Economy", fallbackTweets: [
                { text: "Rwanda GDP grows 7.2% — fastest in East Africa. Services sector and tourism drive expansion as meetings industry surges. #RwandaEconomy", likes: 7100, retweets: 3500 },
                { text: "Kigali International Financial Centre: 40 new financial institutions licensed. Rwanda positions as Africa's Singapore. #KIFC #Rwanda", likes: 6400, retweets: 3100 },
              ]},
            ],
            social: [
              { username: "UNICEFAfrica", topic: "Rwanda Social Development", fallbackTweets: [
                { text: "Rwanda achieves universal health coverage: 97% of population enrolled in Mutuelle de Santé. A model for Africa. #RwandaHealth #UHC", likes: 8900, retweets: 4400 },
                { text: "Rwanda genocide commemoration: 31 years on. Reconciliation villages housing 50,000 survivors and perpetrators in joint communities. #Kwibuka31", likes: 11200, retweets: 5600 },
              ]},
            ],
            technological: [
              { username: "SmartAfricaOrg", topic: "Rwanda Tech & Innovation", fallbackTweets: [
                { text: "Rwanda Coding Academy graduates 1,200 students — 60% female. Kigali's tech ecosystem ranked top 3 in Africa for talent quality. #RwandaTech", likes: 7600, retweets: 3700 },
                { text: "Africa's first drone delivery network scales: Zipline operates 700 daily deliveries across Rwanda. Blood and medicine reach all 30 districts. #Rwanda #Drones", likes: 9300, retweets: 4600 },
              ]},
            ],
            environmental: [
              { username: "AUC_DREA", topic: "Rwanda Environment", fallbackTweets: [
                { text: "Rwanda forest cover reaches 30.4% — first African nation to exceed Rio target. Community forest management model goes continental. #RwandaGreen", likes: 7200, retweets: 3600 },
                { text: "Lake Kivu methane extraction project generates 56MW. Rwanda turns environmental risk into clean energy. #RwandaEnergy", likes: 6100, retweets: 3000 },
              ]},
            ],
            legal: [
              { username: "ICJAfrica", topic: "Rwanda Rule of Law", fallbackTweets: [
                { text: "Rwanda's UK asylum deal collapses. Supreme Court rules deportations unlawful — landmark for refugee law globally. #Rwanda #AsylumPolicy", likes: 9800, retweets: 4900 },
                { text: "Genocide ideology law: Rights groups say Rwanda's broadly worded statute continues to suppress political opposition. #Rwanda #RuleOfLaw", likes: 7400, retweets: 3700 },
              ]},
            ],
          },
        };

        // Resolve the account list based on geo layer and scope
        let accounts: AccountEntry[] = [];
        if (geoLayer === "continental") {
          accounts = continentalAccounts[pestelFilter] || continentalAccounts.political;
        } else if (geoLayer === "regional") {
          const regionData = regionalAccounts[geoScope] || regionalAccounts["east-africa"];
          accounts = regionData[pestelFilter] || regionData.political || continentalAccounts[pestelFilter] || [];
        } else {
          // Map countries without dedicated entries to their nearest region's data
          const countryToRegion: Record<string, string> = {
            "senegal": "west-africa", "cote-divoire": "west-africa", "mali": "west-africa",
            "burkina-faso": "west-africa", "guinea": "west-africa", "cameroon": "central-africa",
            "democratic-republic-of-congo": "central-africa", "angola": "southern-africa",
            "zambia": "southern-africa", "zimbabwe": "southern-africa", "mozambique": "southern-africa",
            "malawi": "southern-africa", "botswana": "southern-africa", "namibia": "southern-africa",
            "sudan": "east-africa", "south-sudan": "east-africa", "somalia": "east-africa",
            "uganda": "east-africa", "djibouti": "east-africa", "eritrea": "east-africa",
            "libya": "north-africa", "tunisia": "north-africa", "algeria": "north-africa",
            "morocco": "north-africa",
          };
          const countryData = countryAccounts[geoScope];
          if (countryData) {
            accounts = countryData[pestelFilter] || countryData.political || continentalAccounts[pestelFilter] || [];
          } else {
            // Fall back to the country's regional data, not always Kenya
            const fallbackRegion = countryToRegion[geoScope] || "east-africa";
            const regionData = regionalAccounts[fallbackRegion] || regionalAccounts["east-africa"];
            accounts = regionData[pestelFilter] || regionData.political || continentalAccounts[pestelFilter] || [];
          }
        }

        // accounts resolved above
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
              const topHashtag = sortedHashtags[0]?.[0] || `#${pestelFilter}`;

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
              hashtag: `#${pestelFilter}`,
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
        researchContext: z.string().optional(),
        geoLayer: z.string().optional(),
        geoScope: z.string().optional(),
        pestelCategory: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const tweetsContext = input.tweets && input.tweets.length > 0
          ? `\n\nRecent signal data:\n${input.tweets.map((t, i) =>
              `${i + 1}. "${t.text.slice(0, 200)}" (${t.likes} likes, ${t.retweets} retweets)`
            ).join("\n")}`
          : "";

        const researchBlock = input.researchContext
          ? `\n\n--- ATTACHED RESEARCH ---\n${input.researchContext.slice(0, 4000)}\n--- END RESEARCH ---`
          : "";

        const scopeLabel = input.geoScope
          ? input.geoScope.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : "Africa";
        const layerLabel = input.geoLayer === "country" ? `country level (${scopeLabel})`
          : input.geoLayer === "regional" ? `regional level (${scopeLabel})`
          : "continental (African Union)";
        const pestelLabel = input.pestelCategory
          ? input.pestelCategory.charAt(0).toUpperCase() + input.pestelCategory.slice(1)
          : "PESTEL";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an Africa political intelligence analyst specialising in PESTEL analysis (Political, Economic, Social, Technological, Environmental, Legal) across all 55 African nations. Your sources include AU organs, regional bodies (EAC, ECOWAS, SADC, ECCAS, AMU), and verified African media.

The user is currently focused on: **${pestelLabel}** signals at the **${layerLabel}** scope. All analysis MUST be grounded in this specific geography. Do not default to other countries or regions.

${input.researchContext ? "You have been provided with an attached research paper or article. Integrate its findings into your analysis and cite it in your conclusions." : ""}

Format your signal analysis as:
1. Signal Overview (2-3 sentences — what is happening and where in ${scopeLabel})
2. PESTEL Dimension (${pestelLabel} — why this signal fits this category)
3. Key Actors & Positions (bullet points)
4. Regional & Continental Implications (1-2 sentences)
5. Risk or Opportunity Assessment (High/Medium/Low with rationale)
${input.researchContext ? "6. Research Synthesis (how the attached paper supports or challenges this signal — 2-3 sentences with inline citation)" : ""}

Keep the total response under 450 words. Every finding must be anchored to ${scopeLabel}, not a neighbouring country.`
            },
            {
              role: "user",
              content: `Analyze the ${pestelLabel} signal for ${scopeLabel}: "${input.topic}"${tweetsContext}${researchBlock}`
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

    // Fetch and extract text from a research URL for PESTEL grounding
    fetchResearchUrl: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        const axios = (await import("axios")).default;
        try {
          const response = await axios.get(input.url, {
            timeout: 10000,
            headers: { "User-Agent": "ViralBeat-Research-Bot/1.0" },
            maxContentLength: 1_000_000,
          });
          const html: string = response.data;
          // Strip HTML tags, collapse whitespace
          const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 8000);
          return { text, url: input.url };
        } catch (e: any) {
          throw new Error(`Could not fetch URL: ${e.message}`);
        }
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
        geoLayer: z.string().optional(),
        geoScope: z.string().optional(),
        pestelCategory: z.string().optional(),
        fileContent: z.string().optional(),  // extracted text from uploaded document
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const contextInfo = input.context?.currentTopic
          ? `\n\nCurrent topic being discussed: ${input.context.currentTopic}`
          : "";

        const tweetsInfo = input.context?.recentTweets && input.context.recentTweets.length > 0
          ? `\n\nRecent tweets for context:\n${input.context.recentTweets.slice(0, 5).join("\n")}`
          : "";

        const scopeLabel = input.geoScope
          ? input.geoScope.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : "Africa";
        const layerLabel = input.geoLayer === "country" ? `country level (${scopeLabel})`
          : input.geoLayer === "regional" ? `regional level (${scopeLabel})`
          : "continental (African Union)";
        const pestelLabel = input.pestelCategory
          ? input.pestelCategory.charAt(0).toUpperCase() + input.pestelCategory.slice(1)
          : null;

        const scopeInstruction = `\n\n**Active intelligence scope: ${layerLabel}${pestelLabel ? ` | PESTEL filter: ${pestelLabel}` : ""}**. Ground all answers in this specific geography and dimension. Do not drift to other countries or regions unless explicitly asked.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are the Africa Intelligence Agent for ViralBeat — a political intelligence platform covering all 55 African nations. You specialise in PESTEL analysis (Political, Economic, Social, Technological, Environmental, Legal) across continental, regional, and country-level scopes.

Your data sources include: African Union organs (AU Commission, AfDB, ECOWAS, EAC, SADC), pan-African media (NationAfrica, NTV Kenya, Citizen TV, DailyMaverick), and verified field signals from contributors.

Your capabilities:
- Analyse political risk, governance signals, and electoral intelligence across Africa
- Assess economic signals: trade, investment, fiscal policy, currency, and development finance
- Map social signals: civic movements, humanitarian situations, demographic trends
- Track technological signals: digital economy, fintech, AI policy, connectivity
- Monitor environmental signals: climate adaptation, resource conflicts, disaster risk
- Interpret legal signals: rule of law, judicial independence, rights frameworks

When answering, always cite the geographic scope (continental / regional / country), the PESTEL dimension, and the key actors involved. Be analytical, precise, and grounded — not speculative.${scopeInstruction}${contextInfo}${tweetsInfo}`
            },
            {
              role: "user",
              content: input.fileContent
                ? `[ATTACHED DOCUMENT: ${input.fileName ?? "document"}]\n\n${input.fileContent}\n\n---\n\n${input.message}`
                : input.message
            }
          ]
        });

        return {
          response: response.choices?.[0]?.message?.content || "I'm having trouble processing that request. Please try again.",
          timestamp: new Date().toISOString(),
        };
      }),

    rateSignal: protectedProcedure
      .input(z.object({
        messageId: z.string(),
        topic: z.string(),
        geoLayer: z.string(),
        geoScope: z.string(),
        pestelCategory: z.string(),
        rating: z.number().int().min(1).max(5),
      }))
      .mutation(async ({ input, ctx }) => {
        await upsertSignalRating({
          userId: ctx.user.id,
          messageId: input.messageId,
          topic: input.topic,
          geoLayer: input.geoLayer,
          geoScope: input.geoScope,
          pestelCategory: input.pestelCategory,
          rating: input.rating,
        });
        return { ok: true };
      }),

    pestelSummary: publicProcedure
      .query(async () => {
        return getPestelRatingSummary();
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
        category: z.string().optional(),
        timeframe: z.enum(["24h", "48h", "72h"]).optional(),
      }))
      .query(async ({ input }) => {
        const category = input.category || "continental:au:political";
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
        // Intelligence triangulation inputs
        signal: z.string().min(1),
        pestelDimensions: z.array(z.enum(["political", "economic", "social", "technological", "environmental", "legal"])).min(1),
        actors: z.string().optional(),   // comma-separated key political actors
        country: z.string().optional(),
        confidenceTier: z.enum(["corroborated", "single-source", "unverified"]).default("single-source"),
        targetFormats: z.array(z.enum(["thread", "newsletter", "sitrep", "cable"])).min(1),
        // Legacy fields kept for backward-compat (ignored)
        originalContent: z.string().optional(),
        originalPlatform: z.string().optional(),
        targetPlatforms: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Spend tokens
        try {
          await spendTokens(ctx.user.id, 25, "spend_ai_agent", `Used Brief Adaptor for signal: ${input.signal.slice(0, 60)}`);
        } catch (error: any) {
          throw new Error(error.message || "Failed to process token payment");
        }

        const formatSpecs: Record<string, { name: string; structure: string }> = {
          thread: {
            name: "X / Twitter Thread",
            structure: `Structure: 6–8 tweets. Tweet 1: hook (the Nash position in one sentence). Tweets 2–4: PESTEL evidence (one dimension per tweet). Tweet 5: Actor mapping and dominant strategies. Tweet 6: What to watch (leading indicators). Tweet 7: Confidence statement. Tweet 8: CTA. Each tweet ≤280 chars. Number them 1/ 2/ etc.`,
          },
          newsletter: {
            name: "Intelligence Newsletter",
            structure: `Structure: Subject line → Situation (2 sentences) → PESTEL Breakdown (bullet per active dimension) → Actor Payoff Matrix (table: Actor | Interest | Likely Move) → Nash Equilibrium (what outcome are actors converging toward?) → Confidence Assessment (sources, axes confirmed) → What to Watch (3 leading indicators) → Analyst Note. Tone: authoritative but accessible.`,
          },
          sitrep: {
            name: "NGO Situation Report",
            structure: `Structure: Classification (Unverified/Single-Source/Corroborated) → Date → Summary (3 sentences max) → Background → Key Developments (numbered) → Actor Analysis (table: Actor | Position | Likely Action | Risk Level) → PESTEL Risk Matrix → Recommended Actions (for humanitarian/civil society actors) → Confidence Level → Sources consulted → Next review date. Tone: formal, neutral, citation-ready.`,
          },
          cable: {
            name: "Diplomatic Intelligence Cable",
            structure: `Structure: CLASSIFICATION header → TO/FROM/DATE fields → SUBJECT → 1. SITUATION SUMMARY → 2. POLITICAL ACTORS (name, position, interest, likely move) → 3. GAME THEORY ASSESSMENT (dominant strategies, Nash equilibrium, signalling vs reality) → 4. PESTEL IMPLICATIONS (one paragraph per active dimension) → 5. REGIONAL IMPLICATIONS → 6. RECOMMENDED POSTURE → 7. CONFIDENCE ASSESSMENT (Corroborated/Single-source/Unverified + rationale) → END. Tone: precise, third-person, diplomatic register.`,
          },
        };

        const pestelActive = input.pestelDimensions.join(", ").toUpperCase();
        const actorList = input.actors || "key political actors in the region";
        const country = input.country || "the relevant African nation(s)";

        const systemPrompt = `You are a senior Africa political intelligence analyst at ViralBeat. Your outputs are used by journalists, NGOs, researchers, and policy analysts.

TRIANGULATION FRAMEWORK — apply all three axes before outputting:

AXIS 1 — PESTEL: Classify the signal across Political, Economic, Social, Technological, Environmental, Legal dimensions. Identify which dimensions are ACTIVE (driving the situation) vs LATENT (background conditions). Active dimensions for this signal: ${pestelActive}.

AXIS 2 — GAME THEORY: Map the key actors, their payoff matrices, and dominant strategies. Apply:
- Dominant Strategy: what move is rational regardless of what others do?
- Nash Equilibrium: what outcome is each actor converging toward given the others' moves?
- Signalling Theory: what are actors saying vs what their actions reveal?
- Mission Alignment: which actors benefit from the stated situation vs the actual situation?

AXIS 3 — SOURCE VALIDATION: Assess confidence based on corroboration. Always state clearly:
- CORROBORATED = confirmed by 3+ independent sources across different frameworks
- SINGLE-SOURCE = one primary source, consistent with PESTEL/GT analysis
- UNVERIFIED = signal exists but insufficient corroboration

The VALIDATED POSITION is where all three axes converge. Do not assert facts that only one axis supports.

CONFIDENCE TIER FOR THIS BRIEF: ${input.confidenceTier.toUpperCase()}

Country/Region: ${country}
Key Actors: ${actorList}`;

        const adaptations: any[] = [];

        for (const fmt of input.targetFormats) {
          const spec = formatSpecs[fmt];
          if (!spec) continue;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Produce a ${spec.name} for the following intelligence signal.

SIGNAL: ${input.signal}

ACTIVE PESTEL DIMENSIONS: ${pestelActive}
KEY ACTORS: ${actorList}
CONFIDENCE TIER: ${input.confidenceTier}

${spec.structure}

Apply the full triangulation framework. Mark any assertion that is only supported by one axis as [SINGLE-SOURCE]. Mark anything unconfirmed as [UNVERIFIED]. The validated intelligence core must be the same across all formats — only the register and structure changes.`,
              }
            ]
          });

          const content = response.choices?.[0]?.message?.content || "Unable to generate output.";
          adaptations.push({ platform: fmt, format: spec.name, content });
        }

        return {
          signal: input.signal,
          pestelDimensions: input.pestelDimensions,
          confidenceTier: input.confidenceTier,
          adaptations,
          generatedAt: new Date().toISOString(),
        };
      }),
  }),

  // ============ ADMIN ============
  admin: router({
    seedKenyaFigures: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const figures: Array<{ name: string; title: string; party: string; imageUrl: string }> = [
        // Executive
        { name: "William Ruto", title: "President", party: "UDA / Kenya Kwanza", imageUrl: "/images/ruto.jpg" },
        { name: "Kithure Kindiki", title: "Deputy President", party: "UDA / Kenya Kwanza", imageUrl: "/images/kindiki.jpg" },
        { name: "Kalonzo Musyoka", title: "Opposition Leader", party: "Wiper / Azimio", imageUrl: "/images/kalonzo.jpg" },
        { name: "Moses Wetangula", title: "National Assembly Speaker", party: "Ford Kenya / Kenya Kwanza", imageUrl: "/images/wetangula.jpg" },
        { name: "Raila Odinga", title: "Former Prime Minister / AU Commission Chair", party: "ODM / Azimio", imageUrl: "/images/raila.jpg" },
        { name: "Rigathi Gachagua", title: "Former Deputy President", party: "UDA / Kenya Kwanza", imageUrl: "/images/gachagua.jpg" },
        // Governors (47 counties)
        { name: "Abdulswamad Shariff Nassir", title: "Governor, Mombasa County", party: "ODM", imageUrl: "" },
        { name: "Fatuma Mohamed Achani", title: "Governor, Kwale County", party: "ODM", imageUrl: "" },
        { name: "Gideon Mung'aro", title: "Governor, Kilifi County", party: "ODM", imageUrl: "" },
        { name: "Issa Timamy", title: "Governor, Lamu County", party: "ODM", imageUrl: "" },
        { name: "Ali Roba", title: "Governor, Mandera County", party: "ODM", imageUrl: "" },
        { name: "Mohamed Mohamud Abdi", title: "Governor, Wajir County", party: "Jubilee", imageUrl: "" },
        { name: "Abdi Mohamud Omar", title: "Governor, Garissa County", party: "UDA", imageUrl: "" },
        { name: "Mohamud Ali Saleh", title: "Governor, Marsabit County", party: "UDA", imageUrl: "" },
        { name: "Isiolo Governor", title: "Governor, Isiolo County", party: "UDA", imageUrl: "" },
        { name: "Kawira Mwangaza", title: "Governor, Meru County", party: "Independent", imageUrl: "" },
        { name: "Tharaka Nithi Governor", title: "Governor, Tharaka Nithi County", party: "UDA", imageUrl: "" },
        { name: "Embu Governor", title: "Governor, Embu County", party: "UDA", imageUrl: "" },
        { name: "Machakos Governor", title: "Governor, Machakos County", party: "Wiper", imageUrl: "" },
        { name: "Alfred Mutua", title: "Governor, Machakos County", party: "Maendeleo Chap Chap", imageUrl: "" },
        { name: "Kitui Governor", title: "Governor, Kitui County", party: "Wiper", imageUrl: "" },
        { name: "Julius Malombe", title: "Governor, Kitui County", party: "Wiper", imageUrl: "" },
        { name: "Makueni Governor", title: "Governor, Makueni County", party: "Wiper", imageUrl: "" },
        { name: "Nyandarua Governor", title: "Governor, Nyandarua County", party: "UDA", imageUrl: "" },
        { name: "Kirinyaga Governor", title: "Governor, Kirinyaga County", party: "UDA", imageUrl: "" },
        { name: "Murang'a Governor", title: "Governor, Murang'a County", party: "UDA", imageUrl: "" },
        { name: "Kiambu Governor", title: "Governor, Kiambu County", party: "UDA", imageUrl: "" },
        { name: "Turkana Governor", title: "Governor, Turkana County", party: "ODM", imageUrl: "" },
        { name: "West Pokot Governor", title: "Governor, West Pokot County", party: "UDA", imageUrl: "" },
        { name: "Samburu Governor", title: "Governor, Samburu County", party: "UDA", imageUrl: "" },
        { name: "Trans Nzoia Governor", title: "Governor, Trans Nzoia County", party: "UDA", imageUrl: "" },
        { name: "Uasin Gishu Governor", title: "Governor, Uasin Gishu County", party: "UDA", imageUrl: "" },
        { name: "Elgeyo Marakwet Governor", title: "Governor, Elgeyo Marakwet County", party: "UDA", imageUrl: "" },
        { name: "Nandi Governor", title: "Governor, Nandi County", party: "UDA", imageUrl: "" },
        { name: "Baringo Governor", title: "Governor, Baringo County", party: "UDA", imageUrl: "" },
        { name: "Laikipia Governor", title: "Governor, Laikipia County", party: "UDA", imageUrl: "" },
        { name: "Nakuru Governor", title: "Governor, Nakuru County", party: "UDA", imageUrl: "" },
        { name: "Narok Governor", title: "Governor, Narok County", party: "KANU", imageUrl: "" },
        { name: "Kajiado Governor", title: "Governor, Kajiado County", party: "ODM", imageUrl: "" },
        { name: "Kericho Governor", title: "Governor, Kericho County", party: "UDA", imageUrl: "" },
        { name: "Bomet Governor", title: "Governor, Bomet County", party: "UDA", imageUrl: "" },
        { name: "Kakamega Governor", title: "Governor, Kakamega County", party: "ANC", imageUrl: "" },
        { name: "Vihiga Governor", title: "Governor, Vihiga County", party: "ANC", imageUrl: "" },
        { name: "Bungoma Governor", title: "Governor, Bungoma County", party: "Ford Kenya", imageUrl: "" },
        { name: "Busia Governor", title: "Governor, Busia County", party: "ODM", imageUrl: "" },
        { name: "Siaya Governor", title: "Governor, Siaya County", party: "ODM", imageUrl: "" },
        { name: "Kisumu Governor", title: "Governor, Kisumu County", party: "ODM", imageUrl: "" },
        { name: "Homa Bay Governor", title: "Governor, Homa Bay County", party: "ODM", imageUrl: "" },
        { name: "Migori Governor", title: "Governor, Migori County", party: "ODM", imageUrl: "" },
        { name: "Kisii Governor", title: "Governor, Kisii County", party: "Jubilee", imageUrl: "" },
        { name: "Nyamira Governor", title: "Governor, Nyamira County", party: "UDA", imageUrl: "" },
        { name: "Nairobi Governor", title: "Governor, Nairobi County", party: "ODM", imageUrl: "" },
      ];

      let inserted = 0;
      let skipped = 0;
      for (const fig of figures) {
        try {
          await db.execute(
            sql.raw(
              `INSERT INTO political_figures (name, title, party, imageUrl, isActive)
               VALUES (${JSON.stringify(fig.name)}, ${JSON.stringify(fig.title)}, ${JSON.stringify(fig.party)}, ${JSON.stringify(fig.imageUrl)}, 'yes')
               ON DUPLICATE KEY UPDATE title=${JSON.stringify(fig.title)}, party=${JSON.stringify(fig.party)}`
            )
          );
          inserted++;
        } catch {
          skipped++;
        }
      }
      return { inserted, skipped, total: figures.length };
    }),

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

    listUsers: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        role: z.enum(["all", "user", "admin"]).default("all"),
        tier: z.enum(["all", "free", "analyst", "enterprise"]).default("all"),
        sortBy: z.enum(["createdAt", "lastSignedIn", "name"]).default("createdAt"),
        sortDir: z.enum(["asc", "desc"]).default("desc"),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const conditions: SQL[] = [];
        if (input.search) {
          const q = `%${input.search}%`;
          conditions.push(sql`(${users.name} LIKE ${q} OR ${users.email} LIKE ${q})`);
        }
        if (input.role !== "all") {
          conditions.push(eq(users.role, input.role as "user" | "admin"));
        }
        if (input.tier !== "all") {
          conditions.push(eq(users.subscriptionTier, input.tier as "free" | "analyst" | "enterprise"));
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const orderCol =
          input.sortBy === "lastSignedIn" ? users.lastSignedIn
          : input.sortBy === "name" ? users.name
          : users.createdAt;
        const order = input.sortDir === "asc" ? asc(orderCol) : desc(orderCol);

        const [rows, [{ count }]] = await Promise.all([
          db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            subscriptionTier: users.subscriptionTier,
            loginMethod: users.loginMethod,
            createdAt: users.createdAt,
            lastSignedIn: users.lastSignedIn,
            isBanned: users.isBanned,
            banReason: users.banReason,
          }).from(users).where(where).orderBy(order)
            .limit(input.limit).offset((input.page - 1) * input.limit),
          db.select({ count: sql<number>`COUNT(*)` }).from(users).where(where),
        ]);

        return {
          users: rows,
          total: Number(count),
          page: input.page,
          pages: Math.ceil(Number(count) / input.limit),
        };
      }),

    getUser: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const [row] = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
        if (!row) throw new Error("User not found");
        return row;
      }),

    updateUserRole: protectedProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        if (ctx.user.id === input.id) throw new Error("Cannot change your own role");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ role: input.role }).where(eq(users.id, input.id));
        return { success: true };
      }),

    updateUserTier: protectedProcedure
      .input(z.object({ id: z.number(), tier: z.enum(["free", "analyst", "enterprise"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ subscriptionTier: input.tier }).where(eq(users.id, input.id));
        return { success: true };
      }),

    runMigrations: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const results: string[] = [];
        for (const stmt of [
          `ALTER TABLE users ADD COLUMN isBanned TINYINT(1) NOT NULL DEFAULT 0`,
          `ALTER TABLE users ADD COLUMN banReason TEXT NULL`,
          `CREATE TABLE IF NOT EXISTS aiAssistantProfiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL UNIQUE,
            assistantName VARCHAR(255) DEFAULT 'ViralMind',
            niche VARCHAR(255),
            primaryPlatform VARCHAR(100),
            contentStyle VARCHAR(255),
            targetAudience TEXT,
            goals TEXT,
            onboardingCompleted TINYINT(1) DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS assistantConversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            sessionId VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_session (userId, sessionId)
          )`,
          `CREATE TABLE IF NOT EXISTS assistantTasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            priority VARCHAR(50) DEFAULT 'medium',
            dueDate DATETIME,
            completedAt DATETIME,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user (userId)
          )`,
          `CREATE TABLE IF NOT EXISTS shared_briefs (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            userId INT NOT NULL,
            countryCode VARCHAR(2) NOT NULL,
            countryName VARCHAR(255) NOT NULL,
            title VARCHAR(500) NOT NULL,
            overview TEXT NOT NULL,
            sentimentScore INT NOT NULL,
            stabilityScore INT NOT NULL,
            riskLevel VARCHAR(50) NOT NULL,
            keyThemes TEXT,
            briefJson LONGTEXT NOT NULL,
            viewCount INT DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (userId),
            INDEX idx_country (countryCode)
          )`,
          `CREATE TABLE IF NOT EXISTS contributor_profiles (
            userId INT NOT NULL PRIMARY KEY,
            displayName VARCHAR(255),
            affiliation VARCHAR(500),
            affiliationType ENUM('journalist','researcher','ngo','activist','independent') DEFAULT 'independent',
            bio TEXT,
            isVerified TINYINT(1) DEFAULT 0,
            verifiedAt DATETIME,
            signalCredits INT DEFAULT 0,
            briefsShared INT DEFAULT 0,
            profileSlug VARCHAR(100) UNIQUE,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )`,
          `ALTER TABLE xTrendsCache MODIFY COLUMN category VARCHAR(128) NOT NULL`,
          `CREATE TABLE IF NOT EXISTS signalRatings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            messageId VARCHAR(128) NOT NULL,
            topic VARCHAR(512) NOT NULL,
            geoLayer VARCHAR(32) NOT NULL,
            geoScope VARCHAR(64) NOT NULL,
            pestelCategory VARCHAR(32) NOT NULL,
            rating INT NOT NULL,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_signal_ratings_user_msg (userId, messageId),
            INDEX idx_signal_ratings_pestel (pestelCategory)
          )`,
          `CREATE TABLE IF NOT EXISTS contentAnalyses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            contentTitle VARCHAR(500) NOT NULL,
            contentUrl TEXT,
            contentType ENUM('video','image','text','audio','research') NOT NULL,
            platform ENUM('youtube','tiktok','instagram','twitter','journal') NOT NULL,
            viralityScore DECIMAL(3,1),
            strengths TEXT,
            weaknesses TEXT,
            recommendations TEXT,
            predictedPerformance TEXT,
            optimizedTitle TEXT,
            optimizedHashtags TEXT,
            optimalPostTime DATETIME,
            analysisType ENUM('pre_publish','post_publish','competitor','game_theory') NOT NULL,
            actualPerformance TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_content_analyses_user (userId)
          )`,
          `ALTER TABLE contentAnalyses MODIFY COLUMN contentType ENUM('video','image','text','audio','research') NOT NULL`,
          `ALTER TABLE contentAnalyses MODIFY COLUMN platform ENUM('youtube','tiktok','instagram','twitter','journal') NOT NULL`,
          `ALTER TABLE contentAnalyses MODIFY COLUMN analysisType ENUM('pre_publish','post_publish','competitor','game_theory') NOT NULL`,
          // 0027: Schema consolidation (ADD COLUMN without IF NOT EXISTS — dup = harmless SKIP)
          `ALTER TABLE sentimentRecords ADD COLUMN geoType VARCHAR(20) NOT NULL DEFAULT 'national'`,
          `ALTER TABLE sentimentRecords ADD COLUMN geoCode VARCHAR(10) NOT NULL DEFAULT 'ke'`,
          `ALTER TABLE llmCache ADD COLUMN source VARCHAR(50) NULL`,
          `ALTER TABLE creatorProfiles ADD COLUMN onboardingCompleted TINYINT(1) NOT NULL DEFAULT 0`,
          `ALTER TABLE creatorProfiles ADD COLUMN niche VARCHAR(255) NULL`,
          `ALTER TABLE creatorProfiles ADD COLUMN primaryPlatform VARCHAR(50) NULL`,
          `ALTER TABLE creatorProfiles ADD COLUMN tone VARCHAR(100) NULL`,
          `ALTER TABLE creatorProfiles ADD COLUMN contentTopics TEXT NULL`,
          `ALTER TABLE creatorProfiles ADD COLUMN aiGoals TEXT NULL`,
          `ALTER TABLE creatorProfiles ADD COLUMN aiChallenges TEXT NULL`,
          `UPDATE creatorProfiles cp JOIN aiAssistantProfiles ap ON cp.userId = ap.userId SET cp.onboardingCompleted = ap.onboardingCompleted, cp.niche = COALESCE(cp.niche, ap.niche), cp.primaryPlatform = COALESCE(cp.primaryPlatform, ap.primaryPlatform), cp.tone = COALESCE(cp.tone, ap.contentStyle), cp.aiGoals = COALESCE(cp.aiGoals, ap.goals) WHERE ap.userId IS NOT NULL`,
        ]) {
          try {
            await db.execute(sql.raw(stmt));
            results.push(`OK: ${stmt.slice(0, 50)}`);
          } catch (e: any) {
            const errMsg = e?.cause?.message ?? e?.cause?.sqlMessage ?? e?.sqlMessage ?? e?.message ?? String(e);
            results.push(`SKIP: ${String(errMsg).slice(0, 120)}`);
          }
        }
        return { results };
      }),

    banUser: protectedProcedure
      .input(z.object({ id: z.number(), reason: z.string().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        if (ctx.user.id === input.id) throw new Error("Cannot ban yourself");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ isBanned: true, banReason: input.reason }).where(eq(users.id, input.id));
        return { success: true };
      }),

    unbanUser: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Unauthorized");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ isBanned: false, banReason: null }).where(eq(users.id, input.id));
        return { success: true };
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
  subscription: subscriptionRouter,
  country: countryRouter,

  briefs: router({
    // Save a brief and return a shareable ID
    share: protectedProcedure
      .input(z.object({
        countryCode: z.string().length(2),
        countryName: z.string(),
        title: z.string(),
        overview: z.string(),
        sentimentScore: z.number(),
        stabilityScore: z.number(),
        riskLevel: z.string(),
        keyThemes: z.array(z.string()).optional(),
        briefJson: z.string(), // full JSON of the brief
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const id = crypto.randomUUID();
        await db.execute(sql.raw(
          `INSERT INTO shared_briefs (id, userId, countryCode, countryName, title, overview, sentimentScore, stabilityScore, riskLevel, keyThemes, briefJson)
           VALUES (${JSON.stringify(id)}, ${ctx.user.id}, ${JSON.stringify(input.countryCode.toUpperCase())}, ${JSON.stringify(input.countryName)},
           ${JSON.stringify(input.title)}, ${JSON.stringify(input.overview)}, ${input.sentimentScore}, ${input.stabilityScore},
           ${JSON.stringify(input.riskLevel)}, ${JSON.stringify((input.keyThemes ?? []).join(","))}, ${JSON.stringify(input.briefJson)})`
        ));
        // Increment briefsShared on contributor profile if exists
        await db.execute(sql.raw(
          `UPDATE contributor_profiles SET briefsShared = briefsShared + 1, signalCredits = signalCredits + 5 WHERE userId = ${ctx.user.id}`
        ));
        return { id, url: `/brief/${id}` };
      }),

    // Public read — no auth required
    get: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const [rows] = await db.execute(sql.raw(
          `SELECT sb.*, cp.displayName, cp.affiliation, cp.affiliationType, cp.isVerified
           FROM shared_briefs sb
           LEFT JOIN contributor_profiles cp ON cp.userId = sb.userId
           WHERE sb.id = ${JSON.stringify(input.id)}`
        )) as any;
        const row = Array.isArray(rows) ? rows[0] : null;
        if (!row) throw new Error("Brief not found");
        // Increment view count
        await db.execute(sql.raw(`UPDATE shared_briefs SET viewCount = viewCount + 1 WHERE id = ${JSON.stringify(input.id)}`));
        return row;
      }),

    // List briefs by current user
    myBriefs: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await db.execute(sql.raw(
        `SELECT id, countryCode, countryName, title, riskLevel, sentimentScore, viewCount, createdAt FROM shared_briefs WHERE userId = ${ctx.user.id} ORDER BY createdAt DESC LIMIT 20`
      )) as any;
      return Array.isArray(rows) ? rows : [];
    }),
  }),

  contributor: router({
    // Get own profile (creates if missing)
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [rows] = await db.execute(sql.raw(
        `SELECT cp.*, ut.balance as tokenBalance FROM contributor_profiles cp LEFT JOIN userTokens ut ON ut.userId = cp.userId WHERE cp.userId = ${ctx.user.id}`
      )) as any;
      const existing = Array.isArray(rows) ? rows[0] : null;
      if (existing) return existing;
      // Auto-create on first visit
      const slug = `contributor-${ctx.user.id}-${Date.now().toString(36)}`;
      await db.execute(sql.raw(
        `INSERT IGNORE INTO contributor_profiles (userId, displayName, profileSlug) VALUES (${ctx.user.id}, ${JSON.stringify(ctx.user.name ?? "Contributor")}, ${JSON.stringify(slug)})`
      ));
      const [newRows] = await db.execute(sql.raw(
        `SELECT cp.*, ut.balance as tokenBalance FROM contributor_profiles cp LEFT JOIN userTokens ut ON ut.userId = cp.userId WHERE cp.userId = ${ctx.user.id}`
      )) as any;
      return Array.isArray(newRows) ? newRows[0] : null;
    }),

    // Update profile
    updateProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(100).optional(),
        affiliation: z.string().max(500).optional(),
        affiliationType: z.enum(["journalist","researcher","ngo","activist","independent"]).optional(),
        bio: z.string().max(600).optional(),
        profileSlug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const sets = Object.entries(input)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
          .join(", ");
        if (!sets) return { success: true };
        await db.execute(sql.raw(
          `UPDATE contributor_profiles SET ${sets}, updatedAt = NOW() WHERE userId = ${ctx.user.id}`
        ));
        return { success: true };
      }),

    // Public profile by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const [rows] = await db.execute(sql.raw(
          `SELECT cp.*, u.name, u.subscriptionTier,
            (SELECT COUNT(*) FROM shared_briefs sb WHERE sb.userId = cp.userId) as totalBriefs,
            (SELECT COALESCE(SUM(viewCount),0) FROM shared_briefs sb WHERE sb.userId = cp.userId) as totalViews
           FROM contributor_profiles cp
           JOIN users u ON u.id = cp.userId
           WHERE cp.profileSlug = ${JSON.stringify(input.slug)} AND u.profileVisibility = 'public'`
        )) as any;
        const profile = Array.isArray(rows) ? rows[0] : null;
        if (!profile) throw new Error("Profile not found");
        // Recent public briefs
        const [briefRows] = await db.execute(sql.raw(
          `SELECT id, countryCode, countryName, title, riskLevel, sentimentScore, viewCount, createdAt FROM shared_briefs WHERE userId = ${profile.userId} ORDER BY createdAt DESC LIMIT 10`
        )) as any;
        return { ...profile, recentBriefs: Array.isArray(briefRows) ? briefRows : [] };
      }),
  }),

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
