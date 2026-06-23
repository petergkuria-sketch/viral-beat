import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, ChevronRight, Globe, ExternalLink, Layers, Filter, AlertCircle, RefreshCw, ArrowUpRight } from "lucide-react";
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
type SourceType = "rss" | "field" | "social" | "parliament" | "research";
const SOURCE_META: Record<SourceType, { label: string; color: string; icon: string }> = {
  rss:        { label: "News",       color: "#38bdf8", icon: "📰" },
  field:      { label: "Field",      color: "#34d399", icon: "🏴" },
  social:     { label: "Social",     color: "#a78bfa", icon: "📡" },
  parliament: { label: "Parliament", color: "#fbbf24", icon: "🏛️" },
  research:   { label: "Research",   color: "#fb923c", icon: "📄" },
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
    region: "east",
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
      {p.id.toUpperCase().slice(0, 3)}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PoliticalAggregator() {
  const [, navigate] = useLocation();
  const [pestelFilter, setPestelFilter] = useState<PestelId>("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"feed" | "cluster">("feed");
  const [pushingId, setPushingId] = useState<string | null>(null);

  // Pull live signals from xTrends to augment seed items
  const { data: liveData, isLoading: liveLoading, refetch } = trpc.xTrends.getTrending.useQuery(
    { category: `continental:au:${pestelFilter === "all" ? "political" : pestelFilter}` },
    { refetchInterval: 120_000 }
  );

  // Convert live trends into AggItem shape
  const liveItems: AggItem[] = (liveData?.trends ?? []).slice(0, 4).map((t: any, i: number) => ({
    id: `live-${i}`,
    headline: t.topic ?? t.text?.slice(0, 90) ?? "Live signal",
    summary: t.summary ?? t.text ?? "",
    source: t.source ?? "Live signal",
    sourceType: "social" as SourceType,
    pestel: pestelFilter === "all" ? "political" : pestelFilter,
    country: "Africa",
    countryFlag: "🌍",
    region: "all",
    publishedAt: "live",
    confidence: "single-source" as const,
  }));

  // Merge and filter
  const allItems = [...liveItems, ...SEED_ITEMS];
  const filtered = allItems.filter(item => {
    const pestelOk = pestelFilter === "all" || item.pestel === pestelFilter;
    const regionOk = regionFilter === "all" || item.region === regionFilter;
    return pestelOk && regionOk;
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
            <p className="text-[11px] text-slate-500">PESTEL-classified political content across all 55 African nations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        <aside className="w-48 flex-shrink-0 border-r border-slate-800 bg-slate-900/40 p-3 space-y-5 overflow-y-auto">

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

          {/* Source legend */}
          <div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Sources</p>
            <div className="space-y-1.5">
              {Object.entries(SOURCE_META).map(([key, meta]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="text-sm">{meta.icon}</span>
                  <span className="text-[10px] text-slate-500">{meta.label}</span>
                </div>
              ))}
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
              <button className="mt-3 text-xs text-purple-400 underline" onClick={() => { setPestelFilter("all"); setRegionFilter("all"); }}>Clear filters</button>
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
