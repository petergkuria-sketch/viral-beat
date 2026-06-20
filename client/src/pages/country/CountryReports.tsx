import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { getCountryConfig } from "@shared/countryConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, FileText, Download, Lock, ChevronRight,
  Clock, Tag, BarChart3, Shield, Globe, Zap,
} from "lucide-react";
import { formatDistanceToNow, subDays, subHours, subWeeks, subMonths } from "date-fns";

type ReportType = "weekly" | "briefing" | "risk" | "electoral" | "special";
type AccessLevel = "free" | "pro";

interface Report {
  id: string;
  title: string;
  type: ReportType;
  access: AccessLevel;
  date: Date;
  pages: number;
  tags: string[];
  summary: string;
  keyFindings: string[];
}

const TYPE_STYLE: Record<ReportType, { label: string; color: string; icon: React.ElementType }> = {
  weekly:    { label: "Weekly Brief",      color: "#60a5fa", icon: BarChart3 },
  briefing:  { label: "Intelligence Brief",color: "#a78bfa", icon: Shield },
  risk:      { label: "Risk Assessment",   color: "#f87171", icon: Zap },
  electoral: { label: "Electoral",         color: "#f59e0b", icon: Globe },
  special:   { label: "Special Report",    color: "#34d399", icon: FileText },
};

const REPORTS: Record<string, Report[]> = {
  ke: [
    { id: "ke-w1", title: "Kenya Weekly Intelligence Brief — Week 24", type: "weekly", access: "free", date: subDays(new Date(), 2), pages: 8, tags: ["politics", "Gen Z", "economy"], summary: "This week saw renewed youth-led protests over cost of living, cabinet reshuffle speculation, and continued ICC engagement. Business sentiment index fell 4 points to 38.", keyFindings: ["Gen Z Coalition announces coordinated protests for Wednesday", "Cabinet reshuffle expected to affect Finance and Interior ministries", "KES weakened 1.2% against USD amid import pressure", "ICC preliminary inquiry notification served to Kenyan government"] },
    { id: "ke-r1", title: "Kenya Risk Assessment Q2 2026", type: "risk", access: "pro", date: subWeeks(new Date(), 1), pages: 24, tags: ["risk", "stability", "2026"], summary: "Comprehensive quarterly risk assessment covering political, economic and security dimensions. Overall risk score: 47/100 (Moderate). Elevated youth unrest risk flagged.", keyFindings: ["Political risk: 58/100 — Cabinet instability and youth protest escalation", "Economic risk: 52/100 — KES depreciation and high fuel prices", "Security risk: 44/100 — Al-Shabaab incursions in Northern Kenya", "Electoral risk: 38/100 — IEBC recruitment begins, early dynamics assessed"] },
    { id: "ke-e1", title: "2027 Kenya General Election — Preliminary Intelligence", type: "electoral", access: "pro", date: subWeeks(new Date(), 2), pages: 16, tags: ["elections", "2027", "IEBC"], summary: "Early assessment of Kenya's August 2027 general election landscape including key candidates, coalition dynamics, and IEBC readiness.", keyFindings: ["UDA coalition remains dominant but faces internal fractures", "Raila Odinga factor: AU role limits direct candidacy but coalition influence remains", "Youth vote (18-35) to constitute 54% of eligible voters in 2027", "IEBC begins recruitment — civil society monitoring for impartiality"] },
    { id: "ke-s1", title: "Gen Z Protest Wave — Special Report", type: "special", access: "free", date: subMonths(new Date(), 1), pages: 12, tags: ["Gen Z", "protests", "Finance Bill"], summary: "Retrospective analysis of the June-August 2024 Gen Z protest movement that forced withdrawal of Finance Bill 2024. Impact assessment and ongoing trajectory.", keyFindings: ["Finance Bill 2024 withdrawn following nationwide protests", "23 protesters killed, over 300 injured — ICC scrutiny ongoing", "Movement remains active, pivoted to accountability and cost-of-living demands", "Social media coordination model (X/TikTok) established as precedent"] },
    { id: "ke-b1", title: "Kenya Economic Intelligence Brief — June 2026", type: "briefing", access: "free", date: subDays(new Date(), 7), pages: 6, tags: ["economy", "inflation", "KES"], summary: "Monthly economic intelligence brief covering inflation, currency, trade balance and key sector developments.", keyFindings: ["Inflation: 7.4% (May 2026) — food prices driving pressure", "KES at 131/USD — Central Bank intervening to defend 130 floor", "Tourism revenue +18% YoY — sector bright spot", "Fuel import bill remains biggest forex drain"] },
  ],
  ng: [
    { id: "ng-w1", title: "Nigeria Weekly Intelligence Brief — Week 24", type: "weekly", access: "free", date: subDays(new Date(), 1), pages: 9, tags: ["Tinubu", "subsidy", "Naira"], summary: "Third day of nationwide fuel subsidy protests. Naira at all-time low of ₦1,900/$. Borno bombing kills 14.", keyFindings: ["Fuel subsidy protests entering Day 3 — Labour NLC threatens indefinite strike", "Naira hits ₦1,900/$ — CBN emergency meeting convened", "Borno bombing: 14 killed, ISWAP suspected", "Cabinet reshuffle: 5 ministers replaced"] },
    { id: "ng-r1", title: "Nigeria Risk Assessment Q2 2026", type: "risk", access: "pro", date: subWeeks(new Date(), 1), pages: 28, tags: ["risk", "insecurity", "economy"], summary: "Nigeria's risk profile remains elevated. Confluence of economic stress, Borno insecurity and political upheaval raises overall score to 64/100 (High).", keyFindings: ["Security: 71/100 — Borno, Zamfara and Niger Delta remain flashpoints", "Economic: 68/100 — Naira depreciation, fuel crisis, food inflation at 35%", "Political: 58/100 — Tinubu facing mounting opposition; cabinet instability", "Electoral: 42/100 — 2027 elections 8 months out; INEC preparations began"] },
    { id: "ng-e1", title: "Nigeria 2027 Election — Scenario Planning", type: "electoral", access: "pro", date: subWeeks(new Date(), 3), pages: 20, tags: ["elections", "2027", "APC", "PDP"], summary: "Three-scenario electoral analysis for Nigeria's February 2027 general elections covering Tinubu reelection, opposition unity, and third-force scenarios.", keyFindings: ["Scenario A (Tinubu wins): 40% probability — incumbent advantage + APC machinery", "Scenario B (PDP unity candidate wins): 35% probability — requires Atiku-Obi alliance", "Scenario C (LP/Labour surge): 25% probability — Obidient movement mobilisation", "Key variable: Cost-of-living trajectory between now and February 2027"] },
  ],
  za: [
    { id: "za-w1", title: "South Africa Weekly Intelligence Brief — Week 24", type: "weekly", access: "free", date: subDays(new Date(), 2), pages: 8, tags: ["GNU", "loadshedding", "MK Party"], summary: "GNU coalition shows strain over NHI. MK Party mass action in KZN. Stage 4 loadshedding returns Friday.", keyFindings: ["GNU: ANC-DA clash on NHI implementation — coalition durability questioned", "MK Party KZN mass action: Police on high alert in Durban", "Loadshedding Stage 4 returns Friday — Eskom maintenance backlog", "Rand at R18.9/$ amid global and domestic pressures"] },
    { id: "za-r1", title: "South Africa Risk Assessment Q2 2026", type: "risk", access: "pro", date: subWeeks(new Date(), 1), pages: 22, tags: ["risk", "GNU", "economy"], summary: "South Africa's GNU coalition stability is the central risk variable. Energy and crime remain structural challenges. Overall risk: 46/100 (Moderate).", keyFindings: ["Political: 52/100 — GNU cohesion depends on 2026 municipal elections", "Economic: 49/100 — Weak rand, unemployment at 32.9%, load-shedding impact", "Security: 44/100 — High crime, gang violence in Western Cape", "Social: 55/100 — Inequality (Gini 0.63) remains structural risk"] },
  ],
  gh: [
    { id: "gh-w1", title: "Ghana Weekly Intelligence Brief — Week 24", type: "weekly", access: "free", date: subDays(new Date(), 3), pages: 6, tags: ["Mahama", "NDC", "cocoa"], summary: "Mahama 100-day review published by civil society. Cocoa price windfall signals revenue boost. Stable political environment.", keyFindings: ["100-day review: Anti-corruption pledges partially fulfilled — mixed assessment", "Cocoa at record high — COCOBOD projects 40% revenue increase", "GHS stable at 13.2/$ — improvement from 15.8/$ in 2024", "Ghana's overall stability score rises to 72/100"] },
  ],
};

const DEFAULT_REPORTS: Report[] = [
  { id: "def1", title: "Country Intelligence Brief — Coming Soon", type: "briefing", access: "free", date: subDays(new Date(), 1), pages: 4, tags: ["intelligence"], summary: "Detailed reports for this country are being prepared. Check back soon for weekly briefs, risk assessments and electoral intelligence.", keyFindings: ["Intelligence pipeline is active", "RSS feeds are being monitored", "First brief will publish within 7 days"] },
];

export default function CountryReports() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const country = getCountryConfig(code);
  const reports = REPORTS[code.toLowerCase()] ?? DEFAULT_REPORTS;
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!country) return <div className="p-6 text-muted-foreground">Country not found.</div>;

  const types: (ReportType | "all")[] = ["all", "weekly", "briefing", "risk", "electoral", "special"];
  const filtered = typeFilter === "all" ? reports : reports.filter(r => r.type === typeFilter);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <button onClick={() => setLocation(`/country/${code}`)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="w-3 h-3" /> {country.name} Overview
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag}</span>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              {country.name} Intelligence Reports
            </h1>
            <p className="text-xs text-muted-foreground">{reports.length} reports available</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Type filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {types.map(t => {
            const style = t !== "all" ? TYPE_STYLE[t] : null;
            return (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}>
                {t === "all" ? "All" : TYPE_STYLE[t].label}
              </button>
            );
          })}
        </div>

        {/* Reports */}
        <div className="space-y-3">
          {filtered.map((report, i) => {
            const style = TYPE_STYLE[report.type];
            const Icon = style.icon;
            const isOpen = expanded === report.id;
            const isLocked = report.access === "pro";

            return (
              <motion.div key={report.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                <button onClick={() => !isLocked && setExpanded(isOpen ? null : report.id)}
                  className={`w-full text-left p-5 transition-colors ${!isLocked ? "hover:bg-muted/20" : "cursor-default"}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${style.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: style.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className="text-[10px]" style={{ background: `${style.color}15`, color: style.color, borderColor: `${style.color}30` }}>
                          {style.label}
                        </Badge>
                        {isLocked ? (
                          <Badge className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                            <Lock className="w-2.5 h-2.5 mr-0.5" /> Pro
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/30">Free</Badge>
                        )}
                      </div>
                      <h3 className="font-black text-sm mb-1 leading-snug">{report.title}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(report.date, { addSuffix: true })}</span>
                        <span>{report.pages} pages</span>
                        {report.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {isLocked ? (
                        <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-500">Upgrade</Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          {isOpen ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && !isLocked && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
                    <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Key Findings</p>
                      <ul className="space-y-2">
                        {report.keyFindings.map((f, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-200">
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: style.color }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-slate-200 border-slate-600 hover:bg-slate-700">
                        <Download className="w-3 h-3" /> Download PDF
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
