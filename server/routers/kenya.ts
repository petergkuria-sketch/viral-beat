import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { eq, desc, gte, and } from "drizzle-orm";
import {
  sentimentRecords,
  hateSpeechAnalyses,
  countySentiments,
  politicalFigures,
  kenyaContentSources,
  executiveMembers,
  parliamentMembers,
  senateMembers,
  politicalParties,
  electionPhases,
  regionalSupport,
  constituencies,
} from "../../drizzle/schema";
import {
  fetchAllNews,
  fetchNewsBySource,
  getNewsSummary,
  getTrendingTopics,
  KENYA_NEWS_FEEDS,
} from "../services/kenyaRssService";
import { kenyaMovementsRouter } from "./kenyaMovements";

// ============ DB Helpers ============

async function saveSentimentRecord(record: {
  figureId: number;
  sentimentScore: string;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  source?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(sentimentRecords).values(record);
  return { success: true, id: (result[0] as any).insertId };
}

async function getSentimentHistory(figureId?: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  if (figureId) {
    return await db
      .select()
      .from(sentimentRecords)
      .where(and(eq(sentimentRecords.figureId, figureId), gte(sentimentRecords.recordedAt, dateThreshold)))
      .orderBy(desc(sentimentRecords.recordedAt))
      .limit(1000);
  }
  return await db
    .select()
    .from(sentimentRecords)
    .where(gte(sentimentRecords.recordedAt, dateThreshold))
    .orderBy(desc(sentimentRecords.recordedAt))
    .limit(1000);
}

async function saveHateSpeechAnalysis(analysis: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(hateSpeechAnalyses).values(analysis);
  return { success: true, id: (result[0] as any).insertId };
}

async function getHateSpeechAnalyses(limit: number = 50, riskLevel?: string) {
  const db = await getDb();
  if (!db) return [];
  if (riskLevel) {
    return await db
      .select()
      .from(hateSpeechAnalyses)
      .where(eq(hateSpeechAnalyses.riskLevel, riskLevel as any))
      .orderBy(desc(hateSpeechAnalyses.createdAt))
      .limit(limit);
  }
  return await db.select().from(hateSpeechAnalyses).orderBy(desc(hateSpeechAnalyses.createdAt)).limit(limit);
}

async function saveCountySentiment(sentiment: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(countySentiments).values(sentiment);
  return { success: true, id: (result[0] as any).insertId };
}

async function getCountySentiments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(countySentiments).orderBy(desc(countySentiments.recordedAt));
}

async function getPoliticalFigures() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(politicalFigures).where(eq(politicalFigures.isActive, "yes"));
}

async function getContentSources(limit: number = 50, sourceType?: string) {
  const db = await getDb();
  if (!db) return [];
  if (sourceType) {
    return await db
      .select()
      .from(kenyaContentSources)
      .where(eq(kenyaContentSources.sourceType, sourceType as any))
      .orderBy(desc(kenyaContentSources.createdAt))
      .limit(limit);
  }
  return await db.select().from(kenyaContentSources).orderBy(desc(kenyaContentSources.createdAt)).limit(limit);
}

async function saveContentSource(content: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(kenyaContentSources).values(content);
  return { success: true, id: (result[0] as any).insertId };
}

async function getExecutiveMembers(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return await db.select().from(executiveMembers).where(eq(executiveMembers.isActive, "yes")).orderBy(executiveMembers.position);
  }
  return await db.select().from(executiveMembers).orderBy(executiveMembers.position);
}

async function getParliamentMembers(memberType?: string, county?: string) {
  const db = await getDb();
  if (!db) return [];
  if (memberType && county) {
    return await db
      .select()
      .from(parliamentMembers)
      .where(and(eq(parliamentMembers.isActive, "yes"), eq(parliamentMembers.memberType, memberType as any), eq(parliamentMembers.county, county)))
      .orderBy(parliamentMembers.name);
  }
  if (memberType) {
    return await db
      .select()
      .from(parliamentMembers)
      .where(and(eq(parliamentMembers.isActive, "yes"), eq(parliamentMembers.memberType, memberType as any)))
      .orderBy(parliamentMembers.name);
  }
  if (county) {
    return await db
      .select()
      .from(parliamentMembers)
      .where(and(eq(parliamentMembers.isActive, "yes"), eq(parliamentMembers.county, county)))
      .orderBy(parliamentMembers.name);
  }
  return await db.select().from(parliamentMembers).where(eq(parliamentMembers.isActive, "yes")).orderBy(parliamentMembers.name);
}

async function getSenateMembers(county?: string) {
  const db = await getDb();
  if (!db) return [];
  if (county) {
    return await db
      .select()
      .from(senateMembers)
      .where(and(eq(senateMembers.isActive, "yes"), eq(senateMembers.county, county)))
      .orderBy(senateMembers.name);
  }
  return await db.select().from(senateMembers).where(eq(senateMembers.isActive, "yes")).orderBy(senateMembers.name);
}

async function getPoliticalParties() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(politicalParties).where(eq(politicalParties.isActive, "yes")).orderBy(politicalParties.name);
}

async function getElectionPhases() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(electionPhases).orderBy(desc(electionPhases.createdAt));
}

async function getRegionalSupport(county?: string) {
  const db = await getDb();
  if (!db) return [];
  if (county) {
    return await db
      .select()
      .from(regionalSupport)
      .where(eq(regionalSupport.county, county))
      .orderBy(desc(regionalSupport.recordedAt))
      .limit(100);
  }
  return await db.select().from(regionalSupport).orderBy(desc(regionalSupport.recordedAt)).limit(100);
}

async function getConstituencies(county?: string) {
  const db = await getDb();
  if (!db) return [];
  if (county) {
    return await db.select().from(constituencies).where(eq(constituencies.county, county)).orderBy(constituencies.name);
  }
  return await db.select().from(constituencies).orderBy(constituencies.name);
}

// ============ LLM Helpers ============

async function analyzeTextSentiment(text: string, context?: string) {
  const systemPrompt = `You are a political sentiment analysis expert specializing in Kenyan politics.
Analyze the sentiment of the given text and return a JSON response with:
- sentimentScore: number from 0-100 (0=very negative, 50=neutral, 100=very positive)
- positive: percentage of positive sentiment (0-100)
- negative: percentage of negative sentiment (0-100)
- neutral: percentage of neutral sentiment (0-100)
- summary: brief 1-2 sentence analysis
- keyThemes: array of key political themes detected`;

  const userPrompt = context ? `Context: ${context}\n\nText to analyze: ${text}` : `Text to analyze: ${text}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "sentiment_analysis",
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
          required: ["sentimentScore", "positive", "negative", "neutral", "summary", "keyThemes"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
}

async function analyzeHateSpeechWithLLM(text: string, speaker?: string, context?: string) {
  const systemPrompt = `You are an expert in hate speech detection using the ICC Rabat Plan of Action threshold test.
Analyze the given text for hate speech risk in the Kenyan political context.
Score each dimension from 0-10:
- contextScore: Political/social context risk
- speakerScore: Speaker's influence and reach
- intentScore: Intent to incite hatred
- contentScore: Severity of hateful content
- extentScore: Potential reach and spread
- likelihoodScore: Likelihood of causing harm

Return JSON with all scores, totalScore (sum), riskLevel (Low/Moderate/High/Critical), detectedTerms array, and verdict string.`;

  const userPrompt = `${speaker ? `Speaker: ${speaker}\n` : ""}${context ? `Context: ${context}\n` : ""}Text: ${text}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "hate_speech_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            contextScore: { type: "number" },
            speakerScore: { type: "number" },
            intentScore: { type: "number" },
            contentScore: { type: "number" },
            extentScore: { type: "number" },
            likelihoodScore: { type: "number" },
            totalScore: { type: "number" },
            riskLevel: { type: "string", enum: ["Low", "Moderate", "High", "Critical"] },
            detectedTerms: { type: "array", items: { type: "string" } },
            verdict: { type: "string" },
          },
          required: [
            "contextScore",
            "speakerScore",
            "intentScore",
            "contentScore",
            "extentScore",
            "likelihoodScore",
            "totalScore",
            "riskLevel",
            "detectedTerms",
            "verdict",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
}

function generateMockNewsData() {
  return [
    {
      id: 1,
      title: "President Ruto addresses economic reforms",
      source: "Daily Nation",
      sentiment: "neutral",
      county: "Nairobi",
      publishedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Parliament debates Finance Bill amendments",
      source: "The Standard",
      sentiment: "negative",
      county: "Nairobi",
      publishedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: "County governors meet on devolution funding",
      source: "Citizen TV",
      sentiment: "positive",
      county: "Various",
      publishedAt: new Date().toISOString(),
    },
  ];
}

// ============ Kenya Intelligence Router ============

export const kenyaRouter = router({
  // Political Sentiment
  sentiment: router({
    getHistory: publicProcedure
      .input(z.object({ figureId: z.number().optional(), days: z.number().default(30) }))
      .query(async ({ input }) => getSentimentHistory(input.figureId, input.days)),

    getLatestScores: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      // For each active figure, get their most recent sentiment record
      const figures = await db
        .select()
        .from(politicalFigures)
        .where(eq(politicalFigures.isActive, "yes"))
        .orderBy(politicalFigures.name);

      const results = await Promise.all(
        figures.map(async (fig) => {
          const [latest] = await db
            .select()
            .from(sentimentRecords)
            .where(eq(sentimentRecords.figureId, fig.id))
            .orderBy(desc(sentimentRecords.recordedAt))
            .limit(1);

          const prev = latest
            ? await db
                .select()
                .from(sentimentRecords)
                .where(eq(sentimentRecords.figureId, fig.id))
                .orderBy(desc(sentimentRecords.recordedAt))
                .limit(1)
                .offset(1)
            : [];

          const score = latest ? Number(latest.sentimentScore) : null;
          const prevScore = prev[0] ? Number(prev[0].sentimentScore) : null;
          const trend: "up" | "down" | "stable" =
            score === null || prevScore === null
              ? "stable"
              : score > prevScore + 2
              ? "up"
              : score < prevScore - 2
              ? "down"
              : "stable";

          return {
            id: fig.id,
            name: fig.name,
            title: fig.title ?? "",
            party: fig.party ?? "",
            imageUrl: fig.imageUrl ?? "",
            score,
            trend,
            hasData: !!latest,
            lastUpdated: latest?.recordedAt ?? null,
          };
        })
      );
      return results;
    }),

    save: protectedProcedure
      .input(
        z.object({
          figureId: z.number(),
          sentimentScore: z.number().min(0).max(100),
          positiveCount: z.number().default(0),
          negativeCount: z.number().default(0),
          neutralCount: z.number().default(0),
          source: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { sentimentScore, ...rest } = input;
        return saveSentimentRecord({ ...rest, sentimentScore: String(sentimentScore) });
      }),
  }),

  // Hate Speech Analysis (ICC Rabat Plan)
  hateSpeech: router({
    getAll: publicProcedure
      .input(z.object({ limit: z.number().default(50), riskLevel: z.string().optional() }))
      .query(async ({ input }) => getHateSpeechAnalyses(input.limit, input.riskLevel)),

    save: protectedProcedure
      .input(
        z.object({
          inputText: z.string(),
          speakerInfo: z.string().optional(),
          contextInfo: z.string().optional(),
          totalScore: z.number(),
          riskLevel: z.enum(["Low", "Moderate", "High", "Critical"]),
          contextScore: z.number(),
          speakerScore: z.number(),
          intentScore: z.number(),
          contentScore: z.number(),
          extentScore: z.number(),
          likelihoodScore: z.number(),
          detectedTerms: z.any().optional(),
          languageAnalysis: z.any().optional(),
          verdict: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => saveHateSpeechAnalysis({ ...input, userId: ctx.user?.id })),

    analyzeWithLLM: publicProcedure
      .input(z.object({ text: z.string().min(1), speaker: z.string().optional(), context: z.string().optional() }))
      .mutation(async ({ input }) => analyzeHateSpeechWithLLM(input.text, input.speaker, input.context)),
  }),

  // County Sentiment (47 counties)
  county: router({
    getAll: publicProcedure.query(async () => getCountySentiments()),

    save: protectedProcedure
      .input(
        z.object({
          countyName: z.string(),
          countyCode: z.number().optional(),
          sentimentScore: z.number().min(0).max(100),
          hateSpeechCount: z.number().default(0),
          riskLevel: z.enum(["low", "medium", "high", "critical"]).default("low"),
          population: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { sentimentScore, ...rest } = input;
        return saveCountySentiment({ ...rest, sentimentScore: String(sentimentScore) });
      }),
  }),

  // Political Figures
  figures: router({
    getAll: publicProcedure.query(async () => getPoliticalFigures()),
  }),

  // Executive Branch
  executive: router({
    getAll: publicProcedure
      .input(z.object({ activeOnly: z.boolean().default(true) }))
      .query(async ({ input }) => getExecutiveMembers(input.activeOnly)),
  }),

  // Parliament (National Assembly)
  parliament: router({
    getAll: publicProcedure
      .input(z.object({ memberType: z.string().optional(), county: z.string().optional() }))
      .query(async ({ input }) => getParliamentMembers(input.memberType, input.county)),
  }),

  // Senate
  senate: router({
    getAll: publicProcedure
      .input(z.object({ county: z.string().optional() }))
      .query(async ({ input }) => getSenateMembers(input.county)),
  }),

  // Political Parties
  parties: router({
    getAll: publicProcedure.query(async () => getPoliticalParties()),
  }),

  // Election Phases
  phases: router({
    getAll: publicProcedure.query(async () => getElectionPhases()),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          phaseType: z.enum(["pre_election", "campaign", "local_mobilization", "election_day", "post_election"]),
          description: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.insert(electionPhases).values(input);
        return { success: true, id: (result[0] as any).insertId };
      }),
  }),

  // Regional Support / Balkanization
  regional: router({
    getAll: publicProcedure
      .input(z.object({ county: z.string().optional() }))
      .query(async ({ input }) => getRegionalSupport(input.county)),
  }),

  // Constituencies
  constituencies: router({
    getAll: publicProcedure
      .input(z.object({ county: z.string().optional() }))
      .query(async ({ input }) => getConstituencies(input.county)),
  }),

  // Content Sources
  content: router({
    getRecent: publicProcedure
      .input(z.object({ limit: z.number().default(50), sourceType: z.enum(["news", "twitter", "facebook", "manual"]).optional() }))
      .query(async ({ input }) => getContentSources(input.limit, input.sourceType)),

    save: protectedProcedure
      .input(
        z.object({
          sourceType: z.enum(["news", "twitter", "facebook", "manual"]),
          title: z.string().optional(),
          content: z.string(),
          url: z.string().optional(),
          author: z.string().optional(),
          publishedAt: z.date().optional(),
          sentimentScore: z.number().optional(),
          hateSpeechRisk: z.enum(["Low", "Moderate", "High", "Critical"]).optional(),
          relatedFigureId: z.number().optional(),
          relatedCounty: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { sentimentScore, ...rest } = input;
        return saveContentSource({
          ...rest,
          sentimentScore: sentimentScore !== undefined ? String(sentimentScore) : undefined,
        });
      }),
  }),

  // News Analysis
  news: router({
    getMockNews: publicProcedure.query(() => generateMockNewsData()),

    analyzeSentiment: publicProcedure
      .input(z.object({ text: z.string().min(1), context: z.string().optional() }))
      .mutation(async ({ input }) => analyzeTextSentiment(input.text, input.context)),
  }),

  // Real RSS News Feed (Nation, Standard Kenya)
  rssFeed: router({
    getAll: publicProcedure.query(async () => {
      const articles = await fetchAllNews();
      const summary = getNewsSummary(articles);
      const trendingTopics = getTrendingTopics(articles);
      return { articles, summary, trendingTopics, lastUpdated: new Date().toISOString() };
    }),

    getBySource: publicProcedure
      .input(
        z.object({
          source: z.enum(["nation", "standardHeadlines", "standardKenya", "standardPolitics", "standardBusiness", "citizenDigital"]),
        })
      )
      .query(async ({ input }) => {
        const articles = await fetchNewsBySource(input.source);
        const feedConfig = (KENYA_NEWS_FEEDS as Record<string, any>)[input.source];
        return {
          articles,
          source: feedConfig ? { name: feedConfig.name, category: feedConfig.category, url: feedConfig.url } : null,
          lastUpdated: new Date().toISOString(),
        };
      }),

    getSources: publicProcedure.query(() =>
      Object.entries(KENYA_NEWS_FEEDS as Record<string, any>).map(([key, config]) => ({
        key,
        name: config.name,
        category: config.category,
        url: config.url,
      }))
    ),

    getTrending: publicProcedure.query(async () => {
      const articles = await fetchAllNews();
      return getTrendingTopics(articles);
    }),

    getSummary: publicProcedure.query(async () => {
      const articles = await fetchAllNews();
      return getNewsSummary(articles);
    }),
  }),

  // ── Civic Movements ──────────────────────────────────────────────────────
  movements: kenyaMovementsRouter,
});
