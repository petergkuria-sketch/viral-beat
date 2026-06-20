import { useState } from "react";
import { motion } from "framer-motion";
import { recentAlerts, politicians } from "@/lib/kenya/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  Shield,
  Radio,
  MapPin,
  Users,
  TrendingUp,
  Activity,
  Flame,
  Eye,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// Circular sentiment ring using SVG
function SentimentRing({ score, size = 64 }: { score: number; color?: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 60 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - fill }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

const REGIONS = [
  { name: "Nairobi", score: 55, pop: "4.4M" },
  { name: "Mombasa", score: 48, pop: "1.2M" },
  { name: "Kisumu", score: 32, pop: "0.6M" },
  { name: "Eldoret", score: 61, pop: "0.5M" },
  { name: "Nakuru", score: 44, pop: "0.6M" },
  { name: "Thika", score: 52, pop: "0.3M" },
];

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", dot: "bg-red-500" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", dot: "bg-orange-500" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", dot: "bg-yellow-500" },
  low: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", dot: "bg-blue-500" },
};

export default function KenyaDashboard() {
  const [, setLocation] = useLocation();
  const criticalCount = recentAlerts.filter((a) => a.severity === "critical").length;
  const overallMood = Math.round(REGIONS.reduce((s, r) => s + r.score, 0) / REGIONS.length);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── HEADER BAND ── */}
      <div className="relative bg-gradient-to-r from-card/80 via-card/60 to-background border-b border-border/50 px-4 sm:px-6 py-5 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black">Kenya Intelligence</h1>
              <p className="text-xs text-slate-400">Mission Control · Real-time political sentiment</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
              <Radio className="w-3 h-3 animate-pulse" /> Live Feed Active
            </div>
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold animate-pulse">
                <AlertTriangle className="w-3 h-3" /> {criticalCount} Critical Alert{criticalCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "National Mood", value: `${overallMood}%`, icon: Activity, color: overallMood >= 50 ? "#34d399" : "#f87171", sub: "Positive sentiment", bg: "from-emerald-500/10 to-emerald-500/5" },
            { label: "Politicians Tracked", value: politicians.length, icon: Users, color: "#22d3ee", sub: "Active profiles", bg: "from-cyan-500/10 to-cyan-500/5" },
            { label: "Active Alerts", value: recentAlerts.length, icon: AlertTriangle, color: "#fb923c", sub: `${criticalCount} critical`, bg: "from-orange-500/10 to-orange-500/5" },
            { label: "Regions Monitored", value: REGIONS.length, icon: MapPin, color: "#a78bfa", sub: "County coverage", bg: "from-purple-500/10 to-purple-500/5" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className={`bg-gradient-to-br ${kpi.bg} border border-border/50 rounded-2xl p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                </div>
                <div className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{kpi.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── POLITICIANS GRID ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-base">Political Sentiment Tracker</h2>
            <Button variant="ghost" size="sm" className="text-xs text-slate-400" onClick={() => setLocation("/kenya/tracker")}>
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {politicians.map((pol, i) => {
              const sentColor = pol.currentSentiment >= 60 ? "#34d399" : pol.currentSentiment >= 40 ? "#fbbf24" : "#f87171";
              return (
                <motion.div
                  key={pol.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="group relative bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden"
                  onClick={() => setLocation("/kenya/tracker")}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: sentColor }} />

                  {/* Avatar + ring */}
                  <div className="relative w-16 h-16 mx-auto mb-3">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <SentimentRing score={pol.currentSentiment} size={64} />
                    </div>
                    <div className="absolute inset-[6px] rounded-full overflow-hidden bg-muted border border-border/50">
                      <img src={pol.image} alt={pol.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="font-bold text-sm leading-tight text-slate-100 group-hover:text-primary transition-colors">{pol.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 mb-3">{pol.role}</p>

                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xl font-black" style={{ color: sentColor }}>{pol.currentSentiment}%</span>
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center",
                        pol.trend === "up" ? "bg-green-500/20" : pol.trend === "down" ? "bg-red-500/20" : "bg-gray-500/20"
                      )}>
                        {pol.trend === "up" ? <ArrowUpRight className="w-3 h-3 text-green-400" /> :
                         pol.trend === "down" ? <ArrowDownRight className="w-3 h-3 text-red-400" /> :
                         <Minus className="w-3 h-3 text-gray-400" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">sentiment</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── REGIONAL HEATMAP + ALERTS ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Regional Heatmap */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
            <div className="bg-card border border-border/50 rounded-2xl p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm">Regional Sentiment</h3>
              </div>
              <div className="space-y-3">
                {REGIONS.map((region, i) => {
                  const color = region.score >= 55 ? "#34d399" : region.score >= 45 ? "#fbbf24" : "#f87171";
                  return (
                    <motion.div key={region.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-semibold text-slate-200">{region.name}</span>
                          <span className="text-[10px] text-slate-400">{region.pop}</span>
                        </div>
                        <span className="text-xs font-black" style={{ color }}>{region.score}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${region.score}%` }}
                          transition={{ duration: 1, delay: 0.4 + i * 0.07, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* National mood big number */}
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">National Mood Index</div>
                  <div className="text-3xl font-black mt-0.5" style={{ color: overallMood >= 50 ? "#34d399" : "#f87171" }}>{overallMood}%</div>
                </div>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${overallMood >= 50 ? "#34d399" : "#f87171"}15` }}>
                  <Flame className="w-6 h-6" style={{ color: overallMood >= 50 ? "#34d399" : "#f87171" }} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Alerts Feed */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-3">
            <div className="bg-card border border-border/50 rounded-2xl p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <h3 className="font-bold text-sm">System Alerts</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-slate-400" onClick={() => setLocation("/kenya/alerts")}>
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {recentAlerts.slice(0, 5).map((alert, i) => {
                  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.07 }}
                      className={`flex gap-3 p-3 rounded-xl border ${cfg.bg} transition-all`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${cfg.color} bg-transparent border-0`}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-slate-400 ml-auto">{alert.timestamp}</span>
                        </div>
                        <p className="text-xs leading-snug text-slate-200">{alert.message}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── QUICK LINKS ── */}
        <div>
          <h3 className="font-bold text-sm mb-3 text-slate-400">Quick Access</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Sentiment Tracker", icon: TrendingUp, href: "/kenya/tracker", color: "#22d3ee", desc: "Live political sentiment" },
              { label: "ICC Hate Speech", icon: AlertTriangle, href: "/kenya/icc-agent", color: "#f87171", desc: "ICC Rabat Plan monitor" },
              { label: "Breaking News", icon: Radio, href: "/kenya/breaking-news", color: "#fb923c", desc: "Live Kenya news feed" },
              { label: "Election Phases", icon: Eye, href: "/kenya/election-phases", color: "#a78bfa", desc: "Electoral cycle tracker" },
            ].map((item, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                onClick={() => setLocation(item.href)}
                className="group flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/40 hover:bg-card/80 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
