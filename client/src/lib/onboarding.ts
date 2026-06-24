// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { driver, type Config } from "driver.js";
import "driver.js/dist/driver.css";

export type TourId =
  | "dashboard"
  | "intelligence"
  | "aggregator"
  | "investment-readiness"
  | "field-contributors";

const STORAGE_KEY = "vb_tours_done";

function getDone(): Set<TourId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markDone(id: TourId) {
  try {
    const done = getDone();
    done.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(done)));
  } catch {}
}

export function isTourDone(id: TourId) {
  return getDone().has(id);
}

export function resetTour(id: TourId) {
  try {
    const done = getDone();
    done.delete(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(done)));
  } catch {}
}

// ── Tour definitions ──────────────────────────────────────────────────────────

const commonOpts: Partial<Config> = {
  animate: true,
  showProgress: true,
  showButtons: ["next", "previous", "close"],
  nextBtnText: "Next →",
  prevBtnText: "← Back",
  doneBtnText: "Got it ✓",
  popoverClass: "vb-driver-popover",
};

export function runDashboardTour() {
  const d = driver({
    ...commonOpts,
    onDestroyStarted: () => { markDone("dashboard"); d.destroy(); },
    steps: [
      {
        popover: {
          title: "Welcome to Viral Beat 🌍",
          description: "This is your Mission Control — your personalised hub for Africa political intelligence. Let's take a 60-second tour.",
          // full-screen intro
          
        },
      },
      {
        element: "#dashboard-search",
        popover: {
          title: "Search Any Topic",
          description: "Type a country, political event, or issue to pull live PESTEL+IR signal analysis.",
          side: "bottom",
        },
      },
      {
        element: "#dashboard-mission-cards",
        popover: {
          title: "Mission Control Cards",
          description: "Quick-access to your core intelligence tools — Aggregator, Trending, Investment Readiness, and Field Contributors.",
          side: "top",
        },
      },
      {
        element: "#dashboard-quick-access",
        popover: {
          title: "Quick Access Tiles",
          description: "Jump directly to any module from here. The Africa Hub is your starting point for country-level intelligence.",
          side: "top",
        },
      },
    ],
  });
  d.drive();
}

export function runIntelligenceTour() {
  const d = driver({
    ...commonOpts,
    onDestroyStarted: () => { markDone("intelligence"); d.destroy(); },
    steps: [
      {
        popover: {
          title: "Intelligence Workspace",
          description: "Your AI-powered intelligence engine. Select a country and dimension to generate structured PESTEL+IR analysis.",
          // full-screen intro
          
        },
      },
      {
        element: "#intel-country-selector",
        popover: {
          title: "Select a Country",
          description: "Choose from all 55 African nations. The platform defaults to your geo-detected country on first load.",
          side: "bottom",
        },
      },
      {
        element: "#intel-pestel-tabs",
        popover: {
          title: "PESTEL+IR Dimensions",
          description: "Switch between Political, Economic, Social, Tech, Environmental, Legal, and Investor Readiness — 7 intelligence dimensions in one workspace.",
          side: "bottom",
        },
      },
      {
        element: "#intel-brief-tab",
        popover: {
          title: "Intelligence Brief",
          description: "The AI generates a structured brief with stability scores, risk classifications, and key actors. You can export or share any brief.",
          side: "right",
        },
      },
      {
        element: "#intel-game-theory-tab",
        popover: {
          title: "Game Theory Analysis",
          description: "Strategic intelligence scoring — maps Nash positions and dominant strategy moves for key political actors.",
          side: "right",
        },
      },
      {
        element: "#intel-forecast-tab",
        popover: {
          title: "Predictive Forecast",
          description: "7-day and 30-day signal forecasts with confidence levels. Available on Analyst and Correspondent plans.",
          side: "right",
        },
      },
    ],
  });
  d.drive();
}

export function runAggregatorTour() {
  const d = driver({
    ...commonOpts,
    onDestroyStarted: () => { markDone("aggregator"); d.destroy(); },
    steps: [
      {
        popover: {
          title: "Political Aggregator ⚡",
          description: "Live PESTEL+IR signal feed from RSS, social media, chambers, APEX bodies, and parliamentary records across 55 nations.",
          // full-screen intro
          
        },
      },
      {
        element: "#aggregator-source-filter",
        popover: {
          title: "Filter by Source",
          description: "Toggle signal sources — RSS feeds, X/Twitter, LinkedIn, Business Chambers, APEX Bodies, Parliament, and field contributors.",
          side: "right",
        },
      },
      {
        element: "#aggregator-pestel-filter",
        popover: {
          title: "Filter by PESTEL+IR Dimension",
          description: "Narrow the feed to a specific intelligence dimension — e.g. show only Investor Readiness signals.",
          side: "bottom",
        },
      },
      {
        element: "#aggregator-feed",
        popover: {
          title: "Signal Feed",
          description: "Each card shows the source, country, PESTEL dimension, and a signal summary. Click any card to open the full intelligence view.",
          side: "left",
        },
      },
    ],
  });
  d.drive();
}

export function runInvestmentReadinessTour() {
  const d = driver({
    ...commonOpts,
    onDestroyStarted: () => { markDone("investment-readiness"); d.destroy(); },
    steps: [
      {
        popover: {
          title: "Investment Readiness 🏗️",
          description: "World Bank B-READY indicators and Investment Readiness Scores for 20 AU economies — purpose-built for investors, DFIs, and business intelligence teams.",
          // full-screen intro
          
        },
      },
      {
        element: "#irs-country-list",
        popover: {
          title: "Country Rankings",
          description: "Countries ranked by their IRS (Investment Readiness Score), derived from 10 B-READY indicators. Filter by region or minimum score.",
          side: "right",
        },
      },
      {
        element: "#irs-gauge",
        popover: {
          title: "IRS Gauge",
          description: "The composite Investment Readiness Score (0–100), calculated from B-READY indicators weighted against political stability.",
          side: "left",
        },
      },
      {
        element: "#irs-comparator",
        popover: {
          title: "Country Comparator",
          description: "Select two countries to compare their IRS, B-READY breakdown, FDI inflows, and PESTEL+IR overlay side by side.",
          side: "top",
        },
      },
      {
        element: "#irs-fdi-map",
        popover: {
          title: "FDI Sector Map",
          description: "View FDI inflows by sector for any country — energy, infrastructure, fintech, agriculture, and more.",
          side: "top",
        },
      },
    ],
  });
  d.drive();
}

export function runFieldContributorsTour() {
  const d = driver({
    ...commonOpts,
    onDestroyStarted: () => { markDone("field-contributors"); d.destroy(); },
    steps: [
      {
        popover: {
          title: "Field Contributors 🧑‍💻",
          description: "Submit, validate, and triangulate ground-truth signals from across Africa. Every verified submission earns VBT tokens.",
          // full-screen intro
          
        },
      },
      {
        element: "#haa-submit-signal",
        popover: {
          title: "Submit a Field Signal",
          description: "File a ground-truth observation — protests, policy shifts, voting discrepancies, county-level events. You earn +500 VBT per verified submission.",
          side: "bottom",
        },
      },
      {
        element: "#haa-validate",
        popover: {
          title: "Validate Signals",
          description: "Corroborate signals submitted by others. When 3+ analysts confirm, the signal reaches triangulated status. You earn +50 VBT per corroboration.",
          side: "bottom",
        },
      },
      {
        element: "#haa-vbt-balance",
        popover: {
          title: "VBT Token Balance",
          description: "Your earned VBT tokens — a reflection of your contribution standing. These are contribution rewards, not payment tokens.",
          side: "left",
        },
      },
      {
        element: "#haa-tier-badge",
        popover: {
          title: "Contributor Tier",
          description: "Observer → Analyst → Correspondent → Partner. Your tier rises with verified contributions, unlocking higher signal weighting.",
          side: "left",
        },
      },
    ],
  });
  d.drive();
}

export const TOURS: Record<TourId, () => void> = {
  "dashboard":            runDashboardTour,
  "intelligence":         runIntelligenceTour,
  "aggregator":           runAggregatorTour,
  "investment-readiness": runInvestmentReadinessTour,
  "field-contributors":   runFieldContributorsTour,
};
