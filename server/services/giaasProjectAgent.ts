/**
 * GIaaS Project Agent
 *
 * Autonomous green investment harvester for all 55 AU nations.
 * Uses LLM knowledge of known/recognised green projects across Africa and
 * inserts them into the greenProjects table with deduplication.
 *
 * Entry points:
 *   runGiaasAgentCycle()          — full 55-nation sweep
 *   runGiaasCountryCycle(iso3)    — single country refresh
 */

import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { greenProjects, scannerSignals } from "../../drizzle/schema";
import { AFRICAN_COUNTRIES } from "../../shared/africanCountries";
import { eq, desc, inArray } from "drizzle-orm";

const MODEL = "claude-opus-4-8";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database unavailable");
  return d;
}

// ── Concurrency guard ─────────────────────────────────────────────────────────
let _cycleRunning = false;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GiaasAgentResult {
  runId: string;
  status: "completed" | "failed" | "skipped";
  countriesProcessed: number;
  projectsInserted: number;
  projectsSkipped: number;
  durationMs: number;
  error?: string;
}

interface RawProject {
  title: string;
  developer: string;
  sector: "renewable_energy" | "reit" | "agriculture";
  description: string;
  claimedCo2Reduction?: number;
  claimedJobsCreated?: number;
  claimedCapacityMw?: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  certifications?: string[];
  sectorMetrics?: Record<string, string | number>;
  sourceConfidence: "high" | "medium" | "low";  // how well-known is this project
}

// ── LLM harvest for a batch of countries ─────────────────────────────────────

async function harvestCountryBatch(
  client: Anthropic,
  countries: typeof AFRICAN_COUNTRIES
): Promise<Map<string, RawProject[]>> {
  const countryList = countries
    .map(c => `- ${c.name} (${c.iso3})`)
    .join("\n");

  const prompt = `You are a green investment intelligence analyst specialising in African ESG projects.

For each of the following African countries, list ALL recognised, real-world green investment projects you know about. Include:
- Renewable energy (solar, wind, hydro, geothermal)
- Green real estate / sustainable REITs
- Sustainable agriculture / carbon farming projects

Countries:
${countryList}

For each project include verified factual data where known. Return ONLY valid JSON in this exact structure:
{
  "projects": [
    {
      "countryIso3": "KEN",
      "title": "Lake Turkana Wind Power",
      "developer": "Lake Turkana Wind Power Ltd",
      "sector": "renewable_energy",
      "description": "310 MW wind farm in Marsabit County, the largest wind power project in Africa.",
      "claimedCo2Reduction": 736000,
      "claimedJobsCreated": 2500,
      "claimedCapacityMw": 310,
      "budget": 680000000,
      "startDate": "2019-01-01",
      "endDate": null,
      "certifications": ["IFC Performance Standards", "LEED"],
      "sectorMetrics": {
        "energyType": "Wind",
        "turbines": "365",
        "gridConnection": "yes",
        "householdsServed": "1000000"
      },
      "sourceConfidence": "high"
    }
  ]
}

Rules:
- Only include REAL projects you have factual knowledge of
- sector must be exactly one of: "renewable_energy", "reit", "agriculture"
- Include at least 1 project per country where you know of any
- Do not invent projects — if you have no data for a country, omit it
- claimedCo2Reduction in tonnes/year, budget in USD, claimedCapacityMw in MW
- sourceConfidence: "high" = well-documented major project, "medium" = known but less data, "low" = referenced but limited info
- Return only JSON, no preamble`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return new Map();

  const parsed = JSON.parse(jsonMatch[0]) as { projects: (RawProject & { countryIso3: string })[] };
  const result = new Map<string, RawProject[]>();

  for (const p of parsed.projects ?? []) {
    const iso3 = p.countryIso3?.toUpperCase();
    if (!iso3) continue;
    if (!result.has(iso3)) result.set(iso3, []);
    const { countryIso3: _, ...rest } = p;
    result.get(iso3)!.push(rest);
  }

  return result;
}

// ── Deduplication key ─────────────────────────────────────────────────────────

function dedupeKey(countryCode: string, developer: string, title: string): string {
  return `${countryCode}::${developer.toLowerCase().trim()}::${title.toLowerCase().trim()}`;
}

// ── Persist projects ──────────────────────────────────────────────────────────

async function persistProjects(
  projects: (RawProject & { countryCode: string; countryName: string })[],
): Promise<{ inserted: number; skipped: number }> {
  const d = await db();
  let inserted = 0;
  let skipped = 0;

  // Load existing projects for dedup
  const existing = await d.select({
    countryCode: greenProjects.countryCode,
    developer:   greenProjects.developer,
    title:       greenProjects.title,
  }).from(greenProjects);

  const existingKeys = new Set(
    existing.map(e => dedupeKey(e.countryCode, e.developer, e.title))
  );

  // Fetch latest political risk scores from scanner signals
  const countryCodes = Array.from(new Set(projects.map(p => p.countryCode)));
  const signalRows = await d
    .select({ countryCode: scannerSignals.countryCode, severity: scannerSignals.severity })
    .from(scannerSignals)
    .where(inArray(scannerSignals.countryCode, countryCodes))
    .orderBy(desc(scannerSignals.ingestedAt))
    .limit(countryCodes.length * 3);

  const politicalRiskMap = new Map<string, number>();
  for (const row of signalRows) {
    if (!politicalRiskMap.has(row.countryCode)) {
      const score = row.severity === "breaking" ? 75 : row.severity === "alert" ? 50 : 25;
      politicalRiskMap.set(row.countryCode, score);
    }
  }

  for (const p of projects) {
    const key = dedupeKey(p.countryCode, p.developer, p.title);
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }

    const politicalRisk = politicalRiskMap.get(p.countryCode) ?? null;

    try {
      await d.insert(greenProjects).values({
        projectId:           randomUUID(),
        title:               p.title,
        developer:           p.developer,
        sector:              p.sector,
        countryCode:         p.countryCode,
        countryName:         p.countryName,
        description:         p.description,
        claimedCo2Reduction: p.claimedCo2Reduction?.toString() ?? null,
        claimedJobsCreated:  p.claimedJobsCreated ?? null,
        claimedCapacityMw:   p.claimedCapacityMw?.toString() ?? null,
        budget:              p.budget?.toString() ?? null,
        startDate:           p.startDate ?? null,
        endDate:             p.endDate ?? null,
        certifications:      p.certifications ?? [],
        sectorMetrics:       (p.sectorMetrics ?? {}) as Record<string, string | number>,
        status:              "active",
        politicalRiskScore:  politicalRisk?.toString() ?? null,
        submittedBy:         null,
      });

      existingKeys.add(key); // prevent intra-batch dupes
      inserted++;
    } catch (e: any) {
      // Duplicate key from concurrent run — treat as skip
      if (e?.code === "ER_DUP_ENTRY") {
        skipped++;
      } else {
        console.warn(`[GIaaS Agent] insert failed for ${p.title}:`, e?.message);
        skipped++;
      }
    }
  }

  return { inserted, skipped };
}

// ── Main cycle — full 55-nation sweep ─────────────────────────────────────────

export async function runGiaasAgentCycle(): Promise<GiaasAgentResult> {
  if (_cycleRunning) {
    return { runId: "skipped", status: "skipped", countriesProcessed: 0, projectsInserted: 0, projectsSkipped: 0, durationMs: 0 };
  }

  if (!ENV.anthropicApiKey) {
    return { runId: "error", status: "failed", countriesProcessed: 0, projectsInserted: 0, projectsSkipped: 0, durationMs: 0, error: "ANTHROPIC_API_KEY not configured" };
  }

  _cycleRunning = true;
  const runId = randomUUID();
  const startMs = Date.now();
  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });

  let totalInserted = 0;
  let totalSkipped = 0;
  let countriesProcessed = 0;

  console.log(`[GIaaS Agent] Starting full cycle ${runId} — ${AFRICAN_COUNTRIES.length} countries`);

  try {
    // Process in batches of 10 countries to keep prompts manageable
    const BATCH_SIZE = 10;
    for (let i = 0; i < AFRICAN_COUNTRIES.length; i += BATCH_SIZE) {
      const batch = AFRICAN_COUNTRIES.slice(i, i + BATCH_SIZE);
      console.log(`[GIaaS Agent] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(c => c.iso3).join(", ")}`);

      try {
        const harvested = await harvestCountryBatch(client, batch);

        const toInsert: (RawProject & { countryCode: string; countryName: string })[] = [];
        for (const [iso3, projects] of Array.from(harvested.entries())) {
          const country = AFRICAN_COUNTRIES.find(c => c.iso3 === iso3);
          if (!country) continue;
          for (const p of projects) {
            toInsert.push({ ...p, countryCode: iso3, countryName: country.name });
          }
          countriesProcessed++;
        }

        if (toInsert.length > 0) {
          const { inserted, skipped } = await persistProjects(toInsert);
          totalInserted += inserted;
          totalSkipped += skipped;
          console.log(`[GIaaS Agent] Batch persisted: +${inserted} new, ${skipped} skipped`);
        }

        // Polite delay between batches
        if (i + BATCH_SIZE < AFRICAN_COUNTRIES.length) {
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (batchErr: any) {
        console.warn(`[GIaaS Agent] Batch failed:`, batchErr?.message);
      }
    }

    const durationMs = Date.now() - startMs;
    console.log(`[GIaaS Agent] Cycle complete in ${(durationMs / 1000).toFixed(1)}s — ${totalInserted} inserted, ${totalSkipped} skipped`);

    return {
      runId,
      status: "completed",
      countriesProcessed,
      projectsInserted: totalInserted,
      projectsSkipped: totalSkipped,
      durationMs,
    };
  } catch (err: any) {
    return {
      runId,
      status: "failed",
      countriesProcessed,
      projectsInserted: totalInserted,
      projectsSkipped: totalSkipped,
      durationMs: Date.now() - startMs,
      error: err?.message ?? "Unknown error",
    };
  } finally {
    _cycleRunning = false;
  }
}

// ── Single-country refresh ────────────────────────────────────────────────────

export async function runGiaasCountryCycle(iso3: string): Promise<GiaasAgentResult> {
  if (!ENV.anthropicApiKey) {
    return { runId: "error", status: "failed", countriesProcessed: 0, projectsInserted: 0, projectsSkipped: 0, durationMs: 0, error: "ANTHROPIC_API_KEY not configured" };
  }

  const runId = randomUUID();
  const startMs = Date.now();
  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  const country = AFRICAN_COUNTRIES.find(c => c.iso3 === iso3.toUpperCase());
  if (!country) {
    return { runId, status: "failed", countriesProcessed: 0, projectsInserted: 0, projectsSkipped: 0, durationMs: 0, error: `Unknown country: ${iso3}` };
  }

  console.log(`[GIaaS Agent] Single-country cycle: ${country.name} (${iso3})`);

  try {
    const harvested = await harvestCountryBatch(client, [country]);
    const raw = harvested.get(iso3.toUpperCase()) ?? [];
    const toInsert = raw.map(p => ({ ...p, countryCode: iso3.toUpperCase(), countryName: country.name }));
    const { inserted, skipped } = toInsert.length > 0 ? await persistProjects(toInsert) : { inserted: 0, skipped: 0 };

    return {
      runId,
      status: "completed",
      countriesProcessed: 1,
      projectsInserted: inserted,
      projectsSkipped: skipped,
      durationMs: Date.now() - startMs,
    };
  } catch (err: any) {
    return {
      runId,
      status: "failed",
      countriesProcessed: 0,
      projectsInserted: 0,
      projectsSkipped: 0,
      durationMs: Date.now() - startMs,
      error: err?.message,
    };
  }
}
