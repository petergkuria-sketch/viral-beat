/**
 * VB AfricaScanner Agent
 *
 * Autonomous intelligence harvester for all 55 AU nations.
 * Pipeline: Fetch → Classify → Score Δ → Deduplicate → Flag → Ingest → Ticker
 *
 * Entry points:
 *   runAgentCycle()        — full 55-nation sweep (scheduled / manual)
 *   runCountryCycle(code)  — single country refresh (webhook / on-demand)
 */

import Anthropic from "@anthropic-ai/sdk";
import Parser from "rss-parser";
import crypto from "crypto";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import {
  agentRuns, scannerSignals, tickerItems, signalWatchlists,
  type InsertAgentRun, type InsertScannerSignal, type InsertTickerItem,
} from "../../drizzle/schema";
import { eq, and, lt, gte, inArray } from "drizzle-orm";
import { sendWatchlistAlert } from "./pushNotifications";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database unavailable");
  return d;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MODEL = "claude-opus-4-8";
const TICKER_TTL_H = 72;
const BREAKING_SCORE_THRESHOLD = 10; // composite Δ that triggers BREAKING

// ── Source registry ───────────────────────────────────────────────────────────

interface RssSource {
  name: string;
  url: string;
  type: "press" | "ifi" | "government";
  countryCodes?: string[];  // if omitted, treated as pan-Africa
}

const RSS_SOURCES: RssSource[] = [
  // Pan-Africa
  { name: "AllAfrica", url: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf", type: "press" },
  { name: "The Africa Report", url: "https://www.theafricareport.com/feed/", type: "press" },
  { name: "BBC Africa", url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml", type: "press" },
  { name: "African Arguments", url: "https://africanarguments.org/feed/", type: "press" },
  { name: "Africa Confidential", url: "https://www.africa-confidential.com/rss", type: "press" },
  { name: "VOA Africa", url: "https://www.voanews.com/api/zmpqopee-qp_i", type: "press" },
  // IFI / MDB — using direct article feeds that don't bot-block
  { name: "IMF Blog", url: "https://www.imf.org/en/Blogs/rss", type: "ifi" },
  { name: "World Bank Blog", url: "https://blogs.worldbank.org/rss.xml", type: "ifi" },
  { name: "UNCTAD News", url: "https://unctad.org/rss.xml", type: "ifi" },
  // Country-specific
  { name: "Punch Nigeria", url: "https://punchng.com/feed/", type: "press", countryCodes: ["NGA"] },
  { name: "Daily Nation Kenya", url: "https://nation.africa/kenya/rss.xml", type: "press", countryCodes: ["KEN"] },
  { name: "The Standard Kenya", url: "https://www.standardmedia.co.ke/rss/latest.php", type: "press", countryCodes: ["KEN"] },
  { name: "MyJoyOnline Ghana", url: "https://www.myjoyonline.com/feed/", type: "press", countryCodes: ["GHA"] },
  { name: "The New Times Rwanda", url: "https://newtimes.co.rw/feed", type: "press", countryCodes: ["RWA"] },
  { name: "Daily Monitor Uganda", url: "https://www.monitor.co.ug/rss/", type: "press", countryCodes: ["UGA"] },
  { name: "Jeune Afrique", url: "https://www.jeuneafrique.com/feed/", type: "press" },
  { name: "Hespress Morocco", url: "https://en.hespress.com/feed", type: "press", countryCodes: ["MAR"] },
  { name: "Egypt Independent", url: "https://egyptindependent.com/feed/", type: "press", countryCodes: ["EGY"] },
  { name: "Zambia Daily Mail", url: "https://www.daily-mail.co.zm/feed/", type: "press", countryCodes: ["ZMB"] },
  { name: "Chronicle Zimbabwe", url: "https://www.chronicle.co.zw/feed/", type: "press", countryCodes: ["ZWE"] },
];

// ── Concurrency guard — prevents overlapping scheduled cycles ────────────────
let _cycleRunning = false;

// ── Rating agency webhook events (structured, not RSS) ────────────────────────

export interface RatingEvent {
  agency: "Moody's" | "S&P" | "Fitch";
  countryCode: string;          // ISO3
  countryName: string;
  previousRating: string;
  newRating: string;
  outlook?: string;
  action: "upgrade" | "downgrade" | "affirm" | "outlook_change";
  headline: string;
  url?: string;
  publishedAt: Date;
}

// ── Country flag map (subset — agent fills rest at runtime) ──────────────────

const FLAG_MAP: Record<string, string> = {
  KEN:"🇰🇪", NGA:"🇳🇬", GHA:"🇬🇭", ZAF:"🇿🇦", EGY:"🇪🇬", MAR:"🇲🇦",
  ETH:"🇪🇹", TZA:"🇹🇿", RWA:"🇷🇼", UGA:"🇺🇬", ZMB:"🇿🇲", MOZ:"🇲🇿",
  SEN:"🇸🇳", CIV:"🇨🇮", CMR:"🇨🇲", AGO:"🇦🇴", DZA:"🇩🇿", TUN:"🇹🇳",
  LBY:"🇱🇾", SDN:"🇸🇩", ETH2:"🇪🇹", COD:"🇨🇩", TCD:"🇹🇩", MLI:"🇲🇱",
  BFA:"🇧🇫", NER:"🇳🇪", GIN:"🇬🇳", SLE:"🇸🇱", LBR:"🇱🇷", GMB:"🇬🇲",
  CPV:"🇨🇻", BEN:"🇧🇯", TGO:"🇹🇬", MRT:"🇲🇷", BWA:"🇧🇼", NAM:"🇳🇦",
  ZWE:"🇿🇼", MWI:"🇲🇼", LSO:"🇱🇸", SWZ:"🇸🇿", MDG:"🇲🇬", MUS:"🇲🇺",
  COM:"🇰🇲", SYC:"🇸🇨", DJI:"🇩🇯", SOM:"🇸🇴", ERI:"🇪🇷", BDI:"🇧🇮",
  GAB:"🇬🇦", COG:"🇨🇬", GNQ:"🇬🇶", STP:"🇸🇹", CAF:"🇨🇫", GNB:"🇬🇼",
};

// ── Anthropic client ──────────────────────────────────────────────────────────

function getAnthropic() {
  return new Anthropic({ apiKey: ENV.anthropicApiKey });
}

// ── UUID helper ───────────────────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID();
}

// ── Semantic deduplication hash ───────────────────────────────────────────────

function semanticHash(countryCode: string, headline: string): string {
  const normalised = headline.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().slice(0, 120);
  return crypto.createHash("sha256").update(`${countryCode}::${normalised}`).digest("hex").slice(0, 32);
}

// ── RSS fetch ─────────────────────────────────────────────────────────────────

const rssParser = new Parser({ timeout: 12000 });

interface RawArticle {
  title: string;
  content: string;
  url: string;
  source: string;
  sourceType: "press" | "ifi" | "government";
  publishedAt: Date;
  hintCountries?: string[];
}

async function fetchRssSources(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];
  await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      try {
        const feed = await rssParser.parseURL(src.url);
        for (const item of (feed.items ?? []).slice(0, 15)) {
          if (!item.title) continue;
          articles.push({
            title: item.title,
            content: item.contentSnippet ?? item.content ?? item.title,
            url: item.link ?? "",
            source: src.name,
            sourceType: src.type,
            publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
            hintCountries: src.countryCodes,
          });
        }
      } catch {
        // individual source failures are non-fatal
      }
    })
  );
  return articles;
}

// ── LLM: classify + score batch ──────────────────────────────────────────────

interface ClassifiedSignal {
  countryCode: string;      // ISO 3166-1 alpha-3
  countryName: string;
  dim: "P" | "E" | "S" | "T" | "En" | "L" | "IR";
  severity: "normal" | "alert" | "breaking";
  headline: string;         // 1-sentence distillation
  deltaScore: number;       // −20 to +20 composite impact
  deltaDir: "up" | "down" | "neutral";
  source: string;
  sourceUrl: string;
  sourceType: "rating_agency" | "ifi" | "press" | "government" | "field" | "rss";
  publishedAt: Date;
  verdictChange?: { before: string; after: string };
}

async function classifyBatch(articles: RawArticle[]): Promise<ClassifiedSignal[]> {
  if (articles.length === 0) return [];

  const anthropic = getAnthropic();
  const articlesText = articles.map((a, i) =>
    `[${i}] SOURCE: ${a.source}\nTITLE: ${a.title}\nSNIPPET: ${a.content.slice(0, 300)}\nURL: ${a.url}`
  ).join("\n\n---\n\n");

  const SYSTEM = `You are VB AfricaScanner Agent — an expert African political intelligence classifier.

For each article, determine:
1. Which African nation it primarily concerns (ISO 3166-1 alpha-3 code). Skip if not Africa-focused.
2. PESTEL+IR dimension: P=Political, E=Economic, S=Social, T=Technology, En=Environmental, L=Legal, IR=Investment Readiness
3. Severity: "normal" (routine update), "alert" (notable development), "breaking" (rating change / coup / IMF programme change / conflict escalation / composite Δ≥10)
4. A clean 1-sentence headline under 120 chars
5. deltaScore: estimated composite score impact −20 to +20 (positive = improves country score)
6. deltaDir: "up" | "down" | "neutral"
7. If a sovereign rating change is detected, note verdictChange {before, after} using Go-Market/Monitor/Caution/No-Go scale

Return ONLY valid JSON array. Skip articles not related to African nations.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      messages: [
        { role: "user", content: `${SYSTEM}\n\nArticles to classify:\n\n${articlesText}\n\nReturn JSON array of classified signals.` }
      ],
    });

    const textBlock = response.content.find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return [];
    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      countryCode: string; countryName: string; dim: string; severity: string;
      headline: string; deltaScore: number; deltaDir: string;
      source: string; sourceUrl: string; sourceType: string;
      publishedAt?: string; verdictChange?: { before: string; after: string };
    }>;

    return parsed
      .filter(s => s.countryCode && s.headline)
      .map(s => ({
        ...s,
        dim: s.dim as ClassifiedSignal["dim"],
        severity: s.severity as ClassifiedSignal["severity"],
        deltaDir: s.deltaDir as ClassifiedSignal["deltaDir"],
        sourceType: (s.sourceType ?? "rss") as ClassifiedSignal["sourceType"],
        publishedAt: s.publishedAt ? new Date(s.publishedAt) : new Date(),
      }));
  } catch {
    return [];
  }
}

// ── LLM: process a single rating event as BREAKING ────────────────────────────

async function classifyRatingEvent(event: RatingEvent): Promise<ClassifiedSignal> {
  const isUpgrade = event.action === "upgrade";
  const headline = `${event.agency} ${isUpgrade ? "upgrades" : "downgrades"} ${event.countryName} to ${event.newRating} (from ${event.previousRating})`;
  const deltaScore = isUpgrade ? 8 : -8;

  return {
    countryCode: event.countryCode,
    countryName: event.countryName,
    dim: "IR",
    severity: "breaking",
    headline,
    deltaScore,
    deltaDir: isUpgrade ? "up" : "down",
    source: event.agency,
    sourceUrl: event.url ?? "",
    sourceType: "rating_agency",
    publishedAt: event.publishedAt,
    verdictChange: event.action !== "affirm" ? undefined : undefined,
  };
}

// ── Deduplicate against DB ────────────────────────────────────────────────────

async function deduplicateSignals(signals: ClassifiedSignal[]): Promise<ClassifiedSignal[]> {
  if (signals.length === 0) return [];
  const d = await db();
  const hashes = signals.map(s => semanticHash(s.countryCode, s.headline));

  const existing = new Set<string>();
  // Check in batches of 20
  for (let i = 0; i < hashes.length; i += 20) {
    const batch = hashes.slice(i, i + 20);
    const rows = await d
      .select({ signalId: scannerSignals.signalId })
      .from(scannerSignals)
      .where(
        batch.reduce((acc: any, hash) =>
          acc ? acc : eq(scannerSignals.signalId, hash),
          null
        )
      )
      .catch(() => []);
    rows.forEach(r => existing.add(r.signalId));
  }

  return signals.filter((s, idx) => !existing.has(hashes[idx]));
}

// ── Persist signals + write ticker items ─────────────────────────────────────

async function persistSignals(
  signals: ClassifiedSignal[],
  runId: string
): Promise<{ ingested: number; breaking: number; verdictChanges: number }> {
  if (signals.length === 0) return { ingested: 0, breaking: 0, verdictChanges: 0 };

  const d = await db();
  let breaking = 0;
  let verdictChanges = 0;

  const expiresAt = new Date(Date.now() + TICKER_TTL_H * 60 * 60 * 1000);

  for (const signal of signals) {
    const signalId = semanticHash(signal.countryCode, signal.headline);
    const flag = FLAG_MAP[signal.countryCode] ?? "🌍";

    // Write scanner signal
    const signalRow: InsertScannerSignal = {
      signalId,
      runId,
      countryCode: signal.countryCode,
      dim: signal.dim,
      severity: signal.severity,
      headline: signal.headline,
      deltaScore: String(signal.deltaScore),
      deltaDir: signal.deltaDir,
      verdictBefore: signal.verdictChange?.before,
      verdictAfter: signal.verdictChange?.after,
      source: signal.source,
      sourceUrl: signal.sourceUrl,
      sourceType: signal.sourceType,
      publishedAt: signal.publishedAt,
    };

    await d.insert(scannerSignals).values(signalRow).catch(() => null);

    // Write ticker item for alert/breaking severity
    if (signal.severity === "breaking" || signal.severity === "alert") {
      const tickerSeverity = signal.severity === "breaking" ? "breaking" : "normal";

      let deltaLabel: string | undefined;
      if (signal.verdictChange) {
        deltaLabel = `${signal.deltaDir === "up" ? "▲" : "▼"} ${signal.verdictChange.before} → ${signal.verdictChange.after}`;
        verdictChanges++;
      } else if (signal.deltaScore !== 0) {
        const sign = signal.deltaScore > 0 ? "▲ +" : "▼ ";
        deltaLabel = `${sign}${Math.abs(signal.deltaScore)} pts`;
      }

      const tickerRow: InsertTickerItem = {
        signalId,
        countryCode: signal.countryCode,
        countryFlag: flag,
        countryName: signal.countryName,
        severity: tickerSeverity,
        headline: signal.headline.slice(0, 300),
        deltaLabel,
        deltaDir: signal.deltaDir !== "neutral" ? signal.deltaDir : undefined,
        verdictKey: signal.verdictChange?.after?.toLowerCase().replace(/\s+/g, "-"),
        verdictLabel: signal.verdictChange?.after,
        source: signal.source,
        expiresAt,
      };

      await d.insert(tickerItems).values(tickerRow).catch(() => null);

      if (signal.severity === "breaking") breaking++;
    }
  }

  return { ingested: signals.length, breaking, verdictChanges };
}

// ── Evaluate signal watchlists ────────────────────────────────────────────────

async function evaluateWatchlists(freshSignals: ClassifiedSignal[]): Promise<void> {
  if (freshSignals.length === 0) return;
  const d = await db();

  // Load all active watchlists
  const watchlists = await d
    .select()
    .from(signalWatchlists)
    .where(eq(signalWatchlists.isActive, true))
    .catch(() => [] as typeof signalWatchlists.$inferSelect[]);

  if (watchlists.length === 0) return;

  const severityRank: Record<string, number> = { normal: 0, alert: 1, breaking: 2 };

  for (const watch of watchlists) {
    const codes    = (watch.countryCodes as string[]) ?? [];
    const dims     = (watch.pestelDims  as string[]) ?? [];
    const kws      = (watch.keywords    as string[]).map(k => k.toLowerCase());
    const minRank  = severityRank[watch.thresholdSeverity] ?? 1;

    const matchedSignal = freshSignals.find(sig => {
      if (severityRank[sig.severity] < minRank) return false;
      if (codes.length && !codes.includes(sig.countryCode)) return false;
      if (dims.length  && !dims.includes(sig.dim))          return false;
      if (watch.sector && !sig.headline.toLowerCase().includes(watch.sector.toLowerCase())) return false;
      if (kws.length   && !kws.some(k => sig.headline.toLowerCase().includes(k))) return false;
      return true;
    });

    if (matchedSignal) {
      await d
        .update(signalWatchlists)
        .set({ triggerCount: (watch.triggerCount ?? 0) + 1, lastTriggeredAt: new Date() })
        .where(eq(signalWatchlists.watchId, watch.watchId))
        .catch(() => null);

      sendWatchlistAlert(
        watch.userId,
        { label: watch.label, watchId: watch.watchId },
        {
          countryCode: matchedSignal.countryCode,
          countryName: matchedSignal.countryName,
          headline: matchedSignal.headline,
          severity: matchedSignal.severity,
          dim: matchedSignal.dim,
        }
      ).catch(e => console.warn("[ScannerAgent] push notification failed:", e));
    }
  }
}

// ── Expire stale ticker items ─────────────────────────────────────────────────

async function expireTickerItems(): Promise<void> {
  const d = await db();
  await d
    .update(tickerItems)
    .set({ active: false })
    .where(and(eq(tickerItems.active, true), lt(tickerItems.expiresAt, new Date())))
    .catch(() => null);
}

// ── Core run cycle ────────────────────────────────────────────────────────────

export async function runAgentCycle(trigger: InsertAgentRun["trigger"] = "scheduled"): Promise<AgentRunResult> {
  if (_cycleRunning && trigger === "scheduled") {
    console.log("[ScannerAgent] skipping scheduled cycle — previous run still in progress");
    return { runId: "skipped", status: "skipped" as any, countriesProcessed: 0, signalsIngested: 0, breakingFlagged: 0, verdictChanges: 0, durationMs: 0 };
  }
  _cycleRunning = true;
  const d = await db();
  const runId = uuid();
  const startedAt = Date.now();

  // Open run record
  await d.insert(agentRuns).values({
    runId, trigger, status: "running",
    startedAt: new Date(),
  }).catch(() => null);

  try {
    // 1. Fetch all RSS sources
    const articles = await fetchRssSources();

    // 2. Classify in batches of 30
    const classified: ClassifiedSignal[] = [];
    const BATCH = 30;
    for (let i = 0; i < articles.length; i += BATCH) {
      const batch = await classifyBatch(articles.slice(i, i + BATCH));
      classified.push(...batch);
    }

    // 3. Deduplicate
    const fresh = await deduplicateSignals(classified);

    // 4. Persist + write ticker
    const stats = await persistSignals(fresh, runId);

    // 5. Evaluate signal watchlists against fresh signals
    await evaluateWatchlists(fresh).catch(e => console.warn("[ScannerAgent] watchlist evaluation error:", e));

    // 6. Expire old ticker items
    await expireTickerItems();

    const durationMs = Date.now() - startedAt;

    // 7. Close run record
    const uniqueCountries = new Set(fresh.map(s => s.countryCode)).size;
    await d
      .update(agentRuns)
      .set({
        status: "completed",
        countriesProcessed: uniqueCountries,
        signalsIngested: stats.ingested,
        breakingFlagged: stats.breaking,
        verdictChanges: stats.verdictChanges,
        durationMs,
        completedAt: new Date(),
      })
      .where(eq(agentRuns.runId, runId))
      .catch(() => null);

    _cycleRunning = false;
    return { runId, status: "completed", countriesProcessed: uniqueCountries, signalsIngested: stats.ingested, breakingFlagged: stats.breaking, verdictChanges: stats.verdictChanges, durationMs };
  } catch (err) {
    _cycleRunning = false;
    const errorLog = err instanceof Error ? err.message : String(err);
    await d
      .update(agentRuns)
      .set({ status: "failed", errorLog, completedAt: new Date() })
      .where(eq(agentRuns.runId, runId))
      .catch(() => null);
    throw err;
  }
}

// ── Webhook handler for rating events ────────────────────────────────────────

export async function ingestRatingEvent(event: RatingEvent): Promise<void> {
  const signal = await classifyRatingEvent(event);
  const fresh = await deduplicateSignals([signal]);
  if (fresh.length === 0) return; // already processed
  const runId = uuid();
  await persistSignals(fresh, runId);
}

// ── Single country refresh (on-demand) ───────────────────────────────────────

export async function runCountryCycle(countryCode: string): Promise<AgentRunResult> {
  const d = await db();
  const runId = uuid();
  const startedAt = Date.now();

  await d.insert(agentRuns).values({
    runId, trigger: "manual", status: "running", startedAt: new Date(),
  }).catch(() => null);

  try {
    // Only fetch sources relevant to this country
    const relevant = RSS_SOURCES.filter(
      s => !s.countryCodes || s.countryCodes.includes(countryCode)
    );
    const articles: RawArticle[] = [];
    await Promise.allSettled(
      relevant.map(async src => {
        try {
          const feed = await rssParser.parseURL(src.url);
          for (const item of (feed.items ?? []).slice(0, 10)) {
            if (!item.title) continue;
            articles.push({
              title: item.title,
              content: item.contentSnippet ?? item.title,
              url: item.link ?? "",
              source: src.name,
              sourceType: src.type,
              publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
              hintCountries: [countryCode],
            });
          }
        } catch { /* non-fatal */ }
      })
    );

    const classified = await classifyBatch(articles);
    const countrySignals = classified.filter(s => s.countryCode === countryCode);
    const fresh = await deduplicateSignals(countrySignals);
    const stats = await persistSignals(fresh, runId);
    await expireTickerItems();

    const durationMs = Date.now() - startedAt;
    await d.update(agentRuns).set({
      status: "completed", countriesProcessed: 1,
      signalsIngested: stats.ingested, breakingFlagged: stats.breaking,
      verdictChanges: stats.verdictChanges, durationMs, completedAt: new Date(),
    }).where(eq(agentRuns.runId, runId)).catch(() => null);

    return { runId, status: "completed", countriesProcessed: 1, signalsIngested: stats.ingested, breakingFlagged: stats.breaking, verdictChanges: stats.verdictChanges, durationMs };
  } catch (err) {
    const errorLog = err instanceof Error ? err.message : String(err);
    await d.update(agentRuns).set({ status: "failed", errorLog, completedAt: new Date() })
      .where(eq(agentRuns.runId, runId)).catch(() => null);
    throw err;
  }
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface AgentRunResult {
  runId: string;
  status: "completed" | "failed" | "skipped";
  countriesProcessed: number;
  signalsIngested: number;
  breakingFlagged: number;
  verdictChanges: number;
  durationMs: number;
}
