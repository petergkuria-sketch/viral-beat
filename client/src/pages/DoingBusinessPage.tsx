import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Building2, ChevronRight, Download, ArrowRight, Loader2,
  TrendingUp, Shield, Globe,
} from "lucide-react";
import jsPDF from "jspdf";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CountryDB {
  code: string;
  name: string;
  flag: string;
  region: string;
  stabilityScore: number;
  aafctaStatus: "ratified" | "signed" | "observer";
  bitCount: number;
  capitalControls: "open" | "partial" | "restricted";
  topSectors: string[];
  indicators: {
    businessEntry: number;
    constructionPermits: number;
    electricity: number;
    propertyRegistration: number;
    creditAccess: number;
    investorProtection: number;
    taxCompliance: number;
    tradeFacilitation: number;
    contractEnforcement: number;
    insolvencyResolution: number;
  };
}

// ── Static seed data ──────────────────────────────────────────────────────────

const COUNTRIES_DB: CountryDB[] = [
  { code: "rw", name: "Rwanda",       flag: "🇷🇼", region: "East Africa",    stabilityScore: 82,
    aafctaStatus: "ratified", bitCount: 12, capitalControls: "open",
    topSectors: ["Tech", "Tourism", "Agriculture"],
    indicators: { businessEntry:91, constructionPermits:78, electricity:72, propertyRegistration:93, creditAccess:65, investorProtection:80, taxCompliance:85, tradeFacilitation:74, contractEnforcement:69, insolvencyResolution:60 } },
  { code: "ma", name: "Morocco",       flag: "🇲🇦", region: "North Africa",   stabilityScore: 74,
    aafctaStatus: "ratified", bitCount: 74, capitalControls: "partial",
    topSectors: ["Manufacturing", "Tourism", "Renewables"],
    indicators: { businessEntry:87, constructionPermits:72, electricity:80, propertyRegistration:66, creditAccess:58, investorProtection:68, taxCompliance:70, tradeFacilitation:72, contractEnforcement:67, insolvencyResolution:52 } },
  { code: "ke", name: "Kenya",         flag: "🇰🇪", region: "East Africa",    stabilityScore: 68,
    aafctaStatus: "ratified", bitCount: 16, capitalControls: "partial",
    topSectors: ["Fintech", "Agriculture", "Logistics"],
    indicators: { businessEntry:82, constructionPermits:65, electricity:71, propertyRegistration:63, creditAccess:75, investorProtection:72, taxCompliance:66, tradeFacilitation:70, contractEnforcement:60, insolvencyResolution:48 } },
  { code: "tn", name: "Tunisia",       flag: "🇹🇳", region: "North Africa",   stabilityScore: 58,
    aafctaStatus: "signed", bitCount: 55, capitalControls: "partial",
    topSectors: ["Manufacturing", "ICT", "Tourism"],
    indicators: { businessEntry:83, constructionPermits:67, electricity:82, propertyRegistration:69, creditAccess:52, investorProtection:59, taxCompliance:68, tradeFacilitation:62, contractEnforcement:72, insolvencyResolution:44 } },
  { code: "za", name: "South Africa",  flag: "🇿🇦", region: "Southern Africa", stabilityScore: 55,
    aafctaStatus: "ratified", bitCount: 47, capitalControls: "partial",
    topSectors: ["Mining", "Finance", "Manufacturing"],
    indicators: { businessEntry:75, constructionPermits:60, electricity:48, propertyRegistration:72, creditAccess:75, investorProtection:78, taxCompliance:67, tradeFacilitation:63, contractEnforcement:66, insolvencyResolution:52 } },
  { code: "bw", name: "Botswana",      flag: "🇧🇼", region: "Southern Africa", stabilityScore: 78,
    aafctaStatus: "ratified", bitCount: 8, capitalControls: "open",
    topSectors: ["Mining", "Finance", "Tourism"],
    indicators: { businessEntry:81, constructionPermits:58, electricity:64, propertyRegistration:68, creditAccess:60, investorProtection:70, taxCompliance:74, tradeFacilitation:55, contractEnforcement:64, insolvencyResolution:46 } },
  { code: "gh", name: "Ghana",         flag: "🇬🇭", region: "West Africa",    stabilityScore: 70,
    aafctaStatus: "ratified", bitCount: 30, capitalControls: "partial",
    topSectors: ["Oil & Gas", "Cocoa", "Fintech"],
    indicators: { businessEntry:85, constructionPermits:55, electricity:58, propertyRegistration:55, creditAccess:55, investorProtection:62, taxCompliance:62, tradeFacilitation:58, contractEnforcement:53, insolvencyResolution:40 } },
  { code: "eg", name: "Egypt",         flag: "🇪🇬", region: "North Africa",   stabilityScore: 52,
    aafctaStatus: "ratified", bitCount: 100, capitalControls: "partial",
    topSectors: ["Gas", "Tourism", "Textiles"],
    indicators: { businessEntry:79, constructionPermits:50, electricity:76, propertyRegistration:57, creditAccess:48, investorProtection:55, taxCompliance:64, tradeFacilitation:60, contractEnforcement:62, insolvencyResolution:42 } },
  { code: "sn", name: "Senegal",       flag: "🇸🇳", region: "West Africa",    stabilityScore: 65,
    aafctaStatus: "ratified", bitCount: 28, capitalControls: "partial",
    topSectors: ["Oil", "Fisheries", "Phosphates"],
    indicators: { businessEntry:78, constructionPermits:52, electricity:62, propertyRegistration:58, creditAccess:50, investorProtection:55, taxCompliance:58, tradeFacilitation:56, contractEnforcement:52, insolvencyResolution:38 } },
  { code: "ci", name: "Côte d'Ivoire", flag: "🇨🇮", region: "West Africa",    stabilityScore: 60,
    aafctaStatus: "ratified", bitCount: 22, capitalControls: "partial",
    topSectors: ["Cocoa", "Oil", "Cashew"],
    indicators: { businessEntry:76, constructionPermits:54, electricity:60, propertyRegistration:52, creditAccess:52, investorProtection:58, taxCompliance:56, tradeFacilitation:55, contractEnforcement:50, insolvencyResolution:36 } },
  { code: "ug", name: "Uganda",        flag: "🇺🇬", region: "East Africa",    stabilityScore: 55,
    aafctaStatus: "ratified", bitCount: 14, capitalControls: "partial",
    topSectors: ["Agriculture", "Oil", "Tourism"],
    indicators: { businessEntry:77, constructionPermits:50, electricity:56, propertyRegistration:55, creditAccess:48, investorProtection:60, taxCompliance:62, tradeFacilitation:52, contractEnforcement:56, insolvencyResolution:40 } },
  { code: "tz", name: "Tanzania",      flag: "🇹🇿", region: "East Africa",    stabilityScore: 60,
    aafctaStatus: "ratified", bitCount: 18, capitalControls: "restricted",
    topSectors: ["Tourism", "Gold", "Agriculture"],
    indicators: { businessEntry:72, constructionPermits:48, electricity:52, propertyRegistration:50, creditAccess:50, investorProtection:56, taxCompliance:56, tradeFacilitation:50, contractEnforcement:48, insolvencyResolution:38 } },
  { code: "ng", name: "Nigeria",       flag: "🇳🇬", region: "West Africa",    stabilityScore: 40,
    aafctaStatus: "ratified", bitCount: 32, capitalControls: "restricted",
    topSectors: ["Oil", "Fintech", "Telecoms"],
    indicators: { businessEntry:76, constructionPermits:44, electricity:40, propertyRegistration:52, creditAccess:60, investorProtection:62, taxCompliance:52, tradeFacilitation:54, contractEnforcement:50, insolvencyResolution:38 } },
  { code: "zm", name: "Zambia",        flag: "🇿🇲", region: "Southern Africa", stabilityScore: 52,
    aafctaStatus: "ratified", bitCount: 20, capitalControls: "partial",
    topSectors: ["Copper", "Agriculture", "Tourism"],
    indicators: { businessEntry:70, constructionPermits:46, electricity:48, propertyRegistration:52, creditAccess:46, investorProtection:55, taxCompliance:55, tradeFacilitation:48, contractEnforcement:52, insolvencyResolution:38 } },
  { code: "et", name: "Ethiopia",      flag: "🇪🇹", region: "East Africa",    stabilityScore: 35,
    aafctaStatus: "signed", bitCount: 24, capitalControls: "restricted",
    topSectors: ["Manufacturing", "Coffee", "Floriculture"],
    indicators: { businessEntry:65, constructionPermits:42, electricity:52, propertyRegistration:44, creditAccess:40, investorProtection:44, taxCompliance:46, tradeFacilitation:46, contractEnforcement:40, insolvencyResolution:30 } },
  { code: "cm", name: "Cameroon",      flag: "🇨🇲", region: "Central Africa",  stabilityScore: 42,
    aafctaStatus: "ratified", bitCount: 16, capitalControls: "partial",
    topSectors: ["Oil", "Cocoa", "Timber"],
    indicators: { businessEntry:58, constructionPermits:40, electricity:48, propertyRegistration:46, creditAccess:38, investorProtection:44, taxCompliance:46, tradeFacilitation:44, contractEnforcement:48, insolvencyResolution:28 } },
  { code: "mz", name: "Mozambique",    flag: "🇲🇿", region: "Southern Africa", stabilityScore: 40,
    aafctaStatus: "ratified", bitCount: 22, capitalControls: "partial",
    topSectors: ["Gas", "Coal", "Agriculture"],
    indicators: { businessEntry:62, constructionPermits:38, electricity:42, propertyRegistration:45, creditAccess:40, investorProtection:42, taxCompliance:44, tradeFacilitation:42, contractEnforcement:40, insolvencyResolution:28 } },
  { code: "ao", name: "Angola",        flag: "🇦🇴", region: "Southern Africa", stabilityScore: 44,
    aafctaStatus: "signed", bitCount: 14, capitalControls: "restricted",
    topSectors: ["Oil", "Diamonds", "Agriculture"],
    indicators: { businessEntry:55, constructionPermits:36, electricity:35, propertyRegistration:40, creditAccess:35, investorProtection:40, taxCompliance:40, tradeFacilitation:38, contractEnforcement:38, insolvencyResolution:26 } },
  { code: "cd", name: "DR Congo",      flag: "🇨🇩", region: "Central Africa",  stabilityScore: 22,
    aafctaStatus: "signed", bitCount: 18, capitalControls: "restricted",
    topSectors: ["Mining", "Cobalt", "Agriculture"],
    indicators: { businessEntry:44, constructionPermits:28, electricity:24, propertyRegistration:38, creditAccess:30, investorProtection:36, taxCompliance:38, tradeFacilitation:32, contractEnforcement:35, insolvencyResolution:20 } },
  { code: "sd", name: "Sudan",         flag: "🇸🇩", region: "North Africa",   stabilityScore: 18,
    aafctaStatus: "observer", bitCount: 20, capitalControls: "restricted",
    topSectors: ["Oil", "Gold", "Agriculture"],
    indicators: { businessEntry:42, constructionPermits:26, electricity:28, propertyRegistration:35, creditAccess:28, investorProtection:32, taxCompliance:36, tradeFacilitation:30, contractEnforcement:32, insolvencyResolution:18 } },
];

// ── IRS Calculation ───────────────────────────────────────────────────────────

function calcIRS(c: CountryDB): number {
  const ind = c.indicators;
  const dbAvg = Object.values(ind).reduce((a, b) => a + b, 0) / 10;
  const bonus =
    (c.aafctaStatus === "ratified" ? 4 : c.aafctaStatus === "signed" ? 2 : 0) +
    (c.capitalControls === "open" ? 4 : c.capitalControls === "partial" ? 2 : 0) +
    Math.min(c.bitCount / 10, 4);
  const raw = dbAvg * 0.5 + c.stabilityScore * 0.3 + bonus * 0.2 * 5;
  return Math.round(Math.min(raw, 100) * 10) / 10;
}

function calcDBAvg(c: CountryDB): number {
  return Math.round(Object.values(c.indicators).reduce((a, b) => a + b, 0) / 10);
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function irsColor(irs: number): string {
  if (irs >= 70) return "text-emerald-400";
  if (irs >= 50) return "text-amber-400";
  return "text-red-400";
}

function irsHex(irs: number): string {
  if (irs >= 70) return "#34d399";
  if (irs >= 50) return "#fbbf24";
  return "#f87171";
}

function stabilityBg(s: number): string {
  if (s >= 70) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (s >= 50) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return "bg-red-500/20 text-red-300 border-red-500/30";
}

// ── Regions ───────────────────────────────────────────────────────────────────

const REGIONS = ["All", ...Array.from(new Set(COUNTRIES_DB.map(c => c.region))).sort()];

const INDICATOR_LABELS: Record<keyof CountryDB["indicators"], string> = {
  businessEntry: "Entry",
  constructionPermits: "Permits",
  electricity: "Power",
  propertyRegistration: "Property",
  creditAccess: "Credit",
  investorProtection: "Protection",
  taxCompliance: "Tax",
  tradeFacilitation: "Trade",
  contractEnforcement: "Contracts",
  insolvencyResolution: "Insolvency",
};

const INDICATOR_KEYS = Object.keys(INDICATOR_LABELS) as (keyof CountryDB["indicators"])[];

// ── Radar colours ─────────────────────────────────────────────────────────────

const RADAR_COLORS = ["#38bdf8", "#34d399", "#f472b6"];

// ── PESTEL keyword classifier ─────────────────────────────────────────────────

function classifyPestel(text: string): string {
  const t = (text || "").toLowerCase();
  if (/politic|election|govern|president|parliament|minister|coup/.test(t)) return "political";
  if (/econom|gdp|inflation|invest|trade|export|import|budget|imf|bank/.test(t)) return "economic";
  if (/social|protest|poverty|health|education|youth|migration/.test(t)) return "social";
  if (/tech|digital|ai|internet|mobile|fintech|cyber/.test(t)) return "technological";
  if (/environment|climate|drought|flood|energy|renewable/.test(t)) return "environmental";
  if (/law|court|legal|regulation|sanction|constitution/.test(t)) return "legal";
  return "political";
}

// ── IRS Gauge SVG ─────────────────────────────────────────────────────────────

function IRSGauge({ irs }: { irs: number }) {
  const r = 60;
  const sw = 14;
  const cx = 80;
  const cy = 80;
  // Half-circle arc from left (-π) to right (0), i.e. 180° span
  const fraction = Math.min(irs / 100, 1);
  const startAngle = Math.PI;           // left  (180°)
  const endAngle = startAngle - fraction * Math.PI; // sweeps counter-clockwise
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = fraction > 0.5 ? 1 : 0;
  const trackD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const fillD   = fraction > 0
    ? `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`
    : "";
  const color = irsHex(irs);
  return (
    <svg viewBox="0 0 160 90" className="w-full max-w-[200px] mx-auto" aria-label={`IRS gauge: ${irs}`}>
      {/* Track */}
      <path d={trackD} fill="none" stroke="#334155" strokeWidth={sw} strokeLinecap="round" />
      {/* Fill */}
      {fillD && (
        <path d={fillD} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      )}
      {/* Score text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>
        {irs}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">
        IRS / 100
      </text>
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface RankRowProps {
  rank: number;
  country: CountryDB;
  irs: number;
  dbAvg: number;
  onDetail: (c: CountryDB) => void;
}

function RankRow({ rank, country, irs, dbAvg, onDetail }: RankRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 rounded-lg transition-colors">
      <span className="w-7 text-slate-500 text-sm font-mono text-right shrink-0">{rank}</span>
      <span className="text-xl shrink-0">{country.flag}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-100 text-sm">{country.name}</span>
          <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400 px-1.5 py-0">{country.region}</Badge>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {country.topSectors.map(s => (
            <span key={s} className="text-[10px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">{s}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-right">
        <div className="hidden sm:block text-right">
          <div className="text-[10px] text-slate-500">DB Avg</div>
          <div className="text-sm font-mono text-slate-300">{dbAvg}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500">Stability</div>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${stabilityBg(country.stabilityScore)}`}>
            {country.stabilityScore}
          </Badge>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-[10px] text-slate-500">Capital</div>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
            country.capitalControls === "open" ? "border-emerald-500/30 text-emerald-300" :
            country.capitalControls === "partial" ? "border-amber-500/30 text-amber-300" :
            "border-red-500/30 text-red-300"
          }`}>
            {country.capitalControls}
          </Badge>
        </div>
        <div className="w-14 text-right">
          <div className="text-[10px] text-slate-500">IRS</div>
          <div className={`text-lg font-bold font-mono ${irsColor(irs)}`}>{irs}</div>
        </div>
        <Button size="sm" variant="ghost" className="text-sky-400 hover:text-sky-300 px-2 h-7"
          onClick={() => onDetail(country)}>
          Detail <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  country: CountryDB;
  irs: number;
  dbAvg: number;
}

function DetailPanel({ country, irs, dbAvg }: DetailPanelProps) {
  const [, navigate] = useLocation();
  const newsQuery = trpc.africa.getCountryNews.useQuery({ countryCode: country.code });
  const briefQuery = trpc.africa.getInvestmentBrief.useQuery(
    { countryCode: country.code, countryName: country.name },
    { enabled: false }
  );

  const pestelCounts = useMemo(() => {
    if (!newsQuery.data?.articles) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const a of newsQuery.data.articles) {
      const dim = classifyPestel((a.title ?? "") + " " + (a.summary ?? ""));
      counts[dim] = (counts[dim] ?? 0) + 1;
    }
    return counts;
  }, [newsQuery.data]);

  const pestelDims = ["political", "economic", "social", "technological", "environmental", "legal"];
  const pestelColors: Record<string, string> = {
    political: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    economic: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    social: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    technological: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    environmental: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    legal: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };

  const briefData = briefQuery.data as {
    headline?: string;
    strengths?: string[];
    risks?: string[];
    sectors?: string[];
    entryAdvice?: string;
    outlook?: string;
  } | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-4xl">{country.flag}</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">{country.name}</h2>
              <p className="text-slate-400 text-sm">{country.region}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10"
            onClick={() => navigate(`/intelligence?country=${country.code}`)}>
            Open in Intelligence <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* IRS gauge + 3-col breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="pt-6">
            <IRSGauge irs={irs} />
            <p className="text-center text-xs text-slate-400 mt-2">Investment Readiness Score</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400 flex items-center gap-2"><TrendingUp className="w-4 h-4" />DB Score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-sky-400 mb-1">{dbAvg}</div>
            <p className="text-xs text-slate-500">Avg across 10 B-READY indicators</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400 flex items-center gap-2"><Shield className="w-4 h-4" />Stability</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-mono mb-1 ${irsColor(country.stabilityScore)}`}>{country.stabilityScore}</div>
            <p className="text-xs text-slate-500">Political stability index</p>
          </CardContent>
        </Card>
      </div>

      {/* Indicator bars */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader><CardTitle className="text-sm text-slate-300">B-READY Indicator Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {INDICATOR_KEYS.map(key => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-28 text-xs text-slate-400 shrink-0">{INDICATOR_LABELS[key]}</span>
              <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${country.indicators[key]}%`,
                    backgroundColor: irsHex(country.indicators[key]),
                  }}
                />
              </div>
              <span className="w-8 text-right text-xs font-mono text-slate-300">{country.indicators[key]}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Investment Climate */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">AfCFTA Status</CardTitle></CardHeader>
          <CardContent>
            <Badge className={
              country.aafctaStatus === "ratified" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
              country.aafctaStatus === "signed" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
              "bg-slate-500/20 text-slate-300 border-slate-500/30"
            }>
              {country.aafctaStatus}
            </Badge>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">BITs in Force</CardTitle></CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-slate-100">{country.bitCount}</span>
            <span className="text-xs text-slate-500 ml-1">treaties</span>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400">Capital Controls</CardTitle></CardHeader>
          <CardContent>
            <Badge className={
              country.capitalControls === "open" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
              country.capitalControls === "partial" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
              "bg-red-500/20 text-red-300 border-red-500/30"
            }>
              {country.capitalControls}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Top sectors */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader><CardTitle className="text-sm text-slate-300">Top Opportunity Sectors</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {country.topSectors.map(s => (
            <Badge key={s} variant="outline" className="border-sky-500/30 text-sky-300">{s}</Badge>
          ))}
        </CardContent>
      </Card>

      {/* PESTEL signals */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader><CardTitle className="text-sm text-slate-300 flex items-center gap-2"><Globe className="w-4 h-4" />Live PESTEL Signal Count</CardTitle></CardHeader>
        <CardContent>
          {newsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />Loading signals…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pestelDims.map(dim => (
                <Badge key={dim} variant="outline" className={pestelColors[dim]}>
                  {dim.charAt(0).toUpperCase()}: {pestelCounts[dim] ?? 0}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Investment Brief */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-slate-300">AI Investment Brief</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
            onClick={() => briefQuery.refetch()}
            disabled={briefQuery.isFetching}
          >
            {briefQuery.isFetching ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating…</> : "Get AI Investment Brief"}
          </Button>
        </CardHeader>
        {briefData && (
          <CardContent className="space-y-4">
            {briefData.headline && (
              <div className="bg-slate-700/40 rounded-lg p-3">
                <p className="text-slate-100 font-semibold text-sm">{briefData.headline}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {briefData.strengths && (
                <div>
                  <p className="text-xs text-emerald-400 font-semibold mb-1.5">Strengths</p>
                  <ul className="space-y-1">
                    {briefData.strengths.map((s, i) => <li key={i} className="text-xs text-slate-300 flex gap-1.5"><span className="text-emerald-400 mt-0.5">+</span>{s}</li>)}
                  </ul>
                </div>
              )}
              {briefData.risks && (
                <div>
                  <p className="text-xs text-red-400 font-semibold mb-1.5">Risks</p>
                  <ul className="space-y-1">
                    {briefData.risks.map((r, i) => <li key={i} className="text-xs text-slate-300 flex gap-1.5"><span className="text-red-400 mt-0.5">−</span>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
            {briefData.entryAdvice && (
              <div>
                <p className="text-xs text-sky-400 font-semibold mb-1">Entry Advice</p>
                <p className="text-xs text-slate-300">{briefData.entryAdvice}</p>
              </div>
            )}
            {briefData.outlook && (
              <Badge className={
                briefData.outlook === "positive" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                briefData.outlook === "cautious" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                "bg-red-500/20 text-red-300 border-red-500/30"
              }>
                Outlook: {briefData.outlook}
              </Badge>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ── Compare Tab ───────────────────────────────────────────────────────────────

function CompareTab() {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(code: string) {
    setSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) :
      prev.length < 3 ? [...prev, code] : prev
    );
  }

  const selectedCountries = COUNTRIES_DB.filter(c => selected.includes(c.code));

  const radarData = INDICATOR_KEYS.map(key => {
    const row: Record<string, number | string> = { subject: INDICATOR_LABELS[key] };
    selectedCountries.forEach(c => { row[c.code] = c.indicators[key]; });
    return row;
  });

  function downloadPDF() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(18);
    doc.setTextColor(30, 30, 50);
    doc.text("ViralBeat Africa — Investment Comparison Brief", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 120);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 30);
    doc.line(14, 33, 196, 33);

    let y = 40;
    selectedCountries.forEach((c, idx) => {
      const irs = calcIRS(c);
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 50);
      doc.text(`${idx + 1}. ${c.flag} ${c.name} — IRS: ${irs}`, 14, y);
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 80);
      INDICATOR_KEYS.forEach(key => {
        doc.text(`  ${INDICATOR_LABELS[key]}: ${c.indicators[key]}`, 14, y);
        y += 5;
      });
      doc.text(`  Stability: ${c.stabilityScore} | AfCFTA: ${c.aafctaStatus} | Capital: ${c.capitalControls}`, 14, y);
      y += 9;
    });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "viralbeat-investment-comparison.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Country pills */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader><CardTitle className="text-sm text-slate-300">Select up to 3 countries to compare</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {COUNTRIES_DB.map(c => {
            const idx = selected.indexOf(c.code);
            const active = idx !== -1;
            return (
              <button
                key={c.code}
                onClick={() => toggle(c.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? "border-sky-400 bg-sky-500/20 text-sky-200"
                    : "border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500"
                }`}
              >
                {active && (
                  <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: RADAR_COLORS[idx], color: "#0f172a" }}>
                    {idx + 1}
                  </span>
                )}
                {c.flag} {c.name}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {selected.length > 0 && (
        <>
          {/* Radar chart */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <CardHeader><CardTitle className="text-sm text-slate-300">Indicator Radar</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#cbd5e1" }}
                  />
                  {selectedCountries.map((c, i) => (
                    <Radar
                      key={c.code}
                      name={c.name}
                      dataKey={c.code}
                      stroke={RADAR_COLORS[i]}
                      fill={RADAR_COLORS[i]}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Side-by-side table */}
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-x-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-slate-300">Detailed Comparison</CardTitle>
              <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                onClick={downloadPDF}>
                <Download className="w-3 h-3 mr-1.5" />Download Comparison Brief
              </Button>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">Indicator</th>
                    {selectedCountries.map((c, i) => (
                      <th key={c.code} className="text-center py-2 px-3 font-semibold" style={{ color: RADAR_COLORS[i] }}>
                        {c.flag} {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INDICATOR_KEYS.map(key => (
                    <tr key={key} className="border-b border-slate-700/40">
                      <td className="py-2 pr-4 text-slate-400">{INDICATOR_LABELS[key]}</td>
                      {selectedCountries.map(c => (
                        <td key={c.code} className={`text-center py-2 px-3 font-mono font-semibold ${irsColor(c.indicators[key])}`}>
                          {c.indicators[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-slate-700/40 bg-slate-700/20">
                    <td className="py-2 pr-4 text-slate-300 font-semibold">DB Average</td>
                    {selectedCountries.map(c => (
                      <td key={c.code} className="text-center py-2 px-3 font-mono font-bold text-sky-300">{calcDBAvg(c)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-700/40 bg-slate-700/20">
                    <td className="py-2 pr-4 text-slate-300 font-semibold">IRS</td>
                    {selectedCountries.map(c => {
                      const irs = calcIRS(c);
                      return (
                        <td key={c.code} className={`text-center py-2 px-3 font-mono font-bold ${irsColor(irs)}`}>{irs}</td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-slate-400">Stability</td>
                    {selectedCountries.map(c => (
                      <td key={c.code} className={`text-center py-2 px-3 font-mono ${irsColor(c.stabilityScore)}`}>{c.stabilityScore}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DoingBusinessPage() {
  const [, navigate] = useLocation();
  const [regionFilter, setRegionFilter] = useState("All");
  const [minIRS, setMinIRS] = useState(0);
  const [activeTab, setActiveTab] = useState("rankings");
  const [detailCountry, setDetailCountry] = useState<CountryDB | null>(null);

  const ranked = useMemo(() => {
    return COUNTRIES_DB
      .map(c => ({ ...c, irs: calcIRS(c), dbAvg: calcDBAvg(c) }))
      .sort((a, b) => b.irs - a.irs);
  }, []);

  const filtered = useMemo(() => {
    return ranked.filter(c =>
      (regionFilter === "All" || c.region === regionFilter) &&
      c.irs >= minIRS
    );
  }, [ranked, regionFilter, minIRS]);

  function handleDetail(c: CountryDB) {
    setDetailCountry(c);
    setActiveTab("detail");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-bold text-slate-100">Investment Readiness Intelligence</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Ease of Doing Business · B-READY indicators · AI-enriched PESTEL overlay
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10 shrink-0"
          onClick={() => navigate("/intelligence")}
        >
          Open Intelligence <ArrowRight className="w-3 h-3 ml-1.5" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/80 border border-slate-700/50 mb-6">
          <TabsTrigger value="rankings" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300">Rankings</TabsTrigger>
          <TabsTrigger value="compare" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300">Compare</TabsTrigger>
          <TabsTrigger value="detail" disabled={!detailCountry} className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300">
            {detailCountry ? `Detail: ${detailCountry.flag} ${detailCountry.name}` : "Detail"}
          </TabsTrigger>
        </TabsList>

        {/* ─── Rankings ─── */}
        <TabsContent value="rankings">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Region</label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="h-8 w-40 bg-slate-800 border-slate-700 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {REGIONS.map(r => (
                    <SelectItem key={r} value={r} className="text-slate-300 focus:bg-slate-700">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Min IRS: <span className="text-sky-400 font-mono">{minIRS}</span></label>
              <input
                type="range"
                min={0}
                max={80}
                step={5}
                value={minIRS}
                onChange={e => setMinIRS(Number(e.target.value))}
                className="w-28 accent-sky-400"
              />
            </div>
            <span className="text-xs text-slate-500 ml-auto">{filtered.length} countries</span>
          </div>

          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardContent className="p-2 space-y-0.5">
              {filtered.map((c, i) => (
                <RankRow
                  key={c.code}
                  rank={i + 1}
                  country={c}
                  irs={c.irs}
                  dbAvg={c.dbAvg}
                  onDetail={handleDetail}
                />
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-slate-500 py-8 text-sm">No countries match the current filters.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Compare ─── */}
        <TabsContent value="compare">
          <CompareTab />
        </TabsContent>

        {/* ─── Detail ─── */}
        <TabsContent value="detail">
          {detailCountry ? (
            <DetailPanel
              country={detailCountry}
              irs={calcIRS(detailCountry)}
              dbAvg={calcDBAvg(detailCountry)}
            />
          ) : (
            <div className="text-center text-slate-500 py-20">
              Select a country from the Rankings tab to view its detail.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
