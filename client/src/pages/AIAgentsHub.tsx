import { useState, useRef } from "react";
import {
  Loader2, Globe, Briefcase, Landmark, AlertTriangle, TrendingUp,
  Radio, Trash2, Plus, Copy, CheckCircle2, Download, Bell, ChevronRight,
  LogIn, Archive, X, Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

// ── Mission meta ──────────────────────────────────────────────────────────────

type MissionType = "country_brief" | "business_case" | "policy_brief" | "crisis_sitrep" | "investor_dd";

const MISSIONS: {
  id: MissionType;
  icon: React.ElementType;
  label: string;
  tagline: string;
  delivers: string[];
  accent: string;
  bg: string;
  border: string;
  prompt: string;
}[] = [
  {
    id: "country_brief",
    icon: Globe,
    label: "Country Intel Brief",
    tagline: "Full PESTEL+IR snapshot with Go/No-Go verdict",
    delivers: ["Brief PDF", "Risk Score"],
    accent: "#22d3ee",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    prompt: "Generate a country intelligence brief for ",
  },
  {
    id: "business_case",
    icon: Briefcase,
    label: "Business Case Builder",
    tagline: "Market entry · FDI · sector analysis · board memo",
    delivers: ["Board Memo", "Risk Matrix"],
    accent: "#a78bfa",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    prompt: "Build me a business case for entering ",
  },
  {
    id: "policy_brief",
    icon: Landmark,
    label: "Policy Analyst",
    tagline: "Bill tracking · regulatory drift · stakeholder map",
    delivers: ["Policy Brief", "Impact Score"],
    accent: "#34d399",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    prompt: "Analyse the policy and regulatory environment in ",
  },
  {
    id: "crisis_sitrep",
    icon: AlertTriangle,
    label: "Crisis SitRep",
    tagline: "Escalation trajectory · actor positions · alert level",
    delivers: ["SitRep", "Alert Level"],
    accent: "#fbbf24",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    prompt: "Generate a crisis situation report for ",
  },
  {
    id: "investor_dd",
    icon: TrendingUp,
    label: "Investor Due Diligence",
    tagline: "Sovereign risk · regulatory pipeline · exit scenarios",
    delivers: ["DD Report", "Verdict"],
    accent: "#f472b6",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    prompt: "Run investor political risk due diligence on ",
  },
];

const EXAMPLE_PROMPTS = [
  "Build me a business case for entering Kenya's fintech market",
  "Crisis SitRep — Sahel security escalation",
  "Policy brief: Nigeria tax reform impact on SMEs",
  "Country intel brief for Ethiopia Q3 2026",
  "Investor DD on DRC mining sector infrastructure",
];

const DIM_LABELS: Record<string, string> = {
  P: "Political", E: "Economic", S: "Social", T: "Technological",
  En: "Environmental", L: "Legal", IR: "Int'l Relations",
};

const VERDICT_META: Record<string, { color: string; bg: string; border: string }> = {
  "GO-MARKET":      { color: "#34d399", bg: "bg-emerald-500/15", border: "border-emerald-500/40" },
  "GO":             { color: "#34d399", bg: "bg-emerald-500/15", border: "border-emerald-500/40" },
  "CONDITIONAL GO": { color: "#22d3ee", bg: "bg-cyan-500/15",    border: "border-cyan-500/40" },
  "MONITOR":        { color: "#fbbf24", bg: "bg-amber-500/15",   border: "border-amber-500/40" },
  "CAUTION":        { color: "#fb923c", bg: "bg-orange-500/15",  border: "border-orange-500/40" },
  "AMBER":          { color: "#fbbf24", bg: "bg-amber-500/15",   border: "border-amber-500/40" },
  "GREEN":          { color: "#34d399", bg: "bg-emerald-500/15", border: "border-emerald-500/40" },
  "RED":            { color: "#f87171", bg: "bg-red-500/15",     border: "border-red-500/40" },
  "NO-GO":          { color: "#f87171", bg: "bg-red-500/15",     border: "border-red-500/40" },
};

function verdictStyle(v: string) {
  return VERDICT_META[v.toUpperCase()] ?? { color: "#94a3b8", bg: "bg-slate-500/15", border: "border-slate-500/40" };
}

// ── Watchlist modal ───────────────────────────────────────────────────────────

const PESTEL_DIMS = ["P","E","S","T","En","L","IR"];
const SEVERITY_OPTS = [
  { value: "normal",   label: "Any signal" },
  { value: "alert",    label: "Alert & above" },
  { value: "breaking", label: "Breaking only" },
];

function WatchlistModal({
  onClose,
  prefillLabel,
  prefillCodes,
  prefillDims,
}: {
  onClose: () => void;
  prefillLabel?: string;
  prefillCodes?: string[];
  prefillDims?: string[];
}) {
  const [label, setLabel] = useState(prefillLabel ?? "");
  const [codes, setCodes] = useState(prefillCodes?.join(", ") ?? "");
  const [dims, setDims] = useState<string[]>(prefillDims ?? []);
  const [sector, setSector] = useState("");
  const [keywords, setKeywords] = useState("");
  const [severity, setSeverity] = useState<"normal"|"alert"|"breaking">("alert");

  const create = trpc.aiAgents.createWatchlist.useMutation({
    onSuccess: () => { toast.success("Watchlist created."); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleDim = (d: string) =>
    setDims(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" /> Create Signal Watchlist
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Watchlist name</label>
            <Input value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g., Kenya Fintech Risk Monitor"
              className="bg-[#050b1a] border-[#1e3a5f] text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Countries (ISO3 codes, comma-separated)</label>
            <Input value={codes} onChange={e => setCodes(e.target.value)}
              placeholder="e.g., KEN, NGA, GHA — leave blank for all Africa"
              className="bg-[#050b1a] border-[#1e3a5f] text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">PESTEL dimensions to watch</label>
            <div className="flex flex-wrap gap-2">
              {PESTEL_DIMS.map(d => (
                <button key={d} onClick={() => toggleDim(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    dims.includes(d)
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                      : "bg-[#050b1a] border-[#1e3a5f] text-gray-500 hover:border-cyan-500/20"
                  }`}>
                  {DIM_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sector (optional)</label>
              <Input value={sector} onChange={e => setSector(e.target.value)}
                placeholder="e.g., Fintech, Mining"
                className="bg-[#050b1a] border-[#1e3a5f] text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Alert threshold</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as any)}
                className="w-full bg-[#050b1a] border border-[#1e3a5f] text-white text-sm rounded-md px-3 py-2">
                {SEVERITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Keywords (comma-separated, optional)</label>
            <Input value={keywords} onChange={e => setKeywords(e.target.value)}
              placeholder="e.g., Finance Bill, CBK, protests"
              className="bg-[#050b1a] border-[#1e3a5f] text-white text-sm" />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-[#1e3a5f] text-gray-400">
            Cancel
          </Button>
          <Button
            disabled={!label.trim() || create.isPending}
            onClick={() => create.mutate({
              label: label.trim(),
              countryCodes: codes.split(",").map(c => c.trim().toUpperCase()).filter(Boolean),
              pestelDims: dims,
              sector: sector.trim() || undefined,
              keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
              thresholdSeverity: severity,
            })}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Watchlist"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIAgentsHub() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Document attachment
  const [attachedDoc, setAttachedDoc] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setAttachedDoc({ name: file.name, content: text });
      toast.success(`${file.name} attached — will ground the mission`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Prompt + classification
  const [prompt, setPrompt] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [classified, setClassified] = useState<{
    missionType: MissionType; country: string; countryCode: string;
    sector: string; pestelDims: string[]; keywords: string[]; confidence: number; refinedPrompt: string;
  } | null>(null);

  // Mission output
  const [missionResult, setMissionResult] = useState<{
    missionType: MissionType; country: string; sector: string | null;
    bodyMd: string; verdict: string; signalCount: number;
    signals: Array<{ headline: string; dim: string; severity: string; source: string }>;
    reportId: string | null; citationKey: string | null;
    generatedAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Watchlists
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [watchlistPrefill, setWatchlistPrefill] = useState<{ label?: string; codes?: string[]; dims?: string[] }>({});
  const [activeTab, setActiveTab] = useState<"missions" | "watchlists">("missions");

  const classifyIntent = trpc.aiAgents.classifyIntent.useMutation();
  const runMission = trpc.aiAgents.runMission.useMutation({
    onSuccess: (data) => setMissionResult(data as any),
    onError: (e) => toast.error("Mission failed: " + e.message),
  });
  const { data: watchlists, refetch: refetchWatchlists } = trpc.aiAgents.listWatchlists.useQuery(undefined, { enabled: !!user });
  const deleteWatchlist = trpc.aiAgents.deleteWatchlist.useMutation({
    onSuccess: () => { toast.success("Watchlist removed."); refetchWatchlists(); },
  });

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;
    setClassifying(true);
    setMissionResult(null);
    setClassified(null);
    try {
      const result = await classifyIntent.mutateAsync({ prompt: prompt.trim() });
      setClassified(result);
      // Auto-run the mission immediately after classification
      const missionData = await runMission.mutateAsync({
        missionType: result.missionType,
        country: result.country,
        countryCode: result.countryCode || undefined,
        sector: result.sector || undefined,
        pestelDims: result.pestelDims,
        keywords: result.keywords,
        refinedPrompt: result.refinedPrompt,
        documentContext: attachedDoc?.content,
        documentName: attachedDoc?.name,
      });
      setMissionResult(missionData as any);
    } catch (e: any) {
      toast.error(e.message || "Failed to run mission");
    } finally {
      setClassifying(false);
    }
  };

  const handleQuickLaunch = (mission: typeof MISSIONS[0]) => {
    setPrompt(mission.prompt);
    setMissionResult(null);
    setClassified(null);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const isRunning = classifying || runMission.isPending;
  const currentMission = classified ? MISSIONS.find(m => m.id === classified.missionType) : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-6">
        <div className="bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl max-w-md w-full p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
            <Globe className="w-7 h-7 text-cyan-400" />
          </div>
          <h2 className="text-xl font-black text-white">Intelligence Agents</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            AI-powered decision agents built on live VB signals — business cases, policy briefs, crisis SitReps, and investor due diligence for every African nation.
          </p>
          <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
            onClick={() => window.location.href = getLoginUrl()}>
            <LogIn className="w-4 h-4 mr-2" /> Sign in to access
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {showWatchlistModal && (
        <WatchlistModal
          onClose={() => { setShowWatchlistModal(false); refetchWatchlists(); }}
          prefillLabel={watchlistPrefill.label}
          prefillCodes={watchlistPrefill.codes}
          prefillDims={watchlistPrefill.dims}
        />
      )}

      {/* Header */}
      <div className="border-b border-white/10 px-4 sm:px-6 py-5 bg-[#0f1f38]/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Intelligence Agents</h1>
            <p className="text-xs text-gray-400 mt-0.5">Describe your mission — agents pull live VB signals and deliver decision-ready intelligence</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("missions")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeTab === "missions" ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300" : "bg-transparent border-[#1e3a5f] text-gray-500"
              }`}>
              Missions
            </button>
            <button onClick={() => setActiveTab("watchlists")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                activeTab === "watchlists" ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300" : "bg-transparent border-[#1e3a5f] text-gray-500"
              }`}>
              <Bell className="w-3 h-3" /> Watchlists
              {watchlists && watchlists.length > 0 && (
                <span className="bg-cyan-500 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {watchlists.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">

        {/* ── MISSIONS TAB ── */}
        {activeTab === "missions" && (
          <>
            {/* Prompt bar */}
            <div className="bg-[#0d1e36] border border-cyan-500/30 rounded-2xl p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.json"
                className="hidden"
                onChange={handleDocAttach}
              />
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-cyan-400 font-black text-sm">⚡</span>
                </div>
                <input
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500 min-w-0"
                  placeholder="Describe your mission — e.g. 'Build me a business case for entering Kenya's fintech market'…"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !isRunning && handlePromptSubmit()}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach a document to ground the mission"
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${attachedDoc ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400" : "bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20"}`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <Button
                  onClick={handlePromptSubmit}
                  disabled={!prompt.trim() || isRunning}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm px-5 shrink-0"
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Run Agent <ChevronRight className="w-3.5 h-3.5 ml-1" /></>}
                </Button>
              </div>
              {/* Attached document chip */}
              {attachedDoc && (
                <div className="flex items-center gap-2 mt-2 ml-11">
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1">
                    <Paperclip className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-emerald-300 max-w-[200px] truncate">{attachedDoc.name}</span>
                    <span className="text-[10px] text-emerald-600">{Math.round(attachedDoc.content.length / 1000)}k chars</span>
                    <button onClick={() => setAttachedDoc(null)} className="ml-1 text-emerald-600 hover:text-emerald-300">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-600">Document will be injected into the mission context</span>
                </div>
              )}
              {/* Example chips */}
              <div className="flex flex-wrap gap-2 mt-3 ml-11">
                {EXAMPLE_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => setPrompt(p)}
                    className="text-[11px] text-gray-500 border border-[#1e3a5f] rounded-full px-3 py-1 hover:border-cyan-500/30 hover:text-gray-300 transition-all">
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Classification receipt (shown briefly while running, then stays) */}
            {classified && (
              <div className="bg-[#050b1a] border border-[#1e3a5f] rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Agent routed →</span>
                {currentMission && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${currentMission.bg} ${currentMission.border}`}
                    style={{ color: currentMission.accent }}>
                    {currentMission.label}
                  </span>
                )}
                {classified.country && <span className="text-xs text-gray-300">{classified.country}</span>}
                {classified.sector && <span className="text-xs text-gray-400">/ {classified.sector}</span>}
                {classified.pestelDims.map(d => (
                  <Badge key={d} className="text-[9px] bg-white/5 text-gray-400 border-white/10">{DIM_LABELS[d] ?? d}</Badge>
                ))}
                <span className="text-[10px] text-gray-600 ml-auto">{Math.round(classified.confidence * 100)}% confidence</span>
              </div>
            )}

            {/* Running state */}
            {isRunning && (
              <div className="bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl p-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                <p className="text-sm text-white font-semibold">
                  {classifying && !runMission.isPending ? "Classifying intent…" : "Pulling live VB signals and generating intelligence product…"}
                </p>
                <p className="text-xs text-gray-500">This may take 15–30 seconds for a full analysis</p>
              </div>
            )}

            {/* Mission output */}
            {missionResult && !isRunning && (
              <div className="bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl overflow-hidden">
                {/* Output header */}
                <div className="bg-[#0a1628] border-b border-[#1e3a5f] px-5 py-4 flex items-start gap-4">
                  {currentMission && (
                    <div className={`w-10 h-10 rounded-xl ${currentMission.bg} border ${currentMission.border} flex items-center justify-center shrink-0`}>
                      <currentMission.icon className="w-5 h-5" style={{ color: currentMission.accent }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-black text-white">
                      {currentMission?.label ?? "Intelligence Report"} — {missionResult.country}
                      {missionResult.sector ? ` / ${missionResult.sector}` : ""}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {missionResult.signalCount} live VB signals synthesised · {new Date(missionResult.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  {/* Verdict */}
                  {(() => {
                    const vs = verdictStyle(missionResult.verdict);
                    return (
                      <div className={`shrink-0 px-3 py-1.5 rounded-xl border text-xs font-black ${vs.bg} ${vs.border}`}
                        style={{ color: vs.color }}>
                        ✓ {missionResult.verdict}
                      </div>
                    );
                  })()}
                </div>

                {/* Three-column body */}
                <div className="grid lg:grid-cols-[220px_1fr_200px] divide-y lg:divide-y-0 lg:divide-x divide-[#1e3a5f]">

                  {/* Col 1: Live signals */}
                  <div className="p-4 space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse inline-block" />
                      VB Signals ({missionResult.signalCount})
                    </p>
                    {missionResult.signals.length > 0 ? (
                      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                        {missionResult.signals.map((sig, i) => (
                          <div key={i} className="border-b border-[#0f1e35] pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                sig.severity === "breaking" ? "bg-red-500/20 text-red-400" :
                                sig.severity === "alert"    ? "bg-amber-500/20 text-amber-400" :
                                "bg-white/5 text-gray-500"
                              }`}>{sig.dim}</span>
                              {sig.severity !== "normal" && (
                                <span className={`text-[9px] font-bold uppercase ${sig.severity === "breaking" ? "text-red-400" : "text-amber-400"}`}>
                                  {sig.severity}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-300 leading-snug">{sig.headline}</p>
                            <p className="text-[10px] text-gray-600 mt-1">{sig.source}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 italic">No signals in DB for this country — brief synthesised from knowledge base.</p>
                    )}
                  </div>

                  {/* Col 2: Full intelligence product */}
                  <div className="p-5 max-h-[560px] overflow-y-auto">
                    <Streamdown className="prose prose-invert prose-sm max-w-none [&_*]:text-gray-100 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_strong]:text-white [&_p]:text-gray-200 [&_li]:text-gray-200 [&_code]:text-cyan-300 [&_blockquote]:text-gray-300 [&_blockquote]:border-cyan-500">{missionResult.bodyMd}</Streamdown>
                  </div>

                  {/* Col 3: Deliverables */}
                  <div className="p-4 space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Deliverables</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleDownload(missionResult.bodyMd, `VB-${missionResult.country.replace(/\s+/g,"-")}-${missionResult.missionType}-${Date.now()}.md`)}
                        className="w-full flex items-center gap-2.5 bg-[#050b1a] border border-[#1e3a5f] rounded-xl p-3 hover:border-cyan-500/30 transition-all text-left group">
                        <Download className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-200">Download Report</p>
                          <p className="text-[10px] text-gray-500">Markdown · full analysis</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleCopy(missionResult.bodyMd)}
                        className="w-full flex items-center gap-2.5 bg-[#050b1a] border border-[#1e3a5f] rounded-xl p-3 hover:border-cyan-500/30 transition-all text-left group">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 shrink-0" />}
                        <div>
                          <p className="text-xs font-bold text-gray-200">Copy to clipboard</p>
                          <p className="text-[10px] text-gray-500">Paste into any tool</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          const title = `${currentMission?.label ?? "Intelligence Brief"} — ${missionResult.country}${missionResult.sector ? " / " + missionResult.sector : ""}`;
                          try {
                            sessionStorage.setItem("vb_intelligence_import", JSON.stringify({
                              content: missionResult.bodyMd,
                              fileName: `VB-${missionResult.country.replace(/\s+/g, "-")}-${missionResult.missionType}.md`,
                              title,
                            }));
                          } catch {}
                          setLocation("/intelligence");
                        }}
                        className="w-full flex items-center gap-2.5 bg-[#050b1a] border border-[#1e3a5f] rounded-xl p-3 hover:border-violet-500/30 transition-all text-left group">
                        <Archive className="w-4 h-4 text-gray-500 group-hover:text-violet-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-200">Deep Analysis</p>
                          <p className="text-[10px] text-gray-500">Open in Intelligence Workspace</p>
                        </div>
                      </button>
                      {missionResult.reportId && (
                        <button
                          onClick={() => setLocation("/archive")}
                          className="w-full flex items-center gap-2.5 bg-[#050b1a] border border-emerald-500/25 rounded-xl p-3 hover:border-emerald-500/40 transition-all text-left group">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-emerald-300">Archived (private)</p>
                            <p className="text-[10px] text-gray-500">{missionResult.citationKey ?? missionResult.reportId.slice(0,8)} · View in Archive</p>
                          </div>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setWatchlistPrefill({
                            label: `${missionResult.country}${missionResult.sector ? " / " + missionResult.sector : ""} — Signal Watch`,
                            codes: classified?.countryCode ? [classified.countryCode] : [],
                            dims: classified?.pestelDims ?? [],
                          });
                          setShowWatchlistModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 bg-[#050b1a] border border-[#1e3a5f] rounded-xl p-3 hover:border-amber-500/30 transition-all text-left group">
                        <Bell className="w-4 h-4 text-gray-500 group-hover:text-amber-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-200">Set Signal Watch</p>
                          <p className="text-[10px] text-gray-500">Get alerts when signals change</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick launch grid (shown when no result) */}
            {!missionResult && !isRunning && (
              <>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quick Launch — Mission Types</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MISSIONS.map(m => (
                    <button key={m.id} onClick={() => handleQuickLaunch(m)}
                      className="group bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl p-4 text-left hover:border-white/20 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-xl ${m.bg} border ${m.border} flex items-center justify-center`}>
                          <m.icon className="w-4 h-4" style={{ color: m.accent }} />
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 mt-0.5 transition-colors" />
                      </div>
                      <h3 className="text-sm font-black text-white mb-1">{m.label}</h3>
                      <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{m.tagline}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Delivers →</span>
                        <div className="flex gap-1.5">
                          {m.delivers.map(d => (
                            <span key={d} className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                              style={{ color: m.accent, background: `${m.accent}12`, borderColor: `${m.accent}30` }}>
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                  {/* Watchlist card */}
                  <button onClick={() => { setWatchlistPrefill({}); setShowWatchlistModal(true); }}
                    className="group bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl p-4 text-left hover:border-white/20 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                        <Radio className="w-4 h-4 text-cyan-400" />
                      </div>
                      <Plus className="w-4 h-4 text-gray-700 group-hover:text-gray-400 mt-0.5 transition-colors" />
                    </div>
                    <h3 className="text-sm font-black text-white mb-1">Signal Watchlist</h3>
                    <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">Standing watch on a country, sector, or PESTEL dimension — alerts when signals cross your threshold</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Delivers →</span>
                      <div className="flex gap-1.5">
                        {["Alerts", "Weekly Digest"].map(d => (
                          <span key={d} className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-cyan-400 border-cyan-500/30" style={{ background: "#22d3ee12" }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Navigation footer */}
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Intelligence Workspace", desc: "Document analysis + PESTEL briefings", href: "/intelligence", color: "#a78bfa" },
                { label: "Africa Scanner", desc: "Live signals for all 55 African nations", href: "/scanner", color: "#22d3ee" },
                { label: "Report Archive", desc: "Browse and search all published briefs", href: "/archive", color: "#34d399" },
              ].map((item) => (
                <button key={item.href} onClick={() => setLocation(item.href)}
                  className="group flex items-center gap-3 bg-[#0d1e36] border border-[#1e3a5f] rounded-xl px-4 py-3 hover:border-white/20 transition-all text-left">
                  <div className="w-2 h-8 rounded-full shrink-0" style={{ background: item.color, opacity: 0.6 }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── WATCHLISTS TAB ── */}
        {activeTab === "watchlists" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Signal Watchlists</h2>
                <p className="text-xs text-gray-400 mt-0.5">Standing watches on countries, sectors, and PESTEL dimensions. Triggers on next scanner cycle.</p>
              </div>
              <Button onClick={() => { setWatchlistPrefill({}); setShowWatchlistModal(true); }}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm">
                <Plus className="w-4 h-4 mr-1.5" /> New Watchlist
              </Button>
            </div>

            {!watchlists || watchlists.length === 0 ? (
              <div className="bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl p-12 text-center">
                <Bell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-semibold">No watchlists yet</p>
                <p className="text-xs text-gray-600 mt-1 mb-5">Run a mission and click "Set Signal Watch" to create one from its context, or add one manually.</p>
                <Button onClick={() => { setWatchlistPrefill({}); setShowWatchlistModal(true); }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                  <Plus className="w-4 h-4 mr-1.5" /> Create Watchlist
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {watchlists.map((w) => (
                  <div key={w.watchId} className="bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          w.isActive ? "bg-cyan-500/15 border border-cyan-500/30" : "bg-white/5 border border-white/10"
                        }`}>
                          <Bell className={`w-3.5 h-3.5 ${w.isActive ? "text-cyan-400" : "text-gray-600"}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white leading-tight">{w.label}</h3>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Threshold: <span className={`font-semibold ${
                              w.thresholdSeverity === "breaking" ? "text-red-400" :
                              w.thresholdSeverity === "alert" ? "text-amber-400" : "text-gray-400"
                            }`}>{w.thresholdSeverity}</span>
                            {" · "}Triggers: {w.triggerCount}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => deleteWatchlist.mutate({ watchId: w.watchId })}
                        className="text-gray-600 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(w.countryCodes as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(w.countryCodes as string[]).map(c => (
                            <span key={c} className="text-[10px] font-semibold px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-300">{c}</span>
                          ))}
                        </div>
                      )}
                      {(w.pestelDims as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(w.pestelDims as string[]).map(d => (
                            <span key={d} className="text-[10px] font-semibold px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/25 rounded-full text-cyan-400">
                              {DIM_LABELS[d] ?? d}
                            </span>
                          ))}
                        </div>
                      )}
                      {w.sector && (
                        <p className="text-[10px] text-gray-500">Sector: <span className="text-gray-300">{w.sector}</span></p>
                      )}
                      {(w.keywords as string[]).length > 0 && (
                        <p className="text-[10px] text-gray-500">Keywords: <span className="text-gray-300">{(w.keywords as string[]).join(", ")}</span></p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#1e3a5f] flex items-center justify-between">
                      <span className="text-[10px] text-gray-600">
                        Created {new Date(w.createdAt).toLocaleDateString()}
                        {w.lastTriggeredAt ? ` · Last triggered ${new Date(w.lastTriggeredAt).toLocaleDateString()}` : " · Never triggered"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        w.isActive
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-white/5 border-white/10 text-gray-500"
                      }`}>{w.isActive ? "Active" : "Paused"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
