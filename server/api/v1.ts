import { Router } from "express";
import { appRouter } from "../routers";
import { invokeLLM } from "../_core/llm";
import { apiKeyMiddleware } from "./middleware";

// Caller with null user — all public procedures pass through, protected ones throw.
const caller = () =>
  appRouter.createCaller({ user: null, req: null as any, res: null as any });

const v1 = Router();
v1.use(apiKeyMiddleware);

// ─── Helpers ────────────────────────────────────────────────────────────────

function ok(res: any, data: unknown) {
  res.json({ success: true, data });
}

function err(res: any, status: number, message: string) {
  res.status(status).json({ success: false, error: message });
}

function wrap(handler: (req: any, res: any) => Promise<void>) {
  return async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (e: any) {
      const status = e?.code === "UNAUTHORIZED" ? 401 : e?.code === "FORBIDDEN" ? 403 : 500;
      err(res, status, e?.message || "Internal server error");
    }
  };
}

// ─── TRENDS ─────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /trends/search:
 *   get:
 *     summary: Search trending content across platforms
 *     parameters:
 *       - name: query
 *         in: query
 *         schema: { type: string }
 *       - name: platform
 *         in: query
 *         schema: { type: string, enum: [all, youtube, tiktok, twitter, instagram] }
 */
v1.get(
  "/trends/search",
  wrap(async (req, res) => {
    const query = String(req.query.query || "");
    const platform = (req.query.platform as any) || "all";
    const data = await caller().trends.search({ query, platform });
    ok(res, data);
  })
);

/**
 * @openapi
 * /trends/virality:
 *   get:
 *     summary: Get virality score and platform breakdown for a topic
 *     parameters:
 *       - name: topic
 *         in: query
 *         required: true
 *         schema: { type: string }
 */
v1.get(
  "/trends/virality",
  wrap(async (req, res) => {
    const topic = String(req.query.topic || "");
    if (!topic) return err(res, 400, "topic is required");
    const data = await caller().trends.getWidgetData({ topic });
    ok(res, data);
  })
);

/**
 * @openapi
 * /trends/top-voted:
 *   get:
 *     summary: Get top-voted trending topics from the community
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 10, maximum: 50 }
 */
v1.get(
  "/trends/top-voted",
  wrap(async (req, res) => {
    const limit = Math.min(parseInt(String(req.query.limit || "10"), 10), 50);
    const data = await caller().votes.getTopVoted({ limit });
    ok(res, data);
  })
);

/**
 * @openapi
 * /trends/x:
 *   get:
 *     summary: Get trending X (Twitter) topics by category
 *     parameters:
 *       - name: category
 *         in: query
 *         schema: { type: string, enum: [general, tech, entertainment, sports, politics, business] }
 */
v1.get(
  "/trends/x",
  wrap(async (req, res) => {
    const category = (req.query.category as any) || "general";
    const data = await caller().xTrends.getTrending({ category });
    ok(res, data);
  })
);

/**
 * @openapi
 * /trends/x/summarize:
 *   post:
 *     summary: AI summary of a trending topic from X
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic]
 *             properties:
 *               topic: { type: string }
 *               tweets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text: { type: string }
 *                     likes: { type: integer }
 *                     retweets: { type: integer }
 */
v1.post(
  "/trends/x/summarize",
  wrap(async (req, res) => {
    const { topic, tweets } = req.body;
    if (!topic) return err(res, 400, "topic is required");
    const data = await caller().xTrends.summarizeTrends({ topic, tweets });
    ok(res, data);
  })
);

// ─── AI ─────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /ai/forecast:
 *   get:
 *     summary: AI-powered trend forecast for the next 24–72 hours
 *     parameters:
 *       - name: category
 *         in: query
 *         schema: { type: string, enum: [general, tech, entertainment, sports, politics, business] }
 *       - name: timeframe
 *         in: query
 *         schema: { type: string, enum: [24h, 48h, 72h] }
 */
v1.get(
  "/ai/forecast",
  wrap(async (req, res) => {
    const category = String(req.query.category || "general");
    const timeframe = String(req.query.timeframe || "48h") as "24h" | "48h" | "72h";

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a trend forecasting AI. Predict which topics will go viral in the next ${timeframe}. Return a JSON object with a predictions array.`,
        },
        {
          role: "user",
          content: `Predict trending topics in the ${category} category for the next ${timeframe}.`,
        },
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

    const content = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    ok(res, { category, timeframe, ...parsed, generatedAt: new Date().toISOString() });
  })
);

// ─── KENYA ──────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /kenya/news:
 *   get:
 *     summary: Latest Kenyan news from RSS feeds (Nation, Standard)
 */
v1.get(
  "/kenya/news",
  wrap(async (req, res) => {
    const data = await caller().kenya.rssFeed.getAll();
    ok(res, data);
  })
);

/**
 * @openapi
 * /kenya/news/trending:
 *   get:
 *     summary: Trending topics extracted from Kenyan news RSS feeds
 */
v1.get(
  "/kenya/news/trending",
  wrap(async (req, res) => {
    const data = await caller().kenya.rssFeed.getTrending();
    ok(res, data);
  })
);

/**
 * @openapi
 * /kenya/sentiment:
 *   get:
 *     summary: Political sentiment history for Kenyan public figures
 *     parameters:
 *       - name: figureId
 *         in: query
 *         schema: { type: integer }
 *       - name: days
 *         in: query
 *         schema: { type: integer, default: 30 }
 */
v1.get(
  "/kenya/sentiment",
  wrap(async (req, res) => {
    const figureId = req.query.figureId ? parseInt(String(req.query.figureId), 10) : undefined;
    const days = parseInt(String(req.query.days || "30"), 10);
    const data = await caller().kenya.sentiment.getHistory({ figureId, days });
    ok(res, data);
  })
);

/**
 * @openapi
 * /kenya/sentiment/analyze:
 *   post:
 *     summary: Analyze sentiment of a piece of Kenyan political text using AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *               context: { type: string }
 */
v1.post(
  "/kenya/sentiment/analyze",
  wrap(async (req, res) => {
    const { text, context } = req.body;
    if (!text) return err(res, 400, "text is required");
    const data = await caller().kenya.news.analyzeSentiment({ text, context });
    ok(res, data);
  })
);

/**
 * @openapi
 * /kenya/counties:
 *   get:
 *     summary: Sentiment scores for all 47 Kenyan counties
 */
v1.get(
  "/kenya/counties",
  wrap(async (req, res) => {
    const data = await caller().kenya.county.getAll();
    ok(res, data);
  })
);

/**
 * @openapi
 * /kenya/figures:
 *   get:
 *     summary: Active Kenyan political figures tracked by the platform
 */
v1.get(
  "/kenya/figures",
  wrap(async (req, res) => {
    const data = await caller().kenya.figures.getAll();
    ok(res, data);
  })
);

/**
 * @openapi
 * /kenya/movements:
 *   get:
 *     summary: Active civic movements in Kenya with live RSS updates
 */
v1.get(
  "/kenya/movements",
  wrap(async (req, res) => {
    const data = await caller().kenya.movements.listMovements();
    ok(res, data);
  })
);

/**
 * @openapi
 * /kenya/movements/{id}:
 *   get:
 *     summary: Detail for a specific civic movement including latest news
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 */
v1.get(
  "/kenya/movements/:id",
  wrap(async (req, res) => {
    const data = await caller().kenya.movements.getMovement({ id: req.params.id });
    ok(res, data);
  })
);

export default v1;
