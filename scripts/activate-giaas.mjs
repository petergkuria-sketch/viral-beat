/**
 * One-shot GIaaS activation script.
 * Set ANTHROPIC_API_KEY in .env then run:
 *   node scripts/activate-giaas.mjs
 *
 * Runs in two phases:
 *   1. Ingest the 3 pending data feed URLs already in the DB
 *   2. Full 55-country LLM sweep to seed greenProjects
 */

import { config } from "dotenv";
config();

process.env.DATABASE_URL = "mysql://root:IhVGRbNRVIPOThVisJwoIbuKDTZNObtQ@thomas.proxy.rlwy.net:28022/railway";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌  ANTHROPIC_API_KEY is not set in .env");
  process.exit(1);
}

console.log("✅  API key present. Connecting to Railway DB…");

const { runGiaasAgentCycle, ingestPendingFeeds } = await import("../server/services/giaasProjectAgent.ts");
const Anthropic = (await import("@anthropic-ai/sdk")).default;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

console.log("\n── Phase 1: Ingest pending data feeds ──────────────────────");
const feedResult = await ingestPendingFeeds(client);
console.log("Feed ingestion result:", JSON.stringify(feedResult, null, 2));

console.log("\n── Phase 2: Full 55-country agent sweep ────────────────────");
const cycleResult = await runGiaasAgentCycle();
console.log("Cycle result:", JSON.stringify(cycleResult, null, 2));

console.log("\n✅  Done. Check /green on viralbeat.io for results.");
process.exit(0);
