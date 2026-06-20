import React from "react";
import { politicians } from "@/lib/kenya/mock-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const SENT_COLOR = (v: number) => v >= 60 ? "#34d399" : v >= 40 ? "#fbbf24" : "#f87171";

export default function Tracker() {
  const [selectedPolId, setSelectedPolId] = React.useState(politicians[0].id);
  const selectedPol = politicians.find(p => p.id === selectedPolId) || politicians[0];
  const sentColor = SENT_COLOR(selectedPol.currentSentiment);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Political Sentiment Tracker
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Historical sentiment analysis of key political figures</p>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Sidebar — figure selector */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1 mb-3">Select Figure</p>
            {politicians.map((pol) => {
              const active = selectedPolId === pol.id;
              const sc = SENT_COLOR(pol.currentSentiment);
              return (
                <button
                  key={pol.id}
                  onClick={() => setSelectedPolId(pol.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2",
                    active
                      ? "bg-white/10 border-white/20 shadow-lg"
                      : "bg-card border-border/50 hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
                      <img src={pol.image} alt={pol.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{pol.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{pol.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black shrink-0" style={{ color: sc }}>{pol.currentSentiment}%</span>
                </button>
              );
            })}
          </div>

          {/* Main area */}
          <div className="lg:col-span-3 space-y-5">

            {/* Selected politician header */}
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={selectedPol.image} alt={selectedPol.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-100">{selectedPol.name}</h2>
                    <p className="text-sm text-slate-400">{selectedPol.role}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 font-mono">
                      {selectedPol.party}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current Sentiment</div>
                  <div className="text-4xl font-black" style={{ color: sentColor }}>
                    {selectedPol.currentSentiment}%
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {selectedPol.trend === "up"
                      ? <><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[11px] text-emerald-400">Rising</span></>
                      : selectedPol.trend === "down"
                      ? <><TrendingDown className="w-3.5 h-3.5 text-red-400" /><span className="text-[11px] text-red-400">Falling</span></>
                      : <><Minus className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] text-slate-400">Stable</span></>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4">Sentiment History</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedPol.history}>
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
                      domain={[0, 100]}
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
                    <Legend
                      wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "16px" }}
                    />
                    <Line type="monotone" dataKey="positive" name="Positive" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="negative" name="Negative" stroke="#f87171" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="neutral"  name="Neutral"  stroke="#818cf8" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Drivers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-emerald-500/20 rounded-2xl p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-3">Positive Drivers</h4>
                <ul className="space-y-1.5">
                  {["Infrastructure launch", "Youth employment initiative"].map(d => (
                    <li key={d} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card border border-red-500/20 rounded-2xl p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-3">Negative Drivers</h4>
                <ul className="space-y-1.5">
                  {["Tax policy criticism", "Cost of living complaints"].map(d => (
                    <li key={d} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card border border-indigo-500/20 rounded-2xl p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 mb-3">Top Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {["#Economy", "#RutoCare", "#Maandamano"].map(kw => (
                    <span key={kw} className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
