import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OnboardingTour } from "@/components/OnboardingTour";
import {
  ChevronDown, ChevronUp, ArrowUpRight, TrendingUp, TrendingDown,
  Minus, Search, Bell, SlidersHorizontal,
} from "lucide-react";
import {
  COUNTRIES, composite, scoreColor, VERDICT_LABELS,
  type CountryProfile, type Verdict,
} from "@/lib/scannerData";

// ── helpers ──────────────────────────────────────────────────────────────────

const DIM_LABELS: Record<string, string> = {
  P:"Political", E:"Economic", S:"Social", T:"Technology",
  En:"Environmental", L:"Legal", IR:"Inv. Readiness",
};

function verdictStyle(v: Verdict) {
  const map: Record<Verdict, string> = {
    "strong-buy": "bg-green-500/15 text-green-400 border-green-500/40",
    "buy":        "bg-lime-500/15  text-lime-400  border-lime-500/40",
    "watch":      "bg-amber-500/15 text-amber-400 border-amber-500/40",
    "avoid":      "bg-red-500/15   text-red-400   border-red-500/40",
  };
  return map[v];
}

function Sparkline({ trend, color }: { trend: number[]; color: string }) {
  const min = Math.min(...trend), max = Math.max(...trend);
  const H = 28, W = 56;
  const pts = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * W;
    const y = H - ((v - min) / (max - min + 0.001)) * H;
    return `${x},${y}`;
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-bold" style={{ color }}>{score}</span>
      <div className="w-12 h-[3px] bg-slate-800 rounded-full">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function ChangeChip({ v }: { v: number }) {
  if (v > 0) return <span className="text-xs font-semibold text-green-400">▲ +{v}</span>;
  if (v < 0) return <span className="text-xs font-semibold text-red-400">▼ {v}</span>;
  return <span className="text-xs text-slate-500">—</span>;
}

// ── expanded row detail ───────────────────────────────────────────────────────

function ExpandedDetail({ c, onNavigate }: { c: CountryProfile; onNavigate: () => void }) {
  const comp = composite(c);
  return (
    <tr>
      <td colSpan={9} className="px-6 py-4 bg-[#0a1628] border-b border-[#0f1e35]">
        <div className="grid grid-cols-3 gap-4">
          {/* PESTEL breakdown */}
          <div className="bg-[#050b1a] rounded-lg p-3 border border-[#1a2d4a]">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">PESTEL + IR</p>
            <div className="space-y-1.5">
              {(Object.entries(c.pestelBreak) as [string, number][]).map(([dim, val]) => (
                <div key={dim} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-[72px]">{DIM_LABELS[dim]}</span>
                  <div className="flex-1 h-[3px] bg-slate-800 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${val}%`, background: scoreColor(val) }} />
                  </div>
                  <span className="text-[10px] font-semibold w-6 text-right" style={{ color: scoreColor(val) }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key risks + opportunities */}
          <div className="bg-[#050b1a] rounded-lg p-3 border border-[#1a2d4a]">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Risks</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {c.risks.map((r, i) => (
                <span key={i} className={`text-[9px] px-2 py-0.5 rounded border ${
                  r.impact === "High" || r.likelihood === "High"
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : r.impact === "Medium"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-green-500/10 text-green-400 border-green-500/30"
                }`}>{r.category}: {r.risk}</span>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Opportunities</p>
            <div className="space-y-1">
              {c.opportunities.slice(0, 3).map((o, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ArrowUpRight className="w-3 h-3 text-green-400 flex-shrink-0" />
                  {o}
                </div>
              ))}
            </div>
          </div>

          {/* Trend + actions */}
          <div className="bg-[#050b1a] rounded-lg p-3 border border-[#1a2d4a]">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">9-Month Trend</p>
            <div className="flex items-end gap-1 h-12 mb-3">
              {c.trend.map((v, i) => {
                const min = Math.min(...c.trend), max = Math.max(...c.trend);
                const h = Math.round(8 + ((v - min) / (max - min + 1)) * 36);
                return (
                  <div key={i} className="flex-1 rounded-sm" style={{ height: h, background: scoreColor(v) + "80" }} />
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mb-3">
              Entry signal:{" "}
              <span className="font-semibold" style={{ color: scoreColor(comp) }}>
                {comp >= 70 ? "Strong — score trending up" : comp >= 55 ? "Moderate — monitor before entry" : "Weak — await stabilisation"}
              </span>
            </p>
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="outline" className="text-[10px] h-7 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 w-full" onClick={onNavigate}>
                Open Full Deep Dive →
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-7 border-slate-700 text-slate-400 hover:bg-slate-800 w-full">
                + Add to Watchlist
              </Button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AfricaScanner() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Africa");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"composite" | "pestel" | "irs" | "change">("composite");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const REGIONS = ["All Africa", "East Africa", "West Africa", "Southern Africa", "North Africa", "Central Africa"];

  const filtered = useMemo(() => {
    let list = [...COUNTRIES];
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));
    if (region !== "All Africa") list = list.filter(c => c.region === region);
    list.sort((a, b) => {
      const va = sortKey === "composite" ? composite(a) : sortKey === "pestel" ? a.pestel : sortKey === "irs" ? a.irs : a.change30d;
      const vb = sortKey === "composite" ? composite(b) : sortKey === "pestel" ? b.pestel : sortKey === "irs" ? b.irs : b.change30d;
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return list;
  }, [search, region, sortKey, sortDir]);

  const counts = useMemo(() => ({
    strongBuy: COUNTRIES.filter(c => c.verdict === "strong-buy").length,
    buy:       COUNTRIES.filter(c => c.verdict === "buy").length,
    watch:     COUNTRIES.filter(c => c.verdict === "watch").length,
    avoid:     COUNTRIES.filter(c => c.verdict === "avoid").length,
  }), []);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: typeof sortKey }) {
    if (sortKey !== k) return <Minus className="w-3 h-3 text-slate-600" />;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3 text-cyan-400" /> : <ChevronUp className="w-3 h-3 text-cyan-400" />;
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-slate-200">

      {/* Top bar */}
      <div className="bg-[#0a1628] border-b border-[#1a2d4a] px-6 py-3 flex items-center gap-6">
        <div>
          <span className="text-xs font-bold text-cyan-400 tracking-[2px]">VIRAL BEAT</span>
          <span className="text-xs text-slate-500 tracking-widest ml-2">AFRICA INTELLIGENCE SCANNER</span>
        </div>
        <div className="flex gap-6 ml-auto">
          <div className="text-center"><div className="text-sm font-bold text-cyan-400">55</div><div className="text-[9px] text-slate-500 uppercase tracking-wider">AU Markets</div></div>
          <div className="text-center"><div className="text-sm font-bold text-green-400">{counts.strongBuy + counts.buy}</div><div className="text-[9px] text-slate-500 uppercase tracking-wider">Buy Signal</div></div>
          <div className="text-center"><div className="text-sm font-bold text-amber-400">{counts.watch}</div><div className="text-[9px] text-slate-500 uppercase tracking-wider">Watch</div></div>
          <div className="text-center"><div className="text-sm font-bold text-red-400">{counts.avoid}</div><div className="text-[9px] text-slate-500 uppercase tracking-wider">Avoid</div></div>
          <div id="scanner-tour-btn">
            <OnboardingTour tourId="aggregator" label="Scanner Tour" autoStart={false} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-[#0f1e35] flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">Region:</span>
        {REGIONS.map(r => (
          <button key={r} onClick={() => setRegion(r)}
            className={`px-3 py-1 rounded text-[11px] border transition-colors ${
              region === r ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-400 font-semibold" : "border-[#1a2d4a] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400"
            }`}>
            {r}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute ml-2.5 pointer-events-none" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search country…"
            className="pl-7 h-7 text-xs w-40 bg-[#0a1628] border-[#1a2d4a] text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/60"
          />
          <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#1a2d4a] text-slate-400 gap-1.5 hover:border-cyan-500/40 hover:text-cyan-400">
            <SlidersHorizontal className="w-3 h-3" />Filters
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#1a2d4a] text-slate-400 gap-1.5 hover:border-cyan-500/40 hover:text-cyan-400">
            <Bell className="w-3 h-3" />Alerts
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[9px] text-slate-500 uppercase tracking-wider border-b border-[#0f1e35]">
              <th className="px-6 py-2 text-left w-10">#</th>
              <th className="px-3 py-2 text-left">Country</th>
              <th className="px-3 py-2 text-center cursor-pointer hover:text-slate-300" onClick={() => toggleSort("composite")}>
                <span className="flex items-center justify-center gap-1">Composite <SortIcon k="composite" /></span>
              </th>
              <th className="px-3 py-2 text-center cursor-pointer hover:text-slate-300" onClick={() => toggleSort("pestel")}>
                <span className="flex items-center justify-center gap-1">PESTEL <SortIcon k="pestel" /></span>
              </th>
              <th className="px-3 py-2 text-center cursor-pointer hover:text-slate-300" onClick={() => toggleSort("irs")}>
                <span className="flex items-center justify-center gap-1">IRS (B-READY) <SortIcon k="irs" /></span>
              </th>
              <th className="px-3 py-2 text-center cursor-pointer hover:text-slate-300" onClick={() => toggleSort("change")}>
                <span className="flex items-center justify-center gap-1">30D Δ <SortIcon k="change" /></span>
              </th>
              <th className="px-3 py-2 text-center">Trend</th>
              <th className="px-3 py-2 text-center">Verdict</th>
              <th className="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => {
              const comp = composite(c);
              const color = scoreColor(comp);
              const isOpen = expanded === c.code;
              return (
                <>
                  <tr
                    key={c.code}
                    className={`border-b border-[#0a1525] cursor-pointer transition-colors ${isOpen ? "bg-[#0d1e38] border-l-2 border-l-cyan-500" : "hover:bg-[#0a1628]"}`}
                    onClick={() => setExpanded(isOpen ? null : c.code)}
                  >
                    <td className="px-6 py-3 text-xs text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{c.flag}</span>
                        <div>
                          <div className="font-semibold text-slate-100">{c.name}</div>
                          <div className="text-[10px] text-slate-500">{c.code} · {c.region}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-extrabold" style={{ color }}>{comp}</span>
                        <span className="text-[9px] text-slate-600 uppercase tracking-wider">Index</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><ScoreBar score={c.pestel} /></td>
                    <td className="px-3 py-3"><ScoreBar score={c.irs} /></td>
                    <td className="px-3 py-3 text-center"><ChangeChip v={c.change30d} /></td>
                    <td className="px-3 py-3"><Sparkline trend={c.trend} color={color} /></td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${verdictStyle(c.verdict)}`}>
                        {VERDICT_LABELS[c.verdict]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-[10px] border-[#1a2d4a] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400"
                        onClick={e => { e.stopPropagation(); setLocation(`/scanner/${c.code.toLowerCase()}`); }}
                      >
                        Deep Dive →
                      </Button>
                    </td>
                  </tr>
                  {isOpen && (
                    <ExpandedDetail
                      key={`${c.code}-detail`}
                      c={c}
                      onNavigate={() => setLocation(`/scanner/${c.code.toLowerCase()}`)}
                    />
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            No countries match your filters.
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="px-6 py-3 border-t border-[#0f1e35] text-[10px] text-slate-600">
        Composite = PESTEL × 0.6 + IRS (B-READY) × 0.4 · Scores updated from live signal feed · Verdicts are intelligence signals, not financial advice
      </div>
    </div>
  );
}
