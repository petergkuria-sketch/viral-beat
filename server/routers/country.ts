import { z } from "zod";
import { router, publicProcedure, getCached, setCached } from "../_core/trpc";
import Parser from "rss-parser";
import { COUNTRY_CONFIGS, type RssFeed } from "../../shared/countryConfig";

const rssParser = new Parser({
  timeout: 12000,
  headers: { "User-Agent": "ViralBeat/1.0 (https://viralbeat.io; RSS reader)" },
});

const NEWS_TTL = 60 * 30; // 30 min cache per country

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  source: string;
  category: RssFeed["category"];
  language: string;
  publishedAt: string | null;
}

async function fetchFeed(feed: RssFeed): Promise<NewsArticle[]> {
  try {
    const parsed = await rssParser.parseURL(feed.url);
    return (parsed.items ?? []).slice(0, 15).map((item, i) => ({
      id: `${feed.name}-${i}-${item.guid ?? item.link ?? i}`,
      title: item.title ?? "Untitled",
      link: item.link ?? item.guid ?? feed.url,
      description: stripHtml(item.contentSnippet ?? item.content ?? item.summary ?? ""),
      source: feed.name,
      category: feed.category,
      language: feed.language,
      publishedAt: item.pubDate ?? item.isoDate ?? null,
    }));
  } catch (err) {
    console.warn(`[RSS] Failed to fetch ${feed.name}: ${(err as Error).message}`);
    return [];
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

export const countryRouter = router({
  // Fetch and cache RSS articles for a country
  newsfeed: publicProcedure
    .input(z.object({
      code: z.string().min(2).max(2),
      category: z.enum(["all", "politics", "business", "general", "enterprise"]).default("all"),
      limit: z.number().min(1).max(100).default(40),
    }))
    .query(async ({ input }) => {
      const { code, category, limit } = input;
      const country = COUNTRY_CONFIGS[code.toLowerCase()];
      if (!country) throw new Error(`Country ${code} not configured`);

      const cacheKey = `rss:${code.toLowerCase()}:${category}`;
      const cached = await getCached<NewsArticle[]>(cacheKey);
      if (cached) return { articles: cached.slice(0, limit), cached: true, country: country.name };

      // Fetch all feeds in parallel
      const feedsToFetch = category === "all"
        ? country.rssFeeds
        : country.rssFeeds.filter(f => f.category === category);

      const results = await Promise.allSettled(feedsToFetch.map(fetchFeed));
      const articles: NewsArticle[] = results
        .flatMap(r => r.status === "fulfilled" ? r.value : [])
        .sort((a, b) => {
          const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const db2 = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return db2 - da;
        });

      if (articles.length > 0) {
        await setCached(cacheKey, articles as any, NEWS_TTL, "rss-cache");
      }

      return { articles: articles.slice(0, limit), cached: false, country: country.name };
    }),

  // List configured countries with their metadata
  list: publicProcedure.query(() => {
    return Object.values(COUNTRY_CONFIGS).map(c => ({
      code: c.code,
      name: c.name,
      flag: c.flag,
      region: c.region,
      riskLevel: c.riskLevel,
      stabilityScore: c.stabilityScore,
      nextElection: c.nextElection,
      moduleCount: c.modules.length,
      feedCount: c.rssFeeds.length,
    }));
  }),

  // Single country metadata
  get: publicProcedure
    .input(z.object({ code: z.string().min(2).max(2) }))
    .query(({ input }) => {
      const country = COUNTRY_CONFIGS[input.code.toLowerCase()];
      if (!country) return null;
      return country;
    }),
});
