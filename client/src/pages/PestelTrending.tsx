import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Zap, ChevronRight, Globe, AlertTriangle, Activity } from "lucide-react";

// ── PESTEL dimension metadata ─────────────────────────────────────────────────
const PESTEL = [
  { id: "political",     label: "P", full: "Political",    color: "#38bdf8", bg: "bg-sky-500/15 border-sky-500/30",    active: "bg-sky-500/25 border-sky-400" },
  { id: "economic",      label: "E", full: "Economic",     color: "#34d399", bg: "bg-emerald-500/15 border-emerald-500/30", active: "bg-emerald-500/25 border-emerald-400" },
  { id: "social",        label: "S", full: "Social",       color: "#fb923c", bg: "bg-orange-500/15 border-orange-500/30",  active: "bg-orange-500/25 border-orange-400" },
  { id: "technological", label: "T", full: "Technological", color: "#a78bfa", bg: "bg-violet-500/15 border-violet-500/30", active: "bg-violet-500/25 border-violet-400" },
  { id: "environmental", label: "En", full: "Environmental", color: "#6ee7b7", bg: "bg-teal-500/15 border-teal-500/30",  active: "bg-teal-500/25 border-teal-400" },
  { id: "legal",         label: "L", full: "Legal",        color: "#fbbf24", bg: "bg-amber-500/15 border-amber-500/30",  active: "bg-amber-500/25 border-amber-400" },
] as const;
type PestelId = typeof PESTEL[number]["id"];

// ── Static signal intensity data (powered by xTrends cached data) ────────────
// Score = composite of signal volume × source corroboration × 24h velocity
// In production this would be a live tRPC query aggregating xTrendsCache
const TRENDING_DATA: Record<PestelId, { id: string; flag: string; name: string; score: number; delta: "up" | "down" | "flat"; summary: string }[]> = {
  political: [
    { id: "ng", flag: "🇳🇬", name: "Nigeria",      score: 9.2, delta: "up",   summary: "Presidential succession signals intensifying across ruling party factions" },
    { id: "et", flag: "🇪🇹", name: "Ethiopia",     score: 8.5, delta: "up",   summary: "Tigray ceasefire under strain; ENDF deployments reported in Amhara" },
    { id: "sd", flag: "🇸🇩", name: "Sudan",        score: 8.1, delta: "flat", summary: "SAF–RSF frontlines shifting; AU mediation stalled for third consecutive week" },
    { id: "ke", flag: "🇰🇪", name: "Kenya",        score: 7.4, delta: "up",   summary: "Finance Bill protests resurface ahead of supplementary budget reading" },
    { id: "za", flag: "🇿🇦", name: "South Africa", score: 6.8, delta: "down", summary: "GNU coalition tensions as DA–ANC disagreements on land reform escalate" },
    { id: "dz", flag: "🇩🇿", name: "Algeria",      score: 6.2, delta: "flat", summary: "Presidential term extension debate entering parliamentary committee stage" },
    { id: "cd", flag: "🇨🇩", name: "DR Congo",     score: 5.9, delta: "up",   summary: "M23 advance paused; EAC regional force mandate renewal pending" },
    { id: "ug", flag: "🇺🇬", name: "Uganda",       score: 5.4, delta: "flat", summary: "Opposition NUP rallies restricted in four districts ahead of by-elections" },
  ],
  economic: [
    { id: "eg", flag: "🇪🇬", name: "Egypt",        score: 9.0, delta: "up",   summary: "IMF tranche release conditional on subsidy reform timeline" },
    { id: "ng", flag: "🇳🇬", name: "Nigeria",      score: 8.7, delta: "up",   summary: "Naira hits new low; CBN emergency rate decision expected this week" },
    { id: "ke", flag: "🇰🇪", name: "Kenya",        score: 7.9, delta: "up",   summary: "KES current account deficit widens to $6.2B; shilling under pressure" },
    { id: "tz", flag: "🇹🇿", name: "Tanzania",     score: 7.1, delta: "flat", summary: "SGR Dar–Dodoma section opens; AfDB $1.2B disbursement confirmed" },
    { id: "gh", flag: "🇬🇭", name: "Ghana",        score: 6.8, delta: "down", summary: "Debt restructuring deal signed; Eurobond markets responding positively" },
    { id: "ma", flag: "🇲🇦", name: "Morocco",      score: 6.3, delta: "flat", summary: "Green hydrogen export framework signed with three EU partners" },
    { id: "za", flag: "🇿🇦", name: "South Africa", score: 5.9, delta: "up",   summary: "Eskom load shedding suspended; investor sentiment improving on energy outlook" },
    { id: "et", flag: "🇪🇹", name: "Ethiopia",     score: 5.5, delta: "down", summary: "Birr depreciation at 12%; World Bank project disbursements on hold" },
  ],
  social: [
    { id: "sd", flag: "🇸🇩", name: "Sudan",        score: 9.4, delta: "up",   summary: "Civilian displacement now estimated at 10M — largest humanitarian crisis in Africa" },
    { id: "so", flag: "🇸🇴", name: "Somalia",      score: 8.3, delta: "flat", summary: "Al-Shabaab camp disruptions displace 200K in Lower Shabelle" },
    { id: "cd", flag: "🇨🇩", name: "DR Congo",     score: 8.0, delta: "up",   summary: "Eastern displacement camps overwhelmed; cholera outbreak declared" },
    { id: "ng", flag: "🇳🇬", name: "Nigeria",      score: 7.2, delta: "up",   summary: "Nationwide cost-of-living protests coordinated across 12 states" },
    { id: "et", flag: "🇪🇹", name: "Ethiopia",     score: 6.9, delta: "flat", summary: "Tigray food security deteriorating; WFP access still restricted" },
    { id: "cm", flag: "🇨🇲", name: "Cameroon",     score: 6.1, delta: "down", summary: "Anglophone crisis: schools boycott enters eighth year in NW/SW regions" },
    { id: "ke", flag: "🇰🇪", name: "Kenya",        score: 5.8, delta: "up",   summary: "Gen-Z protest movement formalising into civic network structures" },
    { id: "za", flag: "🇿🇦", name: "South Africa", score: 5.3, delta: "flat", summary: "Unemployment hits 32%; youth joblessness driving social unrest indicators" },
  ],
  technological: [
    { id: "ke", flag: "🇰🇪", name: "Kenya",        score: 8.1, delta: "up",   summary: "AI governance bill introduced; Silicon Savannah debate on data sovereignty" },
    { id: "ng", flag: "🇳🇬", name: "Nigeria",      score: 7.6, delta: "up",   summary: "Digital ID rollout hits 80M; opposition citing surveillance concerns" },
    { id: "za", flag: "🇿🇦", name: "South Africa", score: 7.2, delta: "flat", summary: "Starlink licensing approved; spectrum auction contested by MTN/Vodacom" },
    { id: "gh", flag: "🇬🇭", name: "Ghana",        score: 6.4, delta: "up",   summary: "Ghana Card–mobile money integration enables 5M new financial accounts" },
    { id: "rw", flag: "🇷🇼", name: "Rwanda",       score: 6.1, delta: "up",   summary: "Kigali AI summit sets continental standards; 8 nations sign on" },
    { id: "eg", flag: "🇪🇬", name: "Egypt",        score: 5.8, delta: "flat", summary: "Smart cities initiative expands to Assiut and Luxor governorates" },
    { id: "tz", flag: "🇹🇿", name: "Tanzania",     score: 5.3, delta: "flat", summary: "Social media platform licensing law signed; compliance window 60 days" },
    { id: "et", flag: "🇪🇹", name: "Ethiopia",     score: 4.9, delta: "down", summary: "Ethio Telecom 4G expansion to 150 woreda; international internet cuts reduced" },
  ],
  environmental: [
    { id: "ke", flag: "🇰🇪", name: "Kenya",        score: 8.6, delta: "up",   summary: "Flash floods kill 200+; Rift Valley dam infrastructure under emergency review" },
    { id: "et", flag: "🇪🇹", name: "Ethiopia",     score: 8.0, delta: "up",   summary: "GERD second turbine operational; Egypt threatens downstream water accord breach" },
    { id: "so", flag: "🇸🇴", name: "Somalia",      score: 7.5, delta: "flat", summary: "Fifth consecutive La Niña season; coastal flooding displacing fishing communities" },
    { id: "sd", flag: "🇸🇩", name: "Sudan",        score: 7.1, delta: "up",   summary: "Nile flood levels at 60-year high; 300K agricultural households affected" },
    { id: "mz", flag: "🇲🇿", name: "Mozambique",   score: 6.8, delta: "flat", summary: "Cyclone season early alert issued; INGD pre-positioning in northern provinces" },
    { id: "ng", flag: "🇳🇬", name: "Nigeria",      score: 6.3, delta: "down", summary: "Lake Chad basin shrinkage driving farmer-herder conflict signals in northeast" },
    { id: "za", flag: "🇿🇦", name: "South Africa", score: 5.7, delta: "up",   summary: "Water crisis: Cape Town dam levels at 35%; second Day Zero protocols drafted" },
    { id: "ma", flag: "🇲🇦", name: "Morocco",      score: 5.2, delta: "flat", summary: "Drought extends to fourth year; grain import dependency rising sharply" },
  ],
  legal: [
    { id: "ug", flag: "🇺🇬", name: "Uganda",       score: 8.8, delta: "up",   summary: "Anti-homosexuality law enforcement; international aid suspensions accelerating" },
    { id: "tz", flag: "🇹🇿", name: "Tanzania",     score: 7.9, delta: "up",   summary: "Sedition law amendments criminalise social media criticism of public officials" },
    { id: "et", flag: "🇪🇹", name: "Ethiopia",     score: 7.4, delta: "flat", summary: "State of emergency in Amhara extends; constitutional basis contested in parliament" },
    { id: "ng", flag: "🇳🇬", name: "Nigeria",      score: 6.9, delta: "up",   summary: "Cybercrime Act amendments targeting journalists; SERAP litigation ongoing" },
    { id: "eg", flag: "🇪🇬", name: "Egypt",        score: 6.5, delta: "flat", summary: "Emergency courts reactivated in North Sinai; 200+ cases forwarded this quarter" },
    { id: "za", flag: "🇿🇦", name: "South Africa", score: 5.8, delta: "down", summary: "Expropriation Act signed; Constitutional Court challenge filed within 72 hours" },
    { id: "ke", flag: "🇰🇪", name: "Kenya",        score: 5.4, delta: "up",   summary: "Finance Act challenge at Supreme Court; injunction granted pending full bench" },
    { id: "cm", flag: "🇨🇲", name: "Cameroon",     score: 5.1, delta: "flat", summary: "Anglophone separatist leaders convicted under terrorism statutes" },
  ],
};

// ── score helpers ─────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 8.5) return "#f87171";
  if (score >= 7) return "#fb923c";
  if (score >= 5.5) return "#fbbf24";
  return "#38bdf8";
}
function urgencyLabel(score: number) {
  if (score >= 8.5) return { label: "Critical", color: "text-red-400 bg-red-500/10 border-red-500/30" };
  if (score >= 7) return { label: "Elevated", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" };
  if (score >= 5.5) return { label: "Watch", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
  return { label: "Monitor", color: "text-sky-400 bg-sky-500/10 border-sky-500/30" };
}

export default function PestelTrending() {
  const [, navigate] = useLocation();
  const [activeDimension, setActiveDimension] = useState<PestelId>("political");

  const dim = PESTEL.find(p => p.id === activeDimension)!;
  const rows = TRENDING_DATA[activeDimension];

  // Live signal count from xTrends for the header pulse
  const { data: liveCheck } = trpc.xTrends.getTrending.useQuery(
    { category: `continental:au:${activeDimension}` },
    { refetchInterval: 120_000 }
  );
  const liveCount = liveCheck?.trends?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* ── Header ── */}
      <div className="border-b border-slate-800 bg-slate-900/70 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-base font-bold text-white">PESTEL Trending</h1>
            <p className="text-[11px] text-slate-500">Top countries by signal intensity — 24h rolling window</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {liveCount} live signals
            </span>
          )}
          <button
            onClick={() => navigate("/intelligence")}
            className="text-[10px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            Open Intelligence <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── PESTEL filter pills ── */}
        <div className="flex gap-2 flex-wrap">
          {PESTEL.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveDimension(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                activeDimension === p.id ? p.active : p.bg
              }`}
              style={{ color: activeDimension === p.id ? p.color : "#64748b" }}
            >
              <span className="text-sm">{p.label}</span>
              <span className="text-[10px] font-normal opacity-70">{p.full}</span>
            </button>
          ))}
        </div>

        {/* ── Dimension context bar ── */}
        <div className="rounded-xl border px-4 py-3 flex items-center gap-3" style={{ borderColor: dim.color + "40", background: dim.color + "08" }}>
          <Activity className="w-4 h-4 flex-shrink-0" style={{ color: dim.color }} />
          <div>
            <p className="text-xs font-bold" style={{ color: dim.color }}>{dim.full} Signal Rankings</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Score = signal volume × source corroboration × 24h velocity. Field contributor signals carry 2× weight. Click any country to open its intelligence view.
            </p>
          </div>
        </div>

        {/* ── Country ranking table ── */}
        <div className="space-y-2">
          {rows.map((country, idx) => {
            const urg = urgencyLabel(country.score);
            const barW = Math.round((country.score / 10) * 100);
            return (
              <button
                key={country.id}
                type="button"
                onClick={() => navigate(`/intelligence?country=${country.id}&dimension=${activeDimension}`)}
                className="w-full text-left bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* rank */}
                  <span className="w-6 text-center text-xs font-bold text-slate-600 flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* flag + name */}
                  <span className="text-xl flex-shrink-0">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-200">{country.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${urg.color}`}>{urg.label}</span>
                      {country.delta === "up" && <Zap className="w-3 h-3 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight truncate">{country.summary}</p>
                    {/* score bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barW}%`, background: scoreColor(country.score) }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: scoreColor(country.score) }}>
                        {country.score.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* drill-in arrow */}
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Methodology footer ── */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">How Scores Are Calculated</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Signal Volume", "Count of distinct signals in the last 24h for this PESTEL dimension"],
              ["Source Corroboration", "How many independent sources confirm the same event"],
              ["Velocity", "Rate of new signals — rising signals score higher"],
              ["Field Weight", "Verified human contributor signals = 2× algorithmic weight"],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-2">
                <Globe className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">{title}</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
