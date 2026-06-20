import { getDb } from "../db";
import { politicalFigures, sentimentRecords } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { fetchAllNews } from "./kenyaRssService";
import { analyzeTextSentiment } from "./kenyaNewsService";

const INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

// Name variants for matching figures to article text
const NAME_VARIANTS: Record<string, string[]> = {
  "William Ruto": ["ruto", "william ruto", "president ruto"],
  "Kithure Kindiki": ["kindiki", "kithure kindiki", "dp kindiki"],
  "Kalonzo Musyoka": ["kalonzo", "kalonzo musyoka"],
  "Moses Wetangula": ["wetangula", "moses wetangula"],
  "Raila Odinga": ["raila", "raila odinga", "baba"],
  "Rigathi Gachagua": ["gachagua", "rigathi gachagua"],
};

function figureVariants(name: string): string[] {
  if (NAME_VARIANTS[name]) return NAME_VARIANTS[name];
  const parts = name.toLowerCase().split(" ");
  // Last name + full name
  return [parts[parts.length - 1], name.toLowerCase()];
}

async function runPipeline() {
  console.log("[SentimentPipeline] Starting RSS ingestion run");
  const db = await getDb();
  if (!db) {
    console.error("[SentimentPipeline] No DB connection — skipping");
    return;
  }

  // Load all active figures once
  const figures = await db
    .select()
    .from(politicalFigures)
    .where(eq(politicalFigures.isActive, "yes"));

  if (figures.length === 0) {
    console.warn("[SentimentPipeline] No figures in DB — run Seed Kenya Figures first");
    return;
  }

  // Fetch and analyse all articles
  let articles;
  try {
    articles = await fetchAllNews();
  } catch (err) {
    console.error("[SentimentPipeline] RSS fetch failed:", err);
    return;
  }

  console.log(`[SentimentPipeline] Fetched ${articles.length} articles`);

  // For each figure, find articles that mention them, batch-analyse, write score
  let totalWritten = 0;
  for (const fig of figures) {
    const variants = figureVariants(fig.name);
    const relevant = articles.filter((a) => {
      const text = `${a.title} ${a.content}`.toLowerCase();
      return variants.some((v) => text.includes(v));
    });

    if (relevant.length === 0) continue;

    // Aggregate counts from rule-based analysis already computed
    let totalPos = 0, totalNeg = 0, totalNeu = 0;
    for (const a of relevant) {
      totalPos += a.analysis.sentimentBreakdown.positive;
      totalNeg += a.analysis.sentimentBreakdown.negative;
      totalNeu += a.analysis.sentimentBreakdown.neutral;
    }
    const count = relevant.length;
    const avgPos = Math.round(totalPos / count);
    const avgNeg = Math.round(totalNeg / count);
    const avgNeu = Math.round(totalNeu / count);

    // Derive a 0-100 sentiment score: positive share minus half the negative share
    const sentimentScore = Math.min(100, Math.max(0, Math.round(avgPos - avgNeg * 0.5 + 50)));

    // For top figures with few articles, enhance with LLM analysis of the most recent headline
    let llmScore: number | null = null;
    if (relevant.length <= 5 && NAME_VARIANTS[fig.name]) {
      try {
        const headline = relevant[0].title + " " + relevant[0].summary;
        const result = await analyzeTextSentiment(headline, `Kenyan politician: ${fig.name}`);
        llmScore = result.score;
      } catch {
        // LLM analysis is enhancement only — don't fail the whole run
      }
    }

    const finalScore = llmScore !== null
      ? Math.round((sentimentScore + llmScore) / 2)
      : sentimentScore;

    try {
      await db.insert(sentimentRecords).values({
        figureId: fig.id,
        sentimentScore: String(finalScore),
        positiveCount: avgPos,
        negativeCount: avgNeg,
        neutralCount: avgNeu,
        source: `rss:${count}articles`,
      });
      totalWritten++;
    } catch (err) {
      console.error(`[SentimentPipeline] Failed to write score for ${fig.name}:`, err);
    }
  }

  console.log(`[SentimentPipeline] Run complete — wrote ${totalWritten} sentiment records`);
}

export function startSentimentPipeline() {
  // Run immediately on startup, then every 4 hours
  runPipeline().catch((err) =>
    console.error("[SentimentPipeline] Uncaught error:", err)
  );
  setInterval(() => {
    runPipeline().catch((err) =>
      console.error("[SentimentPipeline] Uncaught error:", err)
    );
  }, INTERVAL_MS);
}
