import { Router } from "express";
import { appRouter } from "../routers";
import { invokeLLM } from "../_core/llm";
import { apiKeyMiddleware } from "./middleware";
import { getDb } from "../db";
import { scannerSignals } from "../../drizzle/schema";
import crypto from "crypto";

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

// ─── AFRICA ──────────────────────────────────────────────────────────────────

v1.get("/africa/catalogue", wrap(async (_req, res) => {
  const data = await caller().africa.catalogue();
  ok(res, data);
}));

v1.get("/africa/overview", wrap(async (_req, res) => {
  const data = await caller().africa.getContinentOverview();
  ok(res, data);
}));

v1.get("/africa/:countryCode/brief", wrap(async (req, res) => {
  const data = await caller().africa.getCountryBrief({ countryCode: req.params.countryCode.toUpperCase() });
  ok(res, data);
}));

v1.get("/africa/:countryCode/news", wrap(async (req, res) => {
  const data = await caller().africa.getCountryNews({ countryCode: req.params.countryCode.toUpperCase() });
  ok(res, data);
}));

v1.post("/africa/:countryCode/sentiment/analyze", wrap(async (req, res) => {
  const { text } = req.body;
  if (!text) return err(res, 400, "text is required");
  const data = await caller().africa.analyzeSentiment({ countryCode: req.params.countryCode.toUpperCase(), text });
  ok(res, data);
}));

// ─── RATING AGENCY WEBHOOK ───────────────────────────────────────────────────

/**
 * @openapi
 * /rating-event:
 *   post:
 *     summary: Ingest a sovereign credit rating action from Moody's, S&P, or Fitch
 *     description: >
 *       Webhook endpoint for rating agencies. Each event is stored as a scanner
 *       signal with sourceType "rating_agency" and triggers the PESTEL+IR
 *       scoring pipeline on next cycle. Authenticate with your VB API key in
 *       the X-API-Key header.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agency, countryCode, ratingNew, action, headline]
 *             properties:
 *               agency:
 *                 type: string
 *                 enum: [moodys, sp, fitch, gcr, agusto]
 *                 description: Rating agency identifier
 *               countryCode:
 *                 type: string
 *                 description: ISO 3166-1 alpha-3 country code (e.g. KEN, NGA)
 *               ratingNew:
 *                 type: string
 *                 description: New rating designation (e.g. B1, BB-, CCC+)
 *               ratingPrevious:
 *                 type: string
 *                 description: Prior rating designation (optional)
 *               outlook:
 *                 type: string
 *                 enum: [positive, stable, negative, developing]
 *               action:
 *                 type: string
 *                 enum: [upgrade, downgrade, affirm, watchlist_positive, watchlist_negative, new_rating, withdrawal]
 *               headline:
 *                 type: string
 *                 description: Brief description of the rating action
 *               rationale:
 *                 type: string
 *                 description: Full rationale text (optional, stored in body)
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 timestamp of the rating action
 *     responses:
 *       200:
 *         description: Rating event ingested
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Ingestion failed
 */
v1.post(
  "/rating-event",
  wrap(async (req, res) => {
    const { agency, countryCode, ratingNew, ratingPrevious, outlook, action, headline, rationale, publishedAt } = req.body;

    if (!agency || !countryCode || !ratingNew || !action || !headline) {
      return err(res, 400, "agency, countryCode, ratingNew, action, and headline are required");
    }

    const code = String(countryCode).toUpperCase().slice(0, 3);
    const agencyLabel = String(agency).toUpperCase().replace("SP", "S&P").replace("MOODYS", "Moody's").replace("FITCH", "Fitch");

    const fullHeadline = `${agencyLabel} ${String(action).replace(/_/g, " ")} — ${code}: ${ratingNew}${ratingPrevious ? ` (from ${ratingPrevious})` : ""}${outlook ? `, Outlook ${outlook}` : ""}`;

    const severity = ["downgrade","watchlist_negative","withdrawal"].includes(action) ? "alert"
                   : action === "upgrade" ? "alert"
                   : "normal";

    const deltaDir = action === "upgrade" ? "up" : action === "downgrade" ? "down" : "neutral";

    const signalId = crypto
      .createHash("sha256")
      .update(`${code}::${agencyLabel}::${ratingNew}::${action}::${publishedAt ?? Date.now()}`)
      .digest("hex")
      .slice(0, 64);

    const db = await getDb();
    if (!db) return err(res, 500, "Database unavailable");

    await db.insert(scannerSignals).values({
      signalId,
      countryCode: code,
      dim: "E",
      severity,
      headline: fullHeadline.slice(0, 599),
      body: rationale ?? null,
      deltaDir,
      source: agencyLabel,
      sourceType: "rating_agency",
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    }).catch((e: Error) => {
      // Silently ignore duplicate (unique constraint on signalId)
      if (!e.message?.includes("Duplicate")) throw e;
    });

    ok(res, {
      signalId,
      countryCode: code,
      headline: fullHeadline,
      severity,
      ingestedAt: new Date().toISOString(),
    });
  })
);

export default v1;
