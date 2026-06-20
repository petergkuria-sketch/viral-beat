import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { exportBriefPDF } from "@/lib/exportBrief";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, TrendingUp, BarChart3, Download, ExternalLink,
  RefreshCw, AlertCircle, BadgeCheck, Clock, Eye,
} from "lucide-react";
import { getLoginUrl } from "@/const";

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  low:      { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-500/30" },
  medium:   { color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-500/30" },
  high:     { color: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-500/30" },
  critical: { color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-500/30" },
};

const AFFILIATION_LABELS: Record<string, string> = {
  journalist: "Journalist",
  researcher: "Researcher",
  ngo: "NGO",
  activist: "Activist",
  independent: "Independent Analyst",
};

export default function PublicBrief() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: row, isLoading, error } = trpc.briefs.get.useQuery({ id: id! });

  if (isLoading) return (
    <div className="min-h-screen bg-[#050b1a] flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
    </div>
  );

  if (error || !row) return (
    <div className="min-h-screen bg-[#050b1a] flex flex-col items-center justify-center gap-4 text-center px-4">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <h2 className="text-xl font-black text-white">Brief not found</h2>
      <p className="text-slate-400 text-sm">This link may have expired or been removed.</p>
      <Button onClick={() => setLocation("/africa")} variant="outline" className="border-white/10 text-slate-300">
        Browse Africa Intelligence
      </Button>
    </div>
  );

  const riskCfg = RISK_CONFIG[row.riskLevel] ?? RISK_CONFIG.medium;
  const keyThemes: string[] = row.keyThemes ? row.keyThemes.split(",").filter(Boolean) : [];

  function handlePDF() {
    exportBriefPDF({
      countryCode: row.countryCode,
      countryName: row.countryName,
      title: row.title,
      overview: row.overview,
      sentimentScore: Number(row.sentimentScore),
      stabilityScore: Number(row.stabilityScore),
      riskLevel: row.riskLevel,
      keyThemes,
      contributor: row.displayName ?? undefined,
      affiliation: row.affiliation ?? undefined,
      shareUrl: `/brief/${id}`,
      generatedAt: row.createdAt,
    });
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#080d1a]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setLocation("/")}
            className="text-cyan-400 font-black text-sm tracking-tight hover:text-cyan-300 transition-colors">
            VIRALBEAT
          </button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline"
              onClick={handlePDF}
              className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 gap-1.5 text-xs">
              <Download className="w-3 h-3" /> PDF
            </Button>
            <Button size="sm"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs">
              Get Full Access
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${riskCfg.bg} ${riskCfg.border} ${riskCfg.color}`}>
              <Shield className="w-3 h-3" />
              {(row.riskLevel ?? "").toUpperCase()} RISK
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(row.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            {row.viewCount > 0 && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Eye className="w-3 h-3" /> {row.viewCount} views
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">{row.title}</h1>

          {/* Contributor attribution */}
          {row.displayName && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[10px] font-black text-cyan-400">
                {row.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-200">{row.displayName}</span>
                {row.isVerified ? (
                  <BadgeCheck className="w-3.5 h-3.5 text-cyan-400 inline ml-1" />
                ) : null}
                {row.affiliation && (
                  <span className="text-xs text-slate-500 ml-1">
                    · {row.affiliationType ? AFFILIATION_LABELS[row.affiliationType] : ""} · {row.affiliation}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sentiment", value: `${row.sentimentScore}/100`, icon: TrendingUp, color: "text-cyan-400" },
            { label: "Stability", value: `${row.stabilityScore}/100`, icon: BarChart3,  color: "text-indigo-400" },
            { label: "Risk Level", value: (row.riskLevel ?? "").toUpperCase(), icon: Shield, color: riskCfg.color },
          ].map((kpi, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 text-center">
              <kpi.icon className={`w-4 h-4 mx-auto mb-2 ${kpi.color}`} />
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{kpi.label}</p>
              <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Overview */}
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Intelligence Overview</h2>
          <p className="text-slate-200 leading-relaxed text-[15px]">{row.overview}</p>
        </div>

        {/* Key themes */}
        {keyThemes.length > 0 && (
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Key Themes</h2>
            <div className="flex flex-wrap gap-2">
              {keyThemes.map((theme: string) => (
                <span key={theme}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Methodology footer */}
        <div className="bg-[#080d1a] border border-white/5 rounded-2xl p-6">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-3">About this brief</p>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            This brief was generated using the ViralBeat Africa Intelligence Engine — a pipeline that ingests
            RSS feeds from Nation Africa, The Standard, and Citizen Digital every 4 hours, scores content
            using keyword analysis and LLM-enhanced sentiment computation, and derives risk and stability
            indicators from aggregated article signals.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/about#methodology" target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              <ExternalLink className="w-3 h-3" /> Full methodology
            </a>
            <a href={`mailto:hello@viralbeat.io?subject=Score Audit - ${row.countryName}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" /> Request audit
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-600/10 border border-cyan-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-black text-white mb-2">Get Full Africa Intelligence Access</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Live sentiment scores, 55-country coverage, regional risk maps, and AI-generated briefs — updated every 4 hours.
          </p>
          <Button onClick={() => window.location.href = getLoginUrl()}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
            Start Free · viralbeat.io
          </Button>
        </div>

      </div>
    </div>
  );
}
