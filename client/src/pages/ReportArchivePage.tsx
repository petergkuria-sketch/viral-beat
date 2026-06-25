import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, TrendingUp, Globe, BookOpen, Download, Star,
  Lock, Users, Crown, Eye, Archive, ChevronRight,
  FileText, Loader2, Bookmark, BookmarkCheck, LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: string | Date) {
  const ms = Date.now() - new Date(date).getTime();
  const d = Math.floor(ms / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const VISIBILITY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  public:  { label: "Public",  icon: Globe,  color: "text-green-400" },
  free:    { label: "Free",    icon: Users,  color: "text-cyan-400" },
  premium: { label: "Premium", icon: Crown,  color: "text-amber-400" },
  private: { label: "Private", icon: Lock,   color: "text-slate-500" },
};

const VERDICT_CHIP: Record<string, string> = {
  "go-market": "bg-green-500/15 text-green-400 border-green-500/30",
  "monitor":   "bg-lime-500/15 text-lime-400 border-lime-500/30",
  "caution":   "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "no-go":     "bg-red-500/15 text-red-400 border-red-500/30",
};

const TYPE_LABEL: Record<string, string> = {
  document_analysis: "Doc Analysis",
  signal_brief:      "Signal Brief",
  go_no_go:          "Go/No-Go",
  agent_report:      "Agent Report",
  custom:            "Custom",
};

const AFRICA_COUNTRIES = [
  { code: "KEN", name: "Kenya" }, { code: "NGA", name: "Nigeria" }, { code: "ZAF", name: "South Africa" },
  { code: "GHA", name: "Ghana" }, { code: "EGY", name: "Egypt" }, { code: "MAR", name: "Morocco" },
  { code: "ETH", name: "Ethiopia" }, { code: "TZA", name: "Tanzania" }, { code: "RWA", name: "Rwanda" },
  { code: "UGA", name: "Uganda" }, { code: "ZMB", name: "Zambia" }, { code: "MOZ", name: "Mozambique" },
  { code: "SEN", name: "Senegal" }, { code: "CIV", name: "Côte d'Ivoire" }, { code: "CMR", name: "Cameroon" },
  { code: "ZWE", name: "Zimbabwe" }, { code: "BWA", name: "Botswana" }, { code: "NAM", name: "Namibia" },
  { code: "DZA", name: "Algeria" }, { code: "TUN", name: "Tunisia" },
];

// ── Report card ───────────────────────────────────────────────────────────────

function ReportCard({
  report, savedIds, onSave, onUnsave, onOpen,
}: {
  report: any;
  savedIds: Set<string>;
  onSave: (id: string) => void;
  onUnsave: (id: string) => void;
  onOpen: (report: any) => void;
}) {
  const vis = VISIBILITY_META[report.visibility] ?? VISIBILITY_META.public;
  const VisIcon = vis.icon;
  const isSaved = savedIds.has(report.reportId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-all group cursor-pointer"
      onClick={() => onOpen(report)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400">
            {TYPE_LABEL[report.reportType] ?? report.reportType}
          </span>
          {report.verdictKey && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${VERDICT_CHIP[report.verdictKey] ?? ""}`}>
              {report.verdictKey}
            </span>
          )}
          {(report.pestelDims as string[] ?? []).slice(0, 3).map((d: string) => (
            <span key={d} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">{d}</span>
          ))}
        </div>
        <button
          onClick={e => { e.stopPropagation(); isSaved ? onUnsave(report.reportId) : onSave(report.reportId); }}
          className="shrink-0 text-slate-500 hover:text-cyan-400 transition-colors"
          title={isSaved ? "Remove from saved" : "Save report"}
        >
          {isSaved ? <BookmarkCheck className="w-4 h-4 text-cyan-400" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      <h3 className="font-bold text-white text-sm leading-snug mb-2 group-hover:text-cyan-300 transition-colors line-clamp-2">
        {report.title}
      </h3>

      {report.summaryText && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">{report.summaryText}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{report.viewCount ?? 0}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{report.downloadCount ?? 0}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{report.saveCount ?? 0}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {report.citationKey && (
            <span className="text-slate-500 font-mono">{report.citationKey}</span>
          )}
          <span className={`flex items-center gap-1 ${vis.color}`}>
            <VisIcon className="w-3 h-3" />{vis.label}
          </span>
          <span className="text-slate-600">{timeAgo(report.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Report detail drawer ──────────────────────────────────────────────────────

function ReportDrawer({ report, onClose, userTier }: { report: any; onClose: () => void; userTier: string }) {
  const { data: full } = trpc.reportArchive.get.useQuery(
    { reportId: report.reportId, userTier: userTier as any },
    { enabled: !!report }
  );
  const recordDownload = trpc.reportArchive.recordDownload.useMutation();

  const handleDownload = () => {
    if (!full || full.locked) return;
    const blob = new Blob([(full as any).bodyMd ?? ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.citationKey ?? report.reportId}.md`;
    a.click();
    URL.revokeObjectURL(url);
    recordDownload.mutate({ reportId: report.reportId });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="relative w-full max-w-2xl h-full bg-[#0a1628] border-l border-[#1e293b] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a1628] border-b border-[#1e293b] px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                {TYPE_LABEL[report.reportType] ?? report.reportType}
              </Badge>
              {report.citationKey && (
                <Badge className="text-[9px] bg-slate-700/60 text-slate-400 border-slate-600/40 font-mono">
                  {report.citationKey}
                </Badge>
              )}
            </div>
            <h2 className="text-base font-bold text-white leading-snug">{report.title}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-500 hover:text-white p-1 transition-colors">✕</button>
        </div>

        {/* Meta strip */}
        <div className="px-6 py-3 border-b border-[#1e293b] flex flex-wrap gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{report.viewCount} views</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{report.downloadCount} downloads</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{report.saveCount} saves</span>
          {(report.countryCodes as string[] ?? []).map((c: string) => (
            <span key={c} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{c}</span>
          ))}
          <span className="ml-auto text-slate-500">{timeAgo(report.createdAt)}</span>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5">
          {!full ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>
          ) : (full as any).locked ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-white mb-1">
                  {(full as any).visibility === "premium" ? "Premium report" : "Free account required"}
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  {(full as any).summaryText}
                </p>
              </div>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                {(full as any).visibility === "premium" ? "Upgrade to Premium" : "Sign up free"}
              </Button>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white
              prose-li:text-slate-300 prose-code:text-cyan-300 prose-code:bg-cyan-500/10
              prose-blockquote:border-l-cyan-500 prose-blockquote:text-slate-400">
              <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed font-sans">
                {(full as any).bodyMd}
              </pre>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {full && !(full as any).locked && (
          <div className="sticky bottom-0 bg-[#0a1628] border-t border-[#1e293b] px-6 py-4 flex gap-3">
            <Button onClick={handleDownload} size="sm" variant="outline" className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10">
              <Download className="w-3.5 h-3.5 mr-1.5" />Download .md
            </Button>
            <Button
              size="sm" variant="ghost" className="text-slate-400 hover:text-white"
              onClick={() => { navigator.clipboard.writeText(report.citationKey ?? report.reportId); toast.success("Citation key copied"); }}
            >
              Copy citation
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportArchivePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [tab, setTab] = useState<"browse" | "trending" | "saved">("browse");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [openReport, setOpenReport] = useState<any | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { data: me } = trpc.auth.me.useQuery();
  const userTier: "guest" | "free" | "premium" | "analyst" = me
    ? ((me as any).tier ?? "free")
    : "guest";

  // ── queries ──
  const { data: browseData, isLoading: browseLoading } = trpc.reportArchive.list.useQuery(
    { page: 1, pageSize: 30, reportType: typeFilter as any || undefined },
    { enabled: tab === "browse" }
  );

  const { data: trendingData, isLoading: trendingLoading } = trpc.reportArchive.trending.useQuery(
    { limit: 20 },
    { enabled: tab === "trending" }
  );

  const { data: countryData, isLoading: countryLoading } = trpc.reportArchive.byCountry.useQuery(
    { countryCode: countryFilter, limit: 30 },
    { enabled: tab === "browse" && countryFilter.length > 0 }
  );

  const { data: searchData, isLoading: searchLoading } = trpc.reportArchive.search.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length >= 2 }
  );

  const { data: savedData, isLoading: savedLoading } = trpc.reportArchive.savedList.useQuery(
    { limit: 30 },
    { enabled: tab === "saved" && !!me }
  );

  const saveReport = trpc.reportArchive.save.useMutation();
  const unsaveReport = trpc.reportArchive.unsave.useMutation();

  const handleSave = (reportId: string) => {
    if (!me) { toast.error("Sign in to save reports."); return; }
    setSavedIds(prev => new Set(prev).add(reportId));
    saveReport.mutate({ reportId });
    toast.success("Saved to your library.");
  };
  const handleUnsave = (reportId: string) => {
    setSavedIds(prev => { const s = new Set(prev); s.delete(reportId); return s; });
    unsaveReport.mutate({ reportId });
  };

  const displayReports: any[] = searchQuery.length >= 2
    ? (searchData ?? [])
    : countryFilter
    ? (countryData ?? [])
    : tab === "trending"
    ? (trendingData ?? [])
    : tab === "saved"
    ? (savedData ?? [])
    : (browseData?.rows ?? []);

  const isLoading = searchQuery.length >= 2 ? searchLoading
    : countryFilter ? countryLoading
    : tab === "trending" ? trendingLoading
    : tab === "saved" ? savedLoading
    : browseLoading;

  return (
    <div className="min-h-screen bg-[#060d1b] text-white">
      {/* ── Guest nav bar (shown when not logged in / no sidebar) ── */}
      {!user && (
        <div className="border-b border-[#1e293b] bg-[#050b1a] px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-sm font-black text-white hover:text-cyan-400 transition-colors">
            <Globe className="w-4 h-4 text-cyan-400" />
            ViralBeat
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/scanner")} className="text-xs text-gray-400 hover:text-white transition-colors hidden sm:block">Africa Scanner</button>
            <button onClick={() => setLocation("/about")} className="text-xs text-gray-400 hover:text-white transition-colors hidden sm:block">About</button>
            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
              onClick={() => window.location.href = getLoginUrl()}>
              <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign in
            </Button>
          </div>
        </div>
      )}
      {/* ── Header ── */}
      <div className="border-b border-[#1e293b] bg-[#0a1628]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Archive className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl font-black text-white">Intelligence Archive</h1>
          </div>
          <p className="text-slate-400 text-sm ml-12">
            Analyst-authored reports, document analyses, and entry briefs across all 55 AU nations.
          </p>

          {/* Search bar */}
          <div className="mt-5 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") setSearchQuery(search); }}
              placeholder="Search reports by title, topic, country…"
              className="pl-9 bg-[#0f172a] border-[#1e293b] text-white placeholder:text-slate-600 focus:border-cyan-500/50"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setSearchQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >✕</button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">

        {/* ── Sidebar filters ── */}
        <aside className="w-full lg:w-56 shrink-0 space-y-5">
          {/* Tabs */}
          <div className="space-y-1">
            {([
              { id: "browse",   label: "Browse All",  icon: BookOpen },
              { id: "trending", label: "Trending",    icon: TrendingUp },
              { id: "saved",    label: "My Saved",    icon: Bookmark },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSearchQuery(""); setSearch(""); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  tab === t.id ? "bg-cyan-500/10 text-cyan-400 font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>

          {/* Country filter */}
          <div>
            <p className="text-[10px] font-bold tracking-[1.5px] text-slate-500 uppercase mb-2">Country</p>
            <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
              <button
                onClick={() => setCountryFilter("")}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${!countryFilter ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-white"}`}
              >All countries</button>
              {AFRICA_COUNTRIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setCountryFilter(c.code)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${countryFilter === c.code ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-white"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Report type filter */}
          <div>
            <p className="text-[10px] font-bold tracking-[1.5px] text-slate-500 uppercase mb-2">Report Type</p>
            <div className="space-y-0.5">
              {[
                { value: "", label: "All types" },
                { value: "document_analysis", label: "Doc Analysis" },
                { value: "signal_brief",      label: "Signal Brief" },
                { value: "go_no_go",          label: "Go / No-Go" },
                { value: "agent_report",      label: "Agent Report" },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${typeFilter === t.value ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-white"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Access key */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-bold tracking-[1.5px] text-slate-500 uppercase">Access</p>
            {[
              { icon: Globe,  color: "text-green-400", label: "Public — no login" },
              { icon: Users,  color: "text-cyan-400",  label: "Free — registered" },
              { icon: Crown,  color: "text-amber-400", label: "Premium — subscriber" },
              { icon: Lock,   color: "text-slate-500", label: "Private — author only" },
            ].map(a => (
              <div key={a.label} className="flex items-center gap-2 text-[10px] text-slate-400">
                <a.icon className={`w-3 h-3 ${a.color}`} />{a.label}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">
          {/* Active filters */}
          <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
            {searchQuery && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Search className="w-3 h-3" />"{searchQuery}"
                <button onClick={() => { setSearch(""); setSearchQuery(""); }} className="ml-1 hover:text-white">✕</button>
              </span>
            )}
            {countryFilter && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Globe className="w-3 h-3" />{AFRICA_COUNTRIES.find(c => c.code === countryFilter)?.name ?? countryFilter}
                <button onClick={() => setCountryFilter("")} className="ml-1 hover:text-white">✕</button>
              </span>
            )}
            {typeFilter && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">
                <FileText className="w-3 h-3" />{TYPE_LABEL[typeFilter]}
                <button onClick={() => setTypeFilter("")} className="ml-1 hover:text-white">✕</button>
              </span>
            )}
            {!isLoading && displayReports.length > 0 && (
              <span className="text-slate-500 ml-auto">{displayReports.length} report{displayReports.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {/* Section header */}
          {tab === "trending" && !searchQuery && !countryFilter && (
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">Trending this week</span>
              <span className="text-xs text-slate-500">— most viewed & downloaded</span>
            </div>
          )}
          {tab === "saved" && !me && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Lock className="w-10 h-10 text-slate-600 mb-3" />
              <p className="font-semibold text-white mb-1">Sign in to see your saved reports</p>
              <p className="text-xs text-slate-400">Save any report to your personal library from the Intelligence Workspace.</p>
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 animate-pulse">
                  <div className="h-3 w-24 bg-slate-700 rounded mb-3" />
                  <div className="h-4 w-full bg-slate-700 rounded mb-2" />
                  <div className="h-3 w-3/4 bg-slate-700/60 rounded" />
                </div>
              ))}
            </div>
          ) : displayReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Archive className="w-12 h-12 text-slate-700 mb-4" />
              <p className="font-semibold text-slate-300 mb-1">No reports yet</p>
              <p className="text-xs text-slate-500 max-w-xs mb-4">
                {tab === "saved"
                  ? "Reports you save from the Intelligence Workspace appear here."
                  : "Generate a report in the Intelligence Workspace, then archive it to make it visible here."}
              </p>
              <Button
                size="sm" variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                onClick={() => setLocation("/intelligence")}
              >
                <ChevronRight className="w-3.5 h-3.5 mr-1" />Go to Intelligence Workspace
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {displayReports.map((r: any) => (
                <ReportCard
                  key={r.reportId}
                  report={r}
                  savedIds={savedIds}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                  onOpen={setOpenReport}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Report drawer ── */}
      {openReport && (
        <ReportDrawer
          report={openReport}
          onClose={() => setOpenReport(null)}
          userTier={userTier}
        />
      )}
    </div>
  );
}
