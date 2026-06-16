import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { userPurchases, marketplaceItems } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { callDataApi } from "../_core/dataApi";
import { invokeLLM } from "../_core/llm";

/**
 * Middleware to check if user has premium analytics access
 */
async function checkPremiumAccess(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const now = new Date();

  const purchases = await db
    .select({
      expiresAt: userPurchases.expiresAt,
      category: marketplaceItems.category,
    })
    .from(userPurchases)
    .leftJoin(marketplaceItems, eq(userPurchases.itemId, marketplaceItems.id))
    .where(
      and(
        eq(userPurchases.userId, userId),
        eq(userPurchases.isActive, true),
        eq(marketplaceItems.category, "analytics")
      )
    );

  // Check if any purchase is still active
  return purchases.some(p => {
    if (!p.expiresAt) return true; // Permanent
    return new Date(p.expiresAt) > now;
  });
}

export const premiumAnalyticsRouter = router({
  /**
   * Check if user has premium access
   */
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    const hasAccess = await checkPremiumAccess(ctx.user.id);
    return { hasAccess };
  }),

  /**
   * Competitor Analysis - Compare multiple creators side by side
   */
  compareCreators: protectedProcedure
    .input(z.object({
      creators: z.array(z.object({
        platform: z.enum(["youtube", "tiktok", "twitter", "instagram"]),
        handle: z.string(),
      })).min(2).max(5),
    }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await checkPremiumAccess(ctx.user.id);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Premium Analytics access required. Purchase from the marketplace to unlock this feature.",
        });
      }

      // Fetch data for each creator
      const comparisons = await Promise.all(
        input.creators.map(async (creator) => {
          try {
            // For now, return mock data since we don't have specific creator stats API
            const response = {
              followers: Math.floor(Math.random() * 1000000),
              avgViews: Math.floor(Math.random() * 500000),
              engagementRate: (Math.random() * 10).toFixed(2),
              growthRate: (Math.random() * 50).toFixed(2),
              postFrequency: Math.floor(Math.random() * 30),
            };

            // Extract relevant metrics
            return {
              platform: creator.platform,
              handle: creator.handle,
              followers: extractMetric(response, "followers"),
              avgViews: extractMetric(response, "average views"),
              engagementRate: extractMetric(response, "engagement rate"),
              growthRate: extractMetric(response, "growth rate"),
              postFrequency: extractMetric(response, "post frequency"),
            };
          } catch (error) {
            return {
              platform: creator.platform,
              handle: creator.handle,
              error: "Failed to fetch data",
            };
          }
        })
      );

      return { comparisons };
    }),

  /**
   * Advanced Trend Insights - Deeper metrics and analysis
   */
  getAdvancedInsights: protectedProcedure
    .input(z.object({
      topic: z.string(),
      platform: z.enum(["youtube", "tiktok", "twitter", "instagram", "all"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await checkPremiumAccess(ctx.user.id);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Premium Analytics access required. Purchase from the marketplace to unlock this feature.",
        });
      }

      // For now, use mock data for trend analysis
      const response = {
        mentions: Math.floor(Math.random() * 10000),
        engagement: Math.floor(Math.random() * 5000),
        sentiment: (Math.random() * 10).toFixed(1),
        reach: Math.floor(Math.random() * 1000000),
      };

      // Use LLM to analyze and extract insights
      const analysis = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a social media analytics expert. Analyze the provided data and extract key insights about trends, engagement patterns, and audience behavior.",
          },
          {
            role: "user",
            content: `Analyze this trend data for "${input.topic}":\n\n${JSON.stringify(response, null, 2)}\n\nProvide insights on:\n1. Peak engagement times\n2. Content formats performing best\n3. Audience sentiment\n4. Growth trajectory\n5. Competitive landscape`,
          },
        ],
      });

      const content = analysis.choices[0]?.message?.content;
      const insights = typeof content === 'string' ? content : "No insights available";

      return {
        topic: input.topic,
        insights,
        metrics: {
          totalMentions: extractMetric(response, "mentions"),
          averageEngagement: extractMetric(response, "engagement"),
          sentimentScore: extractMetric(response, "sentiment"),
          reachEstimate: extractMetric(response, "reach"),
        },
      };
    }),

  /**
   * Predictive Forecasting - AI-powered predictions
   */
  getForecast: protectedProcedure
    .input(z.object({
      topic: z.string(),
      timeframe: z.enum(["7days", "30days"]),
    }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await checkPremiumAccess(ctx.user.id);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Premium Analytics access required. Purchase from the marketplace to unlock this feature.",
        });
      }

      // Generate mock historical data
      const historicalData = {
        pastWeek: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          engagement: Math.floor(Math.random() * 10000),
          views: Math.floor(Math.random() * 50000),
        })),
      };

      // Use LLM to generate forecast
      const forecast = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a predictive analytics expert specializing in social media trends. Generate realistic forecasts based on historical data patterns.",
          },
          {
            role: "user",
            content: `Based on this historical data for "${input.topic}":\n\n${JSON.stringify(historicalData, null, 2)}\n\nGenerate a ${input.timeframe} forecast including:\n1. Expected engagement levels\n2. Predicted virality score (0-10)\n3. Growth trajectory\n4. Key events or factors that may influence the trend\n5. Confidence level (0-100%)\n\nRespond in JSON format with these fields: predictions (array of daily predictions), viralityScore, growthRate, keyFactors (array), confidenceLevel.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "forecast_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  description: "Daily predictions for the timeframe",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string", description: "Date in YYYY-MM-DD format" },
                      engagement: { type: "number", description: "Predicted engagement level" },
                      views: { type: "number", description: "Predicted view count" },
                    },
                    required: ["date", "engagement", "views"],
                    additionalProperties: false,
                  },
                },
                viralityScore: { type: "number", description: "Predicted virality score (0-10)" },
                growthRate: { type: "number", description: "Expected growth rate percentage" },
                keyFactors: {
                  type: "array",
                  description: "Key factors influencing the forecast",
                  items: { type: "string" },
                },
                confidenceLevel: { type: "number", description: "Forecast confidence (0-100)" },
              },
              required: ["predictions", "viralityScore", "growthRate", "keyFactors", "confidenceLevel"],
              additionalProperties: false,
            },
          },
        },
      });

      let forecastData;
      try {
        const content = forecast.choices[0]?.message?.content;
        forecastData = typeof content === 'string' ? JSON.parse(content) : {};
      } catch {
        forecastData = {};
      }

      return {
        topic: input.topic,
        timeframe: input.timeframe,
        forecast: forecastData,
      };
    }),
});

/**
 * Helper function to extract metrics from API response
 */
function extractMetric(data: any, metricName: string): number | string | null {
  // Simple extraction logic - in production, this would be more sophisticated
  const dataStr = JSON.stringify(data).toLowerCase();
  
  if (dataStr.includes(metricName.toLowerCase())) {
    // Try to extract a number near the metric name
    const regex = new RegExp(`${metricName.toLowerCase()}[:\\s]+([\\d,]+)`, 'i');
    const match = dataStr.match(regex);
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ''));
    }
  }
  
  return null;
}
