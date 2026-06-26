/**
 * Seeds the June 2026 Africa Intelligence Bulletin (Issue 01/12) into Railway MySQL.
 * Run: node scripts/seed-june-bulletin.mjs
 */
import mysql from "mysql2/promise";

const DB_URL = "mysql://root:IhVGRbNRVIPOThVisJwoIbuKDTZNObtQ@thomas.proxy.rlwy.net:28022/railway";

const sections = {
  leadStory: {
    country: "Kenya",
    countryFlag: "🇰🇪",
    headline: "Kenya's IMF Standby Arrangement Unlocks $800M — But Austerity Clawback Threatens 2027 Cycle",
    body: "The IMF Executive Board approved Kenya's 38-month Extended Fund Facility drawing on 26 May 2026, releasing the first $800M tranche. President Ruto framed the deal as 'fiscal discipline with a human face,' but the attached conditionalities — a 2% VAT hike on digital services, freeze on public hiring, and removal of fuel subsidies — have reignited GenZ protest networks dormant since July 2024. The Finance Bill 2026 faces a fiery second reading in July. Verdict: Monitor. Green-sector carve-outs in the IMF deal protect climate-linked infrastructure spend — a rare positive signal for GIaaS-registered developers with active CDM pipelines in Kenya.",
    verdicts: ["monitor", "caution"],
    source: "IMF Press Release + Kenya National Assembly Hansard",
  },
  signals: [
    {
      country: "Rwanda",
      countryFlag: "🇷🇼",
      iso3: "RWA",
      headline: "Kigali Special Economic Zone Phase III opens 40,000 sqm for clean-tech manufacturers",
      verdict: "go-market",
      source: "Rwanda Development Board",
      date: "2026-06-04",
    },
    {
      country: "Ghana",
      countryFlag: "🇬🇭",
      iso3: "GHA",
      headline: "Cocoa board restructuring triggers cedi slide; debt-for-nature swap window opens",
      verdict: "monitor",
      source: "Bank of Ghana MPC Minutes",
      date: "2026-06-10",
    },
    {
      country: "Ethiopia",
      countryFlag: "🇪🇹",
      iso3: "ETH",
      headline: "GERD reaches 95% capacity; downstream Egypt-Sudan talks stalled at AU level",
      verdict: "caution",
      source: "African Union Peace & Security Council Communiqué",
      date: "2026-06-08",
    },
    {
      country: "South Africa",
      countryFlag: "🇿🇦",
      iso3: "ZAF",
      headline: "GNU survives first budget vote; Eskom Stage 1 load-shedding confirmed for Q3",
      verdict: "monitor",
      source: "National Assembly Record + Eskom OCGT Bulletin",
      date: "2026-06-12",
    },
    {
      country: "Senegal",
      countryFlag: "🇸🇳",
      iso3: "SEN",
      headline: "Sangomar oil field output hits 60,000 bpd; Pastef government raises sovereign wealth allocations",
      verdict: "go-market",
      source: "Woodside Energy Investor Update",
      date: "2026-06-06",
    },
    {
      country: "Nigeria",
      countryFlag: "🇳🇬",
      iso3: "NGA",
      headline: "Dangote refinery begins Atlantic-facing export run; naira stabilises at ₦1,580/USD",
      verdict: "monitor",
      source: "CBN Weekly Foreign Exchange Report",
      date: "2026-06-14",
    },
  ],
  verdictShifts: [
    { country: "Senegal", countryFlag: "🇸🇳", iso3: "SEN", delta: 8, from: "Caution", to: "Monitor" },
    { country: "Ghana",   countryFlag: "🇬🇭", iso3: "GHA", delta: -4, from: "Monitor", to: "Caution" },
    { country: "Rwanda",  countryFlag: "🇷🇼", iso3: "RWA", delta: 6, from: "Monitor", to: "Go-Market" },
  ],
  fieldObservations: [
    {
      location: "Kisumu, Kenya",
      headline: "Lake Victoria basin fisherfolk report rapid water hyacinth retreat following NEMA herbicide rollout",
      body: "Three VB contributors embedded with the Lake Victoria Basin Commission confirm that the Kenya-Uganda joint herbicide programme has cleared an estimated 40% of hyacinth coverage near Dunga Beach since April 2026. Local fishing incomes up ~22% month-on-month. Sustainable fisheries projects may qualify for GIaaS blue-carbon credit trails.",
      contributors: 3,
      date: "2026-06-11",
      vbtAwarded: 120,
    },
    {
      location: "Nairobi, Kenya — Eastlands",
      headline: "Informal settlement solar-microgrids outpacing grid connection timelines by 3:1 ratio",
      body: "A VB field reporter in Mathare documents 17 rooftop solar installations completed by community SACCOs in May 2026, while Kenya Power connection queues in the same ward remain 9+ months long. The gap is creating a parallel energy economy with embedded fintech (M-KOPA, SunCulture) capturing the liquidity.",
      contributors: 1,
      date: "2026-06-09",
      vbtAwarded: 80,
    },
  ],
  giaasSpotlight: {
    projectTitle: "Rungwe Highland Reforestation & Carbon Credit Programme",
    country: "Tanzania",
    countryFlag: "🇹🇿",
    iso3: "TZA",
    summary: "A 4,200-hectare reforestation initiative in the Southern Highlands targeting Afromontane species restoration. The developer has pre-registered 18,000 tCO₂e for Verra VCS certification with the GIaaS validation track, aiming for first credit issuance in Q1 2027. Community benefit-sharing at 35% of net revenues — above the GIaaS minimum threshold of 25%.",
    developer: "Greenfield Tanzania Ltd",
    projectId: undefined,
  },
};

const htmlContent = `
<article class="bulletin-issue">
  <p>Welcome to the inaugural edition of the <strong>Africa Intelligence Bulletin</strong> — ViralBeat's monthly signal digest for investors, policymakers, and field operators tracking the continent's political economy and green transition.</p>
  <p>This issue covers the period <strong>1–26 June 2026</strong> and tracks 17 countries across the ViralBeat signal network.</p>

  <h2>From the Editor</h2>
  <p>Africa's June 2026 political economy is defined by two countervailing forces: a resurgent institutional confidence (IMF deals, sovereign oil revenues, SEZ expansions) colliding with a restless street politics that has found new vocabulary in the post-GenZ moment. Neither force is temporary. Our verdicts this issue reflect that tension — more "Monitor" than "Go-Market", but with clear pockets of breakout opportunity in Rwanda, Senegal, and Tanzania's Southern Highlands.</p>
  <p>Issue 01/12 sets the baseline for our 2026 annual arc. We'll track how each signal evolves over the year.</p>
  <p><em>— The ViralBeat Intelligence Desk, Nairobi</em></p>
</article>
`;

const stats = {
  breakingShifts: 7,
  greenProjects: 3,
  fieldSignals: 14,
  verdictsChanged: 3,
};

const coverCountries = ["KEN", "RWA", "GHA", "ETH", "ZAF", "SEN", "NGA", "TZA"];

async function seed() {
  const conn = await mysql.createConnection(DB_URL);
  try {
    const [existing] = await conn.execute(
      "SELECT id FROM intelligenceBulletins WHERE slug = '2026-06' LIMIT 1"
    );
    if (existing.length > 0) {
      console.log("Updating existing June 2026 bulletin...");
      await conn.execute(
        `UPDATE intelligenceBulletins SET
          issueNumber=?, title=?, summary=?, htmlContent=?,
          sections=?, coverCountries=?, stats=?, status=?, publishedAt=?
         WHERE slug='2026-06'`,
        [
          1,
          "Africa Intelligence Bulletin — June 2026",
          "Issue 01/12: IMF deals, Dangote refinery exports, GERD tensions, Kigali clean-tech expansion, and the first GIaaS spotlight — Rungwe Highland reforestation in Tanzania.",
          htmlContent,
          JSON.stringify(sections),
          JSON.stringify(coverCountries),
          JSON.stringify(stats),
          "published",
          new Date("2026-06-26"),
        ]
      );
      console.log("✓ Updated and published.");
    } else {
      console.log("Inserting June 2026 bulletin...");
      await conn.execute(
        `INSERT INTO intelligenceBulletins
          (slug, issueNumber, title, summary, htmlContent, sections, coverCountries, stats, status, publishedAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "2026-06",
          1,
          "Africa Intelligence Bulletin — June 2026",
          "Issue 01/12: IMF deals, Dangote refinery exports, GERD tensions, Kigali clean-tech expansion, and the first GIaaS spotlight — Rungwe Highland reforestation in Tanzania.",
          htmlContent,
          JSON.stringify(sections),
          JSON.stringify(coverCountries),
          JSON.stringify(stats),
          "published",
          new Date("2026-06-26"),
        ]
      );
      console.log("✓ Inserted and published.");
    }
  } finally {
    await conn.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
