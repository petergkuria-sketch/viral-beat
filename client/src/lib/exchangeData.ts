// ── SME Exchange — Phase 1 seed data ───────────────────────────────────────────
// Stock-market-style discovery board. SMEs list a verified Enterprise Readiness
// Score (ERS); those at/above the graduation gate sit on the Capital-Ready board.
//
// Phase 1 is discovery-only — no capital is handled. Listings shown here are
// sample data pending each enterprise's consent before public publication.

export const ERS_GATE = 61; // ERS at/above this graduates to the Capital-Ready board

export type ExchangeBoard = "open" | "capital_ready";

export interface ERSPillars {
  governance: number;   // cap table, ownership, board
  financial: number;    // revenue consistency, audit trail
  innovation: number;   // R&D, IP, product pipeline
  market: number;       // customer base, reach, partnerships
}

export interface ExchangeSME {
  id: string;
  name: string;
  sector: string;
  country: string;
  countryCode: string;       // ISO3
  location: string;
  ers: number;               // composite 0–100
  pillars: ERSPillars;
  status: string[];          // signalled market status, e.g. "Seeking partners"
  summary: string;
  products?: string;
  certifications?: string[];
  exportMarkets?: string[];
  awards?: string[];
  sample: boolean;           // true = illustrative, not yet consented/published
}

export function boardOf(sme: Pick<ExchangeSME, "ers">): ExchangeBoard {
  return sme.ers >= ERS_GATE ? "capital_ready" : "open";
}

// Phase 1 working sample — Nile Chocolates only.
export const EXCHANGE_SMES: ExchangeSME[] = [
  {
    id: "nile-chocolates",
    name: "Nile Chocolates",
    sector: "Agro-processing",
    country: "Uganda",
    countryCode: "UGA",
    location: "Kyambogo University Business Incubation Centre, Kampala",
    ers: 79,
    pillars: { governance: 80, financial: 74, innovation: 82, market: 78 },
    status: ["Matchmaking-ready", "Seeking partners", "Export bound"],
    summary:
      "Uganda's emerging chocolate brand, locally sourcing Ugandan cocoa beans for distinct flavour profiles. Targeting regional dominance across East Africa through competitive pricing and a local sourcing advantage.",
    products: "Chocolates, cocoa products, herbal infusions",
    certifications: ["UNBS", "Phytosanitary certificate"],
    exportMarkets: ["DRC", "South Sudan", "Rwanda", "Kenya"],
    awards: [
      "Kampala Impact Day",
      "UWEAL",
      "Belgian chocolate school certificate",
      "ITC certificate",
      "Daily Monitor Top 100 MSMEs",
    ],
    sample: true,
  },
];

export function ersBand(ers: number): { label: string; color: string } {
  if (ers >= 81) return { label: "Premium listed", color: "#a855f7" };
  if (ers >= 61) return { label: "Investment ready", color: "#22c55e" };
  if (ers >= 41) return { label: "Developing", color: "#f59e0b" };
  return { label: "Not ready", color: "#ef4444" };
}
