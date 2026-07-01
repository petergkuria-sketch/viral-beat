// ── SME Exchange — Phase 1 seed data ───────────────────────────────────────────
// Stock-market-style discovery board. SMEs list a verified Enterprise Readiness
// Score (ERS); those at/above the graduation gate sit on the Capital-Ready board.
//
// Phase 1 is discovery-only — no capital is handled. Listings shown here are
// sample data pending each enterprise's consent before public publication.

export const ERS_GATE = 61; // ERS at/above this graduates to the Capital-Ready board

export type ExchangeBoard = "open" | "capital_ready";

// Verification is orthogonal to the ERS number. An SME only reaches the
// Capital-Ready board once it is BOTH ERS ≥ 61 AND fully verified — a high
// self-assessed number alone never graduates. This is what prevents inflation.
export type VerificationLevel =
  | "unverified"          // self-assessment only (P0 default)
  | "validator_verified"  // ≥3 independent validators have scored it
  | "document_verified"   // document gateway passed
  | "fully_verified";     // validators + documents both cleared

export function verificationBadge(level: VerificationLevel = "unverified"): { label: string; color: string; hint: string } {
  switch (level) {
    case "fully_verified":     return { label: "Fully verified",     color: "#22c55e", hint: "Validators and documents both cleared." };
    case "document_verified":  return { label: "Documents verified", color: "#38bdf8", hint: "Documents cleared — validator review pending." };
    case "validator_verified": return { label: "Validator-verified", color: "#a855f7", hint: "Independent validators have scored this SME." };
    default:                   return { label: "Self-assessed",      color: "#94a3b8", hint: "Self-reported only — not yet independently verified." };
  }
}

// Coaching rubric shown alongside each self-assessment slider (from the ERS
// review). Bands map a 0–100 self-rating to an honest interpretation so owners
// rate themselves accurately rather than aspirationally.
export const ERS_RUBRIC: Record<keyof ERSPillars, { question: string; bands: { max: number; label: string; example: string }[] }> = {
  governance: {
    question: "How well-organised are your leadership and compliance?",
    bands: [
      { max: 33, label: "Emerging",  example: "Informal structure, no documented processes." },
      { max: 66, label: "Developing", example: "Basic org chart, some documented policies." },
      { max: 100, label: "Strong",   example: "Certified compliance, regular board reviews, audit-ready." },
    ],
  },
  financial: {
    question: "How stable and profitable is your business?",
    bands: [
      { max: 33, label: "Emerging",  example: "No formal accounting, irregular cash flow." },
      { max: 66, label: "Developing", example: "Annual accounting, 2-year revenue history, positive cash flow." },
      { max: 100, label: "Strong",   example: "Audited financials, 5-year history, institutional banking." },
    ],
  },
  innovation: {
    question: "How quickly do you adapt and develop new products?",
    bands: [
      { max: 33, label: "Emerging",  example: "No R&D, reactive to the market." },
      { max: 66, label: "Developing", example: "Regular product improvements, customer feedback loops." },
      { max: 100, label: "Strong",   example: "Systematic product development, patents/IP, market-leading." },
    ],
  },
  market: {
    question: "How wide is your customer base and reach?",
    bands: [
      { max: 33, label: "Emerging",  example: "<100 customers, single location." },
      { max: 66, label: "Developing", example: "100–1000 customers, 2–3 regions." },
      { max: 100, label: "Strong",   example: "1000+ customers, multi-country, recognised brand." },
    ],
  },
};

export function rubricBand(pillar: keyof ERSPillars, value: number) {
  return ERS_RUBRIC[pillar].bands.find(b => value <= b.max) ?? ERS_RUBRIC[pillar].bands[ERS_RUBRIC[pillar].bands.length - 1];
}

export interface ERSPillars {
  governance: number;   // cap table, ownership, board
  financial: number;    // revenue consistency, audit trail
  innovation: number;   // R&D, IP, product pipeline
  market: number;       // customer base, reach, partnerships
}

export interface ExchangeSME {
  id: string;
  listingId?: number;        // DB id for the public detail page (real listings only)
  name: string;
  sector: string;
  country: string;
  countryCode: string;       // ISO3
  location: string;
  ers: number;               // weighted composite 0–100
  verificationLevel?: VerificationLevel;  // gates the Capital-Ready board
  pillars: ERSPillars;
  status: string[];          // signalled market status, e.g. "Seeking partners"
  summary: string;
  products?: string;
  certifications?: string[];
  exportMarkets?: string[];
  awards?: string[];
  listedBy?: { type: "incubator" | "accelerator"; org: string };  // set when lodged on behalf
  sample: boolean;           // true = illustrative, not yet consented/published
}

// Capital-Ready requires BOTH a passing ERS and full verification. A high
// self-assessed score on its own stays on the Open board.
export function boardOf(sme: Pick<ExchangeSME, "ers"> & { verificationLevel?: VerificationLevel }): ExchangeBoard {
  return sme.ers >= ERS_GATE && sme.verificationLevel === "fully_verified" ? "capital_ready" : "open";
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
    ers: 39, // capped self-assessment (0–50) until validators + documents verify
    verificationLevel: "unverified",
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
