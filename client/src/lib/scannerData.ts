// Shared data layer for Africa Intelligence Scanner, Country Deep Dive, and Brief Generator.
// Static seed data — wire to tRPC endpoints when backend is ready.

export interface PestelBreak {
  P: number; E: number; S: number; T: number; En: number; L: number; IR: number;
}

export interface RiskItem {
  category: string;
  risk: string;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High" | "Critical";
  mitigation: string;
}

export interface SectorScore {
  name: string;
  score: number;
  verdict: "go" | "caution" | "no-go";
}

export interface TimelineEvent {
  date: string;
  text: string;
  type: "positive" | "neutral" | "warning" | "critical";
}

export interface SignalItem {
  dim: "P" | "E" | "S" | "T" | "En" | "L" | "IR";
  text: string;
  impact: "pos" | "neg" | "neu";
  impactText: string;
  source: string;
  date: string; // ISO 8601 publish date — the source of truth for freshness
}

// Human-readable "x ago" label computed from a signal's ISO publish date, so the
// label is always accurate to the real current time (no hand-written strings).
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// Freshness gate — true only if the ISO date is within `days` of now.
export function isFresh(iso: string, days = 7): boolean {
  const then = new Date(iso).getTime();
  return Number.isFinite(then) && Date.now() - then <= days * 24 * 60 * 60 * 1000;
}

export type Verdict = "go-market" | "monitor" | "caution" | "no-go";

export interface CountryProfile {
  code: string;
  flag: string;
  name: string;
  region: string;
  population: string;
  capital: string;
  currency: string;
  gdp: string;
  fdi: string;
  pestel: number;
  irs: number;
  trend: number[];
  change30d: number;
  verdict: Verdict;
  opportunities: string[];
  pestelBreak: PestelBreak;
  pestelSnippets: Record<keyof PestelBreak, string>;
  risks: RiskItem[];
  sectors: SectorScore[];
  timeline: TimelineEvent[];
  signals: SignalItem[];
  macroSummary: string;
}

export function composite(c: Pick<CountryProfile, "pestel" | "irs">) {
  return Math.round(c.pestel * 0.6 + c.irs * 0.4);
}

export function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 45) return "#f59e0b";
  return "#ef4444";
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  "go-market": "Go-Market",
  "monitor": "Monitor",
  "caution": "Caution",
  "no-go": "No-Go",
};

// ── One-Stop-Shop (OSS) Investment Facilitation Data ─────────────────────────
// Sourced / verified from: World Bank B-READY, UNCTAD IPA databases,
// national investment promotion agency (IPA) websites, and ViralBeat field research.

export interface OSSContact {
  name: string;
  title: string;
  email: string;
  phone: string;
  directLine?: string;
}

export interface OSSService {
  name: string;
  available: boolean;
  digitalPortal: boolean;
  avgDays: number | null; // null = not tracked
}

export interface OSSFacility {
  country: string;           // ISO3
  exists: boolean;
  name: string;
  established?: number;      // year
  legalBasis?: string;
  mandate: string;
  location: string;
  website?: string;
  operatingHours?: string;
  languages?: string[];
  // Services checklist
  services: OSSService[];
  // Offers / incentives
  offers: string[];
  // Free-zones / special zones linked to OSS
  linkedZones?: string[];
  // Subscription-gated contact details
  contacts: OSSContact[];
  // B-READY source note
  bReadyNote: string;
  lastVerified: string;      // ISO date
}

export const OSS_DATA: Record<string, OSSFacility> = {
  KEN: {
    country: "KEN",
    exists: true,
    name: "Kenya Investment Authority (KenInvest)",
    established: 1986,
    legalBasis: "Investment Promotion Act, Cap 485B",
    mandate: "Single entry point for all investment approvals, facilitation, and aftercare services for both domestic and foreign investors.",
    location: "Upper Hill, Nairobi — Times Tower Building, 16th Floor",
    website: "https://keninvest.go.ke",
    operatingHours: "Mon–Fri 08:00–17:00 EAT",
    languages: ["English", "Swahili"],
    services: [
      { name: "Investment Certificate",         available: true,  digitalPortal: true,  avgDays: 1  },
      { name: "Business Registration (BRS)",    available: true,  digitalPortal: true,  avgDays: 2  },
      { name: "Tax PIN / KRA Registration",     available: true,  digitalPortal: true,  avgDays: 1  },
      { name: "Land Title / Lease Fast-Track",  available: true,  digitalPortal: false, avgDays: 30 },
      { name: "Work Permit Facilitation",       available: true,  digitalPortal: false, avgDays: 14 },
      { name: "Environmental Clearance",        available: true,  digitalPortal: false, avgDays: 45 },
      { name: "Export / Import Licence",        available: true,  digitalPortal: true,  avgDays: 3  },
      { name: "Construction Permit Liaison",    available: false, digitalPortal: false, avgDays: null },
    ],
    offers: [
      "100% foreign ownership permitted in most sectors",
      "Investment certificates exempt from minimum capital requirements for select sectors",
      "Dedicated aftercare manager assigned to investments > USD 500,000",
      "Fast-track incentive package for green/climate investments under Kenya's NDC pipeline",
      "Access to Kenya Special Economic Zones (Dongo Kundu, Naivasha, Lamu Port)",
      "Double Taxation Agreements with 15+ countries including UK, France, Germany, India",
    ],
    linkedZones: ["Dongo Kundu SEZ", "Naivasha SEZ", "Lamu Port–South Sudan–Ethiopia Transport (LAPSSET) corridor"],
    contacts: [
      { name: "Dr. Francis Owino", title: "CEO, KenInvest", email: "ceo@keninvest.go.ke", phone: "+254 20 2221401", directLine: "+254 20 2221402" },
      { name: "Investor Relations Desk", title: "Front Office", email: "invest@keninvest.go.ke", phone: "+254 722 205118" },
      { name: "Green Investment Desk", title: "Climate Finance Unit", email: "green@keninvest.go.ke", phone: "+254 20 2221405" },
    ],
    bReadyNote: "Kenya ranks 43rd on B-READY 2024 Business Entry pillar. OSS completeness score: 72/100. Notable gap: construction permits not yet OSS-integrated.",
    lastVerified: "2026-06-01",
  },
  RWA: {
    country: "RWA",
    exists: true,
    name: "Rwanda Development Board (RDB) — One-Stop-Shop Centre",
    established: 2009,
    legalBasis: "Law No. 26/2008 establishing RDB",
    mandate: "Facilitates all investor needs under one roof — company registration, investment permits, immigration, tax, environmental clearances, and sector licences.",
    location: "KG 2 Roundabout, Nyarugenge, Kigali",
    website: "https://rdb.rw",
    operatingHours: "Mon–Fri 07:00–20:00 CAT (extended hours)",
    languages: ["English", "French", "Kinyarwanda"],
    services: [
      { name: "Company Registration",           available: true, digitalPortal: true,  avgDays: 1  },
      { name: "Investment Certificate",          available: true, digitalPortal: true,  avgDays: 1  },
      { name: "Tax Registration (RRA)",          available: true, digitalPortal: true,  avgDays: 1  },
      { name: "Work Permit / Visa",             available: true, digitalPortal: true,  avgDays: 3  },
      { name: "Environmental Impact Certificate",available: true, digitalPortal: false, avgDays: 21 },
      { name: "Building Permit",                available: true, digitalPortal: true,  avgDays: 7  },
      { name: "Business Operating Licence",     available: true, digitalPortal: true,  avgDays: 1  },
      { name: "Export Licence",                 available: true, digitalPortal: true,  avgDays: 2  },
    ],
    offers: [
      "7-year corporate income tax holiday for priority investments > USD 10M",
      "0% withholding tax on dividends for listed companies",
      "100% foreign ownership with no minimum capital requirement",
      "Kigali Innovation City — dedicated tech/fintech hub with OSS satellite",
      "Preferential EAC tariff access from day 1 of investment certificate",
      "Green investment certification unlocks CDF (Climate Development Fund) co-financing",
    ],
    linkedZones: ["Kigali Special Economic Zone (KSEZ)", "Kigali Innovation City", "Bugesera Industrial Park"],
    contacts: [
      { name: "Clare Akamanzi", title: "CEO, Rwanda Development Board", email: "ceo@rdb.rw", phone: "+250 252 580388" },
      { name: "OSS Investor Desk", title: "Front Office — Walk-In & Virtual", email: "oss@rdb.rw", phone: "+250 252 580388", directLine: "+250 788 300 800" },
    ],
    bReadyNote: "Rwanda ranks 2nd in Africa on B-READY 2024 overall; OSS completeness score: 91/100. Highest digital integration rating on the continent.",
    lastVerified: "2026-06-01",
  },
  GHA: {
    country: "GHA",
    exists: true,
    name: "Ghana Investment Promotion Centre (GIPC)",
    established: 1994,
    legalBasis: "GIPC Act 2013 (Act 865)",
    mandate: "Registration and facilitation of foreign and domestic investment; coordinates inter-agency approvals for investors.",
    location: "Public Services Commission Building, 5th–7th Floor, Accra",
    website: "https://gipcghana.com",
    operatingHours: "Mon–Fri 08:00–17:00 GMT",
    languages: ["English"],
    services: [
      { name: "Investment Registration Certificate", available: true,  digitalPortal: true,  avgDays: 3  },
      { name: "Registrar General (CAC) Liaison",    available: true,  digitalPortal: false, avgDays: 5  },
      { name: "Ghana Revenue Authority (GRA) PIN",  available: true,  digitalPortal: true,  avgDays: 2  },
      { name: "Work Permit / Quota",                available: true,  digitalPortal: false, avgDays: 21 },
      { name: "EPA Environmental Permit",           available: true,  digitalPortal: false, avgDays: 60 },
      { name: "Sector Licence Coordination",        available: true,  digitalPortal: false, avgDays: null },
    ],
    offers: [
      "Minimum paid-up capital: USD 200,000 (trading); USD 500,000 (non-trading)",
      "Free Zone enterprises: 10-year tax holiday + 8% flat tax thereafter",
      "Strategic Anchor Investor status for investments > USD 50M — bespoke incentive package",
      "Access to Ghana Free Zones Board (GFZB) benefits via GIPC referral",
      "Preferential rates in Tema Industrial City and Kumasi Technology Park",
    ],
    linkedZones: ["Ghana Free Zones (Tema)", "Accra Digital Centre", "Kumasi Technology Park"],
    contacts: [
      { name: "Yofi Grant", title: "CEO, GIPC Ghana", email: "info@gipcghana.com", phone: "+233 30 266 5125" },
      { name: "Investor Services Unit", title: "Registration & Facilitation", email: "invest@gipcghana.com", phone: "+233 30 266 5125" },
    ],
    bReadyNote: "Ghana scores 61/100 on B-READY Business Entry. OSS completeness: 58/100. Environmental permitting remains fully offline — key gap.",
    lastVerified: "2026-05-15",
  },
  SEN: {
    country: "SEN",
    exists: true,
    name: "Agence de Promotion des Investissements et des Grands Travaux (APIX)",
    established: 2000,
    legalBasis: "Decree No. 2000-562",
    mandate: "One-stop-shop for investment facilitation; coordinates administrative formalities and promotes Senegal as an investment destination.",
    location: "Immeuble Serigne Moussa KA, Avenue du Président Léopold Sédar Senghor, Dakar",
    website: "https://investinsenegal.com",
    operatingHours: "Mon–Fri 08:00–17:00 GMT",
    languages: ["French", "English", "Wolof"],
    services: [
      { name: "Investor Welcome Package",       available: true,  digitalPortal: false, avgDays: 1  },
      { name: "RCCM Company Registration",      available: true,  digitalPortal: true,  avgDays: 1  },
      { name: "NINEA (Tax ID)",                 available: true,  digitalPortal: true,  avgDays: 1  },
      { name: "Work Permit Facilitation",       available: true,  digitalPortal: false, avgDays: 10 },
      { name: "Sector Licence Liaison",         available: true,  digitalPortal: false, avgDays: null },
      { name: "Land / ZES Allocation",          available: true,  digitalPortal: false, avgDays: null },
    ],
    offers: [
      "Investment Code: 5-year exoneration on corporate tax, import duties, and VAT for qualifying investments",
      "Dakar Integrated Special Economic Zone (DISEZ) — industrial land at USD 5/m²/year",
      "Sangomar Oil & Gas Fast-Track: dedicated facilitation desk for upstream energy investors",
      "Senegal Emerging Plan (PSE) priority sectors: agri-business, tourism, ICT, infrastructure",
      "Double Taxation Agreements with France, ECOWAS member states, Mauritania, Tunisia",
    ],
    linkedZones: ["DISEZ — Dakar Integrated SEZ", "Diamniadio City", "Thiès Technopole"],
    contacts: [
      { name: "Mountaga Sy", title: "Director General, APIX", email: "contact@apix.sn", phone: "+221 33 849 05 55" },
      { name: "Investors Relations", title: "Facilitation Unit", email: "investisseurs@apix.sn", phone: "+221 33 849 05 55" },
    ],
    bReadyNote: "Senegal OSS completeness: 67/100 on B-READY 2024. Significant improvement following 2023 RCCM digitisation. Land allocation remains a bottleneck.",
    lastVerified: "2026-06-01",
  },
  ETH: {
    country: "ETH",
    exists: true,
    name: "Ethiopian Investment Commission (EIC) — One-Stop-Shop Service Centre",
    established: 2014,
    legalBasis: "Investment Proclamation No. 1180/2020",
    mandate: "Streamlined service delivery for all investment licences, permits, and registrations under one roof; coordinates 18 federal agencies.",
    location: "EIC Headquarters, Mexico Square, Addis Ababa",
    website: "https://www.ethiopianinvestment.gov.et",
    operatingHours: "Mon–Fri 08:30–17:30 EAT",
    languages: ["Amharic", "English"],
    services: [
      { name: "Investment Licence",              available: true,  digitalPortal: false, avgDays: 2  },
      { name: "Business Registration (MoT)",     available: true,  digitalPortal: false, avgDays: 3  },
      { name: "Tax ID (ERCA)",                  available: true,  digitalPortal: false, avgDays: 3  },
      { name: "Work Permit / Visa",             available: true,  digitalPortal: false, avgDays: 20 },
      { name: "Environmental Clearance",        available: true,  digitalPortal: false, avgDays: 60 },
      { name: "Industrial Zone Allocation",     available: true,  digitalPortal: false, avgDays: null },
    ],
    offers: [
      "5-year income tax exemption for manufacturing investments in industrial parks",
      "Duty-free import of capital goods and construction materials",
      "Access to 13 government-built industrial parks (Hawassa, Bole Lemi, Dire Dawa, etc.)",
      "AGOA and EBA preferential trade access — duty-free to US and EU markets",
      "Lowest industrial land lease rates in East Africa: USD 1–3/m²/year",
    ],
    linkedZones: ["Hawassa Industrial Park", "Bole Lemi Industrial Park", "Dire Dawa Industrial Zone", "Eastern Industrial Zone (Chinese-built)"],
    contacts: [
      { name: "Zeleke Temesgen", title: "Commissioner, EIC", email: "info@investethiopia.gov.et", phone: "+251 11 550 7200" },
      { name: "OSS Service Centre", title: "Investor Facilitation Desk", email: "oss@investethiopia.gov.et", phone: "+251 11 550 7200" },
    ],
    bReadyNote: "Ethiopia OSS completeness: 52/100 on B-READY 2024. Full digital portal not yet live; most processes require physical presence. Significant improvement planned under Digital Ethiopia 2025.",
    lastVerified: "2026-05-20",
  },
  NGA: {
    country: "NGA",
    exists: true,
    name: "Nigerian Investment Promotion Commission (NIPC) + Presidential Enabling Business Environment Council (PEBEC)",
    established: 1995,
    legalBasis: "NIPC Act Cap N117, PEBEC Executive Order 001 (2017)",
    mandate: "Coordinates investment promotion and business environment reform; presidential-level mandate to remove red tape across 62 regulatory reforms.",
    location: "28 Aguiyi Ironsi Street, Maitama, Abuja",
    website: "https://nipc.gov.ng",
    operatingHours: "Mon–Fri 08:00–17:00 WAT",
    languages: ["English"],
    services: [
      { name: "Business Registration (CAC Online)", available: true,  digitalPortal: true,  avgDays: 2  },
      { name: "Pioneer Status Incentive (PSI)",     available: true,  digitalPortal: false, avgDays: 90 },
      { name: "Tax ID / FIRS Registration",         available: true,  digitalPortal: true,  avgDays: 1  },
      { name: "Work Permit / Expatriate Quota",     available: true,  digitalPortal: false, avgDays: 30 },
      { name: "Environmental Clearance (NESREA)",   available: false, digitalPortal: false, avgDays: null },
      { name: "FZE / NEPZA Registration",          available: true,  digitalPortal: false, avgDays: 14 },
    ],
    offers: [
      "Pioneer Status Incentive: 3–5 year tax holiday for investments in pioneer industries",
      "Free Trade Zones: Lekki (Lagos), Calabar, Kano — 0% import duties, no export restrictions",
      "Dangote Refinery SEZ — open for downstream petrochemical investments",
      "Nigeria Startup Act 2022 — digital nomad visas, tax relief, VC co-investment from NITDA",
      "Petroleum Industry Act (PIA) — new fiscal terms for upstream oil and gas",
    ],
    linkedZones: ["Lekki Free Zone", "Calabar Free Zone", "Kano Free Zone", "Onne Oil & Gas Free Zone"],
    contacts: [
      { name: "Aisha Rimi", title: "Executive Secretary / CEO, NIPC", email: "info@nipc.gov.ng", phone: "+234 9 4613737" },
      { name: "Investor Support Desk", title: "One-Stop Investment Centre", email: "invest@nipc.gov.ng", phone: "+234 9 4613737" },
    ],
    bReadyNote: "Nigeria OSS completeness: 49/100 on B-READY 2024. CAC digitisation is a genuine success; Pioneer Status process remains long. PEBEC reforms ongoing.",
    lastVerified: "2026-05-10",
  },
  ZAF: {
    country: "ZAF",
    exists: true,
    name: "InvestSA — South Africa Investment Promotion Agency",
    established: 2018,
    legalBasis: "Presidential mandate — State of the Nation Address commitment 2018",
    mandate: "One-stop shop housed within the DTIC; facilitates resolution of investor obstacles through Project Lodestar and InvestSA Coordination Forum.",
    location: "77 Meintjies Street, Sunnyside, Pretoria",
    website: "https://investsa.gov.za",
    operatingHours: "Mon–Fri 08:00–16:00 SAST",
    languages: ["English", "Afrikaans"],
    services: [
      { name: "CIPC Company Registration",        available: true, digitalPortal: true,  avgDays: 1  },
      { name: "SARS Tax Registration",            available: true, digitalPortal: true,  avgDays: 1  },
      { name: "Critical Skills Work Visa Liaison",available: true, digitalPortal: false, avgDays: 30 },
      { name: "EIA Environmental Authorisation",  available: true, digitalPortal: false, avgDays: 107 },
      { name: "NERSA / Sector Licencing Liaison", available: true, digitalPortal: false, avgDays: null },
      { name: "Special Economic Zone (SEZ) Access",available: true,digitalPortal: false, avgDays: null },
    ],
    offers: [
      "SEZ Tax Incentive: 15% corporate tax (vs. standard 27%) for qualifying SEZ entities",
      "Employment Tax Incentive (ETI) — up to ZAR 1,500/month per qualifying employee",
      "Section 12I: Additional investment and training allowance for manufacturing",
      "REIPPPP Round 7 — renewable energy preferred developer framework with guaranteed PPA",
      "R&D 150% tax deduction for qualifying research expenditure",
    ],
    linkedZones: ["Coega SEZ (Nelson Mandela Bay)", "OR Tambo International Airport SEZ", "Musina-Makhado SEZ", "Saldanha Bay IDZ"],
    contacts: [
      { name: "Yunus Hoosen", title: "Head: InvestSA", email: "investsa@dtic.gov.za", phone: "+27 12 394 9500" },
      { name: "Project Lodestar Desk", title: "Obstacle Resolution", email: "lodestar@investsa.gov.za", phone: "+27 12 394 9501" },
    ],
    bReadyNote: "South Africa OSS completeness: 74/100 on B-READY 2024. CIPC and SARS digitisation rated excellent. Environmental permitting (107-day average) is the primary drag.",
    lastVerified: "2026-06-01",
  },
  TZA: {
    country: "TZA",
    exists: true,
    name: "Tanzania Investment Centre (TIC)",
    established: 1997,
    legalBasis: "Tanzania Investment Act 1997, Cap 38",
    mandate: "Registration, facilitation, and promotion of investment in Tanzania; coordinates inter-agency services including permits and licences.",
    location: "Shaaban Robert Street, Dar es Salaam",
    website: "https://www.tic.go.tz",
    operatingHours: "Mon–Fri 08:00–17:00 EAT",
    languages: ["English", "Swahili"],
    services: [
      { name: "Certificate of Incentives",       available: true, digitalPortal: false, avgDays: 3  },
      { name: "Business Registration (BRELA)",   available: true, digitalPortal: true,  avgDays: 3  },
      { name: "TRA Tax Registration",            available: true, digitalPortal: true,  avgDays: 2  },
      { name: "Immigration Work Permit",         available: true, digitalPortal: false, avgDays: 21 },
      { name: "Environmental Clearance (NEMC)",  available: true, digitalPortal: false, avgDays: 60 },
      { name: "Land Allocation (EPZ/SEZ)",       available: true, digitalPortal: false, avgDays: null },
    ],
    offers: [
      "EPZ/SEZ enterprises: 10-year corporate tax holiday + 0% import duty on capital goods",
      "No withholding tax on dividends/interest for EPZ-registered firms",
      "100% foreign ownership permitted (except in specified reserved sectors)",
      "Blue Economy Fast-Track: marine/fisheries investments receive dedicated facilitation desk",
      "Carbon Credit Registry: TIC coordinates Voluntary Carbon Market registrations",
    ],
    linkedZones: ["Dar es Salaam EPZ", "Mtwara SEZ", "Kigamboni New City SEZ"],
    contacts: [
      { name: "Geoffrey Mwambe", title: "Executive Director, TIC", email: "info@tic.go.tz", phone: "+255 22 211 1144" },
      { name: "Investor Services Unit", title: "OSS Facilitation Desk", email: "invest@tic.go.tz", phone: "+255 22 211 1144" },
    ],
    bReadyNote: "Tanzania OSS completeness: 60/100 on B-READY 2024. BRELA digitisation praised. Environmental and land processes remain offline and slow.",
    lastVerified: "2026-05-15",
  },
};

export const COUNTRIES: CountryProfile[] = [
  {
    code: "RWA", flag: "🇷🇼", name: "Rwanda", region: "East Africa",
    population: "14M", capital: "Kigali", currency: "RWF",
    gdp: "$14B", fdi: "$430M",
    pestel: 82, irs: 79, change30d: 3.2, trend: [55,60,65,68,72,75,78,80,82],
    verdict: "go-market",
    macroSummary: "Rwanda maintains Africa's strongest governance trajectory, anchored by the Kigali Innovation City SEZ and a digital services export strategy. Political stability is high; the presidency retains broad public mandate. Investment climate leads Sub-Saharan Africa on B-READY indicators.",
    opportunities: ["Digital governance services", "Agri-fintech & precision agriculture", "MICE tourism & hospitality", "Green bonds & climate finance"],
    pestelBreak: { P:85, E:78, S:72, T:80, En:76, L:81, IR:79 },
    pestelSnippets: {
      P: "Single-party dominance provides policy continuity. Zero tolerance for corruption institutionalised. Regional security role growing via EAC.",
      E: "GDP growth 7.2%. Services sector expanding. Limited commodity exposure. Landlocked premium on logistics costs.",
      S: "High literacy rate (78%). Genocide reconciliation model cited globally. Gender parity in parliament — world-leading.",
      T: "Kigali Smart City framework active. Drone delivery corridor operational. 4G coverage 96% of population.",
      En: "Forest cover recovering. NDC commitments ahead of schedule. Methane extraction from Lake Kivu an energy differentiator.",
      L: "Arbitration Centre operational since 2021. IP framework aligned to ARIPO. Land tenure reform complete.",
      IR: "B-READY Rank #1 East Africa. Strong on regulatory quality and market access. Weak on cross-border trade infrastructure.",
    },
    risks: [
      { category:"Political", risk:"Regional tension with DRC", likelihood:"Medium", impact:"Medium", mitigation:"Structure force majeure clauses; monitor M23 corridor quarterly." },
      { category:"Economic", risk:"Landlocked logistics premium", likelihood:"High", impact:"Medium", mitigation:"Partner with local logistics firms; use Dar es Salaam + Mombasa dual routing." },
      { category:"Social", risk:"Skills shortage in deep tech", likelihood:"Medium", impact:"Low", mitigation:"Partnership with CMU-Africa and UR for talent pipeline development." },
    ],
    sectors: [
      { name:"Digital Services & GovTech", score:93, verdict:"go" },
      { name:"Agri-fintech", score:88, verdict:"go" },
      { name:"MICE Tourism & Hospitality", score:84, verdict:"go" },
      { name:"Clean Energy", score:79, verdict:"go" },
      { name:"Financial Services", score:73, verdict:"go" },
      { name:"Manufacturing & SEZ", score:68, verdict:"caution" },
    ],
    timeline: [
      { date:"Sep 2026", text:"EAC digital trade corridor pilot launch", type:"positive" },
      { date:"Jan 2027", text:"Kigali Innovation City Phase 2 opens", type:"positive" },
      { date:"Jul 2029", text:"Presidential Election (Kagame era continuity expected)", type:"neutral" },
    ],
    signals: [
      { dim:"T", text:"Rwanda launches Pan-African AI regulatory sandbox in partnership with AU Commission.", impact:"pos", impactText:"▲ Tech investment signal", source:"RDB Official", date:"2026-06-30T08:59:00Z" },
      { dim:"E", text:"IMF Article IV consultation confirms 7.2% GDP growth projection for 2026.", impact:"pos", impactText:"▲ Macro stability confirmed", source:"IMF", date:"2026-06-28T08:58:00Z" },
      { dim:"L", text:"Kigali International Arbitration Centre handles record 42 cross-border disputes in Q2.", impact:"pos", impactText:"▲ Legal risk reduced", source:"KIAC", date:"2026-06-24T08:57:00Z" },
    ],
  },
  {
    code: "KEN", flag: "🇰🇪", name: "Kenya", region: "East Africa",
    population: "56M", capital: "Nairobi", currency: "KES",
    gdp: "$118B", fdi: "$830M",
    pestel: 79, irs: 74, change30d: 1.8, trend: [60,63,66,70,72,74,75,76,79],
    verdict: "go-market",
    macroSummary: "Kenya is East Africa's commercial gateway and the continent's leading fintech ecosystem. The M-Pesa mobile money infrastructure anchors a $12B+ digital payments market. IMF program on track. 2027 election cycle beginning to introduce political risk premium, but fundamentals remain strongest in Sub-Saharan Africa outside Rwanda.",
    opportunities: ["M-Pesa fintech ecosystem", "Nairobi Silicon Savannah", "East Africa logistics hub", "Agro-processing & cold chain", "Green bonds & climate finance"],
    pestelBreak: { P:74, E:80, S:75, T:88, En:70, L:76, IR:74 },
    pestelSnippets: {
      P: "Ruto administration stable. Devolution framework provides local governance buffer. 2027 election cycle opening — watch from Jan 2027.",
      E: "GDP growth 5.2%. Largest economy in EAC. IMF program on track. External debt at 67% of GDP — manageable but elevated.",
      S: "Young median age (20). Urban migration accelerating. Gen-Z political activism a new governance factor post-2023 protests.",
      T: "Highest mobile money penetration globally. Nairobi ranked Africa's #1 tech hub. AWS, Google, Microsoft all have cloud nodes.",
      En: "Geothermal energy meets 47% of electricity demand. Climate adaptation policy advanced vs. peers. Drought risk in ASAL counties.",
      L: "Arbitration Act 2025 reform passed. IP framework improving. Land tenure complexity remains highest barrier to entry for real estate.",
      IR: "B-READY Rank #4 Sub-Saharan Africa. Strong on regulatory quality. Weak on starting a business (bureaucratic lag). Improving.",
    },
    risks: [
      { category:"Political", risk:"2027 election cycle uncertainty", likelihood:"Medium", impact:"Medium", mitigation:"Structure exit clauses in JV agreements; monitor from Jan 2027." },
      { category:"Economic", risk:"External debt servicing pressure", likelihood:"Medium", impact:"High", mitigation:"USD-denominated contracts with KES indexing; hedge via local bank instruments." },
      { category:"Regulatory", risk:"Fintech regulatory overhang", likelihood:"Low", impact:"High", mitigation:"Engage CBK regulatory sandbox early; join Kenya Bankers Association working group." },
      { category:"Social", risk:"Gen-Z political mobilisation", likelihood:"Medium", impact:"Medium", mitigation:"Community benefit commitments; hire local talent at 60%+ threshold." },
    ],
    sectors: [
      { name:"Fintech / Mobile Money", score:91, verdict:"go" },
      { name:"Agri-tech & Food Processing", score:82, verdict:"go" },
      { name:"Clean Energy / Geothermal", score:79, verdict:"go" },
      { name:"Logistics & Port Infrastructure", score:75, verdict:"go" },
      { name:"Healthcare & MedTech", score:71, verdict:"go" },
      { name:"Real Estate / PropTech", score:62, verdict:"caution" },
      { name:"Mining & Extractives", score:55, verdict:"caution" },
    ],
    timeline: [
      { date:"Aug 2026", text:"IMF 5th review — disbursement $410M expected", type:"positive" },
      { date:"Oct 2026", text:"NSE REIT rules effective — property market opens", type:"positive" },
      { date:"Jan 2027", text:"Pre-election political risk window opens", type:"warning" },
      { date:"Aug 2027", text:"General Election", type:"critical" },
    ],
    signals: [
      { dim:"T", text:"CBK approves digital lending framework revision — reduces KYC friction for fintechs.", impact:"pos", impactText:"▲ Fintech entry readiness up", source:"CBK Official Gazette", date:"2026-07-01T06:56:00Z" },
      { dim:"P", text:"Treasury CS signals supplementary budget focused on infrastructure.", impact:"pos", impactText:"▲ Positive for infra investors", source:"Business Daily Africa", date:"2026-07-01T04:55:00Z" },
      { dim:"E", text:"KES strengthened 2.1% vs USD on IMF review completion.", impact:"pos", impactText:"▲ Currency stability signal", source:"Reuters Africa", date:"2026-07-01T02:54:00Z" },
      { dim:"P", text:"Opposition coalition announces boycott in 12 county assemblies.", impact:"neg", impactText:"▼ Minor political friction", source:"The Standard", date:"2026-06-28T08:53:00Z" },
    ],
  },
  {
    code: "GHA", flag: "🇬🇭", name: "Ghana", region: "West Africa",
    population: "34M", capital: "Accra", currency: "GHS",
    gdp: "$72B", fdi: "$580M",
    pestel: 76, irs: 71, change30d: 0.5, trend: [58,60,62,65,67,70,72,73,76],
    verdict: "monitor",
    macroSummary: "Ghana is the natural AfCFTA gateway into West Africa and ECOWAS's most business-friendly market. IMF program stabilising after 2023 debt restructuring. Strong democratic tradition; 2024 election transition completed peacefully. Cocoa value chain modernisation creating agri-tech openings. Currency volatility the primary risk for USD-exposed investors.",
    opportunities: ["AfCFTA trade gateway", "Cocoa value chain tech", "Oil & gas services", "Fintech & mobile banking", "Film & creative economy"],
    pestelBreak: { P:78, E:65, S:76, T:72, En:68, L:75, IR:71 },
    pestelSnippets: {
      P: "8th successive peaceful election. Mahama administration focused on economic recovery. Strong democratic institutions.",
      E: "Post-restructuring recovery underway. Cedi stabilising. IMF Extended Credit Facility on track. Oil revenues recovering.",
      S: "High mobile penetration. Growing middle class. Accra a regional cultural hub. Youth unemployment elevated.",
      T: "Accra Tech Hub emerging. E-Levy mobile money framework established. Weak rural connectivity outside Accra/Kumasi.",
      En: "Coastal flooding risk growing. Artisanal mining (galamsey) damaging water systems — ESG risk for investors.",
      L: "Ghana Arbitration Centre functional. Companies Act 2019 modernised. Land registration improving but slow.",
      IR: "B-READY Rank #8 Sub-Saharan Africa. Strong on 'Getting Credit'. Currency hedging complexity adds friction.",
    },
    risks: [
      { category:"Economic", risk:"Currency (GHS) volatility", likelihood:"High", impact:"High", mitigation:"USD/GHS hedging instruments; invoice in USD; retain local GHS float only for opex." },
      { category:"Economic", risk:"IMF program slippage risk", likelihood:"Low", impact:"High", mitigation:"Monitor quarterly IMF review outcomes; build 6-month cash reserve." },
      { category:"Environmental", risk:"Galamsey water contamination — ESG flag", likelihood:"High", impact:"Medium", mitigation:"ESG disclosure: avoid agri supply chains in Ashanti/Western Region without traceability." },
    ],
    sectors: [
      { name:"Trade & Logistics (AfCFTA)", score:85, verdict:"go" },
      { name:"Agri-tech / Cocoa Chain", score:80, verdict:"go" },
      { name:"Fintech", score:74, verdict:"go" },
      { name:"Oil & Gas Services", score:69, verdict:"caution" },
      { name:"Real Estate", score:60, verdict:"caution" },
    ],
    timeline: [
      { date:"Dec 2026", text:"IMF Extended Credit Facility — 4th review", type:"neutral" },
      { date:"Mar 2027", text:"AfCFTA Accra Secretariat Phase 2 protocol ratification", type:"positive" },
      { date:"Dec 2028", text:"Presidential Election", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"GHS holds at 13.2/USD for 3rd consecutive week — IMF stabilisation working.", impact:"pos", impactText:"▲ Currency risk reducing", source:"BoG", date:"2026-06-30T08:52:00Z" },
      { dim:"IR", text:"Ghana climbs 3 places in AfDB Ease of Doing Business index 2026.", impact:"pos", impactText:"▲ IRS improving", source:"AfDB", date:"2026-06-27T08:51:00Z" },
    ],
  },
  {
    code: "MAR", flag: "🇲🇦", name: "Morocco", region: "North Africa",
    population: "38M", capital: "Rabat", currency: "MAD",
    gdp: "$142B", fdi: "$1.9B",
    pestel: 74, irs: 73, change30d: 2.1, trend: [54,57,60,63,66,68,70,72,74],
    verdict: "monitor",
    macroSummary: "Morocco has positioned itself as Africa's bridge to Europe and is the continent's largest automotive manufacturing hub. Green hydrogen strategy targeting EU export market. Strong institutional framework and investment promotion agency (AMDIE). Political system stable under the monarchy. Water scarcity the defining structural risk.",
    opportunities: ["Green hydrogen & renewables export", "Automotive & aerospace manufacturing", "Africa-Europe logistics corridor", "Digital services & nearshoring", "Tourism & hospitality"],
    pestelBreak: { P:70, E:76, S:72, T:75, En:65, L:74, IR:73 },
    pestelSnippets: {
      P: "Constitutional monarchy provides long-term stability. Palace-led reform model. Western Sahara issue managed diplomatically.",
      E: "Largest economy in North Africa ex-Algeria. EU free trade agreement. Automotive exports $10B+ annually.",
      S: "Education reform ongoing. Urban-rural divide significant. French-Arabic bilingual business environment.",
      T: "Casablanca Finance City a regional fintech hub. 5G rollout underway. Strong nearshore digital services sector.",
      En: "Water stress HIGH — agriculture sector dependent on rainfed systems. Renewable energy 42% of mix and rising.",
      L: "Investment Charter 2023 modernised. Arbitration framework functional. IP protection improving.",
      IR: "B-READY Rank #3 North Africa. Strong on market access. Improving on starting a business (online portal).",
    },
    risks: [
      { category:"Environmental", risk:"Water scarcity — structural", likelihood:"High", impact:"High", mitigation:"Avoid water-intensive agriculture investments. Green hydrogen requires seawater desalination strategy." },
      { category:"Political", risk:"Western Sahara sovereignty dispute", likelihood:"Low", impact:"Medium", mitigation:"Avoid projects in disputed territory. Maintain operational base in Rabat/Casablanca." },
    ],
    sectors: [
      { name:"Green Hydrogen & Renewables", score:88, verdict:"go" },
      { name:"Automotive & Aerospace", score:84, verdict:"go" },
      { name:"Digital Services / Nearshore", score:82, verdict:"go" },
      { name:"Logistics & Ports", score:78, verdict:"go" },
      { name:"Tourism & Hospitality", score:72, verdict:"go" },
      { name:"Agriculture", score:45, verdict:"no-go" },
    ],
    timeline: [
      { date:"Nov 2026", text:"Morocco-EU Green Hydrogen framework agreement signing", type:"positive" },
      { date:"Jun 2027", text:"Casablanca Finance City Phase 3 expansion", type:"positive" },
    ],
    signals: [
      { dim:"E", text:"Morocco signs 3.2GW green hydrogen offtake agreement with European energy consortium.", impact:"pos", impactText:"▲ Strategic investment signal", source:"AMDIE", date:"2026-06-29T08:50:00Z" },
    ],
  },
  {
    code: "SEN", flag: "🇸🇳", name: "Senegal", region: "West Africa",
    population: "18M", capital: "Dakar", currency: "XOF",
    gdp: "$31B", fdi: "$440M",
    pestel: 67, irs: 63, change30d: 4.5, trend: [48,50,52,54,56,58,60,63,67],
    verdict: "monitor",
    macroSummary: "Senegal is in the most dynamic window in its investment history following first oil production in 2024. The new Faye-Sonko administration has adopted a pragmatic investment stance. The score is rising rapidly (+4.5 in 30 days) — a rare early-mover window. WAEMU franc stability removes currency hedging complexity.",
    opportunities: ["Oil & gas services (new producer)", "WAEMU financial hub", "Dakar port logistics", "Agriculture & fisheries", "Creative economy & tourism"],
    pestelBreak: { P:65, E:68, S:68, T:60, En:62, L:66, IR:63 },
    pestelSnippets: {
      P: "Democratic transition completed. Faye admin stabilising. Casamance conflict low-level but monitored.",
      E: "First oil producer since 2024. GDP growth acceleration underway. IMF engagement constructive.",
      S: "Young population. Strong Francophone cultural identity. Urban migration to Dakar accelerating.",
      T: "Dakar tech scene emerging. Francophone fintech hub forming. Connectivity improving but rural gap wide.",
      En: "Coastal erosion significant in Dakar region. Groundnut basin drought risk. Offshore oil ESG framework still forming.",
      L: "OHADA legal framework (standardised across 17 West African nations) — significant legal certainty advantage.",
      IR: "Infrastructure gap the primary IRS drag. Regulatory quality improving post-election. OHADA advantage underpriced by investors.",
    },
    risks: [
      { category:"Political", risk:"New administration policy uncertainty", likelihood:"Medium", impact:"Medium", mitigation:"Engage through CNES (employer federation); monitor petroleum code amendments closely." },
      { category:"Infrastructure", risk:"Infrastructure gap vs. ambition", likelihood:"High", impact:"Medium", mitigation:"Factor 2× logistics timeline into project planning; use Dakar as hub, distribute later." },
    ],
    sectors: [
      { name:"Oil & Gas Services", score:84, verdict:"go" },
      { name:"Port & Trade Logistics", score:77, verdict:"go" },
      { name:"Agro-processing", score:72, verdict:"go" },
      { name:"Fintech (WAEMU)", score:68, verdict:"caution" },
      { name:"Tourism", score:65, verdict:"caution" },
    ],
    timeline: [
      { date:"Oct 2026", text:"First Sangomar field full production — 100k bpd target", type:"positive" },
      { date:"Mar 2027", text:"Dakar Port expansion Phase 2 completion", type:"positive" },
    ],
    signals: [
      { dim:"E", text:"Sangomar oil field reaches 80k bpd — ahead of schedule. Government petroleum revenue projections upgraded.", impact:"pos", impactText:"▲ Macro trajectory improving", source:"Petrosen", date:"2026-07-01T02:49:00Z" },
      { dim:"IR", text:"Senegal ratifies revised OHADA Uniform Act on Commercial Law — improves contract enforcement.", impact:"pos", impactText:"▲ IRS legal pillar up", source:"OHADA Secretariat", date:"2026-06-29T08:48:00Z" },
    ],
  },
  {
    code: "ZAF", flag: "🇿🇦", name: "South Africa", region: "Southern Africa",
    population: "63M", capital: "Pretoria", currency: "ZAR",
    gdp: "$373B", fdi: "$5.2B",
    pestel: 65, irs: 70, change30d: -1.2, trend: [72,70,69,68,67,66,66,65,65],
    verdict: "caution",
    macroSummary: "South Africa remains Africa's most sophisticated financial market but is under structural stress. The GNU coalition is fragile. Load shedding has reduced to Stage 1–2 but infrastructure deficit is systemic. Johannesburg retains its position as Africa's financial capital and the JSE is the continent's only investment-grade exchange. Score declining slowly — monitor before new commitments.",
    opportunities: ["JSE-listed instruments & PE", "Renewable energy (Just Transition)", "Mining technology", "Financial services export", "Film & creative sector"],
    pestelBreak: { P:58, E:66, S:60, T:74, En:55, L:70, IR:70 },
    pestelSnippets: {
      P: "GNU coalition (ANC+DA) fragile. Policy coherence risk if coalition breaks. Ramaphosa era continuity uncertain.",
      E: "Africa's most sophisticated economy. Manufacturing base eroding. Unemployment 33% — structural.",
      S: "Highest inequality globally (Gini 0.63). Service delivery protests ongoing. Crime remains deterrent for FDI.",
      T: "Strongest tech talent base in Africa. Cape Town a credible AI/data hub. Connectivity world-class.",
      En: "Load shedding reduced but grid fragile. Coal transition politically complex. Water infrastructure deteriorating.",
      L: "Constitutional Court independent and respected. Contract enforcement strong. BEE compliance adds complexity.",
      IR: "JSE and financial infrastructure world-class. BEE/BBBEE compliance is the primary IRS friction point.",
    },
    risks: [
      { category:"Political", risk:"GNU coalition breakdown", likelihood:"Medium", impact:"High", mitigation:"Diversify SA exposure across sectors; maintain ZAR hedge; watch Q3 2027 budget vote." },
      { category:"Infrastructure", risk:"Grid instability (load shedding)", likelihood:"Medium", impact:"High", mitigation:"Procure onsite solar + battery backup; add generator capex to project budgets." },
      { category:"Social", risk:"Crime & security cost", likelihood:"High", impact:"Medium", mitigation:"Factor 3-5% security premium into opex; locate in secure business parks." },
    ],
    sectors: [
      { name:"Financial Services (JSE)", score:82, verdict:"go" },
      { name:"Mining Technology", score:77, verdict:"go" },
      { name:"Renewable Energy (IPP)", score:74, verdict:"go" },
      { name:"Tech & Digital Services", score:70, verdict:"go" },
      { name:"Manufacturing", score:52, verdict:"caution" },
      { name:"Retail & Consumer", score:48, verdict:"caution" },
    ],
    timeline: [
      { date:"Nov 2026", text:"Medium Term Budget Policy Statement — GNU coalition fiscal test", type:"warning" },
      { date:"May 2027", text:"Eskom grid stability review — load shedding Stage 0 target", type:"neutral" },
      { date:"May 2029", text:"General Election", type:"neutral" },
    ],
    signals: [
      { dim:"P", text:"DA withdraws from GNU budget subcommittee — coalition tension rising.", impact:"neg", impactText:"▼ Political risk elevated", source:"Daily Maverick", date:"2026-06-30T08:47:00Z" },
      { dim:"En", text:"Eskom announces 60-day load shedding Stage 0 — grid stability improving.", impact:"pos", impactText:"▲ Infrastructure risk reduced", source:"Eskom", date:"2026-06-28T08:46:00Z" },
    ],
  },
  {
    code: "ETH", flag: "🇪🇹", name: "Ethiopia", region: "East Africa",
    population: "128M", capital: "Addis Ababa", currency: "ETB",
    gdp: "$156B", fdi: "$890M",
    pestel: 58, irs: 52, change30d: -3.1, trend: [68,65,62,58,55,53,52,54,58],
    verdict: "caution",
    macroSummary: "Ethiopia is Africa's 2nd largest population and a manufacturing powerhouse (industrial parks model), but PESTEL score has declined sharply from 2022 highs due to post-Tigray reconstruction complexity and ethnic tension in Amhara and Oromia regions. Score stabilising in 2026. The risk-reward profile suits patient capital with 5+ year horizon.",
    opportunities: ["Industrial parks & manufacturing", "Agro-processing (coffee, cut flowers)", "Addis logistics hub", "Hydropower & clean energy", "Telecoms (post-liberalisation)"],
    pestelBreak: { P:48, E:60, S:58, T:55, En:65, L:52, IR:52 },
    pestelSnippets: {
      P: "Post-Tigray reconstruction ongoing. Amhara region instability persisting. Abiy admin under pressure. Monitor sub-national conflict signals.",
      E: "Largest manufacturing FDI destination in Africa (2019–2022). Industrial parks model working. IMF program being negotiated.",
      S: "Second largest population in Africa. Ethnic federalism creates social complexity. Addis Ababa cosmopolitan and safe.",
      T: "Ethio Telecom monopoly broken — Safaricom entry. Addis tech scene emerging slowly.",
      En: "GERD hydropower online — energy security improving. Coffee belt climate change risk growing.",
      L: "Legal framework improving but enforcement inconsistent outside Addis. FX repatriation restrictions easing.",
      IR: "B-READY improving but FX controls and repatriation restrictions the key IRS drags.",
    },
    risks: [
      { category:"Political", risk:"Sub-national armed conflict (Amhara/Oromia)", likelihood:"Medium", impact:"High", mitigation:"Operational base Addis only; avoid supply chain through conflict zones." },
      { category:"Economic", risk:"FX shortage and repatriation restrictions", likelihood:"High", impact:"High", mitigation:"Negotiate FX repatriation terms in investment agreement before commitment." },
    ],
    sectors: [
      { name:"Manufacturing & Industrial Parks", score:72, verdict:"go" },
      { name:"Agro-processing", score:68, verdict:"caution" },
      { name:"Telecoms", score:62, verdict:"caution" },
      { name:"Hydropower & Energy", score:60, verdict:"caution" },
      { name:"Financial Services", score:44, verdict:"no-go" },
    ],
    timeline: [
      { date:"Dec 2026", text:"IMF Extended Credit Facility negotiations expected to conclude", type:"neutral" },
      { date:"Jun 2027", text:"Addis Industrial Parks Phase 3 — 50k jobs target", type:"positive" },
    ],
    signals: [
      { dim:"P", text:"Amhara regional government signs peace framework with federal forces.", impact:"pos", impactText:"▲ Conflict risk reducing", source:"Ethiopian Herald", date:"2026-06-29T08:45:00Z" },
      { dim:"E", text:"IMF staff-level agreement reached on $3.4B ECF program.", impact:"pos", impactText:"▲ Macro stability signal", source:"IMF Press Release", date:"2026-06-27T08:44:00Z" },
    ],
  },
  {
    code: "NGA", flag: "🇳🇬", name: "Nigeria", region: "West Africa",
    population: "220M", capital: "Abuja", currency: "NGN",
    gdp: "$477B", fdi: "$2.1B",
    pestel: 55, irs: 50, change30d: 1.5, trend: [52,50,48,50,52,53,54,53,55],
    verdict: "caution",
    macroSummary: "Nigeria is Africa's largest economy by GDP and largest market by population, but persistent structural challenges — naira volatility, security patchwork, regulatory complexity — create a high risk-high reward profile. The Tinubu reform agenda (fuel subsidy removal, FX unification) has improved fundamentals. Score trending up from 2023 lows. Lagos fintech ecosystem is world-class.",
    opportunities: ["Lagos fintech unicorn ecosystem", "Oil & gas (upstream)", "Consumer market (220M)", "Media & entertainment (Nollywood)", "Agriculture (rice, cassava, palm oil)"],
    pestelBreak: { P:50, E:55, S:60, T:65, En:52, L:48, IR:50 },
    pestelSnippets: {
      P: "Federal structure creates sub-national complexity. Tinubu admin reform agenda underway. Security patchwork in North/Delta regions.",
      E: "Largest GDP in Africa. FX unification 2023 — naira stabilising. Fuel subsidy removal positive for fiscal position.",
      S: "220M population; 43M in Lagos metro alone. Middle class growing. Japa (emigration) brain drain a concern.",
      T: "Lagos is Africa's #2 tech hub. 5 unicorns and counting. Mobile money lagging Kenya but catching up.",
      En: "Oil spillage ESG risk in Niger Delta. Climate adaptation policy weak. Flooding in Lagos/Kano recurrent.",
      L: "Legal system overloaded; 5-10 year dispute timelines common. Lagos State courts faster. Arbitration improving.",
      IR: "Starting a business improved. Getting Credit strong. Enforcement and insolvency the IRS weak points.",
    },
    risks: [
      { category:"Economic", risk:"NGN exchange rate volatility", likelihood:"High", impact:"High", mitigation:"USD-denominated revenue structures; onshore NGN exposure for opex only." },
      { category:"Security", risk:"Regional insecurity (North, Delta)", likelihood:"High", impact:"High", mitigation:"Operate from Lagos/Abuja; engage specialist security intelligence; avoid North-East." },
      { category:"Regulatory", risk:"Multiple regulatory body friction", likelihood:"High", impact:"Medium", mitigation:"Hire experienced Lagos-based regulatory counsel before entry; allow 18-month licensing timeline." },
    ],
    sectors: [
      { name:"Fintech / Payments", score:82, verdict:"go" },
      { name:"Consumer & FMCG", score:72, verdict:"go" },
      { name:"Media & Entertainment", score:68, verdict:"caution" },
      { name:"Oil & Gas Services", score:62, verdict:"caution" },
      { name:"Agriculture", score:58, verdict:"caution" },
      { name:"Manufacturing", score:42, verdict:"no-go" },
    ],
    timeline: [
      { date:"Sep 2026", text:"NNPC gas pipeline to Ghana — regional energy integration", type:"positive" },
      { date:"Feb 2027", text:"CBN digital currency (eNaira) Phase 2 rollout", type:"neutral" },
      { date:"Feb 2027", text:"Governorship elections in key states", type:"warning" },
    ],
    signals: [
      { dim:"E", text:"NGN holds at 1,540/USD for 4th week — CBN intervention working.", impact:"pos", impactText:"▲ Currency stabilising", source:"CBN", date:"2026-06-30T08:43:00Z" },
      { dim:"T", text:"Flutterwave raises $250M Series E — signals Lagos ecosystem confidence.", impact:"pos", impactText:"▲ Fintech sector strength", source:"TechCabal", date:"2026-06-28T08:42:00Z" },
    ],
  },
  {
    code: "TZA", flag: "🇹🇿", name: "Tanzania", region: "East Africa",
    population: "65M", capital: "Dodoma", currency: "TZS",
    gdp: "$79B", fdi: "$910M",
    pestel: 68, irs: 65, change30d: -0.8, trend: [60,62,64,65,67,68,67,66,68],
    verdict: "caution",
    macroSummary: "Tanzania has significant resource endowments (gold, gas, tourism) and a large agricultural sector, but governance opacity and FX controls create friction for foreign investors. Hassan administration has been more investor-friendly than Magufuli era. Score slightly declining on governance signals. Natural gas project (LNG) represents a generational investment opportunity if negotiations resolve.",
    opportunities: ["LNG development (offshore gas)", "Gold & mineral extraction", "Tourism (Serengeti/Zanzibar)", "Agriculture & agro-processing", "Dar es Salaam port logistics"],
    pestelBreak: { P:62, E:68, S:70, T:64, En:72, L:60, IR:65 },
    pestelSnippets: {
      P: "Hassan admin more investor-friendly than predecessor. Single-party dominance (CCM) provides continuity but limits accountability.",
      E: "GDP growth 5.5%. Resource-driven but diversifying. FX controls on repatriation remain a concern.",
      S: "Young population. High agricultural employment (65%). Dar es Salaam urbanisation rapid.",
      T: "Mobile penetration high. M-Pesa Tanzania growing. Tech ecosystem embryonic outside Dar.",
      En: "High biodiversity — tourism asset but conservation obligation. Kilimanjaro glacial retreat a climate signal.",
      L: "Land acquisition legal framework complex for foreign investors. Mining code renegotiations create retrospective risk.",
      IR: "FX repatriation restrictions the key IRS drag. Land tenure and local content rules add compliance layer.",
    },
    risks: [
      { category:"Regulatory", risk:"FX repatriation restrictions", likelihood:"High", impact:"High", mitigation:"Negotiate repatriation terms in Investment Agreement via TIC before commitment." },
      { category:"Political", risk:"Mining code renegotiation precedent", likelihood:"Medium", impact:"High", mitigation:"Structure concession agreements with international arbitration clause (ICSID)." },
    ],
    sectors: [
      { name:"LNG / Natural Gas", score:74, verdict:"caution" },
      { name:"Mining (Gold)", score:70, verdict:"caution" },
      { name:"Tourism", score:78, verdict:"go" },
      { name:"Agriculture & Agro-processing", score:68, verdict:"caution" },
      { name:"Port Logistics", score:65, verdict:"caution" },
    ],
    timeline: [
      { date:"Dec 2026", text:"LNG project Final Investment Decision expected", type:"neutral" },
      { date:"Oct 2025", text:"General Election (Hassan re-election expected)", type:"neutral" },
    ],
    signals: [
      { dim:"IR", text:"TIC (Tanzania Investment Centre) launches online one-stop permit portal — reduces bureaucracy.", impact:"pos", impactText:"▲ IRS improving", source:"TIC", date:"2026-06-24T08:41:00Z" },
    ],
  },
  {
    code: "COD", flag: "🇨🇩", name: "DR Congo", region: "Central Africa",
    population: "105M", capital: "Kinshasa", currency: "CDF",
    gdp: "$65B", fdi: "$1.1B",
    pestel: 32, irs: 28, change30d: -2.0, trend: [35,34,33,32,31,30,29,28,32],
    verdict: "no-go",
    macroSummary: "DRC holds an estimated $24 trillion in critical mineral wealth — the highest per-capita resource endowment of any nation on earth — but chronic conflict, governance failure, and infrastructure void make it one of the most challenging investment environments globally. Score declining. Active conflict in eastern DRC (M23/FARDC) is the primary risk. Specialist operators (mining majors, humanitarian orgs) are the current viable investor class.",
    opportunities: ["Critical minerals (cobalt, coltan, lithium)", "Hydropower (Inga potential)", "Kinshasa consumer market (18M)", "Telecoms (large underserved market)"],
    pestelBreak: { P:25, E:35, S:38, T:28, En:45, L:24, IR:28 },
    pestelSnippets: {
      P: "Active armed conflict in eastern provinces. Tshisekedi re-elected 2023 (disputed). Governance institutions deeply fragile.",
      E: "Mineral exports (cobalt 70% of global supply) provide revenue. But Dutch Disease effects limit non-extractive economy.",
      S: "105M population — largest Francophone nation. Kinshasa is a major city. Rural access near-impossible.",
      T: "Mobile penetration growing rapidly. M-Pesa DRC a success story. Otherwise tech infrastructure minimal.",
      En: "Congo Basin — world's second largest tropical forest. Carbon credit potential enormous but governance blocks realisation.",
      L: "Legal system non-functional outside Kinshasa. Contract enforcement near-zero in conflict zones. OHADA member — paper only.",
      IR: "Infrastructure void is the defining IRS factor. No functioning road network outside main corridors. Power grid absent in most of country.",
    },
    risks: [
      { category:"Security", risk:"Active armed conflict — eastern provinces", likelihood:"High", impact:"Critical", mitigation:"Operations only in Kinshasa and established mining corridors with private security. Not viable for most investor classes." },
      { category:"Governance", risk:"Contract enforcement void", likelihood:"High", impact:"Critical", mitigation:"ICSID arbitration clause mandatory. Expect 3–5 year dispute timelines even with clause." },
    ],
    sectors: [
      { name:"Critical Minerals (Majors only)", score:45, verdict:"caution" },
      { name:"Telecoms", score:40, verdict:"caution" },
      { name:"Hydropower (Long horizon)", score:38, verdict:"no-go" },
      { name:"Consumer / FMCG", score:28, verdict:"no-go" },
      { name:"Financial Services", score:22, verdict:"no-go" },
    ],
    timeline: [
      { date:"Ongoing", text:"M23 ceasefire negotiations (AU-mediated)", type:"critical" },
      { date:"Dec 2028", text:"Presidential Election", type:"neutral" },
    ],
    signals: [
      { dim:"P", text:"M23 ceasefire holds for 14 days — longest pause in 18 months.", impact:"neu", impactText:"→ Monitor; fragile", source:"AU Commission", date:"2026-06-28T08:40:00Z" },
    ],
  },
  // ── NORTH AFRICA ─────────────────────────────────────────────────────────
  {
    code: "EGY", flag: "🇪🇬", name: "Egypt", region: "North Africa",
    population: "106M", capital: "Cairo", currency: "EGP",
    gdp: "$396B", fdi: "$9.8B",
    pestel: 62, irs: 57, change30d: 1.5, trend: [55,56,57,58,59,60,61,62,62,62],
    verdict: "monitor",
    macroSummary: "Egypt remains Africa's second-largest economy with strong FDI infrastructure and the Suez Canal as a strategic anchor. IMF programme underway. Currency reforms improving competitiveness. Governance and political freedoms constrained but investor protections relatively strong.",
    opportunities: ["Suez logistics corridor", "Renewable energy (solar/wind)", "Tech & BPO (Arabic-speaking talent)", "Agri-processing", "Tourism"],
    pestelBreak: { P:55, E:64, S:60, T:65, En:58, L:62, IR:57 },
    pestelSnippets: {
      P: "Sisi government stable; political dissent constrained. Regional positioning strong — mediator role in Gaza/Libya. SCAF influence on economy significant.",
      E: "IMF Extended Fund Facility ($8B). EGP floated 2024; inflation easing. Suez revenue ~$10B/yr. Remittances $22B. FX risk materially reduced vs 2023.",
      S: "106M population; median age 25. Youth unemployment ~30%. Cairo mega-city dynamics — large consumer base, inequality high.",
      T: "Active fintech scene. Cairo-based startups funded. Government pushing digital ID and e-gov. IT export sector growing.",
      En: "High solar irradiance. Benban Solar Park = one of world's largest. Water scarcity (Nile) is structural risk. GERD dispute with Ethiopia active.",
      L: "ICSID member. Investment Law 72/2017 provides guarantees. Enforcement improving but courts slow. IP protections adequate.",
      IR: "Special Economic Zones (Suez Canal Zone, SCZONE). Industrial clusters active. Port infrastructure world-class.",
    },
    risks: [
      { category:"Macro", risk:"FX volatility and import restrictions", likelihood:"Medium", impact:"High", mitigation:"USD-denominated contracts. SCZONE structures offer hard-currency repatriation." },
      { category:"Political", risk:"Government intervention in private sector", likelihood:"Medium", impact:"Medium", mitigation:"Partner with established local private-sector anchor. Avoid sectors with army-linked SOEs." },
    ],
    sectors: [
      { name:"Logistics & Suez Services", score:84, verdict:"go" },
      { name:"Renewable Energy", score:80, verdict:"go" },
      { name:"Tech & BPO", score:74, verdict:"go" },
      { name:"Tourism", score:68, verdict:"caution" },
      { name:"Manufacturing", score:62, verdict:"caution" },
      { name:"Agriculture", score:48, verdict:"no-go" },
    ],
    timeline: [
      { date:"2026 Q1", text:"IMF fourth review — disbursement $1.2B", type:"positive" },
      { date:"Oct 2027", text:"Presidential term continues (Sisi re-elected 2024)", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"EGP stabilises below 50/USD — first sustained period in 18 months.", impact:"pos", impactText:"▲ FX risk reducing", source:"CBE", date:"2026-06-24T08:39:00Z" },
    ],
  },
  {
    code: "TUN", flag: "🇹🇳", name: "Tunisia", region: "North Africa",
    population: "12M", capital: "Tunis", currency: "TND",
    gdp: "$46B", fdi: "$1.0B",
    pestel: 54, irs: 49, change30d: -1.0, trend: [58,57,56,55,55,54,54,54,54,54],
    verdict: "caution",
    macroSummary: "Tunisia's democratic experiment reversed under Saied's 2022 power consolidation. Fiscal pressures severe; IMF deal stalled. Skilled workforce and EU proximity remain genuine assets for nearshore manufacturing and digital services. Political trajectory is the primary risk.",
    opportunities: ["Nearshore manufacturing (EU supply chains)", "IT & digital services", "Olive oil & agri-export", "Renewable energy (wind)"],
    pestelBreak: { P:42, E:52, S:58, T:60, En:55, L:54, IR:49 },
    pestelSnippets: {
      P: "Saied consolidated power via 2022 referendum. Parliament weakened. Press freedom declining. Political risk elevated but no active conflict.",
      E: "Fiscal deficit ~8% GDP. Public debt 80%+ GDP. IMF talks stalled over subsidy reform. Inflation ~8%. Remittances and tourism key.",
      S: "Educated, French-speaking workforce. High youth unemployment (~36%). Gender equality among best in MENA. Social unrest potential rising.",
      T: "Tunis Tech City. Decent broadband. Fintech ecosystem early-stage. EU digital market proximity a strong pull.",
      En: "Water stress growing. Solar/wind potential high — limited exploitation.",
      L: "OHADA-adjacent. French legal tradition. FDI laws investor-friendly in theory; enforcement slower.",
      IR: "EU-Tunisia trade agreement. Onshoring interest from European manufacturers. Port of Bizerte underutilised.",
    },
    risks: [
      { category:"Political", risk:"Policy unpredictability under Saied", likelihood:"High", impact:"High", mitigation:"Short-horizon investments only. Build in early-exit clauses. Monitor election timetable." },
      { category:"Fiscal", risk:"Sovereign default risk if IMF deal collapses", likelihood:"Medium", impact:"Critical", mitigation:"USD contracts. Repatriate profits quarterly." },
    ],
    sectors: [
      { name:"IT & Nearshore Services", score:72, verdict:"go" },
      { name:"Agri-export (Olive Oil)", score:68, verdict:"caution" },
      { name:"Renewable Energy", score:62, verdict:"caution" },
      { name:"Tourism", score:58, verdict:"caution" },
      { name:"Financial Services", score:40, verdict:"no-go" },
    ],
    timeline: [
      { date:"2026 H1", text:"IMF deal renegotiation expected", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"IMF Article IV consultation resumes — signals possible deal restart.", impact:"pos", impactText:"▲ Fiscal risk watch", source:"IMF", date:"2026-06-17T08:38:00Z" },
    ],
  },
  {
    code: "DZA", flag: "🇩🇿", name: "Algeria", region: "North Africa",
    population: "46M", capital: "Algiers", currency: "DZD",
    gdp: "$239B", fdi: "$1.5B",
    pestel: 48, irs: 43, change30d: 0.5, trend: [44,45,45,46,46,47,47,48,48,48],
    verdict: "caution",
    macroSummary: "Algeria's hydrocarbon wealth (gas exports to EU spiking post-Ukraine) provides fiscal buffer but the non-oil economy is state-dominated and hard to enter. New investment code (2022) attempts to open sectors. Bureaucracy and forex access remain the core barriers. Energy sector the clearest entry point.",
    opportunities: ["LNG & gas export infrastructure", "Renewable energy (Sahara solar)", "Construction & infrastructure", "Agri-processing"],
    pestelBreak: { P:45, E:55, S:50, T:44, En:52, L:42, IR:43 },
    pestelSnippets: {
      P: "Tebboune re-elected 2024. Military-establishment balance stable. Algeria cautious on foreign engagement; non-alignment posture.",
      E: "Hydrocarbon exports 95% of FX earnings. Gas export revenues surging. Non-oil budget deficit structural. Inflation ~9%.",
      S: "Young population; high unemployment. Hirak protest movement suppressed 2021 but underlying discontent remains.",
      T: "Digital economy nascent. Starlink blocked. State controls telecoms. Fintech nascent.",
      En: "Sahara has world-class solar potential (Desertec legacy). Climate policy improving.",
      L: "Investment code 2022 allows 100% foreign ownership outside strategic sectors. Joint-venture rule lifted outside energy. Contract enforcement weak.",
      IR: "Large public works pipeline. State-owned banks only route to local financing. Repatriation rules improved in law but slow in practice.",
    },
    risks: [
      { category:"Market access", risk:"Forex repatriation delays", likelihood:"High", impact:"High", mitigation:"Structure via offshore entity. Use free zone mechanisms under Investment Code 2022." },
      { category:"Political", risk:"State SOE competition in most sectors", likelihood:"High", impact:"Medium", mitigation:"Enter via public-private partnership or as technology/expertise provider to SOE." },
    ],
    sectors: [
      { name:"LNG & Gas Services", score:72, verdict:"go" },
      { name:"Renewable Energy (Sahara)", score:65, verdict:"caution" },
      { name:"Construction & EPC", score:62, verdict:"caution" },
      { name:"Agri-processing", score:50, verdict:"caution" },
      { name:"Fintech", score:30, verdict:"no-go" },
    ],
    timeline: [
      { date:"2026 Q2", text:"National economic reform plan review", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Algeria signs 15-year LNG supply extension with Italy's ENI.", impact:"pos", impactText:"▲ Energy sector stability", source:"Sonatrach", date:"2026-06-01T08:37:00Z" },
    ],
  },
  {
    code: "LBY", flag: "🇱🇾", name: "Libya", region: "North Africa",
    population: "7M", capital: "Tripoli", currency: "LYD",
    gdp: "$45B", fdi: "$0.5B",
    pestel: 28, irs: 24, change30d: -1.0, trend: [30,30,29,29,28,28,28,28,28,28],
    verdict: "no-go",
    macroSummary: "Libya remains split between rival administrations (GNU-Tripoli / LNA-Benghazi). Oil revenues flow but cannot translate into development. No unified legal system, no reliable banking, no functioning central authority outside energy. Specialist extractive operators only.",
    opportunities: ["Oil & gas (NOC-structured)", "Reconstruction (post-stabilisation)"],
    pestelBreak: { P:18, E:38, S:30, T:28, En:35, L:22, IR:24 },
    pestelSnippets: {
      P: "Dual-government status. GNU (Dbeibah) vs LNA (Haftar/Bashagha). UN process stalled. Elections repeatedly delayed.",
      E: "Oil production ~1.2M bpd — revenue split disputed. Parallel exchange rates. Inflation unchecked in non-oil economy.",
      S: "Tribal and militia loyalties define economic access. Displacement from 2011 conflict ongoing.",
      T: "Infrastructure largely pre-2011. Telecoms functioning in cities. No tech ecosystem.",
      En: "Oil-rich. Renewable potential unexploited. Environmental degradation from conflict.",
      L: "No unified legal system. Contract sanctity depends on which authority controls the asset location.",
      IR: "NOC is only viable entry vehicle. Reconstruction pipeline real but unlocked only post-stabilisation.",
    },
    risks: [
      { category:"Security", risk:"Active armed factions, no unified authority", likelihood:"High", impact:"Critical", mitigation:"NOC joint venture only. Private security mandatory. No viable entry outside hydrocarbons." },
    ],
    sectors: [
      { name:"Oil & Gas (NOC only)", score:40, verdict:"caution" },
      { name:"Reconstruction (future)", score:25, verdict:"no-go" },
    ],
    timeline: [
      { date:"TBD", text:"UN-mediated national elections (repeatedly delayed)", type:"critical" },
    ],
    signals: [
      { dim:"P", text:"GNU and LNA representatives meet in Cairo — first direct talks in 8 months.", impact:"neu", impactText:"→ Monitor; fragile", source:"UN SMIL", date:"2026-06-10T08:36:00Z" },
    ],
  },
  {
    code: "SDN", flag: "🇸🇩", name: "Sudan", region: "North Africa",
    population: "46M", capital: "Khartoum", currency: "SDG",
    gdp: "$30B", fdi: "$0.2B",
    pestel: 18, irs: 15, change30d: -2.5, trend: [25,24,22,21,20,20,19,18,18,18],
    verdict: "no-go",
    macroSummary: "Active civil war between SAF and RSF since April 2023. Khartoum largely destroyed. Humanitarian crisis among worst globally. No viable commercial entry. Exit recommended for all non-humanitarian operators.",
    opportunities: ["Humanitarian logistics (specialist only)", "Post-conflict reconstruction (long horizon)"],
    pestelBreak: { P:10, E:20, S:22, T:18, En:25, L:12, IR:15 },
    pestelSnippets: {
      P: "SAF vs RSF civil war ongoing. No functioning central government. AU mediation stalled.",
      E: "Economy collapsed. Currency worthless outside SAF zones. Hyperinflation. Oil output near-zero.",
      S: "10M+ displaced — largest displacement crisis globally. Famine conditions declared.",
      T: "Telecoms infrastructure destroyed in conflict zones. Internet largely offline.",
      En: "Nile corridor. Agricultural potential enormous — post-conflict only.",
      L: "Legal system non-functional. No contract sanctity.",
      IR: "Infrastructure destroyed. IRS score functionally zero.",
    },
    risks: [
      { category:"Security", risk:"Active civil war — SAF vs RSF", likelihood:"High", impact:"Critical", mitigation:"No commercial entry viable. Humanitarian operators only with UN coordination." },
    ],
    sectors: [
      { name:"Humanitarian Logistics", score:20, verdict:"no-go" },
      { name:"Post-conflict Agriculture (future)", score:15, verdict:"no-go" },
    ],
    timeline: [
      { date:"Ongoing", text:"SAF-RSF conflict — AU ceasefire negotiations", type:"critical" },
    ],
    signals: [
      { dim:"P", text:"RSF advances into North Darfur — SAF counter-offensive launched.", impact:"neg", impactText:"▼ Conflict escalating", source:"OCHA", date:"2026-06-27T08:35:00Z" },
    ],
  },

  // ── WEST AFRICA ───────────────────────────────────────────────────────────
  {
    code: "CIV", flag: "🇨🇮", name: "Côte d'Ivoire", region: "West Africa",
    population: "27M", capital: "Abidjan", currency: "XOF",
    gdp: "$78B", fdi: "$2.8B",
    pestel: 68, irs: 62, change30d: 1.5, trend: [62,63,64,65,66,67,67,68,68,68],
    verdict: "monitor",
    macroSummary: "Côte d'Ivoire is West Africa's fastest-growing major economy and the world's top cocoa producer. Abidjan is a regional financial and logistics hub. WAEMU member with franc-zone stability. FDI-friendly regime under Ouattara. Political succession risk rising ahead of 2025 cycle.",
    opportunities: ["Cocoa & agri-processing", "Port & logistics (Abidjan)", "Fintech (WAEMU)", "Construction & real estate", "Consumer goods"],
    pestelBreak: { P:62, E:72, S:65, T:64, En:68, L:68, IR:62 },
    pestelSnippets: {
      P: "Ouattara stable since 2011. 2025 presidential succession is key risk. North-south historical division managed but not resolved.",
      E: "GDP growth ~7% p.a. Cocoa 40% export earnings. Abidjan port handles 70% of landlocked West African trade.",
      S: "Young, growing population. Urban migration rapid. Abidjan consumer class expanding fast.",
      T: "MTN and Orange mobile money dominant. Abidjan growing tech ecosystem. Francophone digital market leader.",
      En: "Deforestation pressure from cocoa expansion. Forest Code reform underway.",
      L: "OHADA member — strong regional contract law framework. Judiciary improving. Anti-corruption drive genuine.",
      IR: "Abidjan port expansion. Industrial zones active. Investment promotion code generous.",
    },
    risks: [
      { category:"Political", risk:"2025 presidential succession uncertainty", likelihood:"Medium", impact:"High", mitigation:"Monitor Ouattara health and succession signals. Plan for short-term volatility in Q4 2025." },
    ],
    sectors: [
      { name:"Cocoa & Agri-processing", score:86, verdict:"go" },
      { name:"Port & Logistics", score:82, verdict:"go" },
      { name:"Fintech (WAEMU)", score:74, verdict:"go" },
      { name:"Construction", score:68, verdict:"caution" },
      { name:"Consumer & FMCG", score:64, verdict:"caution" },
    ],
    timeline: [
      { date:"Oct 2025", text:"Presidential election — succession risk key", type:"critical" },
    ],
    signals: [
      { dim:"E", text:"Abidjan port completes container terminal expansion — capacity +40%.", impact:"pos", impactText:"▲ Logistics capacity", source:"Port Autonome d'Abidjan", date:"2026-06-17T08:34:00Z" },
    ],
  },
  {
    code: "CMR", flag: "🇨🇲", name: "Cameroon", region: "West Africa",
    population: "28M", capital: "Yaoundé", currency: "XAF",
    gdp: "$47B", fdi: "$0.9B",
    pestel: 44, irs: 40, change30d: -0.5, trend: [46,46,45,45,44,44,44,44,44,44],
    verdict: "caution",
    macroSummary: "Cameroon is Central/West Africa's most diversified non-oil economy with strong agri base (cocoa, palm oil, timber). Anglophone crisis in NW/SW regions creates significant security and market fragmentation risk. Biya governance (40+ years) creates uncertainty. Agricultural and logistics sectors viable with risk mitigation.",
    opportunities: ["Agri-processing (cocoa, palm oil)", "Kribi deep-sea port", "Energy (hydro)", "Telecoms & digital"],
    pestelBreak: { P:38, E:48, S:42, T:44, En:50, L:42, IR:40 },
    pestelSnippets: {
      P: "Biya in power since 1982 — succession question acute. Anglophone separatist conflict (NW/SW) ongoing. Stability fragile in conflict zones.",
      E: "Oil revenues declining. Diversification via cocoa, timber, palm oil. GDP growth ~4%. IMF programme active.",
      S: "Bilingual (French/English) — Anglophone minority resentment is core social risk. Yaoundé/Douala urban centres stable.",
      T: "MTN Cameroon dominant. Fintech ecosystem early. Digital services growing from Douala.",
      En: "Significant forest cover — REDD+ potential. Kribi LNG terminal operational.",
      L: "OHADA. Douala commercial court improving. Corruption ranked high — Transparency International.",
      IR: "Kribi port is transformative infrastructure. Road network to landlocked neighbours improving.",
    },
    risks: [
      { category:"Security", risk:"Anglophone crisis — NW/SW regions inaccessible", likelihood:"High", impact:"High", mitigation:"Operations restricted to Douala, Yaoundé, and Centre/Littoral regions. NW/SW excluded." },
      { category:"Governance", risk:"Biya succession — policy uncertainty", likelihood:"High", impact:"High", mitigation:"Short-horizon investments. Build local JV partnerships resilient to regime change." },
    ],
    sectors: [
      { name:"Agri-processing", score:65, verdict:"caution" },
      { name:"Port & Logistics (Kribi)", score:62, verdict:"caution" },
      { name:"Hydropower", score:58, verdict:"caution" },
      { name:"Telecoms", score:55, verdict:"caution" },
      { name:"Consumer & FMCG", score:48, verdict:"no-go" },
    ],
    timeline: [
      { date:"Oct 2025", text:"Presidential election (Biya expected to run)", type:"critical" },
    ],
    signals: [
      { dim:"P", text:"Anglophone separatists declare 90-day ceasefire — ICRC-mediated.", impact:"pos", impactText:"▲ NW/SW access marginally improving", source:"ICRC", date:"2026-06-01T08:33:00Z" },
    ],
  },
  {
    code: "MLI", flag: "🇲🇱", name: "Mali", region: "West Africa",
    population: "23M", capital: "Bamako", currency: "XOF",
    gdp: "$19B", fdi: "$0.4B",
    pestel: 24, irs: 22, change30d: -1.5, trend: [30,28,27,26,26,25,25,24,24,24],
    verdict: "no-go",
    macroSummary: "Mali under military junta since 2021 coup. French and ECOWAS sanctions lifted but governance deteriorated. Jihadist insurgency controls large swathes of the north and centre. Gold mining continues under junta control — otherwise near-total commercial freeze.",
    opportunities: ["Gold mining (major operators with junta relations)"],
    pestelBreak: { P:15, E:28, S:25, T:22, En:30, L:20, IR:22 },
    pestelSnippets: {
      P: "Goïta junta suspended constitution. Transition elections delayed indefinitely. AES alliance with Burkina and Niger signals anti-Western posture.",
      E: "Gold = 80% export revenue. Economy contracting. WAEMU FX stability continues (CFA). Agricultural base disrupted.",
      S: "Half population in food insecurity. 400k+ displaced by conflict.",
      T: "Telecoms functioning in Bamako. Otherwise minimal.",
      En: "Sahel drought worsening. Desertification expanding.",
      L: "OHADA membership maintained — irrelevant outside Bamako.",
      IR: "Infrastructure degrading. No viable FDI pipeline outside gold mining.",
    },
    risks: [
      { category:"Security", risk:"Jihadist insurgency — north and centre", likelihood:"High", impact:"Critical", mitigation:"Operations limited to Bamako only. No northern operations viable." },
    ],
    sectors: [
      { name:"Gold Mining (Majors only)", score:38, verdict:"no-go" },
    ],
    timeline: [
      { date:"TBD", text:"Junta transition elections (repeatedly delayed)", type:"critical" },
    ],
    signals: [
      { dim:"P", text:"Junta expels MINUSMA peacekeepers — security void expanding.", impact:"neg", impactText:"▼ Security deteriorating", source:"UN", date:"2026-06-01T08:32:00Z" },
    ],
  },
  {
    code: "BFA", flag: "🇧🇫", name: "Burkina Faso", region: "West Africa",
    population: "22M", capital: "Ouagadougou", currency: "XOF",
    gdp: "$18B", fdi: "$0.3B",
    pestel: 22, irs: 20, change30d: -2.0, trend: [30,28,26,25,24,23,22,22,22,22],
    verdict: "no-go",
    macroSummary: "Two coups (2022) under Traore junta. Jihadist groups (JNIM, ISGS) control 40%+ of territory. Gold mines operating under threat. French troops expelled. Russian Wagner/Africa Corps deployed. Most severe commercial environment in ECOWAS.",
    opportunities: ["Gold mining (extreme risk, major operators only)"],
    pestelBreak: { P:12, E:25, S:22, T:20, En:28, L:18, IR:20 },
    pestelSnippets: {
      P: "Traore junta. State of emergency in most regions. AES (Alliance of Sahel States) anti-ECOWAS posture.",
      E: "Gold = 70% exports. Economy contracting. Humanitarian aid is largest 'sector'.",
      S: "2M+ displaced. Famine conditions. Schools closed in conflict zones.",
      T: "Internet shutdowns during security operations. Mobile penetration low outside Ouagadougou.",
      En: "Sahel desertification extreme. Agricultural collapse in conflict zones.",
      L: "OHADA — irrelevant outside capital.",
      IR: "Infrastructure degrading. Power cuts routine.",
    },
    risks: [
      { category:"Security", risk:"Jihadist territorial control — 40% of country", likelihood:"High", impact:"Critical", mitigation:"No commercial entry viable." },
    ],
    sectors: [
      { name:"Gold Mining (extreme risk only)", score:30, verdict:"no-go" },
    ],
    timeline: [
      { date:"TBD", text:"Junta transition plan — no timeline set", type:"critical" },
    ],
    signals: [
      { dim:"P", text:"JNIM attacks Ouagadougou perimeter — first since 2021.", impact:"neg", impactText:"▼ Capital security deteriorating", source:"ACLED", date:"2026-06-17T08:31:00Z" },
    ],
  },
  {
    code: "NER", flag: "🇳🇪", name: "Niger", region: "West Africa",
    population: "25M", capital: "Niamey", currency: "XOF",
    gdp: "$14B", fdi: "$0.5B",
    pestel: 24, irs: 21, change30d: -1.0, trend: [32,30,28,27,26,25,24,24,24,24],
    verdict: "no-go",
    macroSummary: "July 2023 coup ousted Bazoum. ECOWAS sanctions lifted 2024 but governance severely degraded. France expelled; China and Russia filling vacuum. Uranium and oil remain operative but under junta control. Agadez corridor central to Sahel conflict dynamics.",
    opportunities: ["Uranium (ORANO-structured)", "Oil (China NPC-structured)"],
    pestelBreak: { P:14, E:28, S:24, T:22, En:30, L:20, IR:21 },
    pestelSnippets: {
      P: "CNSP junta. Tchiani in power. AES bloc. Transition elections delayed. Security deteriorating near borders.",
      E: "Uranium 70% FX. Oil production (Agadem) growing. But sanctions (partial) disrupted supply chains.",
      S: "High food insecurity. Youth bulge with no employment base.",
      T: "Telecoms basic. No digital economy.",
      En: "Climate extremely vulnerable. Lake Chad shrinking. Pastoral conflict rising.",
      L: "OHADA — theoretical. Enforcement none outside Niamey.",
      IR: "Agadem oil pipeline to Benin operational. Otherwise infrastructure minimal.",
    },
    risks: [
      { category:"Political", risk:"Junta instability — second coup risk", likelihood:"Medium", impact:"Critical", mitigation:"Uranium/oil via established international structures only." },
    ],
    sectors: [
      { name:"Uranium (ORANO-structured)", score:35, verdict:"no-go" },
      { name:"Oil (Agadem corridor)", score:32, verdict:"no-go" },
    ],
    timeline: [
      { date:"TBD", text:"Junta transition elections", type:"critical" },
    ],
    signals: [
      { dim:"E", text:"Agadem–Benin oil pipeline exports first cargo.", impact:"pos", impactText:"▲ Oil revenue starting", source:"CNPC", date:"2026-05-20T08:30:00Z" },
    ],
  },
  {
    code: "TCD", flag: "🇹🇩", name: "Chad", region: "West Africa",
    population: "18M", capital: "N'Djamena", currency: "XAF",
    gdp: "$12B", fdi: "$0.6B",
    pestel: 28, irs: 25, change30d: 0.5, trend: [26,26,27,27,27,28,28,28,28,28],
    verdict: "no-go",
    macroSummary: "Mahamat Déby Itno consolidated power after 2021 transitional council. 2024 elections gave civilian mandate. Oil production declining. Security environment fragile — regional spill-over from Sudan and CAR. Limited commercial viability outside oil sector.",
    opportunities: ["Oil (ExxonMobil/Glencore-structured)", "Humanitarian logistics (Lake Chad basin)"],
    pestelBreak: { P:24, E:32, S:28, T:24, En:30, L:26, IR:25 },
    pestelSnippets: {
      P: "Déby Itno won 2024 elections — international community accepted outcome with reservations. Security apparatus loyal.",
      E: "Oil 80%+ GDP. Production declining from peak. No diversification. Heavily indebted to Glencore.",
      S: "Lake Chad basin — humanitarian crisis. High displacement from Boko Haram and Sudan spill-over.",
      T: "Digital penetration near-zero outside N'Djamena.",
      En: "Lake Chad shrinking — regional environmental disaster. Pastoral conflict escalating.",
      L: "CEMAC/OHADA. Enforcement minimal outside capital.",
      IR: "N'Djamena–Maiduguri road critical. Otherwise infrastructure absent.",
    },
    risks: [
      { category:"Security", risk:"Regional spill-over (Sudan, CAR, Boko Haram)", likelihood:"High", impact:"High", mitigation:"Operations in N'Djamena only. Southern corridor requires private security." },
    ],
    sectors: [
      { name:"Oil (structured JV only)", score:38, verdict:"no-go" },
    ],
    timeline: [
      { date:"Apr 2025", text:"Post-election government formation — donor engagement", type:"neutral" },
    ],
    signals: [
      { dim:"P", text:"Déby Itno wins April 2024 presidential election — transition to civilian rule formalised.", impact:"pos", impactText:"▲ Political legitimacy improving", source:"AU Election Observer", date:"2026-05-02T08:29:00Z" },
    ],
  },
  {
    code: "GIN", flag: "🇬🇳", name: "Guinea", region: "West Africa",
    population: "14M", capital: "Conakry", currency: "GNF",
    gdp: "$18B", fdi: "$1.2B",
    pestel: 36, irs: 32, change30d: 0.5, trend: [33,33,34,34,35,35,36,36,36,36],
    verdict: "caution",
    macroSummary: "Guinea holds 25% of the world's known bauxite reserves — the single most important driver of investment. Mamadi Doumbouya junta (coup 2021) has maintained mining operations and extended partnerships. Transition election timeline unclear. Non-mining sectors face severe governance and infrastructure barriers.",
    opportunities: ["Bauxite & alumina (world's largest reserves)", "Hydropower (Souapiti, Kaleta)", "Iron ore (Simandou — mega-project)"],
    pestelBreak: { P:28, E:42, S:35, T:32, En:44, L:30, IR:32 },
    pestelSnippets: {
      P: "Doumbouya junta. Transition elections promised but delayed. ECOWAS engagement ongoing.",
      E: "Bauxite exports ~$3B/yr. Simandou iron ore project ($20B) transformative if completed. GDP growth 6%+ driven by mining.",
      S: "Ethnic tensions (Fula/Malinke/Soussou) historically exploited politically.",
      T: "Digital economy minimal. Mobile penetration growing.",
      En: "Forest Guinea biodiversity under pressure from mining. Hydropower development significant.",
      L: "Mining code investor-friendly in theory. Junta interventions in specific contracts create risk. OHADA.",
      IR: "Simandou rail and port (TransGuinée) will transform infrastructure if completed.",
    },
    risks: [
      { category:"Political", risk:"Junta contract renegotiation precedent", likelihood:"Medium", impact:"High", mitigation:"ICSID arbitration clause essential. Political risk insurance mandatory." },
    ],
    sectors: [
      { name:"Bauxite & Alumina", score:68, verdict:"caution" },
      { name:"Iron Ore (Simandou)", score:62, verdict:"caution" },
      { name:"Hydropower", score:58, verdict:"caution" },
      { name:"Consumer & FMCG", score:32, verdict:"no-go" },
    ],
    timeline: [
      { date:"2026 H1", text:"Transition election (junta commitment)", type:"neutral" },
      { date:"2026", text:"Simandou iron ore first production expected", type:"positive" },
    ],
    signals: [
      { dim:"E", text:"Rio Tinto resumes Simandou construction after financing close.", impact:"pos", impactText:"▲ Mining FDI confirmed", source:"Rio Tinto", date:"2026-06-10T08:28:00Z" },
    ],
  },
  {
    code: "SLE", flag: "🇸🇱", name: "Sierra Leone", region: "West Africa",
    population: "8M", capital: "Freetown", currency: "SLL",
    gdp: "$4B", fdi: "$0.3B",
    pestel: 45, irs: 40, change30d: 0.5, trend: [42,42,43,43,44,44,44,45,45,45],
    verdict: "caution",
    macroSummary: "Sierra Leone is small, post-conflict stable, and improving. Bio government (APC defeated in 2023) maintaining reform trajectory. Minerals, tourism, and fisheries are viable entry points. Infrastructure gap is severe — small market limits scale.",
    opportunities: ["Minerals (diamonds, rutile, bauxite)", "Tourism (beaches)", "Fisheries", "Agri-processing"],
    pestelBreak: { P:48, E:42, S:48, T:40, En:50, L:44, IR:40 },
    pestelSnippets: {
      P: "Julius Maada Bio returned 2023. Peaceful transfer accepted. Democratic trajectory positive.",
      E: "GDP $4B. High poverty. Mining and remittances key. IMF programme improving fiscal management.",
      S: "Post-conflict generation now in workforce. High unemployment but improving.",
      T: "Mobile penetration growing. Fintech early-stage.",
      En: "Biodiversity high. Coastal fisheries under pressure from illegal fishing.",
      L: "English common law. Relatively functional courts.",
      IR: "Freetown infrastructure poor. Road network improving. Small market limits FDI scale.",
    },
    risks: [
      { category:"Infrastructure", risk:"Power and road infrastructure severely limits scale", likelihood:"High", impact:"Medium", mitigation:"Off-grid energy solutions required. Partner with IFC or DFI for infrastructure co-investment." },
    ],
    sectors: [
      { name:"Minerals (Diamonds/Rutile)", score:62, verdict:"caution" },
      { name:"Tourism", score:55, verdict:"caution" },
      { name:"Fisheries", score:52, verdict:"caution" },
      { name:"Agri-processing", score:48, verdict:"no-go" },
    ],
    timeline: [
      { date:"2027", text:"Next presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"L", text:"Sierra Leone enacts new Mines & Minerals Act — royalty renegotiation clause removed.", impact:"pos", impactText:"▲ Mining legal stability", source:"NMA", date:"2026-06-01T08:27:00Z" },
    ],
  },
  {
    code: "LBR", flag: "🇱🇷", name: "Liberia", region: "West Africa",
    population: "5M", capital: "Monrovia", currency: "LRD",
    gdp: "$4B", fdi: "$0.5B",
    pestel: 44, irs: 39, change30d: 0.5, trend: [41,41,42,42,43,43,43,44,44,44],
    verdict: "caution",
    macroSummary: "Joseph Boakai won 2023 election — defeated Weah in peaceful transfer. Liberia is post-conflict stable with English common law, rubber and iron ore assets, and improving governance. Infrastructure remains the binding constraint. Small market but improving investment climate.",
    opportunities: ["Iron ore (Nimba)", "Rubber (Firestone legacy)", "Timber (sustainable certification)", "Ports (Freeport of Monrovia)"],
    pestelBreak: { P:46, E:42, S:46, T:38, En:48, L:46, IR:39 },
    pestelSnippets: {
      P: "Boakai presidency — reform signals positive. Weah accepted defeat. Democratic consolidation continuing.",
      E: "Rubber, iron ore, timber key. GDP ~$4B. Aid and remittances significant.",
      S: "Post-war generation workforce. English speaking. ECOWAS mobility.",
      T: "Digital services growing. Fintech early.",
      En: "West African forest block — significant conservation value. Logging concessions controversial.",
      L: "English common law. ICSID member. Investment incentive code generous.",
      IR: "Freeport improving. Road network poor. Power grid intermittent.",
    },
    risks: [
      { category:"Infrastructure", risk:"Power unreliability — manufacturing non-viable without own generation", likelihood:"High", impact:"High", mitigation:"Include captive power plant in project finance. IFC and DFI co-investment available." },
    ],
    sectors: [
      { name:"Iron Ore", score:60, verdict:"caution" },
      { name:"Rubber", score:56, verdict:"caution" },
      { name:"Port Services", score:52, verdict:"caution" },
      { name:"Timber (certified)", score:48, verdict:"caution" },
    ],
    timeline: [
      { date:"2029", text:"Next presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"P", text:"Boakai signs new anti-corruption executive order — asset declaration mandatory for ministers.", impact:"pos", impactText:"▲ Governance improving", source:"Government of Liberia", date:"2026-05-27T08:26:00Z" },
    ],
  },
  {
    code: "GMB", flag: "🇬🇲", name: "Gambia", region: "West Africa",
    population: "2.6M", capital: "Banjul", currency: "GMD",
    gdp: "$2.2B", fdi: "$0.1B",
    pestel: 50, irs: 44, change30d: 1.0, trend: [46,46,47,47,48,48,49,50,50,50],
    verdict: "caution",
    macroSummary: "Gambia post-Jammeh is improving steadily under Barrow. Tourism, remittances, and groundnuts dominate. English-speaking with stable governance trajectory. Very small market — entry only viable for niche, low-capital plays.",
    opportunities: ["Tourism (Atlantic coast)", "Fintech (remittances)", "Groundnut processing", "Fisheries"],
    pestelBreak: { P:52, E:46, S:54, T:48, En:52, L:50, IR:44 },
    pestelSnippets: {
      P: "Barrow government stable. Jammeh-era TRRC recommendations partly implemented. Civil society active.",
      E: "Heavily dependent on remittances (~25% GDP) and tourism. Very small domestic market.",
      S: "Strong diaspora. English-speaking. Low literacy rates in rural areas.",
      T: "Good mobile penetration. Fintech growing — remittance corridor with UK/US diaspora valuable.",
      En: "River Gambia ecosystem. Coastal erosion a growing risk.",
      L: "Common law. Improving judicial independence.",
      IR: "Banjul airport, port. Very limited industrial infrastructure.",
    },
    risks: [
      { category:"Scale", risk:"GDP <$3B — insufficient domestic market for most plays", likelihood:"High", impact:"Medium", mitigation:"Niche-only entry. Consider as part of ECOWAS/SENEGAMBIA regional strategy." },
    ],
    sectors: [
      { name:"Tourism", score:66, verdict:"caution" },
      { name:"Fintech (Remittances)", score:60, verdict:"caution" },
      { name:"Agri-processing", score:48, verdict:"caution" },
    ],
    timeline: [
      { date:"Dec 2026", text:"Presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"T", text:"Gambia joins PAPSS (Pan-African Payment Settlement System).", impact:"pos", impactText:"▲ Fintech infrastructure improving", source:"Afreximbank", date:"2026-05-02T08:25:00Z" },
    ],
  },
  {
    code: "GNB", flag: "🇬🇼", name: "Guinea-Bissau", region: "West Africa",
    population: "2.1M", capital: "Bissau", currency: "XOF",
    gdp: "$1.7B", fdi: "$0.05B",
    pestel: 28, irs: 24, change30d: 0.0, trend: [28,28,28,28,28,28,28,28,28,28],
    verdict: "no-go",
    macroSummary: "Guinea-Bissau has had 9 coups or attempted coups since independence. Drug trafficking (transshipment) intertwined with political class. CFA franc provides monetary stability. Cashew = 90% of exports. Tiny market with minimal viable commercial entry.",
    opportunities: ["Cashew processing (niche)", "Fisheries"],
    pestelBreak: { P:18, E:30, S:32, T:24, En:38, L:22, IR:24 },
    pestelSnippets: {
      P: "Chronic political instability. Drug trafficking influence on governance documented by UNODC.",
      E: "Cashew 90% export. WAEMU franc stability. Tiny market.",
      S: "Small population. Portuguese-speaking. Low development indicators.",
      T: "Mobile basic. No digital economy.",
      En: "Bijagos archipelago — biodiversity hotspot. Fisheries rich.",
      L: "Portuguese-influenced. Courts unreliable.",
      IR: "Infrastructure near-absent.",
    },
    risks: [
      { category:"Governance", risk:"Narco-state dynamics — institutional capture", likelihood:"High", impact:"Critical", mitigation:"No viable commercial entry." },
    ],
    sectors: [
      { name:"Fisheries (licensed)", score:30, verdict:"no-go" },
      { name:"Cashew processing", score:28, verdict:"no-go" },
    ],
    timeline: [
      { date:"2026", text:"Elections (schedule uncertain)", type:"neutral" },
    ],
    signals: [
      { dim:"P", text:"President Embaló survives fourth coup attempt — political class reshuffled.", impact:"neg", impactText:"▼ Instability persisting", source:"ECOWAS", date:"2026-04-02T08:24:00Z" },
    ],
  },
  {
    code: "CPV", flag: "🇨🇻", name: "Cabo Verde", region: "West Africa",
    population: "0.6M", capital: "Praia", currency: "CVE",
    gdp: "$2.2B", fdi: "$0.2B",
    pestel: 72, irs: 65, change30d: 1.0, trend: [66,67,67,68,69,70,71,72,72,72],
    verdict: "monitor",
    macroSummary: "Cabo Verde is Africa's most stable democracy outside Botswana — consistent MCC compact recipient, mid-income status, tourism-driven. Blue economy, fintech, and digital nomad economy emerging. Constraint: very small market (~600k) and no natural resources. Ideal for niche, high-quality positioning.",
    opportunities: ["Tourism (premium)", "Blue economy / fisheries", "Digital services / nomad economy", "Renewable energy (wind)"],
    pestelBreak: { P:78, E:66, S:72, T:68, En:75, L:74, IR:65 },
    pestelSnippets: {
      P: "Two-party democracy alternating peacefully. MCC Compact II active. AU, ECOWAS, CPLP member.",
      E: "Tourism 25% GDP. Remittances 15%. IMF Article IV positive. Small market limits scale.",
      S: "High HDI for income level. Diaspora (US, Portugal) significant. Welcoming society.",
      T: "Good broadband. Growing digital nomad and tech community in Mindelo and Praia.",
      En: "Wind energy potential high — net-zero targets ambitious. Water scarcity managed via desalination.",
      L: "Portuguese common law. Strong property rights. Transparent courts.",
      IR: "MCC investment in infrastructure. International airport (Sal, Santiago). Limited industrial base.",
    },
    risks: [
      { category:"Scale", risk:"600k market — insufficient for most B2C plays", likelihood:"High", impact:"Medium", mitigation:"Position as HQ for ECOWAS/CPLP digital strategy or premium tourism brand launch." },
    ],
    sectors: [
      { name:"Tourism (Premium)", score:82, verdict:"go" },
      { name:"Renewable Energy", score:76, verdict:"go" },
      { name:"Digital Services", score:70, verdict:"go" },
      { name:"Blue Economy", score:64, verdict:"caution" },
    ],
    timeline: [
      { date:"2026", text:"Presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"T", text:"Cabo Verde launches Digital Nomad Visa — remote worker permits in 72 hours.", impact:"pos", impactText:"▲ Digital economy growing", source:"Governo de Cabo Verde", date:"2026-05-20T09:00:00Z" },
    ],
  },
  {
    code: "BEN", flag: "🇧🇯", name: "Benin", region: "West Africa",
    population: "13M", capital: "Porto-Novo", currency: "XOF",
    gdp: "$17B", fdi: "$0.5B",
    pestel: 56, irs: 50, change30d: 1.0, trend: [51,51,52,52,53,54,55,56,56,56],
    verdict: "monitor",
    macroSummary: "Benin under Talon is West Africa's reform standout — structural reforms, port expansion (Cotonou), digital governance, and agricultural processing (cashew, cotton). Growing corridor role for Niger landlocked trade. Democracy weakened but technocratic governance efficient.",
    opportunities: ["Cashew & cotton processing", "Cotonou port (landlocked corridor)", "Digital governance tech", "Agri-logistics"],
    pestelBreak: { P:52, E:58, S:54, T:56, En:55, L:58, IR:50 },
    pestelSnippets: {
      P: "Talon (two terms, 2016–2026). Democratic space narrowed but governance efficient. Pro-business posture consistent.",
      E: "GDP growth ~6%. Cashew, cotton, and port revenues. IMF programme positive.",
      S: "Stable ethnically. Youth unemployment moderate.",
      T: "Benin CityTech initiative. E-government advanced for WAEMU peer.",
      En: "Climate vulnerability — coastal erosion. Agricultural base at risk from rainfall variability.",
      L: "OHADA. Investment code good. Arbitration culture improving.",
      IR: "Cotonou port extended. Road to Niamey (Niger oil pipeline). Industrial zone (GDIZ — largest in WAEMU).",
    },
    risks: [
      { category:"Political", risk:"Democratic backsliding — opposition excluded", likelihood:"Medium", impact:"Medium", mitigation:"Monitor 2026 election. Talon constitutionally barred from third term — succession risk." },
    ],
    sectors: [
      { name:"Agri-processing (Cashew)", score:74, verdict:"go" },
      { name:"Port & Logistics", score:70, verdict:"go" },
      { name:"Digital Services", score:62, verdict:"caution" },
      { name:"Consumer & FMCG", score:56, verdict:"caution" },
    ],
    timeline: [
      { date:"Apr 2026", text:"Presidential election — Talon constitutionally barred", type:"critical" },
    ],
    signals: [
      { dim:"E", text:"GDIZ (Glo-Djigbé Industrial Zone) reaches 50 operational firms — ahead of schedule.", impact:"pos", impactText:"▲ Industrial zone delivering", source:"GDIZ Authority", date:"2026-06-01T08:59:00Z" },
    ],
  },
  {
    code: "TGO", flag: "🇹🇬", name: "Togo", region: "West Africa",
    population: "9M", capital: "Lomé", currency: "XOF",
    gdp: "$9B", fdi: "$0.4B",
    pestel: 50, irs: 44, change30d: 0.5, trend: [47,47,48,48,49,49,50,50,50,50],
    verdict: "caution",
    macroSummary: "Togo under Faure Gnassingbé (family in power 58 years) is politically static but commercially functional. Lomé port is a key West African transshipment hub. 2024 constitutional change moved to parliamentary system. Governance score constrained by dynasty politics but business environment improving.",
    opportunities: ["Lomé port (transshipment)", "Special Economic Zone (SAZOF)", "Phosphate", "Agri-logistics"],
    pestelBreak: { P:40, E:52, S:48, T:50, En:52, L:50, IR:44 },
    pestelSnippets: {
      P: "Gnassingbé family 58 years in power. 2024 moved to parliamentary system — extending family grip. Political risk stable-low.",
      E: "Lomé port handles transshipment for landlocked Sahel. Phosphate exports. GDP growth ~5.5%.",
      S: "Stable ethnically. Young population. Lomé urban class growing.",
      T: "Digital financial services growing. Fintech hub emerging.",
      En: "Coastal erosion significant. Climate vulnerability moderate.",
      L: "OHADA. Lomé arbitration centre emerging. Business code improving.",
      IR: "Lomé container terminal world-class. SAZOF export zone. Road network adequate.",
    },
    risks: [
      { category:"Political", risk:"Dynasty political risk — long-term succession unclear", likelihood:"Low", impact:"High", mitigation:"Medium-horizon investments viable. Build political risk insurance for longer plays." },
    ],
    sectors: [
      { name:"Port & Logistics", score:76, verdict:"go" },
      { name:"SEZ Manufacturing", score:66, verdict:"caution" },
      { name:"Phosphate", score:60, verdict:"caution" },
      { name:"Fintech", score:56, verdict:"caution" },
    ],
    timeline: [
      { date:"2025 H2", text:"New parliamentary government formation post-constitution change", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Lomé port wins Bests African Container Port 2024 — Lloyds List.", impact:"pos", impactText:"▲ Logistics positioning", source:"Lloyds List", date:"2026-05-02T08:58:00Z" },
    ],
  },

  // ── EAST AFRICA ───────────────────────────────────────────────────────────
  {
    code: "UGA", flag: "🇺🇬", name: "Uganda", region: "East Africa",
    population: "49M", capital: "Kampala", currency: "UGX",
    gdp: "$45B", fdi: "$1.0B",
    pestel: 48, irs: 43, change30d: 0.5, trend: [44,44,45,45,46,46,47,48,48,48],
    verdict: "caution",
    macroSummary: "Uganda is East Africa's third economy with strong agricultural potential, growing fintech, and significant oil (Tilenga/Kingfisher EACOP). Museveni's 39-year rule creates governance ceiling. Oil pipeline controversy (EACOP) generates ESG risk. Demographic dividend large but skills gap acute.",
    opportunities: ["Oil (EACOP — TotalEnergies)", "Fintech / mobile money", "Agri-processing (coffee, maize)", "Tourism (gorillas)"],
    pestelBreak: { P:40, E:52, S:50, T:50, En:46, L:46, IR:43 },
    pestelSnippets: {
      P: "Museveni since 1986. Bobi Wine opposition remains active. Anti-homosexuality law creating Western donor tension.",
      E: "GDP growth 6%. Oil production (2025 expected) transformative. Coffee export boom continuing.",
      S: "Youngest median age in Africa (16). Urban growth rapid. Anti-LGBTQ+ law impacting diaspora investment.",
      T: "MTN Uganda mobile money dominant. Kampala fintech ecosystem active.",
      En: "EACOP pipeline ESG controversy — European DFI withdrawn. Climate vulnerability moderate.",
      L: "English common law. Improving commercial courts. Anti-corruption laws exist but enforcement selective.",
      IR: "Entebbe expansion. Roads improving. EACOP infrastructure transformative if pipeline proceeds.",
    },
    risks: [
      { category:"ESG", risk:"EACOP reputational and ESG risk — European DFI exclusion", likelihood:"High", impact:"High", mitigation:"Non-EACOP sector entry avoids contamination. ESG due diligence critical for any investor with European LP base." },
      { category:"Political", risk:"Museveni succession — no clear path", likelihood:"Medium", impact:"High", mitigation:"Political risk insurance. Short-horizon structuring." },
    ],
    sectors: [
      { name:"Fintech / Mobile Money", score:70, verdict:"go" },
      { name:"Agri-processing (Coffee)", score:66, verdict:"caution" },
      { name:"Oil (EACOP)", score:58, verdict:"caution" },
      { name:"Tourism", score:62, verdict:"caution" },
      { name:"Manufacturing", score:48, verdict:"no-go" },
    ],
    timeline: [
      { date:"2026 Q1", text:"Presidential election — Museveni vs Bobi Wine (expected)", type:"critical" },
      { date:"2025", text:"EACOP first oil expected", type:"positive" },
    ],
    signals: [
      { dim:"E", text:"Uganda coffee exports hit record $1.1B — 3rd year of growth.", impact:"pos", impactText:"▲ Agri sector expanding", source:"UCDA", date:"2026-06-01T08:57:00Z" },
    ],
  },
  {
    code: "BDI", flag: "🇧🇮", name: "Burundi", region: "East Africa",
    population: "13M", capital: "Gitega", currency: "BIF",
    gdp: "$3.1B", fdi: "$0.05B",
    pestel: 22, irs: 19, change30d: 0.0, trend: [22,22,22,22,22,22,22,22,22,22],
    verdict: "no-go",
    macroSummary: "Burundi remains one of Africa's least-developed nations under Ndayishimiye's authoritarian consolidation post-Nkurunziza. Donor aid suspended. Nickel mining offers one entry point for specialists. Otherwise, no viable commercial environment.",
    opportunities: ["Nickel mining (Musongati — specialist only)"],
    pestelBreak: { P:18, E:24, S:26, T:20, En:30, L:20, IR:19 },
    pestelSnippets: {
      P: "Ndayishimiye consolidated power. Opposition suppressed. ICC investigation open.",
      E: "GDP $3.1B. Aid suspension. Coffee and tea exports. Nickel reserves (world's 2nd largest).",
      S: "Extreme poverty. Displacement from 2015 crisis ongoing.",
      T: "Mobile penetration minimal.",
      En: "Agriculture base. Climate vulnerable.",
      L: "Courts not independent.",
      IR: "Infrastructure near-absent. IRS score functionally zero.",
    },
    risks: [
      { category:"Political", risk:"Authoritarian government — ICC investigation open", likelihood:"High", impact:"Critical", mitigation:"No viable entry." },
    ],
    sectors: [
      { name:"Nickel (Specialist only)", score:28, verdict:"no-go" },
    ],
    timeline: [
      { date:"2027", text:"Presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Musongati nickel deposit feasibility study restarts under Chinese partnership.", impact:"neu", impactText:"→ Watch nickel sector", source:"BME", date:"2026-05-02T08:56:00Z" },
    ],
  },
  {
    code: "SOM", flag: "🇸🇴", name: "Somalia", region: "East Africa",
    population: "18M", capital: "Mogadishu", currency: "SOS",
    gdp: "$8B", fdi: "$0.1B",
    pestel: 18, irs: 16, change30d: 0.5, trend: [16,16,17,17,17,18,18,18,18,18],
    verdict: "no-go",
    macroSummary: "Somalia remains a fragile state with improving but fragile federal government (HSM presidency). Al-Shabaab active in rural areas. Mogadishu telecoms and trade surprisingly active. HIPC debt relief completed 2023 — unlocks IFI engagement. Long-horizon only.",
    opportunities: ["Telecoms (Hormuud model)", "Hawala / remittance fintech", "Fisheries", "Long-horizon reconstruction"],
    pestelBreak: { P:14, E:20, S:22, T:26, En:22, L:16, IR:16 },
    pestelSnippets: {
      P: "Hassan Sheikh Mohamud presidency (elected 2022). Federal fragility. Al-Shabaab controls rural south.",
      E: "Remittances = 40%+ GDP. Hormuud Telecom profitable. Livestock, fisheries, charcoal exports.",
      S: "Clan dynamics define market access. Mogadishu consumer economy surprisingly active.",
      T: "Some of Africa's cheapest mobile data. Hormuud-built infrastructure.",
      En: "Drought vulnerability extreme. Coastal fisheries rich but unregulated.",
      L: "No unified legal system. Federal government control limited to Mogadishu.",
      IR: "Mogadishu port rehabilitated. HIPC completion opens MDB pipeline.",
    },
    risks: [
      { category:"Security", risk:"Al-Shabaab rural presence — mobility severely restricted", likelihood:"High", impact:"Critical", mitigation:"Mogadishu-only. Private security mandatory. Clan relationships essential for market access." },
    ],
    sectors: [
      { name:"Telecoms (Hormuud model)", score:40, verdict:"caution" },
      { name:"Remittance Fintech", score:36, verdict:"no-go" },
      { name:"Fisheries (licensed)", score:30, verdict:"no-go" },
    ],
    timeline: [
      { date:"2026", text:"Parliamentary and presidential elections", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Somalia completes HIPC debt relief — $4.5B debt cancelled.", impact:"pos", impactText:"▲ IFI access unlocked", source:"IMF/World Bank", date:"2026-05-02T08:55:00Z" },
    ],
  },
  {
    code: "DJI", flag: "🇩🇯", name: "Djibouti", region: "East Africa",
    population: "1.1M", capital: "Djibouti City", currency: "DJF",
    gdp: "$3.8B", fdi: "$0.5B",
    pestel: 56, irs: 52, change30d: 0.5, trend: [52,52,53,53,54,54,55,56,56,56],
    verdict: "monitor",
    macroSummary: "Djibouti is Africa's premier logistics chokepoint — the Horn of Africa's natural port for landlocked Ethiopia (100M+ population hinterland). Free trade zones, data cables, and military base revenues supplement port fees. Tiny market, authoritarian but stable, and commercially functional.",
    opportunities: ["Port & logistics (Doraleh)", "Free trade zone", "Data centre (subsea cable hub)", "Bunkering & maritime services"],
    pestelBreak: { P:48, E:60, S:50, T:58, En:52, L:54, IR:52 },
    pestelSnippets: {
      P: "Guelleh in power since 1999. Stable but authoritarian. Multi-base military (US, France, China, Japan) provides geopolitical anchor.",
      E: "Port revenues 80% GDP. Doraleh expansion. Addis Ababa hinterland demand growing.",
      S: "Small local market. 25% unemployment. Migrant corridor to Gulf.",
      T: "Subsea cable hub (DARE1, EASSy, SEACOM). Data centre opportunity real.",
      En: "Severe water scarcity. Extreme heat vulnerability.",
      L: "French-influenced. Commercial courts functional. Investment code generous.",
      IR: "Port infrastructure world-class. DIFTZ free trade zone active.",
    },
    risks: [
      { category:"Concentration", risk:"Over-dependence on Ethiopia corridor — EthioTelecom exclusivity dispute", likelihood:"Medium", impact:"High", mitigation:"Diversify service offering across Horn and Gulf corridor." },
    ],
    sectors: [
      { name:"Port & Logistics", score:82, verdict:"go" },
      { name:"Free Trade Zone", score:74, verdict:"go" },
      { name:"Data Centre / Cable", score:68, verdict:"caution" },
      { name:"Maritime Services", score:62, verdict:"caution" },
    ],
    timeline: [
      { date:"2026", text:"Presidential election — Guelleh expected to run again", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Djibouti Port volumes up 18% YoY — Ethiopia rerouting post-Eritrea tensions.", impact:"pos", impactText:"▲ Port revenue growing", source:"DPA", date:"2026-06-01T08:54:00Z" },
    ],
  },
  {
    code: "ERI", flag: "🇪🇷", name: "Eritrea", region: "East Africa",
    population: "3.5M", capital: "Asmara", currency: "ERN",
    gdp: "$2.1B", fdi: "$0.05B",
    pestel: 16, irs: 14, change30d: 0.0, trend: [16,16,16,16,16,16,16,16,16,16],
    verdict: "no-go",
    macroSummary: "Eritrea is Africa's most isolated state — North Korea comparisons common. Isaias Afwerki one-party rule since 1993. No private press, no opposition, indefinite national service. Gold and zinc mining under state control. No viable commercial entry outside specialist extractive.",
    opportunities: ["Mining (gold/zinc — state JV only)"],
    pestelBreak: { P:8, E:20, S:18, T:14, En:22, L:12, IR:14 },
    pestelSnippets: {
      P: "One-party PFDJ rule. No elections. Indefinite national service. ICC-documented human rights abuses.",
      E: "Mining (Bisha, Zara) — foreign JVs under extreme state control.",
      S: "Large diaspora taxed 2% income. Extreme human rights conditions.",
      T: "No internet economy. State telecoms only.",
      En: "Mining environmental governance absent.",
      L: "No independent judiciary.",
      IR: "Port of Massawa potential — unrealised under isolation.",
    },
    risks: [
      { category:"Political", risk:"Total state control — no rule of law", likelihood:"High", impact:"Critical", mitigation:"No viable entry." },
    ],
    sectors: [
      { name:"Mining (State JV only)", score:22, verdict:"no-go" },
    ],
    timeline: [
      { date:"TBD", text:"No transition visible", type:"critical" },
    ],
    signals: [
      { dim:"P", text:"Eritrea sends troops to support Ethiopian federal forces — regional entanglement deepening.", impact:"neg", impactText:"▼ Regional conflict exposure", source:"ISS Africa", date:"2026-06-01T08:53:00Z" },
    ],
  },

  // ── SOUTHERN AFRICA ───────────────────────────────────────────────────────
  {
    code: "MOZ", flag: "🇲🇿", name: "Mozambique", region: "Southern Africa",
    population: "33M", capital: "Maputo", currency: "MZN",
    gdp: "$18B", fdi: "$3.2B",
    pestel: 40, irs: 36, change30d: -1.5, trend: [44,43,42,42,41,41,40,40,40,40],
    verdict: "caution",
    macroSummary: "Mozambique holds one of the world's largest natural gas deposits (Rovuma Basin). TotalEnergies LNG suspended due to Islamist insurgency in Cabo Delgado. Southern provinces (Maputo, Beira) are stable and offer logistics and agri plays. Post-election violence (2024) added political risk layer.",
    opportunities: ["LNG (Rovuma — future)", "Port & logistics (Nacala, Maputo)", "Agriculture (cashew, sugar)", "Tourism (southern coast)"],
    pestelBreak: { P:35, E:42, S:40, T:38, En:46, L:38, IR:36 },
    pestelSnippets: {
      P: "Frelimo election disputed Oct 2024 — Mondlane protests. Chapo (new president) faces legitimacy crisis. Cabo Delgado insurgency ongoing.",
      E: "LNG potential enormous but suspended. Southern economy ($18B) growing. Cashew and sugar exports solid.",
      S: "Post-election violence (150+ deaths). Deep north-south divide. Portuguese-speaking.",
      T: "Mobile money growing. Digital services minimal.",
      En: "Climate extremely vulnerable — cyclones (Idai, Kenneth legacy). Cabo Delgado deforestation.",
      L: "Portuguese-influenced. ICSID member. Investment code investor-friendly but enforcement slow.",
      IR: "Nacala Corridor transformative. Maputo port rehabilitated. Cabo Delgado infrastructure destroyed.",
    },
    risks: [
      { category:"Security", risk:"Cabo Delgado insurgency — northern provinces inaccessible", likelihood:"High", impact:"Critical", mitigation:"Southern-province operations only. LNG entry only viable post-ANSOM military stabilisation." },
      { category:"Political", risk:"Post-election legitimacy crisis", likelihood:"High", impact:"High", mitigation:"Short-horizon investments. Monitor Mondlane political settlement." },
    ],
    sectors: [
      { name:"Port & Logistics (Nacala/Maputo)", score:62, verdict:"caution" },
      { name:"Agri-processing", score:56, verdict:"caution" },
      { name:"LNG (future)", score:52, verdict:"caution" },
      { name:"Tourism (southern)", score:50, verdict:"caution" },
      { name:"Cabo Delgado operations", score:15, verdict:"no-go" },
    ],
    timeline: [
      { date:"2025 H1", text:"Chapo government stability test — protest negotiations", type:"critical" },
    ],
    signals: [
      { dim:"P", text:"Mondlane protest movement suspends demonstrations — negotiation talks announced.", impact:"pos", impactText:"▲ Political risk easing marginally", source:"CIP Mozambique", date:"2026-06-10T08:52:00Z" },
    ],
  },
  {
    code: "ZWE", flag: "🇿🇼", name: "Zimbabwe", region: "Southern Africa",
    population: "16M", capital: "Harare", currency: "ZiG",
    gdp: "$26B", fdi: "$0.4B",
    pestel: 32, irs: 28, change30d: 0.5, trend: [29,29,30,30,31,31,32,32,32,32],
    verdict: "no-go",
    macroSummary: "Zimbabwe's ZiG currency (April 2024) is the latest attempt to escape hyperinflation cycle. Mnangagwa's ZANU-PF continues Mugabe-era political economy. Significant lithium, platinum, and chrome resources attracting Chinese FDI. Otherwise commercial environment severely distorted.",
    opportunities: ["Lithium (Arcadia — Chinese-led)", "Platinum (Zimplats)", "Chrome / ferrochrome", "Tobacco (regional export)"],
    pestelBreak: { P:25, E:35, S:35, T:32, En:40, L:28, IR:28 },
    pestelSnippets: {
      P: "Mnangagwa consolidating power post-2023 election (disputed). Opposition (CCC/Chamisa) suppressed. AU observation accepted outcome reluctantly.",
      E: "ZiG introduced Apr 2024. Hyperinflation history. USD de facto in most transactions. Minerals boom (lithium) saving foreign currency.",
      S: "40%+ in poverty. Large skilled diaspora (South Africa, UK). Remittances critical.",
      T: "EcoCash mobile money significant. ZIMRA e-filing improving. Harare tech community small but growing.",
      En: "Hwange coal electricity. Climate vulnerability. Victoria Falls tourism.",
      L: "ICSID member. Bilateral investment treaties. Enforcement unpredictable. Nationalisation risk (Mugabe era legacy).",
      IR: "Chinese infrastructure investment (road, rail) improving. Power cuts (12h+/day) severe.",
    },
    risks: [
      { category:"Macro", risk:"Currency instability — ZiG may fail like prior currencies", likelihood:"Medium", impact:"Critical", mitigation:"USD-only contracts. Offshore holding structures mandatory." },
      { category:"Political", risk:"Nationalisation risk precedent (Indigenisation Act legacy)", likelihood:"Medium", impact:"High", mitigation:"ICSID arbitration clause. Political risk insurance. Chinese JV reduces expropriation risk." },
    ],
    sectors: [
      { name:"Lithium (Arcadia model)", score:48, verdict:"caution" },
      { name:"Platinum / Chrome", score:44, verdict:"caution" },
      { name:"Tourism (Victoria Falls)", score:42, verdict:"caution" },
      { name:"Agriculture (tobacco)", score:38, verdict:"no-go" },
      { name:"Manufacturing", score:28, verdict:"no-go" },
    ],
    timeline: [
      { date:"2028", text:"Presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"ZiG currency depreciates 40% vs USD — third devaluation in 8 months.", impact:"neg", impactText:"▼ Currency instability persists", source:"RBZ", date:"2026-06-17T08:51:00Z" },
    ],
  },
  {
    code: "ZMB", flag: "🇿🇲", name: "Zambia", region: "Southern Africa",
    population: "20M", capital: "Lusaka", currency: "ZMW",
    gdp: "$29B", fdi: "$1.0B",
    pestel: 52, irs: 47, change30d: 1.5, trend: [46,46,47,48,49,50,51,52,52,52],
    verdict: "monitor",
    macroSummary: "Zambia completed historic debt restructuring in 2023 — first African sovereign to conclude G20 Common Framework process. Hichilema government is reform-credible, business-friendly, and restoring investor confidence. Copper + cobalt (green energy metals) at centre of global supply chain. Growing consumer market.",
    opportunities: ["Copper & cobalt (green transition metals)", "Agriculture (maize corridor)", "Tourism (Zambia/Zimbabwe Victoria Falls)", "Fintech"],
    pestelBreak: { P:56, E:50, S:52, T:48, En:54, L:54, IR:47 },
    pestelSnippets: {
      P: "Hichilema (UPND) elected 2021 — peaceful transfer. Pro-business, anti-corruption stance credible.",
      E: "Debt restructuring completed. Copper boom (EV battery demand). IMF ECF programme on track.",
      S: "Urban-rural inequality high. English-speaking. Lusaka growing consumer class.",
      T: "Mobile money growing. Fintech ecosystem emerging in Lusaka.",
      En: "Kafue National Park — conservation economy. Hydropower (Kariba) critical for power.",
      L: "Common law. ICSID member. Mining code reformed under Hichilema — royalty rates stabilised.",
      IR: "TAZARA rail. Lusaka–Ndola road improving. Industrial parks in Lusaka.",
    },
    risks: [
      { category:"Power", risk:"Loadshedding 12–18h/day — Kariba drought impact", likelihood:"High", impact:"High", mitigation:"Captive power (solar) essential for any manufacturing. Solar RE sector opportunity itself." },
    ],
    sectors: [
      { name:"Copper & Cobalt", score:78, verdict:"go" },
      { name:"Renewable Energy (Solar)", score:72, verdict:"go" },
      { name:"Agriculture (Maize)", score:62, verdict:"caution" },
      { name:"Fintech", score:58, verdict:"caution" },
      { name:"Tourism", score:56, verdict:"caution" },
    ],
    timeline: [
      { date:"Aug 2026", text:"Presidential election — Hichilema vs. opposition", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Zambia copper production hits 830k tonnes — 10-year high under new mine expansions.", impact:"pos", impactText:"▲ Mining sector performing", source:"Zambia Chamber of Mines", date:"2026-06-10T08:50:00Z" },
    ],
  },
  {
    code: "BWA", flag: "🇧🇼", name: "Botswana", region: "Southern Africa",
    population: "2.7M", capital: "Gaborone", currency: "BWP",
    gdp: "$20B", fdi: "$0.5B",
    pestel: 74, irs: 69, change30d: 0.5, trend: [70,70,71,71,72,72,73,74,74,74],
    verdict: "monitor",
    macroSummary: "Botswana is Africa's governance benchmark alongside Rwanda — diamonds, democracy, and rule of law its defining assets. 2024 election saw Masisi's BDP defeated — first opposition win in 58 years. Duma (UDC) government continues pro-business track. Diamond dependence (De Beers) is the concentration risk. Diversification into financial services, logistics, and tourism underway.",
    opportunities: ["Diamond processing (De Beers/Debswana)", "Financial services (SADC hub)", "Tourism (Okavango)", "Beef & agri-export", "Logistics (landlocked SADC gateway)"],
    pestelBreak: { P:76, E:70, S:72, T:68, En:76, L:78, IR:69 },
    pestelSnippets: {
      P: "Duma elected 2024 — first opposition win since independence. Peaceful transfer. Strong democratic institutions.",
      E: "GDP $20B. Diamonds 85% exports (De Beers JV). New De Beers contract 2023 — Botswana 50% stake. Diversification urgent.",
      S: "Very small population. High income inequality (Gini). Good HDI. HIV prevalence managed.",
      T: "BITC investment promotion strong. Digital services growing. Botswana Stock Exchange liquid.",
      En: "Okavango Delta — UNESCO. Conservation economy. Climate vulnerability moderate.",
      L: "Common law. Best contract enforcement in Southern Africa. ICSID. Anti-corruption best practice.",
      IR: "Gaborone logistics hub. Tlokweng SEZ. SADC passport.",
    },
    risks: [
      { category:"Concentration", risk:"85% FX from diamonds — De Beers price cycle exposure", likelihood:"High", impact:"High", mitigation:"Diversification sectors (services, tourism) structurally sound. Diamond processing adds value." },
    ],
    sectors: [
      { name:"Financial Services", score:80, verdict:"go" },
      { name:"Tourism (Okavango)", score:76, verdict:"go" },
      { name:"Diamond Processing", score:72, verdict:"go" },
      { name:"Logistics (SADC gateway)", score:68, verdict:"caution" },
      { name:"Beef & Agri", score:62, verdict:"caution" },
    ],
    timeline: [
      { date:"Oct 2024", text:"Duma government 100-day reform programme", type:"positive" },
    ],
    signals: [
      { dim:"P", text:"Botswana new government's first budget — infrastructure and digital economy focus.", impact:"pos", impactText:"▲ Reform momentum", source:"Ministry of Finance", date:"2026-06-01T08:49:00Z" },
    ],
  },
  {
    code: "NAM", flag: "🇳🇦", name: "Namibia", region: "Southern Africa",
    population: "2.7M", capital: "Windhoek", currency: "NAD",
    gdp: "$12B", fdi: "$0.5B",
    pestel: 65, irs: 60, change30d: 2.0, trend: [58,59,60,61,62,63,64,65,65,65],
    verdict: "monitor",
    macroSummary: "Namibia's discovery of Orange Basin offshore oil (2022) is transformative — TotalEnergies Namibia (2025 FID). Green hydrogen (Hyphen project) positions Namibia as potential global exporter. SWAPO democratic continuity under Netumbo Nandi-Ndaitwah (first female president, 2024). Small population limits consumer market.",
    opportunities: ["Offshore oil (Orange Basin)", "Green hydrogen (Hyphen)", "Mining (uranium, diamonds)", "Tourism (luxury safari)", "Renewable energy"],
    pestelBreak: { P:68, E:62, S:65, T:62, En:70, L:66, IR:60 },
    pestelSnippets: {
      P: "Nandi-Ndaitwah elected Nov 2024 — SWAPO continuity. Democratic stability high. Anti-corruption credible.",
      E: "Orange Basin oil FID 2025 — production 2029–30. Hyphen green hydrogen $10B investment. GDP about to transform.",
      S: "High inequality (world's highest Gini). Small population. English-speaking. San and Himba communities protected.",
      T: "Good broadband. Growing tech ecosystem in Windhoek. E-government improving.",
      En: "Skeleton Coast, Namib — world-class conservation. Green hydrogen requires large water volumes (Namib Water Works).",
      L: "Common law. ICSID. Walvis Bay EPZ.",
      IR: "Walvis Bay port — SADC gateway. Trans-Caprivi highway. Small but improving infrastructure.",
    },
    risks: [
      { category:"Scale", risk:"2.7M population — consumer market limited", likelihood:"High", impact:"Medium", mitigation:"Position as SADC export base and energy hub rather than consumer play." },
    ],
    sectors: [
      { name:"Offshore Oil (Orange Basin)", score:82, verdict:"go" },
      { name:"Green Hydrogen", score:78, verdict:"go" },
      { name:"Mining (Uranium)", score:72, verdict:"go" },
      { name:"Tourism (Luxury)", score:68, verdict:"caution" },
      { name:"Renewable Energy", score:65, verdict:"caution" },
    ],
    timeline: [
      { date:"2025 H2", text:"TotalEnergies Orange Basin FID", type:"positive" },
    ],
    signals: [
      { dim:"E", text:"TotalEnergies Namibia confirms $9B Orange Basin FID — first oil 2029.", impact:"pos", impactText:"▲ Oil sector transformation confirmed", source:"TotalEnergies", date:"2026-06-17T08:48:00Z" },
    ],
  },
  {
    code: "MWI", flag: "🇲🇼", name: "Malawi", region: "Southern Africa",
    population: "21M", capital: "Lilongwe", currency: "MWK",
    gdp: "$12B", fdi: "$0.2B",
    pestel: 44, irs: 38, change30d: 0.5, trend: [40,40,41,41,42,42,43,44,44,44],
    verdict: "caution",
    macroSummary: "Malawi under Chakwera (re-elected 2025) is democratically functional — courts overturned fraudulent election in 2020, setting continental precedent. Economy severely constrained by landlocked position, forex shortages, and tobacco-dependency. Agriculture and fintech are viable entry points.",
    opportunities: ["Agri-processing (tobacco, tea, macadamia)", "Fintech (MOMO)", "Tourism (Lake Malawi)", "Solar energy"],
    pestelBreak: { P:50, E:40, S:46, T:42, En:48, L:46, IR:38 },
    pestelSnippets: {
      P: "2020 annulled election democratic landmark. Chakwera returned 2025. Anti-corruption efforts genuine but capacity limited.",
      E: "Tobacco 50% exports. FX shortages. GDP $12B — heavily aid-dependent. IMF ECF active.",
      S: "High poverty. Lake Malawi culture. Warm, English-speaking population.",
      T: "Airtel Money and TNM Mpamba mobile money active. Fintech growing.",
      En: "Lake Malawi (biodiversity hotspot). Climate vulnerability high — seasonal flooding.",
      L: "Common law. Judiciary independence proven (2020 election annulment). ICSID.",
      IR: "Landlocked — Nacala/Beira corridors. Kamuzu International Airport small.",
    },
    risks: [
      { category:"Macro", risk:"FX shortages — import-dependent businesses disrupted", likelihood:"High", impact:"High", mitigation:"USD revenue streams only. Local manufacturing only for domestic market." },
    ],
    sectors: [
      { name:"Agri-processing (Tea/Macadamia)", score:60, verdict:"caution" },
      { name:"Fintech", score:56, verdict:"caution" },
      { name:"Tourism (Lake Malawi)", score:52, verdict:"caution" },
      { name:"Solar Energy", score:50, verdict:"caution" },
    ],
    timeline: [
      { date:"Jun 2025", text:"Presidential election — Chakwera seeks re-election", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Malawi kwacha stabilises after 6-month IMF intervention — FX crisis easing.", impact:"pos", impactText:"▲ Macro risk reducing", source:"RBM", date:"2026-05-20T08:47:00Z" },
    ],
  },
  {
    code: "LSO", flag: "🇱🇸", name: "Lesotho", region: "Southern Africa",
    population: "2.2M", capital: "Maseru", currency: "LSL",
    gdp: "$2.8B", fdi: "$0.1B",
    pestel: 40, irs: 35, change30d: 0.5, trend: [37,37,38,38,39,39,40,40,40,40],
    verdict: "caution",
    macroSummary: "Lesotho is a landlocked enclave within South Africa — this geography defines its economy. Water exports (Lesotho Highlands Water Project), diamonds, and garment manufacturing (AGOA) are the three viable sectors. Political instability (multiple coups) is chronic but improving.",
    opportunities: ["Water exports (LHWP II)", "Diamonds (Letseng)", "Garment/apparel (AGOA)", "Cannabis (medicinal — export licensed)"],
    pestelBreak: { P:36, E:42, S:42, T:36, En:44, L:40, IR:35 },
    pestelSnippets: {
      P: "Multiple coups in recent decades. Current coalition government (2022) under Matekane. Improving stability.",
      E: "Water revenues ~10% GDP (LHWP). Diamonds (Letseng — high-value). AGOA garments. Remittances from SA miners.",
      S: "High HIV prevalence. SA labour migration dominant economic strategy. High youth unemployment.",
      T: "Mobile penetration growing. No digital economy.",
      En: "Highlands — water tower of Southern Africa. Climate change risk to water yields.",
      L: "Common law (SA aligned). Property rights improving.",
      IR: "LHWP infrastructure massive. Road network improving. SA dependency total.",
    },
    risks: [
      { category:"Political", risk:"Coalition instability — third election in 5 years possible", likelihood:"Medium", impact:"Medium", mitigation:"Short-horizon investments. Resource sector (diamonds) most insulated from politics." },
    ],
    sectors: [
      { name:"Diamonds (Letseng)", score:64, verdict:"caution" },
      { name:"Garment/Apparel (AGOA)", score:58, verdict:"caution" },
      { name:"Water/Hydropower", score:56, verdict:"caution" },
      { name:"Medicinal Cannabis", score:50, verdict:"caution" },
    ],
    timeline: [
      { date:"2027", text:"Next election (schedule permitting)", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Lesotho LHWP Phase II reaches 70% construction completion.", impact:"pos", impactText:"▲ Water export revenue pipeline", source:"LHDA", date:"2026-05-02T08:46:00Z" },
    ],
  },
  {
    code: "SWZ", flag: "🇸🇿", name: "Eswatini", region: "Southern Africa",
    population: "1.2M", capital: "Mbabane", currency: "SZL",
    gdp: "$4.7B", fdi: "$0.1B",
    pestel: 36, irs: 32, change30d: 0.0, trend: [36,36,36,36,36,36,36,36,36,36],
    verdict: "caution",
    macroSummary: "Eswatini is Africa's last absolute monarchy (Mswati III). Political parties banned. Pro-democracy protests (2021) suppressed with lethal force. AGOA eligibility suspended (governance). Manufacturing and sugar rely on SA/SACU customs union. Limited viable FDI outside SACU-aligned manufacturing.",
    opportunities: ["Sugar & agri-processing (SACU export)", "Textiles (SACU/SADC)", "Tourism (Swazi culture)"],
    pestelBreak: { P:24, E:42, S:38, T:34, En:42, L:30, IR:32 },
    pestelSnippets: {
      P: "Mswati absolute monarchy. AGOA suspended. Pro-democracy movement suppressed.",
      E: "Sugar 50%+ exports. SACU customs union revenues important. Remittances from SA.",
      S: "High HIV prevalence (world's highest rate historically). Youth unemployment high.",
      T: "Mobile penetration adequate. No digital economy.",
      En: "Irrigated sugar agriculture. Small but biodiverse.",
      L: "Roman-Dutch/common law hybrid. Courts partially independent.",
      IR: "SACU benefits. SA transport network adjacent.",
    },
    risks: [
      { category:"Political", risk:"AGOA suspension — textile sector export model damaged", likelihood:"High", impact:"High", mitigation:"EU EPA route instead of AGOA. SADC market for manufacturing." },
    ],
    sectors: [
      { name:"Sugar / Agri (SACU export)", score:52, verdict:"caution" },
      { name:"Textiles (SADC)", score:46, verdict:"caution" },
      { name:"Tourism", score:40, verdict:"caution" },
    ],
    timeline: [
      { date:"TBD", text:"Pro-democracy reform demands — ongoing", type:"critical" },
    ],
    signals: [
      { dim:"L", text:"US confirms AGOA suspension remains in place — textile exports to US blocked.", impact:"neg", impactText:"▼ AGOA market access closed", source:"USTR", date:"2026-04-02T08:45:00Z" },
    ],
  },
  {
    code: "MDG", flag: "🇲🇬", name: "Madagascar", region: "Southern Africa",
    population: "29M", capital: "Antananarivo", currency: "MGA",
    gdp: "$14B", fdi: "$0.5B",
    pestel: 36, irs: 32, change30d: 0.5, trend: [33,33,33,34,34,35,35,36,36,36],
    verdict: "caution",
    macroSummary: "Madagascar is resource-rich (nickel, cobalt, chromite, vanilla) but governance-weak. Rajoelina (re-elected 2023, disputed) government is pro-mining. Vanilla economy (50% global supply) fragile — weather and price volatility. Infrastructure void is the binding constraint. IOC island position creates logistics costs.",
    opportunities: ["Nickel & cobalt (Ambatovy)", "Chromite & ilmenite", "Vanilla (premium export)", "Blue economy / fisheries", "Ecotourism (biodiversity)"],
    pestelBreak: { P:32, E:38, S:36, T:30, En:44, L:30, IR:32 },
    pestelSnippets: {
      P: "Rajoelina disputed re-election 2023. Chronic coup history (5 coups/crises since 1972). Governance fragile.",
      E: "Vanilla 30%+ exports. Nickel/cobalt (Ambatovy). GDP $14B. Extreme poverty (75%+).",
      S: "Persistent food insecurity. Climate shocks. Extreme poverty in south.",
      T: "Mobile penetration growing. No digital economy.",
      En: "World's 4th largest island — biodiversity hotspot. Deforestation severe. Cyclone vulnerability.",
      L: "French-influenced. Investment code generous in theory. Enforcement weak.",
      IR: "Port of Toamasina improving. Road network poor. Island logistics costly.",
    },
    risks: [
      { category:"Political", risk:"Coup risk — chronic political instability", likelihood:"Medium", impact:"High", mitigation:"ICSID arbitration essential. Political risk insurance. Short-horizon unless resource-backed." },
    ],
    sectors: [
      { name:"Mining (Nickel/Cobalt)", score:54, verdict:"caution" },
      { name:"Vanilla / Agri", score:50, verdict:"caution" },
      { name:"Ecotourism", score:48, verdict:"caution" },
      { name:"Blue Economy", score:44, verdict:"caution" },
    ],
    timeline: [
      { date:"2028", text:"Presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Vanilla price rebounds 40% — cyclone-reduced supply tightens global market.", impact:"pos", impactText:"▲ Export revenue improving", source:"FAOSTAT", date:"2026-05-02T08:44:00Z" },
    ],
  },
  {
    code: "MUS", flag: "🇲🇺", name: "Mauritius", region: "Southern Africa",
    population: "1.3M", capital: "Port Louis", currency: "MUR",
    gdp: "$14B", fdi: "$0.6B",
    pestel: 78, irs: 74, change30d: 1.0, trend: [72,73,74,74,75,76,77,78,78,78],
    verdict: "monitor",
    macroSummary: "Mauritius is Africa's premium financial and business services hub — World Bank top quartile governance, IFC regional HQ, and Africa's most sophisticated capital market. FATF grey-listing (2021) removed 2022 — AML/CFT credibility restored. Tourism, fintech, and global business licences drive growth. Tiny population is the only constraint.",
    opportunities: ["Financial services (IFC/GBC licences)", "Fintech (MINDEX)", "Premium tourism", "Digital economy HQ", "Africa holding company structures"],
    pestelBreak: { P:76, E:78, S:76, T:74, En:78, L:80, IR:74 },
    pestelSnippets: {
      P: "Jugnauth re-elected 2024. Stable multiparty democracy. SADC, COMESA, IOC member.",
      E: "GDP $14B. Financial services 30% GDP. Tourism 15%. IFC double-tax treaties with 46 countries including India.",
      S: "Multicultural (Hindu, Creole, Muslim, Chinese). High HDI. Ageing population.",
      T: "Fibre broadband near-universal. MINDEX digital exchange. Fintech sandbox active.",
      En: "Climate-vulnerable low-lying island. Blue economy investment significant.",
      L: "Common + French hybrid. Very strong financial services regulation. IOSCO, FATF-compliant.",
      IR: "Port Louis as Africa IFC. Airport. MINDEX exchange.",
    },
    risks: [
      { category:"Scale", risk:"1.3M population — domestic market minimal", likelihood:"High", impact:"Low", mitigation:"By design — Mauritius is a gateway, not a consumer market." },
    ],
    sectors: [
      { name:"Financial Services (IFC)", score:90, verdict:"go" },
      { name:"Fintech (MINDEX)", score:84, verdict:"go" },
      { name:"Tourism (Premium)", score:78, verdict:"go" },
      { name:"Digital Economy HQ", score:76, verdict:"go" },
      { name:"Logistics (Port Louis)", score:68, verdict:"caution" },
    ],
    timeline: [
      { date:"2028", text:"Next parliamentary election", type:"neutral" },
    ],
    signals: [
      { dim:"L", text:"Mauritius signs new DTA with Saudi Arabia — Gulf investment corridor opens.", impact:"pos", impactText:"▲ IFC positioning strengthened", source:"FSC Mauritius", date:"2026-06-10T08:43:00Z" },
    ],
  },
  {
    code: "COM", flag: "🇰🇲", name: "Comoros", region: "Southern Africa",
    population: "0.9M", capital: "Moroni", currency: "KMF",
    gdp: "$1.3B", fdi: "$0.02B",
    pestel: 30, irs: 26, change30d: 0.0, trend: [30,30,30,30,30,30,30,30,30,30],
    verdict: "no-go",
    macroSummary: "Comoros is one of the world's most coup-prone states (20+ coups/attempts). Azali consolidated power via 2018 referendum. Remittances from France-based diaspora dominate the economy. Ylang-ylang and cloves the only notable exports. No viable commercial environment.",
    opportunities: ["Ylang-ylang (niche export)", "Fisheries (licensed)"],
    pestelBreak: { P:18, E:32, S:34, T:26, En:38, L:24, IR:26 },
    pestelSnippets: {
      P: "Azali power consolidation. High coup frequency.",
      E: "Remittances 25%+ GDP. Ylang-ylang and cloves. Very small domestic market.",
      S: "French-speaking diaspora significant. Islamic society.",
      T: "Mobile basic.",
      En: "Indian Ocean islands — biodiversity. Cyclone-exposed.",
      L: "French-influenced. Enforcement unreliable.",
      IR: "Port Moroni. Very limited infrastructure.",
    },
    risks: [
      { category:"Political", risk:"Chronic political instability — coup risk", likelihood:"High", impact:"Critical", mitigation:"No viable commercial entry." },
    ],
    sectors: [
      { name:"Fisheries (licensed)", score:28, verdict:"no-go" },
    ],
    timeline: [
      { date:"2026", text:"Presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"P", text:"Azali wins referendum extending presidential term — opposition boycott.", impact:"neg", impactText:"▼ Democratic backsliding", source:"IOC", date:"2026-03-03T08:42:00Z" },
    ],
  },

  // ── CENTRAL AFRICA ────────────────────────────────────────────────────────
  {
    code: "GAB", flag: "🇬🇦", name: "Gabon", region: "Central Africa",
    population: "2.4M", capital: "Libreville", currency: "XAF",
    gdp: "$20B", fdi: "$1.2B",
    pestel: 38, irs: 34, change30d: 0.5, trend: [35,35,35,36,36,37,37,38,38,38],
    verdict: "caution",
    macroSummary: "Gabon's August 2023 coup (Oligui Nguema) ended the Bongo dynasty after 56 years. Transitional government signalling reform and investors remain engaged — oil (Perenco, Total) continues operating. Mango transition calendar cautiously positive. Forest carbon (80% forest cover) an emerging play.",
    opportunities: ["Oil & gas", "Manganese (world's 2nd largest)", "Forest carbon credits", "Timber (sustainable)", "Special Economic Zone (Nkok)"],
    pestelBreak: { P:32, E:44, S:38, T:36, En:52, L:36, IR:34 },
    pestelSnippets: {
      P: "Oligui Nguema junta — coup Aug 2023. Transition elections 2025 promised. Reformist signals but military-led.",
      E: "Oil 40%+ GDP (declining). Manganese (Comilog/Eramet) strong. Nkok SEZ operational.",
      S: "Small population. High income (oil wealth). Libreville consumer class. Rural poor.",
      T: "Digital services growing in Libreville.",
      En: "80%+ forest cover — Congo Basin. Carbon credit potential enormous.",
      L: "OHADA. Oil codes investor-friendly. Junta policy stability — to be tested.",
      IR: "Nkok SEZ improving. Port-Gentil oil infrastructure operational.",
    },
    risks: [
      { category:"Political", risk:"Military transition uncertainty — Bongo family assets dispute", likelihood:"Medium", impact:"Medium", mitigation:"Oil and manganese most insulated. SEZ manufacturing viable." },
    ],
    sectors: [
      { name:"Oil & Gas", score:60, verdict:"caution" },
      { name:"Manganese", score:66, verdict:"caution" },
      { name:"Forest Carbon", score:58, verdict:"caution" },
      { name:"SEZ Manufacturing (Nkok)", score:54, verdict:"caution" },
    ],
    timeline: [
      { date:"2025", text:"Transition elections promised by junta", type:"neutral" },
    ],
    signals: [
      { dim:"P", text:"Oligui Nguema announces August 2025 presidential election date — transition calendar confirmed.", impact:"pos", impactText:"▲ Transition credibility improving", source:"Transition Government", date:"2026-05-02T08:41:00Z" },
    ],
  },
  {
    code: "CAF", flag: "🇨🇫", name: "Central African Republic", region: "Central Africa",
    population: "5M", capital: "Bangui", currency: "XAF",
    gdp: "$2.5B", fdi: "$0.08B",
    pestel: 14, irs: 12, change30d: 0.0, trend: [14,14,14,14,14,14,14,14,14,14],
    verdict: "no-go",
    macroSummary: "CAR is one of the world's most fragile states. Russian Wagner/Africa Corps forces the de facto security provider. Gold and diamonds mined under militia control. No viable commercial entry.",
    opportunities: ["Gold (militia-controlled — no viable entry)", "Timber (specialist)"],
    pestelBreak: { P:8, E:18, S:18, T:12, En:20, L:10, IR:12 },
    pestelSnippets: {
      P: "Touadera reliant on Wagner/Africa Corps. Armed groups control 70%+ territory.",
      E: "Gold and diamonds — extractive economy, militia-intermediated.",
      S: "Extreme humanitarian crisis. Mass displacement.",
      T: "No digital economy.",
      En: "Congo Basin forest. Mining environmental governance absent.",
      L: "Legal system non-functional outside Bangui.",
      IR: "Infrastructure absent. Aid delivery primary economic activity.",
    },
    risks: [
      { category:"Security", risk:"Armed groups control most of territory", likelihood:"High", impact:"Critical", mitigation:"No viable entry." },
    ],
    sectors: [
      { name:"No viable sectors", score:10, verdict:"no-go" },
    ],
    timeline: [
      { date:"TBD", text:"UN stabilisation plan — no timeline", type:"critical" },
    ],
    signals: [
      { dim:"P", text:"Wagner rebrands as Africa Corps — operations continue unchanged in CAR.", impact:"neg", impactText:"▼ Russian influence entrenching", source:"ISS", date:"2026-05-02T08:40:00Z" },
    ],
  },
  {
    code: "COG", flag: "🇨🇬", name: "Republic of Congo", region: "Central Africa",
    population: "6M", capital: "Brazzaville", currency: "XAF",
    gdp: "$12B", fdi: "$2.2B",
    pestel: 36, irs: 32, change30d: 0.5, trend: [33,33,34,34,35,35,35,36,36,36],
    verdict: "caution",
    macroSummary: "Republic of Congo (Congo-Brazzaville) is oil-dominated under Sassou Nguesso (40+ years). Post-debt crisis recovery with IMF programme. Total Energies operates large oil fields. Congo Basin forest is the other major asset. Small non-oil economy.",
    opportunities: ["Oil & gas (TotalEnergies)", "Forest carbon", "Timber (sustainable)"],
    pestelBreak: { P:28, E:38, S:35, T:32, En:50, L:30, IR:32 },
    pestelSnippets: {
      P: "Sassou Nguesso 40+ years. Stable but authoritarian.",
      E: "Oil 80% GDP. IMF programme stabilising debt. Non-oil economy tiny.",
      S: "Small population. Brazzaville consumer class. Rural poor.",
      T: "Brazzaville fibre hub for CEMAC. Digital services minimal.",
      En: "Congo Basin forest. Carbon credit pipeline building.",
      L: "OHADA. Oil code investor-friendly.",
      IR: "Pointe-Noire port oil hub. Brazzaville–Kinshasa ferry — Congo River corridor.",
    },
    risks: [
      { category:"Political", risk:"Succession risk after 40+ year rule", likelihood:"Medium", impact:"High", mitigation:"ICSID. Short-horizon. Oil sector most protected by international frameworks." },
    ],
    sectors: [
      { name:"Oil & Gas", score:58, verdict:"caution" },
      { name:"Forest Carbon", score:52, verdict:"caution" },
      { name:"Timber (certified)", score:44, verdict:"caution" },
    ],
    timeline: [
      { date:"2026", text:"Presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"Congo receives $500M IMF disbursement — programme on track.", impact:"pos", impactText:"▲ Fiscal stabilising", source:"IMF", date:"2026-05-27T08:39:00Z" },
    ],
  },
  {
    code: "GNQ", flag: "🇬🇶", name: "Equatorial Guinea", region: "Central Africa",
    population: "1.5M", capital: "Malabo", currency: "XAF",
    gdp: "$12B", fdi: "$0.8B",
    pestel: 26, irs: 22, change30d: 0.0, trend: [26,26,26,26,26,26,26,26,26,26],
    verdict: "no-go",
    macroSummary: "Equatorial Guinea under Obiang (world's longest-serving non-royal president, 45+ years) is one of Africa's most opaque petrostates. Son Teodorin vice president — ICC-investigated. Oil declining. No viable commercial entry outside energy sector JVs.",
    opportunities: ["LNG (EG LNG — Hess)", "Oil (declining — specialist)"],
    pestelBreak: { P:14, E:35, S:28, T:24, En:32, L:18, IR:22 },
    pestelSnippets: {
      P: "Obiang since 1979. Dynasty succession (Teodorin VP). No opposition. ICC investigations.",
      E: "LNG and oil revenues. Declining production. Non-oil economy near-zero.",
      S: "Spanish-speaking. Small population. Oil wealth not distributed.",
      T: "No digital economy.",
      En: "Bioko Island biodiversity. Oil environmental governance minimal.",
      L: "No independent judiciary. Spanish law nominal.",
      IR: "Malabo port and airport for energy sector only.",
    },
    risks: [
      { category:"Political", risk:"Kleptocracy — ICC investigations of ruling family", likelihood:"High", impact:"Critical", mitigation:"Energy sector JVs only via established operators." },
    ],
    sectors: [
      { name:"LNG (EG LNG structure)", score:38, verdict:"no-go" },
    ],
    timeline: [
      { date:"TBD", text:"No visible transition", type:"critical" },
    ],
    signals: [
      { dim:"E", text:"EG LNG completes train 2 maintenance — capacity restored.", impact:"neu", impactText:"→ LNG output stable", source:"EG LNG", date:"2026-05-02T08:38:00Z" },
    ],
  },
  {
    code: "STP", flag: "🇸🇹", name: "São Tomé and Príncipe", region: "Central Africa",
    population: "0.22M", capital: "São Tomé", currency: "STN",
    gdp: "$0.5B", fdi: "$0.02B",
    pestel: 54, irs: 46, change30d: 0.5, trend: [50,50,51,51,52,52,53,54,54,54],
    verdict: "caution",
    macroSummary: "Africa's second-smallest country. Portuguese-speaking island democracy — stable multiparty system. Cocoa (premium) and niche tourism are the entry plays. Offshore oil (JDZ with Nigeria) has never materialised. Micro-market — niche positioning only.",
    opportunities: ["Premium cocoa", "Niche ecotourism", "Offshore oil (JDZ — long-term)"],
    pestelBreak: { P:58, E:46, S:56, T:44, En:62, L:56, IR:46 },
    pestelSnippets: {
      P: "Stable democracy. Peaceful transfers. CPLP member.",
      E: "Cocoa and tourism. Aid-dependent. Very small economy.",
      S: "Small, literate, Portuguese-speaking. Good social indicators for income level.",
      T: "Basic mobile. No digital economy.",
      En: "Unique biodiversity — endemic species. Climate vulnerable.",
      L: "Portuguese law. Courts functional.",
      IR: "Port São Tomé improving. Small airport.",
    },
    risks: [
      { category:"Scale", risk:"220k population — no scale market", likelihood:"High", impact:"Low", mitigation:"Premium niche plays only." },
    ],
    sectors: [
      { name:"Premium Cocoa", score:62, verdict:"caution" },
      { name:"Ecotourism", score:58, verdict:"caution" },
    ],
    timeline: [
      { date:"Jul 2026", text:"Presidential election", type:"neutral" },
    ],
    signals: [
      { dim:"E", text:"STP cocoa receives UNESCO Terroir recognition — premium price uplift.", impact:"pos", impactText:"▲ Cocoa export value", source:"ICCO", date:"2026-04-02T08:37:00Z" },
    ],
  },

  // ── HORN & ISLAND ────────────────────────────────────────────────────────
  {
    code: "SYC", flag: "🇸🇨", name: "Seychelles", region: "East Africa",
    population: "0.1M", capital: "Victoria", currency: "SCR",
    gdp: "$2.0B", fdi: "$0.2B",
    pestel: 68, irs: 62, change30d: 1.0, trend: [62,63,63,64,65,66,67,68,68,68],
    verdict: "monitor",
    macroSummary: "Seychelles is Africa's highest-income nation (GDP per capita ~$19k). Ramkalawan presidency (2020) ended 42-year PL monopoly — democratic opening. Tourism and blue economy are the pillars. Financial services (offshore) being reformed for FATF compliance. Micro-state — gateway positioning.",
    opportunities: ["Blue economy (tuna, EEZ)", "Premium tourism", "Financial services (IFC)", "Renewable energy (island)"],
    pestelBreak: { P:66, E:68, S:70, T:64, En:72, L:68, IR:62 },
    pestelSnippets: {
      P: "Ramkalawan 2020 — democratic transition landmark. Multiparty system functioning.",
      E: "Tourism 60% GDP. Tuna and EEZ licensing. GDP/capita highest in Africa.",
      S: "Very small population. Multicultural. High HDI.",
      T: "Good broadband. Digital nomad appeal.",
      En: "Blue economy leader — 30x30 ocean commitment. Climate-vulnerable (sea level).",
      L: "French/English hybrid. Financial services under reform. FATF compliant.",
      IR: "Victoria port. International airport. Small industrial base.",
    },
    risks: [
      { category:"Scale", risk:"100k population — micro-state", likelihood:"High", impact:"Low", mitigation:"Blue economy and financial services as gateway, not consumer market." },
    ],
    sectors: [
      { name:"Blue Economy / Tuna", score:76, verdict:"go" },
      { name:"Premium Tourism", score:74, verdict:"go" },
      { name:"Financial Services", score:64, verdict:"caution" },
    ],
    timeline: [
      { date:"2025", text:"Parliamentary election", type:"neutral" },
    ],
    signals: [
      { dim:"En", text:"Seychelles signs 30x30 blue bond — largest IOC ocean conservation finance.", impact:"pos", impactText:"▲ Blue economy leadership", source:"World Bank", date:"2026-05-02T08:36:00Z" },
    ],
  },

  // ── SADC ISLANDS ─────────────────────────────────────────────────────────
  {
    code: "MRT", flag: "🇲🇷", name: "Mauritania", region: "North Africa",
    population: "4.7M", capital: "Nouakchott", currency: "MRU",
    gdp: "$10B", fdi: "$1.8B",
    pestel: 46, irs: 41, change30d: 1.5, trend: [40,41,41,42,43,43,44,45,46,46],
    verdict: "caution",
    macroSummary: "Mauritania under Ghazouani is a relatively stable Sahel state transforming its hydrocarbon position. Gas (GTA — Greater Tortue Ahmeyim LNG) with Senegal is coming online 2024–25. Iron ore (SNIM) significant. Migration and counter-terrorism posture gives geopolitical leverage with EU. Modern slavery concerns remain.",
    opportunities: ["LNG (GTA — BP/Kosmos)", "Iron ore (SNIM)", "Green hydrogen (solar belt)", "Fisheries"],
    pestelBreak: { P:44, E:48, S:44, T:40, En:52, L:42, IR:41 },
    pestelSnippets: {
      P: "Ghazouani re-elected 2024. Military-civilian balance managed. EU counter-terror partner.",
      E: "GTA LNG (FLNG) first gas 2024. Iron ore (SNIM) — 40%+ exports. Fish sector large.",
      S: "Nomadic Moorish culture. Slavery abolition enforcement weak — ongoing ILO concern.",
      T: "Digital economy minimal. Mobile basic.",
      En: "Sahara solar potential enormous. Desertification advancing. Atlantic fisheries rich.",
      L: "Mixed legal system. Investment code improving. Modern slavery legal gaps.",
      IR: "Nouakchott port improving. GTA FLNG offshore platform.",
    },
    risks: [
      { category:"ESG", risk:"Modern slavery prevalence — ILO concern for supply chain investors", likelihood:"High", impact:"High", mitigation:"Human rights due diligence mandatory. Haratin community stakeholder engagement required." },
    ],
    sectors: [
      { name:"LNG (GTA)", score:68, verdict:"caution" },
      { name:"Iron Ore", score:62, verdict:"caution" },
      { name:"Fisheries", score:58, verdict:"caution" },
      { name:"Green Hydrogen", score:55, verdict:"caution" },
    ],
    timeline: [
      { date:"2025", text:"GTA LNG train 2 FID", type:"positive" },
    ],
    signals: [
      { dim:"E", text:"GTA FLNG delivers first LNG cargo — BP confirms production ramp.", impact:"pos", impactText:"▲ LNG revenue starts", source:"BP", date:"2026-06-01T08:35:00Z" },
    ],
  },
];

export const REGIONS = ["All Africa", "East Africa", "West Africa", "Southern Africa", "North Africa", "Central Africa"];
export const SECTORS = ["All Sectors", "Fintech", "Energy", "Agriculture", "Infrastructure", "Manufacturing"];
