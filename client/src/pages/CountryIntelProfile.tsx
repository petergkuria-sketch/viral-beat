import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Bell, Download, GitCompare, Lock,
  TrendingUp, TrendingDown, ArrowUpRight, ChevronRight,
} from "lucide-react";
import {
  COUNTRIES, composite, scoreColor, VERDICT_LABELS,
  type CountryProfile, type Verdict,
} from "@/lib/scannerData";

// ── helpers ──────────────────────────────────────────────────────────────────

const DIM_LABELS: Record<string, string> = {
  P:"Political", E:"Economic", S:"Social", T:"Technology",
  En:"Environmental", L:"Legal", IR:"Investment Readiness",
};

const DIM_COLORS: Record<string, string> = {
  P:"#3b82f6", E:"#22c55e", S:"#84cc16", T:"#a855f7", En:"#06b6d4", L:"#f59e0b", IR:"#00d4ff",
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

function GaugeCircle({ score, color }: { score: number; color: string }) {
  const r = 52, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  const gap = circ - dash;
  return (
    <svg width="140" height="120" viewBox="0 0 140 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a2d4a" strokeWidth="10"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        strokeDashoffset={circ * 0.375} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${gap + circ * 0.25}`}
        strokeDashoffset={circ * 0.375} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="800" fill={color}>{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="#64748b">COMPOSITE</text>
    </svg>
  );
}

const DIM_SIGNAL_MAP: Partial<Record<string, string>> = {
  P:"bg-blue-500/20 text-blue-400",
  E:"bg-green-500/20 text-green-400",
  S:"bg-lime-500/20 text-lime-400",
  T:"bg-purple-500/20 text-purple-400",
  En:"bg-cyan-500/20 text-cyan-400",
  L:"bg-amber-500/20 text-amber-400",
  IR:"bg-[#00d4ff]/20 text-[#00d4ff]",
};

// ── sub-views ─────────────────────────────────────────────────────────────────

function OverviewTab({ c }: { c: CountryProfile }) {
  const [activeDim, setActiveDim] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-2 gap-3">
      {(Object.entries(c.pestelBreak) as [string, number][]).map(([dim, val]) => {
        const color = DIM_COLORS[dim] ?? "#64748b";
        const isActive = activeDim === dim;
        return (
          <div
            key={dim} onClick={() => setActiveDim(isActive ? null : dim)}
            className={`bg-[#0a1628] rounded-lg p-3 border cursor-pointer transition-all ${isActive ? "border-cyan-500/50 bg-cyan-500/5" : "border-[#1a2d4a] hover:border-[#2a3d5a]"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-400">{dim} · {DIM_LABELS[dim]}</span>
              <span className="text-lg font-extrabold" style={{ color }}>{val}</span>
            </div>
            <div className="h-[3px] bg-slate-800 rounded-full mb-2">
              <div className="h-full rounded-full" style={{ width: `${val}%`, background: color }} />
            </div>
            <p className={`text-[10px] text-slate-500 leading-relaxed transition-all overflow-hidden ${isActive ? "max-h-40" : "max-h-8"}`}>
              {c.pestelSnippets[dim as keyof typeof c.pestelSnippets]}
            </p>
            {!isActive && <p className="text-[10px] text-cyan-500/70 mt-0.5">Click to expand →</p>}
          </div>
        );
      })}
    </div>
  );
}

function SignalsTab({ c }: { c: CountryProfile }) {
  return (
    <div className="space-y-0">
      {c.signals.map((s, i) => (
        <div key={i} className="border-b border-[#0a1525] py-3 last:border-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${DIM_SIGNAL_MAP[s.dim] ?? "bg-slate-700 text-slate-400"}`}>{s.dim}</span>
            <span className="text-[10px] text-slate-500">{s.source}</span>
            <span className="ml-auto text-[10px] text-slate-600">{s.time}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{s.text}</p>
          <p className={`text-[10px] mt-1 font-medium ${s.impact === "pos" ? "text-green-400" : s.impact === "neg" ? "text-red-400" : "text-slate-500"}`}>
            {s.impactText}
          </p>
        </div>
      ))}
      {c.signals.length === 0 && (
        <p className="text-slate-500 text-xs py-4">No recent signals.</p>
      )}
    </div>
  );
}

function SectorsTab({ c, onBrief }: { c: CountryProfile; onBrief: (sector: string) => void }) {
  return (
    <div className="space-y-0">
      {c.sectors.map((s, i) => {
        const color = scoreColor(s.score);
        return (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#0a1525] last:border-0">
            <span className="flex-1 text-sm text-slate-300">{s.name}</span>
            <div className="w-20 h-[3px] bg-slate-800 rounded-full">
              <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: color }} />
            </div>
            <span className="text-sm font-bold w-7 text-right" style={{ color }}>{s.score}</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase ${
              s.verdict === "enter" ? "bg-green-500/10 text-green-400 border-green-500/30"
              : s.verdict === "watch" ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}>{s.verdict}</span>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-slate-500 hover:text-cyan-400 px-2"
              onClick={() => onBrief(s.name)}>
              Plan <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function RisksTab({ c }: { c: CountryProfile }) {
  return (
    <div className="space-y-3">
      {c.risks.map((r, i) => {
        const isCritical = (r.impact as string) === "Critical";
        const impactColor = r.impact === "High" || isCritical ? "#ef4444" : r.impact === "Medium" ? "#f59e0b" : "#22c55e";
        return (
          <div key={i} className="bg-[#0a1628] rounded-lg p-4 border border-[#1a2d4a]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase" style={{ background: impactColor + "20", color: impactColor, border: `1px solid ${impactColor}40` }}>
                {r.category}
              </span>
              <span className="font-semibold text-sm text-slate-200">{r.risk}</span>
            </div>
            <div className="flex gap-4 mb-2">
              <span className="text-[10px] text-slate-500">Likelihood: <strong className="text-slate-400">{r.likelihood}</strong></span>
              <span className="text-[10px] text-slate-500">Impact: <strong style={{ color: impactColor }}>{r.impact}</strong></span>
            </div>
            <div className="text-[11px] text-slate-500">
              Mitigation: <span className="text-slate-300">{r.mitigation}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ForecastTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Lock className="w-10 h-10 text-slate-600 mb-3" />
      <p className="font-semibold text-slate-300 mb-1">12-Month Forecast — Analyst Plan Required</p>
      <p className="text-xs text-slate-500 mb-4 max-w-xs">
        Access 12-month composite score trajectory, election risk windows, and sector timing recommendations.
      </p>
      <Button size="sm" className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30">
        Upgrade to Analyst →
      </Button>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function CountryIntelProfile() {
  const [, setLocation] = useLocation();
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase() ?? "";

  const c = COUNTRIES.find(x => x.code === code) ?? COUNTRIES[1];
  const comp = composite(c);
  const color = scoreColor(comp);

  function handleBrief(sector = "") {
    const qs = sector ? `?sector=${encodeURIComponent(sector)}` : "";
    setLocation(`/scanner/${c.code.toLowerCase()}/brief${qs}`);
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-slate-200">

      {/* Nav */}
      <div className="bg-[#0a1628] border-b border-[#1a2d4a] px-6 py-2.5 flex items-center gap-3">
        <button onClick={() => setLocation("/scanner")} className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-cyan-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Scanner
        </button>
        <span className="text-[#1a2d4a]">/</span>
        <span className="text-[11px] text-cyan-400 font-semibold">{c.flag} {c.name} — {c.code} — {c.region}</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#1a2d4a] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 gap-1.5">
            <Bell className="w-3 h-3" />+ Watchlist
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#1a2d4a] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 gap-1.5"
            onClick={() => setLocation(`/scanner`)}>
            <GitCompare className="w-3 h-3" />Compare
          </Button>
          <Button size="sm" className="h-7 text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 gap-1.5"
            onClick={() => handleBrief()}>
            <Download className="w-3 h-3" />Export Brief
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 py-4 border-b border-[#0f1e35] flex items-center gap-4 flex-wrap">
        <div className="text-5xl leading-none">{c.flag}</div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">{c.name}</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {c.region} · Pop. {c.population} · Capital: {c.capital} · Currency: {c.currency}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            GDP {c.gdp} · FDI Inflow {c.fdi} (2023) · AfCFTA signatory
          </p>
        </div>
        <div className="flex items-center gap-6 ml-auto flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-extrabold" style={{ color: scoreColor(c.pestel) }}>{c.pestel}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">PESTEL Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold" style={{ color: scoreColor(c.irs) }}>{c.irs}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">IRS (B-READY)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold" style={{ color }}>{comp}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Composite</div>
          </div>
          <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${
            c.verdict === "strong-buy" ? "bg-green-500/15 border-green-500/40"
            : c.verdict === "buy" ? "bg-lime-500/15 border-lime-500/40"
            : c.verdict === "watch" ? "bg-amber-500/15 border-amber-500/40"
            : "bg-red-500/15 border-red-500/40"
          }`}>
            <span className="text-xl font-extrabold uppercase" style={{ color }}>
              {VERDICT_LABELS[c.verdict]}
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5">
              Updated 2h ago · {c.change30d >= 0 ? `▲ +${c.change30d}` : `▼ ${c.change30d}`} (30d)
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{ minHeight: "calc(100vh - 200px)" }}>

        {/* Main content */}
        <div className="flex-1 border-r border-[#0f1e35] overflow-hidden">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="w-full rounded-none border-b border-[#0f1e35] bg-[#0a1628] h-auto p-0 justify-start">
              {["overview","signals","sectors","risks","forecast"].map(t => (
                <TabsTrigger key={t} value={t}
                  className="rounded-none px-5 py-2.5 text-xs capitalize border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent text-slate-500 hover:text-slate-300">
                  {t === "signals" ? `Live Signals (${c.signals.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
              <TabsContent value="overview"><OverviewTab c={c} /></TabsContent>
              <TabsContent value="signals"><SignalsTab c={c} /></TabsContent>
              <TabsContent value="sectors"><SectorsTab c={c} onBrief={handleBrief} /></TabsContent>
              <TabsContent value="risks"><RisksTab c={c} /></TabsContent>
              <TabsContent value="forecast"><ForecastTab /></TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>

          {/* Gauge */}
          <div className="bg-[#0a1628] rounded-lg border border-[#1a2d4a] p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Entry Readiness</p>
            <div className="flex justify-center">
              <GaugeCircle score={comp} color={color} />
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${verdictStyle(c.verdict)}`}>
              {VERDICT_LABELS[c.verdict]}
            </span>
            <p className="text-[10px] text-slate-500 mt-2">{c.macroSummary.substring(0, 120)}…</p>
          </div>

          {/* Timeline */}
          <div className="bg-[#0a1628] rounded-lg border border-[#1a2d4a] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Key Upcoming Events</p>
            <div className="space-y-3">
              {c.timeline.map((e, i) => {
                const dotColor = e.type === "positive" ? "#22c55e" : e.type === "warning" ? "#f59e0b" : e.type === "critical" ? "#ef4444" : "#64748b";
                return (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: dotColor }} />
                    <div>
                      <div className="text-[9px] text-slate-600">{e.date}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{e.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prospector actions */}
          <div className="bg-[#0a1628] rounded-lg border border-[#1a2d4a] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Prospector Actions</p>
            <div className="space-y-2">
              <Button className="w-full h-8 text-xs bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 justify-start"
                onClick={() => handleBrief(c.sectors[0]?.name)}>
                <ArrowUpRight className="w-3.5 h-3.5 mr-2" />
                {c.sectors[0]?.name ?? "Top Sector"} Entry Plan
              </Button>
              <Button className="w-full h-8 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 justify-start"
                onClick={() => handleBrief()}>
                <Download className="w-3.5 h-3.5 mr-2" />
                Export Investor Brief (PDF)
              </Button>
              <Button className="w-full h-8 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 justify-start"
                onClick={() => setLocation("/scanner")}>
                <GitCompare className="w-3.5 h-3.5 mr-2" />
                Peer Comparison
              </Button>
              <Button variant="outline" className="w-full h-8 text-xs border-[#1a2d4a] text-slate-400 hover:bg-slate-800 justify-start">
                <Bell className="w-3.5 h-3.5 mr-2" />
                Set Score Alert
              </Button>
            </div>
          </div>

          {/* Trend bars */}
          <div className="bg-[#0a1628] rounded-lg border border-[#1a2d4a] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">9-Month Trend</p>
            <div className="flex items-end gap-1 h-14">
              {c.trend.map((v, i) => {
                const min = Math.min(...c.trend), max = Math.max(...c.trend);
                const h = Math.round(8 + ((v - min) / (max - min + 1)) * 48);
                return (
                  <div key={i} title={String(v)} className="flex-1 rounded-sm relative group"
                    style={{ height: h, background: scoreColor(v) + "70" }}>
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-slate-600 opacity-0 group-hover:opacity-100">{v}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {c.change30d >= 0
                ? <span className="text-green-400">▲ Improving — +{c.change30d} pts in 30 days</span>
                : <span className="text-red-400">▼ Declining — {c.change30d} pts in 30 days</span>
              }
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
