import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getCountryConfig } from "@shared/countryConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, AlertTriangle, Shield, Zap, Info, CheckCircle2, Filter } from "lucide-react";
import { formatDistanceToNow, subHours, subDays, subMinutes } from "date-fns";

type Severity = "critical" | "high" | "medium" | "low" | "info";
type AlertCategory = "security" | "political" | "economic" | "social" | "electoral";

interface Alert {
  id: string;
  title: string;
  summary: string;
  severity: Severity;
  category: AlertCategory;
  location: string;
  timestamp: Date;
  resolved: boolean;
  tags: string[];
}

const ALERT_STYLE: Record<Severity, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  critical: { color: "#ef4444", bg: "bg-red-500/10",    border: "border-red-500/40",    icon: AlertTriangle, label: "Critical" },
  high:     { color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/40", icon: AlertTriangle, label: "High" },
  medium:   { color: "#fbbf24", bg: "bg-yellow-500/10", border: "border-yellow-500/40", icon: Zap,           label: "Medium" },
  low:      { color: "#60a5fa", bg: "bg-blue-500/10",   border: "border-blue-500/40",   icon: Info,          label: "Low" },
  info:     { color: "#94a3b8", bg: "bg-slate-500/10",  border: "border-slate-500/40",  icon: Info,          label: "Info" },
};

const ALERTS: Record<string, Alert[]> = {
  ke: [
    { id: "ke1", title: "Gen Z Protest Planned — Nairobi CBD", summary: "Organisers announce nationwide demonstrations on Wednesday over cost-of-living concerns. CBD businesses advised to prepare contingency plans.", severity: "high", category: "social", location: "Nairobi", timestamp: subHours(new Date(), 2), resolved: false, tags: ["protest", "Gen Z", "CBD"] },
    { id: "ke2", title: "Petrol Price Hike — Effective Midnight", summary: "EPRA announces 12% increase in petrol prices. Matatu fare increases expected to follow. Transporters' strike threatened.", severity: "high", category: "economic", location: "National", timestamp: subHours(new Date(), 5), resolved: false, tags: ["fuel", "inflation", "transport"] },
    { id: "ke3", title: "Cabinet Reshuffle Imminent — State House Sources", summary: "Multiple cabinet secretaries expect dismissal this week. Ruto's office expected to announce changes affecting Finance and Interior ministries.", severity: "medium", category: "political", location: "Nairobi", timestamp: subHours(new Date(), 8), resolved: false, tags: ["cabinet", "executive", "reshuffle"] },
    { id: "ke4", title: "ICC Preliminary Inquiry Notification Served", summary: "ICC Registry confirms service of preliminary inquiry notice related to 2024 protest casualties. Government has 30 days to respond.", severity: "medium", category: "political", location: "National", timestamp: subDays(new Date(), 1), resolved: false, tags: ["ICC", "accountability", "protests"] },
    { id: "ke5", title: "Al-Shabaab Incursion — Mandera County", summary: "KDF and GSU repelled cross-border incursion near Mandera. Two officers wounded. Area under enhanced security posture.", severity: "critical", category: "security", location: "Mandera", timestamp: subDays(new Date(), 2), resolved: false, tags: ["Al-Shabaab", "security", "KDF"] },
    { id: "ke6", title: "Electoral Commission Recruitment Opens", summary: "IEBC begins recruitment for 15,000 ward-level election officials ahead of 2027 cycle. Civil society monitoring process for impartiality.", severity: "low", category: "electoral", location: "National", timestamp: subDays(new Date(), 3), resolved: false, tags: ["IEBC", "elections", "2027"] },
    { id: "ke7", title: "Drought Emergency — Turkana, Marsabit, Wajir", summary: "County governments declare drought emergency. Over 800,000 people at acute food insecurity risk. WFP scaling up response.", severity: "high", category: "social", location: "Northern Kenya", timestamp: subDays(new Date(), 4), resolved: false, tags: ["drought", "food security", "humanitarian"] },
    { id: "ke8", title: "Internet Disruption Resolved — Mombasa Port", summary: "Fibre cable damage at Mombasa port caused 4-hour connectivity disruption. Fully restored at 14:30 EAT.", severity: "low", category: "economic", location: "Mombasa", timestamp: subDays(new Date(), 5), resolved: true, tags: ["internet", "connectivity", "mombasa"] },
  ],
  ng: [
    { id: "ng1", title: "Nationwide Fuel Protests — Day 3", summary: "Labour unions continue fuel subsidy removal protests across Lagos, Abuja, and Port Harcourt. Transport networks severely disrupted.", severity: "critical", category: "social", location: "National", timestamp: subHours(new Date(), 1), resolved: false, tags: ["fuel", "protests", "Labour"] },
    { id: "ng2", title: "Borno Suicide Bombing — 14 Casualties", summary: "Suicide bomb attack at Maiduguri market kills 14, injures 30. Boko Haram / ISWAP responsibility suspected. State of emergency considerations.", severity: "critical", category: "security", location: "Borno", timestamp: subHours(new Date(), 6), resolved: false, tags: ["Boko Haram", "Borno", "terrorism"] },
    { id: "ng3", title: "Naira Hits All-Time Low — ₦1,900/$", summary: "Official exchange rate breaches ₦1,900 per dollar. CBN emergency meeting scheduled. Forex reserves under pressure.", severity: "high", category: "economic", location: "National", timestamp: subHours(new Date(), 12), resolved: false, tags: ["naira", "forex", "CBN"] },
    { id: "ng4", title: "Tinubu Cabinet Reshuffle — 5 Ministers Replaced", summary: "President Tinubu replaces ministers for Finance, Petroleum, Agriculture, Labour and Interior. New appointments signal policy shift.", severity: "medium", category: "political", location: "Abuja", timestamp: subDays(new Date(), 1), resolved: false, tags: ["cabinet", "Tinubu", "reshuffle"] },
    { id: "ng5", title: "Bandits Attack — 60 Killed in Zamfara", summary: "Armed bandits attack three villages in Zamfara. Security forces deployed. Governor declares 24-hour curfew in affected LGAs.", severity: "critical", category: "security", location: "Zamfara", timestamp: subDays(new Date(), 2), resolved: false, tags: ["bandits", "Zamfara", "insecurity"] },
  ],
  za: [
    { id: "za1", title: "GNU Coalition Tension — ANC-DA Disagreement on NHI", summary: "Government of National Unity shows strain as ANC and DA clash over National Health Insurance implementation timeline.", severity: "medium", category: "political", location: "Pretoria", timestamp: subHours(new Date(), 3), resolved: false, tags: ["GNU", "NHI", "ANC", "DA"] },
    { id: "za2", title: "MK Party Mass Action — KwaZulu-Natal", summary: "MK Party announces major mobilisation in KZN following court ruling against Zuma candidacy. Police on high alert in Durban.", severity: "high", category: "political", location: "KwaZulu-Natal", timestamp: subHours(new Date(), 7), resolved: false, tags: ["MK Party", "Zuma", "KZN"] },
    { id: "za3", title: "Rand Under Pressure — R18.9/$", summary: "Currency weakens amid global risk-off sentiment and domestic political uncertainty. SARB monitoring closely.", severity: "medium", category: "economic", location: "National", timestamp: subDays(new Date(), 1), resolved: false, tags: ["rand", "currency", "SARB"] },
    { id: "za4", title: "Loadshedding Returns — Stage 4 from Friday", summary: "Eskom announces return to Stage 4 loadshedding from Friday 20:00. Maintenance backlog cited. Business impact estimated R4bn/day.", severity: "high", category: "economic", location: "National", timestamp: subDays(new Date(), 2), resolved: false, tags: ["Eskom", "loadshedding", "energy"] },
  ],
  gh: [
    { id: "gh1", title: "Mahama 100-Day Review — Civil Society Report", summary: "Coalition of civil society organisations publishes 100-day assessment of NDC government. Mixed review on anti-corruption pledges.", severity: "low", category: "political", location: "Accra", timestamp: subDays(new Date(), 1), resolved: false, tags: ["Mahama", "NDC", "governance"] },
    { id: "gh2", title: "Cocoa Price Surge — COCOBOD Windfall", summary: "International cocoa prices at record highs. COCOBOD projecting 40% revenue increase. Government plans infrastructure spending.", severity: "info", category: "economic", location: "National", timestamp: subDays(new Date(), 2), resolved: false, tags: ["cocoa", "COCOBOD", "economy"] },
  ],
};

const DEFAULT_ALERTS: Alert[] = [
  { id: "def1", title: "Intelligence Feed Active", summary: "No active alerts for this country. System is monitoring for new developments.", severity: "info", category: "political", location: "National", timestamp: subMinutes(new Date(), 30), resolved: false, tags: [] },
];

const CAT_COLORS: Record<AlertCategory, string> = {
  security:  "#ef4444",
  political: "#a78bfa",
  economic:  "#34d399",
  social:    "#60a5fa",
  electoral: "#f59e0b",
};

export default function CountryAlerts() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const country = getCountryConfig(code);
  const allAlerts = ALERTS[code.toLowerCase()] ?? DEFAULT_ALERTS;
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [showResolved, setShowResolved] = useState(false);

  if (!country) return <div className="p-6 text-muted-foreground">Country not found.</div>;

  const active = allAlerts.filter(a => !a.resolved);
  const resolved = allAlerts.filter(a => a.resolved);
  const criticalCount = active.filter(a => a.severity === "critical").length;
  const highCount = active.filter(a => a.severity === "high").length;

  const displayed = (showResolved ? allAlerts : active).filter(a =>
    severityFilter === "all" || a.severity === severityFilter
  );

  const severities: (Severity | "all")[] = ["all", "critical", "high", "medium", "low", "info"];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <button onClick={() => setLocation(`/country/${code}`)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="w-3 h-3" /> {country.name} Overview
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-400" />
              {country.name} Intelligence Alerts
            </h1>
            <p className="text-xs text-muted-foreground">{active.length} active alerts</p>
          </div>
          {(criticalCount > 0 || highCount > 0) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount > 0 ? `${criticalCount} Critical` : `${highCount} High`}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3">
          {(["critical","high","medium","low"] as Severity[]).map(sev => {
            const style = ALERT_STYLE[sev];
            const count = active.filter(a => a.severity === sev).length;
            return (
              <motion.button key={sev} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
                className={`p-3 rounded-xl border text-center transition-all ${severityFilter === sev ? style.border + " " + style.bg : "border-border/50 bg-card hover:border-primary/30"}`}>
                <div className="text-2xl font-black" style={{ color: style.color }}>{count}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{sev}</div>
              </motion.button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {severities.map(s => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${severityFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}>
              {s}
            </button>
          ))}
          <div className="ml-auto">
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowResolved(!showResolved)}>
              {showResolved ? "Hide resolved" : `Show resolved (${resolved.length})`}
            </Button>
          </div>
        </div>

        {/* Alert list */}
        <div className="space-y-3">
          {displayed.map((alert, i) => {
            const style = ALERT_STYLE[alert.severity];
            const Icon = style.icon;
            return (
              <motion.div key={alert.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border p-4 ${style.border} ${style.bg} ${alert.resolved ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-sm">{alert.title}</h3>
                      {alert.resolved && (
                        <Badge className="text-[9px]" style={{ background: "#22c55e20", color: "#22c55e", borderColor: "#22c55e30" }}>
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{alert.summary}</p>
                    <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground/60">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span className="capitalize font-semibold" style={{ color: CAT_COLORS[alert.category] }}>{alert.category}</span>
                      </span>
                      <span>{alert.location}</span>
                      <span>{formatDistanceToNow(alert.timestamp, { addSuffix: true })}</span>
                      {alert.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <Badge className="shrink-0 text-[10px]" style={{ background: `${style.color}15`, color: style.color, borderColor: `${style.color}30` }}>
                    {style.label}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
          {displayed.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No alerts match the selected filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
