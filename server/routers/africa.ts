import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { eq, desc, and } from "drizzle-orm";
import {
  userCountryProfiles,
  africaRegionSentiments,
  africaContentSources,
} from "../../drizzle/schema";
import {
  AFRICAN_COUNTRIES,
  AFRICAN_REGIONS,
  getCountry,
  getCountriesByRegion,
  COUNTRY_CODES,
} from "../../shared/africanCountries";
import Parser from "rss-parser";

const rssParser = new Parser({ timeout: 10000 });

// ── Geo-detection ─────────────────────────────────────────────────────────────

// Detect country code from Cloudflare/Vercel/Railway headers or Accept-Language
export function detectCountryFromRequest(req: any): string | null {
  // Cloudflare sets CF-IPCountry; Railway / AWS CloudFront use CloudFront-Viewer-Country
  const cf = req.headers["cf-ipcountry"] as string | undefined;
  const cfFront = req.headers["cloudfront-viewer-country"] as string | undefined;
  const xCountry = req.headers["x-country-code"] as string | undefined;

  const raw = (cf || cfFront || xCountry || "").toUpperCase();
  if (raw && COUNTRY_CODES.has(raw)) return raw;

  // Fallback: browser Accept-Language (e.g. "sw-KE,sw;q=0.9" → KE)
  const lang = req.headers["accept-language"] as string | undefined;
  if (lang) {
    const match = lang.match(/[a-z]{2}-([A-Z]{2})/);
    if (match && COUNTRY_CODES.has(match[1])) return match[1];
  }

  return null;
}

// ── LLM helpers ──────────────────────────────────────────────────────────────

async function generateCountryIntelligence(countryCode: string) {
  const country = getCountry(countryCode);
  if (!country) throw new Error(`Unknown country code: ${countryCode}`);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an African political intelligence analyst. Provide a structured JSON intelligence brief for ${country.name} (${country.code}).
Be factual, concise, and current (knowledge cutoff applies).
Cover: government structure, current stability, key political figures, recent significant events, civic movements, economic outlook, security situation.`,
      },
      {
        role: "user",
        content: `Generate a political intelligence brief for ${country.name} (capital: ${country.capital}, languages: ${country.languages.join(", ")}).`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "country_intelligence",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overview: { type: "string" },
            governmentType: { type: "string" },
            headOfState: { type: "string" },
            stabilityScore: { type: "number", description: "0–100, higher=more stable" },
            sentimentScore: { type: "number", description: "0–100, public sentiment toward govt" },
            riskLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
            keyFigures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  title: { type: "string" },
                  party: { type: "string" },
                  sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                },
                required: ["name", "title", "party", "sentiment"],
                additionalProperties: false,
              },
            },
            civicMovements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  status: { type: "string", enum: ["active", "dormant", "emerging"] },
                  summary: { type: "string" },
                },
                required: ["name", "status", "summary"],
                additionalProperties: false,
              },
            },
            recentEvents: { type: "array", items: { type: "string" } },
            economicOutlook: { type: "string", enum: ["strong", "stable", "fragile", "crisis"] },
            keyThemes: { type: "array", items: { type: "string" } },
          },
          required: [
            "overview","governmentType","headOfState","stabilityScore","sentimentScore",
            "riskLevel","keyFigures","civicMovements","recentEvents","economicOutlook","keyThemes",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
}

async function fetchCountryNews(countryCode: string): Promise<any[]> {
  const country = getCountry(countryCode);
  if (!country?.rssFeeds?.length) return [];
  const articles: any[] = [];
  for (const feed of country.rssFeeds) {
    try {
      const parsed = await rssParser.parseURL(feed.url);
      for (const item of (parsed.items || []).slice(0, 8)) {
        articles.push({
          title: item.title,
          summary: item.contentSnippet || item.content || "",
          url: item.link,
          source: feed.name,
          publishedAt: item.pubDate || item.isoDate,
        });
      }
    } catch {
      // Feed unavailable — skip silently
    }
  }
  return articles;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const africaRouter = router({
  // All countries and regions catalogue
  catalogue: publicProcedure.query(() => ({
    countries: AFRICAN_COUNTRIES,
    regions: AFRICAN_REGIONS,
    byRegion: Object.fromEntries(
      AFRICAN_REGIONS.map(r => [r, getCountriesByRegion(r)])
    ),
  })),

  // AI-powered country intelligence brief
  getCountryBrief: publicProcedure
    .input(z.object({ countryCode: z.string().length(2) }))
    .query(async ({ input }) => {
      const country = getCountry(input.countryCode.toUpperCase());
      if (!country) throw new Error("Unknown country code");

      // Check if we have a cached sentiment from today
      const db = await getDb();
      if (db) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [cached] = await db
          .select()
          .from(africaRegionSentiments)
          .where(and(
            eq(africaRegionSentiments.countryCode, country.code),
          ))
          .orderBy(desc(africaRegionSentiments.recordedAt))
          .limit(1);

        if (cached && cached.recordedAt >= today) {
          return {
            country,
            fromCache: true,
            sentimentScore: Number(cached.sentimentScore),
            stabilityScore: cached.stabilityScore ? Number(cached.stabilityScore) : null,
            riskLevel: cached.riskLevel,
            summary: cached.summary,
            keyThemes: cached.keyThemes || [],
          };
        }
      }

      const brief = await generateCountryIntelligence(country.code);

      // Cache to DB
      if (db) {
        try {
          await db.insert(africaRegionSentiments).values({
            countryCode: country.code,
            region: country.region,
            sentimentScore: String(brief.sentimentScore),
            stabilityScore: String(brief.stabilityScore),
            riskLevel: brief.riskLevel,
            summary: brief.overview,
            keyThemes: brief.keyThemes,
            sourcedFrom: "ai",
          });
        } catch { /* cache write failure is non-fatal */ }
      }

      return { country, fromCache: false, ...brief };
    }),

  // Live news for a country (from configured RSS feeds)
  getCountryNews: publicProcedure
    .input(z.object({ countryCode: z.string().length(2) }))
    .query(async ({ input }) => {
      const country = getCountry(input.countryCode.toUpperCase());
      if (!country) throw new Error("Unknown country code");
      const articles = await fetchCountryNews(country.code);
      return { country, articles, fetchedAt: new Date().toISOString() };
    }),

  // AI sentiment analysis on any text in country context
  analyzeSentiment: publicProcedure
    .input(z.object({
      countryCode: z.string().length(2),
      text: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const country = getCountry(input.countryCode.toUpperCase());
      const context = country ? `Political context: ${country.name}` : "";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a political sentiment analyst specializing in African politics. ${context}. Analyze the sentiment and return structured JSON.`,
          },
          { role: "user", content: `Analyze: "${input.text}"` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sentiment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                sentimentScore: { type: "number" },
                positive: { type: "number" },
                negative: { type: "number" },
                neutral: { type: "number" },
                summary: { type: "string" },
                keyThemes: { type: "array", items: { type: "string" } },
              },
              required: ["sentimentScore","positive","negative","neutral","summary","keyThemes"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0].message.content;
      return { countryCode: input.countryCode, ...JSON.parse(typeof content === "string" ? content : JSON.stringify(content)) };
    }),

  // Historical sentiment records for a country
  getSentimentHistory: publicProcedure
    .input(z.object({ countryCode: z.string().length(2), limit: z.number().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(africaRegionSentiments)
        .where(eq(africaRegionSentiments.countryCode, input.countryCode.toUpperCase()))
        .orderBy(desc(africaRegionSentiments.recordedAt))
        .limit(input.limit);
    }),

  // Continent-wide risk overview (one row per country, latest only)
  getContinentOverview: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { countries: AFRICAN_COUNTRIES, sentiments: [] };
    const sentiments = await db
      .select()
      .from(africaRegionSentiments)
      .orderBy(desc(africaRegionSentiments.recordedAt))
      .limit(200);
    // Keep only latest per country
    const latest = new Map<string, typeof sentiments[0]>();
    for (const s of sentiments) {
      if (!latest.has(s.countryCode)) latest.set(s.countryCode, s);
    }
    return { countries: AFRICAN_COUNTRIES, sentiments: Array.from(latest.values()) };
  }),

  // User country profile — read
  getMyCountry: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [profile] = await db
      .select()
      .from(userCountryProfiles)
      .where(eq(userCountryProfiles.userId, ctx.user.id))
      .limit(1);
    return profile ? getCountry(profile.defaultCountryCode) : null;
  }),

  // User country profile — set/update
  setMyCountry: protectedProcedure
    .input(z.object({
      countryCode: z.string().length(2),
      method: z.enum(["ip", "browser", "manual"]).default("manual"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const code = input.countryCode.toUpperCase();
      if (!COUNTRY_CODES.has(code)) throw new Error("Not a recognised African country code");

      const [existing] = await db
        .select()
        .from(userCountryProfiles)
        .where(eq(userCountryProfiles.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(userCountryProfiles)
          .set({ defaultCountryCode: code, detectionMethod: input.method })
          .where(eq(userCountryProfiles.userId, ctx.user.id));
      } else {
        await db.insert(userCountryProfiles).values({
          userId: ctx.user.id,
          defaultCountryCode: code,
          detectedCountryCode: input.method !== "manual" ? code : undefined,
          detectionMethod: input.method,
        });
      }
      return { success: true, countryCode: code };
    }),

  // Auto-set country from request headers (called on first login)
  autoDetectCountry: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [existing] = await db
      .select()
      .from(userCountryProfiles)
      .where(eq(userCountryProfiles.userId, ctx.user.id))
      .limit(1);

    // Don't override a manual selection
    if (existing?.detectionMethod === "manual") return existing;

    const code = detectCountryFromRequest(ctx.req);
    if (!code) return existing || null;

    if (existing) {
      await db
        .update(userCountryProfiles)
        .set({ defaultCountryCode: code, detectedCountryCode: code, detectionMethod: "ip" })
        .where(eq(userCountryProfiles.userId, ctx.user.id));
    } else {
      await db.insert(userCountryProfiles).values({
        userId: ctx.user.id,
        defaultCountryCode: code,
        detectedCountryCode: code,
        detectionMethod: "ip",
      });
    }
    return { countryCode: code };
  }),
});
