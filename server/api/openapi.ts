export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Viral Beat API",
    version: "1.0.0",
    description:
      "Public REST API for trend intelligence, Kenya political data, and AI forecasting. " +
      "All endpoints require an API key passed via the `X-API-Key` header.",
    contact: { email: "api@viralbeat.io" },
  },
  servers: [
    { url: "https://viralbeat.io/api/v1", description: "Production" },
    { url: "http://localhost:3000/api/v1", description: "Local dev" },
  ],
  security: [{ ApiKeyAuth: [] }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "Obtain a key from your Viral Beat dashboard under Settings → API Keys.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
        },
      },
      TrendSearchResult: {
        type: "object",
        properties: {
          youtube: { type: "array", items: { type: "object" } },
          tiktok: { type: "array", items: { type: "object" } },
          viralityScore: { type: "number", description: "0–100" },
          sentiment: {
            type: "object",
            properties: {
              positive: { type: "number" },
              negative: { type: "number" },
              neutral: { type: "number" },
              summary: { type: "string" },
            },
          },
          topCreators: { type: "array", items: { type: "object" } },
          trendData: {
            type: "array",
            items: {
              type: "object",
              properties: { day: { type: "string" }, value: { type: "number" } },
            },
          },
        },
      },
      ViralityResult: {
        type: "object",
        properties: {
          viralityScore: { type: "number" },
          trendChange: { type: "number" },
          views: { type: "integer" },
          likes: { type: "integer" },
          shares: { type: "integer" },
          platforms: {
            type: "array",
            items: {
              type: "object",
              properties: { name: { type: "string" }, percentage: { type: "number" } },
            },
          },
        },
      },
      ForecastPrediction: {
        type: "object",
        properties: {
          topic: { type: "string" },
          confidence: { type: "number", description: "0–100" },
          peakTime: { type: "string" },
          reasoning: { type: "string" },
          action: { type: "string", description: "Recommended action for creators" },
        },
      },
      SentimentAnalysis: {
        type: "object",
        properties: {
          sentimentScore: { type: "number", description: "0–100" },
          positive: { type: "number" },
          negative: { type: "number" },
          neutral: { type: "number" },
          summary: { type: "string" },
          keyThemes: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
  paths: {
    "/trends/search": {
      get: {
        tags: ["Trends"],
        summary: "Search trending content",
        description: "Search for trending content across YouTube, TikTok, and Twitter/X. Returns videos, virality score, sentiment analysis, and top creators.",
        parameters: [
          { name: "query", in: "query", schema: { type: "string" }, description: "Search query (defaults to 'trending')" },
          { name: "platform", in: "query", schema: { type: "string", enum: ["all", "youtube", "tiktok", "twitter", "instagram"], default: "all" } },
        ],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/TrendSearchResult" } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/trends/virality": {
      get: {
        tags: ["Trends"],
        summary: "Virality score for a topic",
        description: "Returns a virality score (0–100), platform distribution, estimated views/likes/shares for any topic.",
        parameters: [
          { name: "topic", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/ViralityResult" } } } },
          "400": { description: "topic is required" },
        },
      },
    },
    "/trends/top-voted": {
      get: {
        tags: ["Trends"],
        summary: "Community top-voted topics",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
        ],
        responses: {
          "200": { description: "OK" },
        },
      },
    },
    "/trends/x": {
      get: {
        tags: ["Trends"],
        summary: "Trending X (Twitter) topics",
        description: "Live trending topics sourced from influential X accounts, grouped by category.",
        parameters: [
          {
            name: "category",
            in: "query",
            schema: { type: "string", enum: ["general", "tech", "entertainment", "sports", "politics", "business"], default: "general" },
          },
        ],
        responses: {
          "200": { description: "OK" },
        },
      },
    },
    "/trends/x/summarize": {
      post: {
        tags: ["Trends"],
        summary: "AI summary of X trend",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["topic"],
                properties: {
                  topic: { type: "string" },
                  tweets: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        likes: { type: "integer" },
                        retweets: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { "200": { description: "AI-generated summary" } },
      },
    },
    "/ai/forecast": {
      get: {
        tags: ["AI"],
        summary: "AI trend forecast",
        description: "Uses an LLM to predict which topics will go viral in the next 24–72 hours, with confidence scores and creator action tips.",
        parameters: [
          {
            name: "category",
            in: "query",
            schema: { type: "string", enum: ["general", "tech", "entertainment", "sports", "politics", "business"], default: "general" },
          },
          { name: "timeframe", in: "query", schema: { type: "string", enum: ["24h", "48h", "72h"], default: "48h" } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    timeframe: { type: "string" },
                    predictions: { type: "array", items: { $ref: "#/components/schemas/ForecastPrediction" } },
                    generatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/kenya/news": {
      get: {
        tags: ["Kenya"],
        summary: "Latest Kenyan news",
        description: "Aggregated news from Nation Media and The Standard RSS feeds with trending topic extraction.",
        responses: { "200": { description: "OK" } },
      },
    },
    "/kenya/news/trending": {
      get: {
        tags: ["Kenya"],
        summary: "Trending Kenyan news topics",
        responses: { "200": { description: "OK" } },
      },
    },
    "/kenya/sentiment": {
      get: {
        tags: ["Kenya"],
        summary: "Political sentiment history",
        parameters: [
          { name: "figureId", in: "query", schema: { type: "integer" }, description: "Filter by political figure ID" },
          { name: "days", in: "query", schema: { type: "integer", default: 30 } },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
    "/kenya/sentiment/analyze": {
      post: {
        tags: ["Kenya"],
        summary: "Analyze sentiment of Kenyan political text",
        description: "Runs AI sentiment analysis on any text in the context of Kenyan politics. Returns scores, emotions, and key themes.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: { text: { type: "string" }, context: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/SentimentAnalysis" } } } },
        },
      },
    },
    "/kenya/counties": {
      get: {
        tags: ["Kenya"],
        summary: "Sentiment scores for all 47 counties",
        responses: { "200": { description: "OK" } },
      },
    },
    "/kenya/figures": {
      get: {
        tags: ["Kenya"],
        summary: "Active Kenyan political figures",
        responses: { "200": { description: "OK" } },
      },
    },
    "/kenya/movements": {
      get: {
        tags: ["Kenya"],
        summary: "Active civic movements",
        description: "Lists all civic movements tracked by the platform (e.g. Linda Mwananchi, GenZ protests) with current status and leaders.",
        responses: { "200": { description: "OK" } },
      },
    },
    "/kenya/movements/{id}": {
      get: {
        tags: ["Kenya"],
        summary: "Single civic movement with latest news",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Movement not found" } },
      },
    },
  },
  // Re-usable response refs
} as const;

// Patch in response refs after the fact (TypeScript can't handle circular $ref in const)
(openapiSpec as any).components.responses = {
  Unauthorized: {
    description: "Missing or invalid API key",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },
};
