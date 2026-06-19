import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getCountryConfig, hasModule } from "@/lib/countries/config";
import {
  Shield, Radio, AlertTriangle, Activity, Users, MapPin,
  TrendingUp, Eye, ChevronRight, FileText, Bell, Globe,
  BarChart3, Newspaper, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ModuleCard {
  label: string;
  icon: React.ElementType;
  module: string;
  color: string;
  desc: string;
}

const ALL_MODULES: ModuleCard[] = [
  { label: "Sentiment Tracker",   icon: TrendingUp,   module: "tracker",        color: "#22d3ee", desc: "Live political sentiment" },
  { label: "Parliament",          icon: Users,         module: "parliament",     color: "#a78bfa", desc: "Assembly members & votes" },
  { label: "Senate",              icon: Shield,        module: "senate",         color: "#34d399", desc: "Senate tracker" },
  { label: "Executive",           icon: Globe,         module: "executive",      color: "#fb923c", desc: "Cabinet & presidency" },
  { label: "Governors",           icon: MapPin,        module: "governors",      color: "#f472b6", desc: "Regional leadership" },
  { label: "Women Reps",          icon: Users,         module: "women-reps",     color: "#818cf8", desc: "Women representatives" },
  { label: "Breaking News",       icon: Radio,         module: "breaking-news",  color: "#fb923c", desc: "Live news feed" },
  { label: "Newsfeed",            icon: Newspaper,     module: "newsfeed",       color: "#60a5fa", desc: "Curated intelligence" },
  { label: "Social Media",        icon: Zap,           module: "social-media",   color: "#f59e0b", desc: "Social signal tracking" },
  { label: "Election Phases",     icon: Eye,           module: "election-phases", color: "#a78bfa", desc: "Electoral cycle" },
  { label: "Movements",           icon: Activity,      module: "movements",      color: "#34d399", desc: "Civil movements" },
  { label: "Alerts",              icon: Bell,          module: "alerts",         color: "#f87171", desc: "Security alerts" },
  { label: "Reports",             icon: FileText,      module: "reports",        color: "#94a3b8", desc: "Intelligence reports" },
  { label: "ICC Monitor",         icon: AlertTriangle, module: "icc-agent",      color: "#f87171", desc: "ICC Rabat Plan monitor" },
  { label: "Regional Map",        icon: BarChart3,     module: "regional-map",   color: "#22d3ee", desc: "Geographic breakdown" },
  { label: "Balkanization",       icon: AlertTriangle, module: "balkanization",  color: "#ef4444", desc: "Fragmentation risk" },
];

const RISK_COLOR: Record<string, string> = {
  Low: "#34d399",
  Moderate: "#fbbf24",
  High: "#fb923c",
  Critical: "#f87171",
};

export default function CountryDashboard() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const country = getCountryConfig(code);

  if (!country) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🌍</div>
          <h2 className="text-xl font-bold mb-2">Country not found</h2>
          <p className="text-muted-foreground mb-4">Intelligence module for <strong>{code.toUpperCase()}</strong> is not yet available.</p>
          <Button onClick={() => setLocation("/africa")}>← Back to Africa Overview</Button>
        </div>
      </div>
    );
  }

  const riskColor = RISK_COLOR[country.riskLevel] ?? "#fbbf24";
  const activeModules = ALL_MODULES.filter(m => hasModule(code, m.module as any));
  const basePath = `/country/${code}`;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-card/80 via-card/60 to-background border-b border-border/50 px-4 sm:px-6 py-5 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{country.flag}</div>
            <div>
              <h1 className="text-xl font-black">{country.name} Intelligence</h1>
              <p className="text-xs text-muted-foreground">{country.capital} · {country.region} · {country.government} government</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
              <Radio className="w-3 h-3 animate-pulse" /> Live Feed Active
            </div>
            <Badge style={{ background: `${riskColor}20`, color: riskColor, borderColor: `${riskColor}40` }}
              className="border text-xs font-semibold">
              {country.riskLevel} Risk
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Stability Score",    value: `${country.stabilityScore}%`, icon: Activity,  color: country.stabilityScore >= 60 ? "#34d399" : country.stabilityScore >= 40 ? "#fbbf24" : "#f87171", sub: country.riskLevel + " risk", bg: "from-emerald-500/10 to-emerald-500/5" },
            { label: "Population",         value: `${country.population}M`,     icon: Users,     color: "#22d3ee", sub: country.languages[0] + " speaking", bg: "from-cyan-500/10 to-cyan-500/5" },
            { label: "Legislature Seats",  value: country.legislature.seats ?? "—", icon: Shield, color: "#a78bfa", sub: country.legislature.lowerHouse ?? "Parliament", bg: "from-purple-500/10 to-purple-500/5" },
            { label: "Next Election",      value: country.nextElection ? new Date(country.nextElection).getFullYear().toString() : "—", icon: Eye, color: "#fb923c", sub: country.nextElection ?? "TBD", bg: "from-orange-500/10 to-orange-500/5" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className={`bg-gradient-to-br ${kpi.bg} border border-border/50 rounded-2xl p-4`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${kpi.color}20` }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <div className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">{kpi.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Intelligence Modules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-base">Intelligence Modules</h2>
            <span className="text-xs text-muted-foreground">{activeModules.length} active</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeModules.map((item, i) => (
              <motion.button
                key={item.module}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => setLocation(`${basePath}/${item.module}`)}
                className="group flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/40 hover:bg-card/80 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{item.desc}</div>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* RSS Sources */}
        {country.rssFeeds.length > 0 && (
          <div>
            <h2 className="font-black text-base mb-4">Intelligence Sources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {country.rssFeeds.map((feed, i) => (
                <motion.a
                  key={i}
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                  className="flex items-center gap-3 bg-card border border-border/50 rounded-xl p-3 hover:border-primary/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Newspaper className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{feed.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{feed.category} · {feed.language.toUpperCase()}</div>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* Legislature breakdown */}
        {(country.legislature.lowerHouse || country.legislature.upperHouse) && (
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <h2 className="font-black text-base mb-4">Legislature</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {country.legislature.lowerHouse && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-sm font-semibold">{country.legislature.lowerHouse}</div>
                    <div className="text-xs text-muted-foreground">Lower House{country.legislature.seats ? ` · ${country.legislature.seats} seats` : ""}</div>
                  </div>
                  {hasModule(code, "parliament") && (
                    <Button size="sm" variant="ghost" className="ml-auto text-xs" onClick={() => setLocation(`${basePath}/parliament`)}>
                      View <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
              {country.legislature.upperHouse && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-sm font-semibold">{country.legislature.upperHouse}</div>
                    <div className="text-xs text-muted-foreground">Upper House</div>
                  </div>
                  {hasModule(code, "senate") && (
                    <Button size="sm" variant="ghost" className="ml-auto text-xs" onClick={() => setLocation(`${basePath}/senate`)}>
                      View <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
