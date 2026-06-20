import React from "react";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Database, AlertCircle, ShieldCheck, ShieldAlert, Shield } from "lucide-react";

const SENT_COLOR = (v: number) => v >= 60 ? "#34d399" : v >= 40 ? "#fbbf24" : "#f87171";

type ConfidenceLevel = "high" | "medium" | "low" | "none";

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, {
  label: string; color: string; bg: string; border: string; Icon: React.ElementType;
}> = {
  high:   { label: "High confidence",   color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-500/30", Icon: ShieldCheck },
  medium: { label: "Medium confidence", color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-500/30",   Icon: Shield },
  low:    { label: "Low confidence",    color: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-500/30",  Icon: ShieldAlert },
  none:   { label: "No signal yet",     color: "text-slate-500",   bg: "bg-white/5",         border: "border-white/10",       Icon: ShieldAlert },
};

function ConfidenceBadge({ level, articleCount, compact = false }: {
  level: ConfidenceLevel; articleCount: number; compact?: boolean;
}) {
  const cfg = CONFIDENCE_CONFIG[level];
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
      cfg.bg, cfg.border
    )}>
      <cfg.Icon className={cn("shrink-0", compact ? "w-3 h-3" : "w-3.5 h-3.5", cfg.color)} />
      <span className={cn("font-semibold", compact ? "text-[9px]" : "text-[10px]", cfg.color)}>
        {cfg.label}{articleCount > 0 && !compact ? ` · ${articleCount} articles` : ""}
      </span>
    </span>
  );
}

// Placeholder history for figures that have no DB records yet
function placeholderHistory() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (7 - i));
    return {
      date: months[d.getMonth()],
      positive: 0,
      negative: 0,
      neutral: 0,
    };
  });
}

export default function Tracker() {
  const { data: figures, isLoading, error, refetch } = trpc.kenya.sentiment.getLatestScores.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  // Default to first figure once loaded
  const figureList = figures ?? [];
  const effectiveId = selectedId ?? figureList[0]?.id ?? null;
  const selected = figureList.find(f => f.id === effectiveId) ?? figureList[0];

  const { data: history } = trpc.kenya.sentiment.getHistory.useQuery(
    { figureId: effectiveId ?? 0, days: 90 },
    { enabled: !!effectiveId }
  );

  const chartData = React.useMemo(() => {
    if (!history || history.length === 0) return placeholderHistory();
    // Group by week, compute average scores
    const byWeek: Record<string, { pos: number[]; neg: number[]; neu: number[] }> = {};
    for (const row of history) {
      const d = new Date(row.recordedAt);
      const key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      if (!byWeek[key]) byWeek[key] = { pos: [], neg: [], neu: [] };
      byWeek[key].pos.push(row.positiveCount);
      byWeek[key].neg.push(row.negativeCount);
      byWeek[key].neu.push(row.neutralCount);
    }
    return Object.entries(byWeek).slice(-12).map(([key, v]) => ({
      date: key,
      positive: Math.round(v.pos.reduce((a, b) => a + b, 0) / v.pos.length),
      negative: Math.round(v.neg.reduce((a, b) => a + b, 0) / v.neg.length),
      neutral: Math.round(v.neu.reduce((a, b) => a + b, 0) / v.neu.length),
    }));
  }, [history]);

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-slate-400 text-sm">Failed to load sentiment data</p>
        <button onClick={() => refetch()} className="text-xs text-cyan-400 underline">Retry</button>
      </div>
    </div>
  );

  const score = selected?.score ?? null;
  const displayScore = score !== null ? Math.round(score) : "—";
  const sentColor = score !== null ? SENT_COLOR(score) : "#64748b";
  const trend = selected?.trend ?? "stable";
  const hasData = selected?.hasData ?? false;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Political Sentiment Tracker
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Live sentiment scores sourced from Kenyan news RSS feeds</p>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Sidebar — figure selector */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1 mb-3">
              {figureList.length} Figures
            </p>
            {figureList.map((fig) => {
              const active = fig.id === effectiveId;
              const sc = fig.score !== null ? SENT_COLOR(fig.score) : "#64748b";
              return (
                <button
                  key={fig.id}
                  onClick={() => setSelectedId(fig.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2",
                    active
                      ? "bg-white/10 border-white/20 shadow-lg"
                      : "bg-card border-border/50 hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {fig.imageUrl ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
                        <img src={fig.imageUrl} alt={fig.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg shrink-0 border border-white/10 bg-white/5 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400">{fig.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{fig.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{fig.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-black" style={{ color: sc }}>
                      {fig.score !== null ? `${Math.round(fig.score)}%` : "—"}
                    </span>
                    <ConfidenceBadge level={fig.confidenceLevel as ConfidenceLevel} articleCount={fig.articleCount} compact />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main area */}
          <div className="lg:col-span-3 space-y-5">

            {/* Selected figure header */}
            {selected && (
              <div className="bg-card border border-border/50 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {selected.imageUrl ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                        <span className="text-lg font-black text-slate-400">{selected.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-black text-slate-100">{selected.name}</h2>
                      <p className="text-sm text-slate-400">{selected.title}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 font-mono">
                        {selected.party}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current Sentiment</div>
                    <div className="text-4xl font-black" style={{ color: sentColor }}>
                      {displayScore}{score !== null ? "%" : ""}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {trend === "up"
                        ? <><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[11px] text-emerald-400">Rising</span></>
                        : trend === "down"
                        ? <><TrendingDown className="w-3.5 h-3.5 text-red-400" /><span className="text-[11px] text-red-400">Falling</span></>
                        : <><Minus className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] text-slate-400">Stable</span></>
                      }
                    </div>
                    <div className="mt-2">
                      <ConfidenceBadge
                        level={(selected.confidenceLevel ?? "none") as ConfidenceLevel}
                        articleCount={selected.articleCount ?? 0}
                      />
                    </div>
                  </div>
                </div>

                {/* Data source badge */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  {hasData ? (
                    <span className="text-[11px] text-emerald-400">
                      Live data · last updated {selected.lastUpdated
                        ? new Date(selected.lastUpdated).toLocaleString()
                        : "recently"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Awaiting first news signal — scores update as articles are ingested
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-bold text-slate-300">Sentiment History</h3>
                {!hasData ? (
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                    No signal data yet
                  </span>
                ) : (selected.scoreDelta ?? 0) > 20 ? (
                  <span className="text-[10px] text-orange-400 bg-orange-400/10 border border-orange-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Conflicted signal · ±{Math.round(selected.scoreDelta ?? 0)}pt swing
                  </span>
                ) : null}
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1525",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: 12,
                        color: "#e2e8f0",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "16px" }} />
                    <Line type="monotone" dataKey="positive" name="Positive" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="negative" name="Negative" stroke="#f87171" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="neutral"  name="Neutral"  stroke="#818cf8" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data coverage note */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-start gap-3">
              <Database className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-1">Data sources</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Scores derived from Nation Africa, The Standard (Headlines, Kenya, Politics, Counties) RSS feeds.
                  Ingestion runs every 4 hours. Sentiment computed via LLM analysis of article text with Kenyan political context.
                  Figures with no recent coverage show "—" until articles are ingested.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
