import { useState } from "react";
import { useLocation } from "wouter";
import { OnboardingTour } from "@/components/OnboardingTour";
import { trpc } from "@/lib/trpc";
import { Loader2, Globe, ExternalLink, Layers, AlertCircle, RefreshCw, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// ── PESTEL ────────────────────────────────────────────────────────────────────
const PESTEL = [
  { id: "all",           label: "All",  color: "#94a3b8", bg: "bg-slate-700/30 border-slate-600/40",       active: "bg-slate-700/60 border-slate-400" },
  { id: "political",     label: "P",    color: "#38bdf8", bg: "bg-sky-500/10 border-sky-500/25",            active: "bg-sky-500/20 border-sky-400" },
  { id: "economic",      label: "E",    color: "#34d399", bg: "bg-emerald-500/10 border-emerald-500/25",    active: "bg-emerald-500/20 border-emerald-400" },
  { id: "social",        label: "S",    color: "#fb923c", bg: "bg-orange-500/10 border-orange-500/25",      active: "bg-orange-500/20 border-orange-400" },
  { id: "technological", label: "T",    color: "#a78bfa", bg: "bg-violet-500/10 border-violet-500/25",      active: "bg-violet-500/20 border-violet-400" },
  { id: "environmental", label: "En",   color: "#6ee7b7", bg: "bg-teal-500/10 border-teal-500/25",          active: "bg-teal-500/20 border-teal-400" },
  { id: "legal",         label: "L",    color: "#fbbf24", bg: "bg-amber-500/10 border-amber-500/25",        active: "bg-amber-500/20 border-amber-400" },
  { id: "investor",      label: "IR",   color: "#fb7185", bg: "bg-rose-500/10 border-rose-500/25",          active: "bg-rose-500/20 border-rose-400" },
] as const;
type PestelId = typeof PESTEL[number]["id"];

// ── Regions ──────────────────────────────────────────────────────────────────
const REGIONS = [
  { id: "all",     label: "All Africa" },
  { id: "east",    label: "East Africa" },
  { id: "west",    label: "West Africa" },
  { id: "central", label: "Central Africa" },
  { id: "north",   label: "North Africa" },
  { id: "south",   label: "Southern Africa" },
];

// ── Source types ──────────────────────────────────────────────────────────────
type SourceType = "rss" | "field" | "social" | "parliament" | "research" | "x" | "linkedin" | "chamber" | "apex";
const SOURCE_META: Record<SourceType, { label: string; color: string; icon: string }> = {
  rss:        { label: "News",              color: "#38bdf8", icon: "📰" },
  field:      { label: "Field Signal",      color: "#34d399", icon: "🏴" },
  social:     { label: "Social",            color: "#a78bfa", icon: "📡" },
  parliament: { label: "Parliament",        color: "#fbbf24", icon: "🏛️" },
  research:   { label: "Research",          color: "#fb923c", icon: "📄" },
  x:          { label: "𝕏 / Twitter",      color: "#e2e8f0", icon: "𝕏" },
  linkedin:   { label: "LinkedIn",          color: "#0ea5e9", icon: "🔗" },
  chamber:    { label: "Business Chamber",  color: "#a78bfa", icon: "🏢" },
  apex:       { label: "APEX Body",         color: "#f472b6", icon: "⚖️" },
};

// ── Content item shape ────────────────────────────────────────────────────────
interface AggItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceType: SourceType;
  pestel: string;
  country: string;
  countryFlag: string;
  region: string;
  publishedAt: string;
  url?: string;
  confidence: "corroborated" | "single-source" | "unverified";
  crossBorder?: string[]; // other countries with same signal
  clusterSize?: number;
}

// ── Static seed items (live items come from xTrends getTrending) ──────────────
const SEED_ITEMS: AggItem[] = [
  {
    id: "agg-1",
    headline: "Tanzania sedition law criminalises social media criticism of officials",
    summary: "Parliament passed amendments expanding the Computer Misuse Act to include posts deemed critical of named public officials. Civil society coalition challenging the law at the High Court. Six journalists already summoned for questioning.",
    source: "The Citizen TZ",
    sourceType: "rss",
    pestel: "legal",
    country: "Tanzania",
    countryFlag: "🇹🇿",
    region: "east",
    publishedAt: "2h ago",
    confidence: "corroborated",
    crossBorder: ["🇺🇬", "🇷🇼"],
    clusterSize: 4,
  },
  {
    id: "agg-2",
    headline: "Nigeria CBN emergency rate decision expected as Naira hits new low",
    summary: "The Central Bank of Nigeria convenes an emergency Monetary Policy Committee session after the Naira slipped to ₦1,850/$. Parallel market pressure attributed to oil revenue delays and external debt service obligations.",
    source: "Punch Nigeria",
    sourceType: "rss",
    pestel: "economic",
    country: "Nigeria",
    countryFlag: "🇳🇬",
    region: "west",
    publishedAt: "4h ago",
    confidence: "corroborated",
    clusterSize: 7,
  },
  {
    id: "agg-3",
    headline: "GERD second turbine operational; Egypt issues diplomatic protest",
    summary: "Ethiopia's Grand Renaissance Dam second generation unit begins full-power operation. Cairo immediately filed a diplomatic protest with the AU Peace and Security Council, calling for an emergency meeting under the Nile Basin Initiative framework.",
    source: "Field signal — Addis Ababa",
    sourceType: "field",
    pestel: "environmental",
    country: "Ethiopia",
    countryFlag: "🇪🇹",
    region: "east",
    publishedAt: "6h ago",
    confidence: "corroborated",
    crossBorder: ["🇪🇬", "🇸🇩"],
    clusterSize: 5,
  },
  {
    id: "agg-4",
    headline: "Kenya Finance Bill protests: Gen-Z network formalising into civic structures",
    summary: "The decentralised protest movement that toppled the Finance Bill is consolidating into a registered civic network. Five county chapters filed incorporation papers this week. Leaders declining political party overtures, citing independence mandate.",
    source: "Nation Africa",
    sourceType: "rss",
    pestel: "political",
    country: "Kenya",
    countryFlag: "🇰🇪",
    region: "east",
    publishedAt: "8h ago",
    confidence: "corroborated",
    crossBorder: ["🇺🇬", "🇹🇿", "🇷🇼"],
    clusterSize: 6,
  },
  {
    id: "agg-5",
    headline: "Sudan: SAF–RSF frontlines shifting; AU mediation stalled for third week",
    summary: "AU-led Jeddah Process negotiations failed to produce a ceasefire extension. RSF forces reported in new positions around Khartoum North. UN OCHA estimates 1.2M civilians in newly contested areas without humanitarian access.",
    source: "Field signal — Omdurman",
    sourceType: "field",
    pestel: "political",
    country: "Sudan",
    countryFlag: "🇸🇩",
    region: "north",
    publishedAt: "3h ago",
    confidence: "single-source",
    clusterSize: 3,
  },
  {
    id: "agg-6",
    headline: "Kigali AI summit: 8 nations sign continental data governance standards",
    summary: "A framework for AI oversight and cross-border data flows was agreed at the Rwanda-hosted summit. Signatories include Kenya, Ghana, Senegal, South Africa, Morocco, Egypt, Ethiopia, and Nigeria. The AU Commission to convene an implementation working group within 90 days.",
    source: "Africa Report",
    sourceType: "rss",
    pestel: "technological",
    country: "Rwanda",
    countryFlag: "🇷🇼",
    region: "east",
    publishedAt: "12h ago",
    confidence: "corroborated",
    crossBorder: ["🇰🇪", "🇬🇭", "🇿🇦"],
    clusterSize: 5,
  },
  {
    id: "agg-7",
    headline: "South Africa Expropriation Act: Constitutional Court challenge filed within 72h",
    summary: "AfriForum and the South African Institute of Race Relations jointly filed an urgent Constitutional Court application to suspend the Expropriation Act pending review. The DA also announced separate legal action. ANC government says the Act is constitutional.",
    source: "Daily Maverick",
    sourceType: "rss",
    pestel: "legal",
    country: "South Africa",
    countryFlag: "🇿🇦",
    region: "south",
    publishedAt: "9h ago",
    confidence: "corroborated",
    clusterSize: 8,
  },
  {
    id: "agg-8",
    headline: "Kenya flash floods: 200+ dead, Rift Valley dam infrastructure under review",
    summary: "Persistent heavy rains triggered flash floods across Rift Valley and Central counties. Government declared a national disaster. NEMA placed 14 dams under emergency review after three earth dams partially breached in Baringo and Nakuru counties.",
    source: "KBC Kenya",
    sourceType: "rss",
    pestel: "environmental",
    country: "Kenya",
    countryFlag: "🇰🇪",
    region: "east",
    publishedAt: "5h ago",
    confidence: "corroborated",
    clusterSize: 4,
  },

  // ── North Africa — full PESTEL spectrum ──────────────────────────────────────
  {
    id: "agg-n1",
    headline: "Egypt parliament fast-tracks emergency media regulations ahead of elections",
    summary: "The Egyptian House of Representatives passed amendments tightening state oversight of online news outlets and social media accounts with more than 5,000 followers. Critics say the law codifies pre-existing enforcement and will chill opposition coverage ahead of local elections.",
    source: "Egypt Independent",
    sourceType: "rss",
    pestel: "political",
    country: "Egypt",
    countryFlag: "🇪🇬",
    region: "north",
    publishedAt: "2h ago",
    confidence: "corroborated",
    crossBorder: ["🇱🇾", "🇹🇳"],
    clusterSize: 5,
  },
  {
    id: "agg-n2",
    headline: "Morocco dirham peg widened as tourism receipts offset remittance dip",
    summary: "Bank Al-Maghrib announced a 5% widening of the dirham's exchange-rate band. Tourism revenues hit a record MAD 105bn in 2025 but worker remittances fell 8% — the first annual drop since 2020 — due to cost-of-living pressures in Europe.",
    source: "Morocco World News",
    sourceType: "rss",
    pestel: "economic",
    country: "Morocco",
    countryFlag: "🇲🇦",
    region: "north",
    publishedAt: "4h ago",
    confidence: "corroborated",
    clusterSize: 4,
  },
  {
    id: "agg-n3",
    headline: "Algeria youth unemployment crisis: 26% of under-30s neither in work nor education",
    summary: "A report by the National Statistics Office revealed structural youth unemployment has reached 26.4%, the highest recorded figure. Analysts link rising informal-sector work and migration intentions to stalled diversification from hydrocarbon revenues.",
    source: "Algeria Watch",
    sourceType: "rss",
    pestel: "social",
    country: "Algeria",
    countryFlag: "🇩🇿",
    region: "north",
    publishedAt: "7h ago",
    confidence: "corroborated",
    crossBorder: ["🇲🇦", "🇹🇳"],
    clusterSize: 3,
  },
  {
    id: "agg-n4",
    headline: "Tunisia launches national AI strategy with UAE investment partnership",
    summary: "President Saied signed a framework agreement with Abu Dhabi's G42 to co-fund a national data centre and AI training institute. The deal includes a 500-engineer scholarship programme and a sovereign AI model trained on Arabic-Maghrebi dialect datasets.",
    source: "Field signal — Tunis",
    sourceType: "field",
    pestel: "technological",
    country: "Tunisia",
    countryFlag: "🇹🇳",
    region: "north",
    publishedAt: "10h ago",
    confidence: "corroborated",
    crossBorder: ["🇪🇬", "🇲🇦"],
    clusterSize: 4,
  },
  {
    id: "agg-n5",
    headline: "Libya desertification accelerates: 60% of agricultural land degraded since 2011",
    summary: "A UN Environment Programme assessment found that conflict-era displacement of rural communities combined with aquifer over-extraction has degraded 60% of Libya's historically productive land. The Great Man-Made River system is operating at 38% capacity.",
    source: "Libya Observer",
    sourceType: "rss",
    pestel: "environmental",
    country: "Libya",
    countryFlag: "🇱🇾",
    region: "north",
    publishedAt: "14h ago",
    confidence: "corroborated",
    crossBorder: ["🇹🇩", "🇸🇩"],
    clusterSize: 3,
  },
  {
    id: "agg-n6",
    headline: "Morocco ICC statute ratification signals AU legal reform momentum",
    summary: "Morocco's parliament voted to ratify the Rome Statute, making it the 5th North African state to join the ICC. Legal scholars say the move signals a shift in AU-level discussions on accountability mechanisms for conflict-related crimes, with implications for Sudan and Libya cases.",
    source: "Morocco World News",
    sourceType: "rss",
    pestel: "legal",
    country: "Morocco",
    countryFlag: "🇲🇦",
    region: "north",
    publishedAt: "18h ago",
    confidence: "corroborated",
    crossBorder: ["🇱🇾", "🇸🇩", "🇪🇬"],
    clusterSize: 5,
  },

  // ── West Africa — additional PESTEL coverage ─────────────────────────────────
  {
    id: "agg-w1",
    headline: "Sahel Alliance military pact: Mali, Burkina, Niger formalise joint command",
    summary: "The Alliance of Sahel States signed a unified military command structure in Bamako. Joint operations will target jihadist corridor between Gao and Tillabéri. France and ECOWAS both excluded from the framework; AU observer status requested.",
    source: "Field signal — Bamako",
    sourceType: "field",
    pestel: "political",
    country: "Mali",
    countryFlag: "🇲🇱",
    region: "west",
    publishedAt: "6h ago",
    confidence: "corroborated",
    crossBorder: ["🇧🇫", "🇳🇪"],
    clusterSize: 6,
  },
  {
    id: "agg-w2",
    headline: "Ghana cocoa sector crisis deepens as COCOBOD defaults on pre-finance loans",
    summary: "Ghana's COCOBOD confirmed it will miss repayment on $800M in pre-finance syndicated loans due to a 40% production shortfall. IMF programme review delayed pending a restructuring plan. Farmers report fertiliser shortages and climate-linked yield failures as root causes.",
    source: "Ghana Web",
    sourceType: "rss",
    pestel: "economic",
    country: "Ghana",
    countryFlag: "🇬🇭",
    region: "west",
    publishedAt: "5h ago",
    confidence: "corroborated",
    clusterSize: 5,
  },
  {
    id: "agg-w3",
    headline: "Senegal judicial independence law: president strips Supreme Court of oversight powers",
    summary: "President Faye signed a decree restructuring the judicial oversight framework, removing the Supreme Court's authority to review executive appointments. Bar association and EU mission issued immediate statements citing constitutional concerns.",
    source: "Senenews",
    sourceType: "rss",
    pestel: "legal",
    country: "Senegal",
    countryFlag: "🇸🇳",
    region: "west",
    publishedAt: "8h ago",
    confidence: "corroborated",
    crossBorder: ["🇬🇲", "🇬🇼"],
    clusterSize: 4,
  },

  // ── 𝕏 / Twitter threads ─────────────────────────────────────────────────────
  {
    id: "agg-x1",
    headline: "@CBNigeria governor confirms emergency MPC sitting — Naira defense or managed float?",
    summary: "Thread by @EzeUgochukwu_Eco: 'Breaking: CBN Gov confirms emergency MPC. Market reading this as last-ditch Naira defense. But my read — they're preparing a managed float corridor. Watch the band announcement.' 4.2K likes, 1.8K RTs, ratio suggests market alignment.",
    source: "𝕏 @EzeUgochukwu_Eco",
    sourceType: "x",
    pestel: "economic",
    country: "Nigeria",
    countryFlag: "🇳🇬",
    region: "west",
    publishedAt: "45m ago",
    confidence: "single-source",
    clusterSize: 3,
  },
  {
    id: "agg-x2",
    headline: "Kenya Gen-Z civic network thread: 'We are registering 47 county chapters this week'",
    summary: "@BobbyAllan_KE thread gaining traction: 'The movement is not dead. We filed papers in Mombasa, Kisumu, Nakuru and Eldoret today. This is not a political party. We are a pressure group. #OccupyParliament2 is a myth — we're building institutions.' 6.8K likes.",
    source: "𝕏 @BobbyAllan_KE",
    sourceType: "x",
    pestel: "political",
    country: "Kenya",
    countryFlag: "🇰🇪",
    region: "east",
    publishedAt: "2h ago",
    confidence: "single-source",
    crossBorder: ["🇺🇬", "🇹🇿"],
    clusterSize: 4,
  },
  {
    id: "agg-x3",
    headline: "South Africa Expropriation Act: JSE REITs sector selling off — live market thread",
    summary: "@SAPropertyAnalyst: 'REITs down 4.2% intraday. Growthpoint, Redefine, Hyprop all in red. Markets pricing in constitutional uncertainty before courts rule. DM me for the legal timeline breakdown.' 2.1K RTs, Bloomberg SA desk is watching this thread.",
    source: "𝕏 @SAPropertyAnalyst",
    sourceType: "x",
    pestel: "investor",
    country: "South Africa",
    countryFlag: "🇿🇦",
    region: "south",
    publishedAt: "1h ago",
    confidence: "single-source",
    clusterSize: 6,
  },

  // ── LinkedIn — executives & policy makers ────────────────────────────────────
  {
    id: "agg-li1",
    headline: "Rwanda Finance Minister: 'Kigali IFC mandates signal Africa's capital market maturity'",
    summary: "Hon. Uzziel Ndagijimana (LinkedIn post, 3.4K reactions): 'Three new DFI mandates signed at KIFC this week. This is not charity capital — it is commercial-grade investment seeking African returns. Rwanda's regulatory clarity is the product, not the pitch.'",
    source: "LinkedIn — Min. Ndagijimana",
    sourceType: "linkedin",
    pestel: "investor",
    country: "Rwanda",
    countryFlag: "🇷🇼",
    region: "east",
    publishedAt: "3h ago",
    confidence: "corroborated",
    clusterSize: 4,
  },
  {
    id: "agg-li2",
    headline: "Morocco CFC CEO: 'Casablanca is Africa's gateway — 47 multinationals relocated HQ in 2024'",
    summary: "Lamia Merzouki (CFC CEO, LinkedIn, 5.1K reactions): 'Forty-seven multinational African HQ relocations to Casablanca in 2024 alone. The infrastructure, the talent, and the regulatory framework are in place. The story is no longer a promise — it is a performance record.' Engagement dominated by PE and DFI professionals.",
    source: "LinkedIn — L. Merzouki, CFC",
    sourceType: "linkedin",
    pestel: "investor",
    country: "Morocco",
    countryFlag: "🇲🇦",
    region: "north",
    publishedAt: "5h ago",
    confidence: "corroborated",
    clusterSize: 5,
  },
  {
    id: "agg-li3",
    headline: "Ethiopian investment board director: 'Manufacturing FDI up 22% — open for business'",
    summary: "Abebe Abebe (EIC LinkedIn post): 'Q1 2025 data confirms 22% YoY growth in manufacturing FDI commitments. The industrial parks are running at 78% capacity. We are actively seeking investors in textiles, agro-processing and pharma. Inbox open.' 2.8K reactions, several PE fund comments.",
    source: "LinkedIn — Ethiopian Investment Commission",
    sourceType: "linkedin",
    pestel: "investor",
    country: "Ethiopia",
    countryFlag: "🇪🇹",
    region: "east",
    publishedAt: "8h ago",
    confidence: "corroborated",
    clusterSize: 3,
  },

  // ── Business Chambers ─────────────────────────────────────────────────────────
  {
    id: "agg-ch1",
    headline: "KENFAP: Fertiliser shortage threatening Kenya's next harvest — emergency brief to Cabinet",
    summary: "Kenya National Federation of Agricultural Producers submitted an emergency Cabinet memo warning that fertiliser stock levels cover only 40% of planting season needs. KENFAP cites import duty structures and port delays as root causes. Farmers in Rift Valley beginning dry planting with no inputs.",
    source: "KENFAP (Kenya)",
    sourceType: "chamber",
    pestel: "economic",
    country: "Kenya",
    countryFlag: "🇰🇪",
    region: "east",
    publishedAt: "6h ago",
    confidence: "corroborated",
    crossBorder: ["🇺🇬", "🇹🇿"],
    clusterSize: 4,
  },
  {
    id: "agg-ch2",
    headline: "NACCIMA urges CBN: 'FX restrictions destroying manufacturer confidence'",
    summary: "Nigeria Association of Chambers of Commerce, Industry, Mines and Agriculture issued a position paper citing a survey showing 68% of manufacturers considering relocating production outside Nigeria due to FX allocation unpredictability. Paper formally submitted to CBN governor's office.",
    source: "NACCIMA (Nigeria)",
    sourceType: "chamber",
    pestel: "investor",
    country: "Nigeria",
    countryFlag: "🇳🇬",
    region: "west",
    publishedAt: "4h ago",
    confidence: "corroborated",
    clusterSize: 5,
  },
  {
    id: "agg-ch3",
    headline: "BCCI Botswana: Mining diversification strategy needs policy signal from government",
    summary: "Botswana Confederation of Commerce, Industry and Manpower published its annual policy request paper calling for a formal government timeline on Special Economic Zone legislation, revised mining royalty structures, and a green hydrogen investment framework before Q3 budget.",
    source: "BCCI Botswana",
    sourceType: "chamber",
    pestel: "investor",
    country: "Botswana",
    countryFlag: "🇧🇼",
    region: "south",
    publishedAt: "12h ago",
    confidence: "corroborated",
    clusterSize: 3,
  },

  // ── APEX Bodies ───────────────────────────────────────────────────────────────
  {
    id: "agg-ap1",
    headline: "AU Commission: AfCFTA digital trade protocol enters final ratification round",
    summary: "The African Union Commission announced that the AfCFTA Digital Trade Protocol has secured 38 of the required 44 ratifications. The Commission Secretary-General confirmed a target of full entry into force by Q4 2025. Protocol covers e-commerce, data flows and digital payment systems.",
    source: "AU Commission — AfCFTA Secretariat",
    sourceType: "apex",
    pestel: "economic",
    country: "Pan-Africa",
    countryFlag: "🌍",
    region: "all",
    publishedAt: "10h ago",
    confidence: "corroborated",
    clusterSize: 8,
  },
  {
    id: "agg-ap2",
    headline: "ECOWAS condemns coup in Guinea-Bissau; activates standby force protocols",
    summary: "The Economic Community of West African States Emergency Summit issued a 72-hour ultimatum to the military council in Guinea-Bissau. ECOWAS standby force protocols have been activated. Nigeria and Senegal confirmed troop readiness. AU PSC to convene parallel session within 24 hours.",
    source: "ECOWAS Commission",
    sourceType: "apex",
    pestel: "political",
    country: "Guinea-Bissau",
    countryFlag: "🇬🇼",
    region: "west",
    publishedAt: "2h ago",
    confidence: "corroborated",
    crossBorder: ["🇸🇳", "🇬🇳", "🇬🇲"],
    clusterSize: 7,
  },
  {
    id: "agg-ap3",
    headline: "EAC Secretariat: East African common market passport enters pilot phase in 3 countries",
    summary: "The East African Community Secretariat announced the pilot launch of the common market biometric passport in Kenya, Rwanda and Uganda. Tanzania and Burundi will join in Phase 2. The passport enables visa-free movement and common market employment rights across all EAC member states.",
    source: "EAC Secretariat",
    sourceType: "apex",
    pestel: "social",
    country: "East Africa",
    countryFlag: "🌍",
    region: "east",
    publishedAt: "15h ago",
    confidence: "corroborated",
    crossBorder: ["🇰🇪", "🇷🇼", "🇺🇬"],
    clusterSize: 6,
  },
  {
    id: "agg-ap4",
    headline: "SADC Tribunal: Zimbabwe land reform compensation ruling sets continental precedent",
    summary: "The reconstituted SADC Tribunal issued a landmark ruling requiring Zimbabwe to pay compensation to former commercial farmers, setting a precedent for state-investor disputes across the region. Legal scholars note the ruling reactivates the Tribunal's advisory jurisdiction after 13 years of dormancy.",
    source: "SADC Tribunal",
    sourceType: "apex",
    pestel: "legal",
    country: "Zimbabwe",
    countryFlag: "🇿🇼",
    region: "south",
    publishedAt: "20h ago",
    confidence: "corroborated",
    crossBorder: ["🇿🇦", "🇧🇼", "🇲🇿"],
    clusterSize: 5,
  },

  // ── Central Africa ────────────────────────────────────────────────────────────
  {
    id: "agg-c1",
    headline: "DRC M23 ceasefire collapses; Goma humanitarian corridor blocked",
    summary: "Fighting resumed in eastern DRC after M23 forces rejected a Luanda process extension. The UN Mission (MONUSCO) confirmed all three humanitarian corridors into Goma are currently inaccessible. Rwanda denies fresh supply allegations; AU High-Level Panel convening emergency session.",
    source: "Radio Okapi",
    sourceType: "rss",
    pestel: "political",
    country: "DR Congo",
    countryFlag: "🇨🇩",
    region: "central",
    publishedAt: "1h ago",
    confidence: "corroborated",
    crossBorder: ["🇷🇼", "🇺🇬", "🇧🇮"],
    clusterSize: 8,
  },
  {
    id: "agg-c2",
    headline: "Cameroon Anglophone crisis: UN special envoy visit yields first talks in 18 months",
    summary: "A UN special envoy conducted a four-day shuttle diplomacy mission resulting in an agreement to resume direct dialogue between the government and Ambazonia Governing Council. Separatist factions remain divided on participation; humanitarian access to Northwest region remains restricted.",
    source: "Field signal — Buea",
    sourceType: "field",
    pestel: "social",
    country: "Cameroon",
    countryFlag: "🇨🇲",
    region: "central",
    publishedAt: "11h ago",
    confidence: "single-source",
    clusterSize: 3,
  },
];

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfBadge({ level }: { level: AggItem["confidence"] }) {
  const cfg = {
    "corroborated":  { label: "Corroborated",  cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
    "single-source": { label: "Single-source", cls: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
    "unverified":    { label: "Unverified",    cls: "text-red-400 bg-red-500/10 border-red-500/25" },
  }[level];
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
}

// ── PESTEL pill ───────────────────────────────────────────────────────────────
function PestelPill({ id }: { id: string }) {
  const p = PESTEL.find(x => x.id === id);
  if (!p || p.id === "all") return null;
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
      style={{ color: p.color, borderColor: p.color + "50", background: p.color + "15" }}
    >
      {p.id === "investor" ? "IR" : p.id.toUpperCase().slice(0, 3)}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PoliticalAggregator() {
  const [, navigate] = useLocation();
  const [pestelFilter, setPestelFilter] = useState<PestelId>("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<Set<SourceType>>(new Set());
  const [viewMode, setViewMode] = useState<"feed" | "cluster">("feed");
  const [pushingId, setPushingId] = useState<string | null>(null);

  // Pull live signals from xTrends to augment seed items
  const { data: liveData, isLoading: liveLoading, refetch } = trpc.xTrends.getTrending.useQuery(
    { category: `continental:au:${pestelFilter === "all" ? "political" : pestelFilter}` },
    { refetchInterval: 120_000 }
  );

  // Convert live trends into AggItem shape
  // t.source is an object {username, name, followers…} — extract the name string
  const liveItems: AggItem[] = (liveData?.trends ?? []).slice(0, 4).map((t: any, i: number) => {
    const sourceStr = typeof t.source === "object" && t.source !== null
      ? (t.source.name ?? t.source.username ?? "Live signal")
      : (typeof t.source === "string" ? t.source : "Live signal");
    // Use the best available text: topic headline first, else first tweet text
    const headline = (typeof t.topic === "string" && t.topic.trim())
      ? t.topic.trim()
      : (t.tweets?.[0]?.text?.slice(0, 100) ?? "Live political signal");
    const summary = t.tweets?.[0]?.text
      ? t.tweets[0].text.slice(0, 220)
      : "";
    return {
      id: `live-${i}`,
      headline,
      summary,
      source: sourceStr,
      sourceType: "social" as SourceType,
      pestel: pestelFilter === "all" ? "political" : pestelFilter,
      country: sourceStr,
      countryFlag: "🌍",
      region: "all",
      publishedAt: "live",
      confidence: "single-source" as const,
    };
  });

  // Merge and filter
  const allItems = [...liveItems, ...SEED_ITEMS];
  const filtered = allItems.filter(item => {
    const pestelOk = pestelFilter === "all" || item.pestel === pestelFilter;
    const regionOk = regionFilter === "all" || item.region === regionFilter;
    const sourceOk = sourceFilter.size === 0 || sourceFilter.has(item.sourceType);
    return pestelOk && regionOk && sourceOk;
  });

  // Cluster view: group by clusterSize > 1
  const clustered = viewMode === "cluster"
    ? filtered.filter(i => (i.clusterSize ?? 1) > 2)
    : filtered;

  const handlePushToPipeline = (item: AggItem) => {
    setPushingId(item.id);
    setTimeout(() => {
      setPushingId(null);
      toast.success("Signal pushed to Intelligence Pipeline");
      navigate(`/intelligence?signal=${encodeURIComponent(item.headline)}`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* ── Header ── */}
      <div className="border-b border-slate-800 bg-slate-900/70 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-purple-400" />
          <div>
            <h1 className="text-base font-bold text-white">Political Aggregator</h1>
            <p className="text-[11px] text-slate-500">PESTEL+IR signal intelligence from RSS, social media, chambers, APEX bodies & field contributors across 55 nations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OnboardingTour tourId="aggregator" label="How to use" />
          {liveLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />}
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {/* Feed / Cluster toggle */}
          <div className="flex border border-slate-700 rounded-lg overflow-hidden">
            {(["feed", "cluster"] as const).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setViewMode(v)}
                className={`px-3 py-1 text-[10px] font-bold capitalize transition-all ${viewMode === v ? "bg-purple-500/20 text-purple-300" : "text-slate-500 hover:text-slate-300"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">

        {/* ── Left sidebar — filters ── */}
        <aside id="aggregator-source-filter" className="w-48 flex-shrink-0 border-r border-slate-800 bg-slate-900/40 p-3 space-y-5 overflow-y-auto">

          {/* PESTEL filter */}
          <div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">PESTEL</p>
            <div className="space-y-1">
              {PESTEL.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPestelFilter(p.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-2 ${pestelFilter === p.id ? p.active : p.bg}`}
                  style={{ color: pestelFilter === p.id ? p.color : "#64748b" }}
                >
                  <span className="font-black">{p.label}</span>
                  <span className="opacity-70 text-[10px]">{p.id === "all" ? "All signals" : p.id.charAt(0).toUpperCase() + p.id.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Region filter */}
          <div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Region</p>
            <div className="space-y-1">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegionFilter(r.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${regionFilter === r.id ? "bg-slate-700/60 border-slate-500 text-slate-200" : "border-slate-700/40 text-slate-500 hover:text-slate-300"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Sources</p>
              {sourceFilter.size > 0 && (
                <button type="button" onClick={() => setSourceFilter(new Set())} className="text-[9px] text-purple-400 hover:text-purple-300">all</button>
              )}
            </div>
            <div className="space-y-1">
              {(Object.entries(SOURCE_META) as [SourceType, typeof SOURCE_META[SourceType]][]).map(([key, meta]) => {
                const active = sourceFilter.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const next = new Set(sourceFilter);
                      if (active) next.delete(key); else next.add(key);
                      setSourceFilter(next);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg border text-[10px] flex items-center gap-1.5 transition-all ${active ? "border-purple-500/40 bg-purple-500/10 text-slate-200" : "border-slate-700/40 text-slate-500 hover:text-slate-300"}`}
                  >
                    <span className="text-sm leading-none">{meta.icon}</span>
                    <span className="font-medium">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Main feed ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {viewMode === "cluster" && (
            <div className="flex items-center gap-2 px-1 pb-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <p className="text-[11px] text-slate-400">Cluster view shows stories with 3+ corroborating signals. <button className="text-purple-400 underline" onClick={() => setViewMode("feed")}>Switch to feed</button></p>
            </div>
          )}

          {clustered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-8 h-8 text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">No signals match this filter</p>
              <button className="mt-3 text-xs text-purple-400 underline" onClick={() => { setPestelFilter("all"); setRegionFilter("all"); setSourceFilter(new Set()); }}>Clear filters</button>
            </div>
          )}

          {clustered.map((item, idx) => {
            const src = SOURCE_META[item.sourceType];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all group"
              >
                <div className="px-4 py-3">
                  {/* meta row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-base">{item.countryFlag}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{item.country}</span>
                    <PestelPill id={item.pestel} />
                    <ConfBadge level={item.confidence} />
                    {item.clusterSize && item.clusterSize > 2 && (
                      <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/25 px-1.5 py-0.5 rounded-full">
                        {item.clusterSize} sources
                      </span>
                    )}
                    {item.publishedAt === "live" && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        live
                      </span>
                    )}
                    <span className="text-[10px] text-slate-600 ml-auto">{item.publishedAt}</span>
                  </div>

                  {/* headline */}
                  <p className="text-sm font-semibold text-slate-100 leading-snug mb-1.5 group-hover:text-white transition-colors">
                    {item.headline}
                  </p>

                  {/* summary */}
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{item.summary}</p>

                  {/* cross-border */}
                  {item.crossBorder && item.crossBorder.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Globe className="w-3 h-3 text-slate-600" />
                      <span className="text-[9px] text-slate-600">Cross-border signal:</span>
                      {item.crossBorder.map(flag => (
                        <span key={flag} className="text-sm">{flag}</span>
                      ))}
                    </div>
                  )}

                  {/* action row */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-slate-600">
                      <span>{src.icon}</span>
                      {item.source}
                    </span>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Source
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePushToPipeline(item)}
                        disabled={pushingId === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/20 hover:border-cyan-400/50 disabled:opacity-60 transition-all"
                      >
                        {pushingId === item.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <ArrowUpRight className="w-3 h-3" />
                        }
                        Push to Pipeline
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
