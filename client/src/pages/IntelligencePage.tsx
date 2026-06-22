import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Loader2, Send, Sparkles, TrendingUp, Target, Lightbulb, Zap, Paperclip, X as XIcon,
  FileText, Star, Share2, Download, Check, Globe, MapPin, ChevronRight, AlertCircle, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { AnimatePresence, motion } from "framer-motion";

// ── types ───────────────────────────────────────────────────────────────────

type GeoLayer = "continental" | "regional" | "country";
type PestelCategory = "political" | "economic" | "social" | "technological" | "environmental" | "legal";

interface Signal {
  id: string;
  topic: string;
  summary?: string;
  geoScope?: string;
  pestelCategory?: string;
  trendScore?: number;
  source?: string;
}

const PESTEL: { id: PestelCategory; label: string; color: string; bg: string }[] = [
  { id: "political",     label: "P", color: "text-red-400",    bg: "bg-red-500/15 border-red-500/30" },
  { id: "economic",      label: "E", color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/30" },
  { id: "social",        label: "S", color: "text-green-400",  bg: "bg-green-500/15 border-green-500/30" },
  { id: "technological", label: "T", color: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/30" },
  { id: "environmental", label: "En", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  { id: "legal",         label: "L", color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30" },
];

const AFRICA_REGIONS = [
  { id: "east-africa",    label: "East Africa" },
  { id: "west-africa",    label: "West Africa" },
  { id: "central-africa", label: "Central Africa" },
  { id: "north-africa",   label: "North Africa" },
  { id: "southern-africa",label: "Southern Africa" },
];

const AFRICA_COUNTRIES = [
  { id: "ke", label: "Kenya" },
  { id: "ng", label: "Nigeria" },
  { id: "za", label: "South Africa" },
  { id: "gh", label: "Ghana" },
  { id: "tz", label: "Tanzania" },
  { id: "et", label: "Ethiopia" },
  { id: "eg", label: "Egypt" },
  { id: "sn", label: "Senegal" },
];

// ── component ───────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── geo / PESTEL filter state ──
  const [geoLayer, setGeoLayer] = useState<GeoLayer>("continental");
  const [selectedRegion, setSelectedRegion] = useState("east-africa");
  const [selectedCountry, setSelectedCountry] = useState("ke");
  const [selectedCategory, setSelectedCategory] = useState<PestelCategory>("political");

  // ── signal selection ──
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [signalAnalysis, setSignalAnalysis] = useState<string>("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // ── chat ──
  const [sessionId, setSessionId] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [fileExtracting, setFileExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ── right panel tabs ──
  const [rightTab, setRightTab] = useState("chat");

  // ── game theory analyser ──
  const [gtTitle, setGtTitle] = useState("");
  const [gtUrl, setGtUrl] = useState("");
  const [gtType, setGtType] = useState<"video" | "image" | "text" | "audio" | "research">("text");
  const [gtPlatform, setGtPlatform] = useState<"youtube" | "tiktok" | "instagram" | "twitter" | "journal">("twitter");
  const [copiedInsight, setCopiedInsight] = useState(false);
  const [gtTitleHint, setGtTitleHint] = useState(false);

  // ── forecast (premium) ──
  const [forecastTopic, setForecastTopic] = useState("");
  const [forecastTimeframe, setForecastTimeframe] = useState<"7days" | "30days">("7days");
  const [forecastRun, setForecastRun] = useState(false);

  // ── ratings ──
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});

  // ── derived scope ──
  const scopeKey =
    geoLayer === "continental" ? "au" :
    geoLayer === "regional"    ? selectedRegion :
                                 selectedCountry;

  const queryCategory = `${geoLayer}:${scopeKey}:${selectedCategory}`;

  // ── tRPC ──
  const utils = trpc.useUtils();

  const { data: signals, isLoading: signalsLoading } = trpc.xTrends.getTrending.useQuery(
    { topic: queryCategory, limit: 20 },
    { refetchInterval: 120_000 }
  );

  const { data: conversations } = trpc.aiAssistant.getConversations.useQuery({ sessionId });
  const { data: insights } = trpc.aiAssistant.getAnalyses.useQuery({ limit: 10 });

  const summarizeTrends = trpc.xTrends.summarizeTrends.useMutation({
    onSuccess: (data) => {
      setSignalAnalysis(data.summary || "");
      setAnalysisLoading(false);
    },
    onError: () => setAnalysisLoading(false),
  });

  const rateSignal = trpc.xTrends.rateSignal.useMutation();

  const sendMessage = trpc.aiAssistant.chat.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setChatMessage("");
    },
  });

  const analyzeContent = trpc.aiAssistant.analyzeContent.useMutation({
    onSuccess: async () => {
      toast.success("Game Theory analysis complete!");
      setGtTitle("");
      setGtUrl("");
      await utils.aiAssistant.getAnalyses.invalidate();
      setRightTab("insights");
    },
  });

  // Premium analytics
  const { data: premiumAccess } = trpc.premiumAnalytics.checkAccess.useQuery();
  const hasPremium = premiumAccess?.hasAccess ?? false;

  const { data: forecastData, isLoading: forecastLoading, refetch: runForecast } =
    trpc.premiumAnalytics.getForecast.useQuery(
      { topic: forecastTopic || "Africa political signals", timeframe: forecastTimeframe },
      { enabled: false }
    );
  const { data: insightsData, isLoading: insightsLoading, refetch: runInsights } =
    trpc.premiumAnalytics.getAdvancedInsights.useQuery(
      { topic: forecastTopic || "Africa political signals" },
      { enabled: false }
    );

  const extractDocument = trpc.aiAssistant.extractDocument.useMutation({
    onSuccess: (data) => {
      setFileExtracting(false);
      setAttachedFile({ name: data.fileName, content: data.text });
      toast.success(`${data.fileName} — ${Math.round(data.charCount / 1000)}k chars extracted`);
      sendMessage.mutate({
        message: `I've attached "${data.fileName}". Provide an overview: summarise key findings, identify active PESTEL dimensions, map key actors and positions, and flag signals relevant to East Africa.`,
        sessionId: sessionId || undefined,
        fileContent: data.text,
        fileName: data.fileName,
      });
    },
    onError: (err) => {
      toast.error("Extraction failed: " + err.message);
      setFileExtracting(false);
    },
  });

  // ── auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  // ── handlers ──
  const ACCEPTED_TYPES = ["application/pdf", "text/plain", "text/markdown", "text/csv"];
  const ACCEPTED_EXT = [".pdf", ".txt", ".md", ".csv"];

  const processFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXT.some(ext => file.name.toLowerCase().endsWith(ext))) {
      toast.error(`Unsupported file type. Please upload a PDF, TXT, MD, or CSV file.`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large — maximum 20 MB.");
      return;
    }
    setFileExtracting(true);
    setRightTab("chat");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      extractDocument.mutate({ base64: btoa(binary), fileName: file.name, mimeType: file.type || "application/pdf" });
    } catch (err: any) {
      toast.error("Could not read file: " + (err?.message ?? "unknown"));
      setFileExtracting(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAnalyzeSignal = (signal: Signal) => {
    setActiveSignal(signal);
    setSignalAnalysis("");
    setAnalysisLoading(true);
    setRightTab("chat");
    summarizeTrends.mutate({
      topic: signal.topic,
      geoScope: scopeKey,
      pestelCategory: selectedCategory,
    });
    // Inject signal as context message into chat
    sendMessage.mutate({
      message: `Analyse this intelligence signal for ${AFRICA_COUNTRIES.find(c => c.id === scopeKey)?.label ?? scopeKey.toUpperCase()} — PESTEL dimension: ${selectedCategory.toUpperCase()}.\n\nSignal: "${signal.topic}"\n\nProvide: (1) Key actors and their dominant strategies, (2) PESTEL breakdown, (3) Game Theory payoff matrix, (4) Recommended intelligence move.`,
      sessionId: sessionId || undefined,
      fileContent: attachedFile?.content,
      fileName: attachedFile?.name,
    });
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() && !attachedFile) return;
    const signalPrefix = activeSignal
      ? `[Signal context: "${activeSignal.topic}" — ${selectedCategory} / ${scopeKey}]\n\n`
      : "";
    sendMessage.mutate({
      message: signalPrefix + (chatMessage.trim() || `Analyse this document: ${attachedFile?.name}`),
      sessionId: sessionId || undefined,
      fileContent: attachedFile?.content,
      fileName: attachedFile?.name,
    });
  };

  const handleRateSignal = (signalId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [signalId]: rating }));
    rateSignal.mutate({ signalId, rating });
  };

  const handleShareAnalysis = async (insight: any) => {
    const text = buildAnalysisText(insight);
    if (navigator.share) {
      await navigator.share({ title: `ViralBeat GT Analysis — ${insight.contentTitle}`, text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedInsight(true);
      toast.success("Copied to clipboard.");
      setTimeout(() => setCopiedInsight(false), 2000);
    }
  };

  const handleDownloadAnalysis = (insight: any) => {
    const blob = new Blob([buildAnalysisText(insight)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viralbeat-gt-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildAnalysisText = (insight: any) => {
    const perf = safeJson(insight.predictedPerformance, {});
    const recs: string[] = safeJson(insight.recommendations, []);
    const strengths: string[] = safeJson(insight.strengths, []);
    const tags: string[] = safeJson(insight.optimizedHashtags, []);
    return [
      `VIRALBEAT — GAME THEORY ANALYSIS`,
      `Generated: ${new Date(insight.createdAt).toLocaleDateString()}`,
      ``,
      `CONTENT: ${insight.contentTitle}`,
      `PLATFORM: ${insight.platform?.toUpperCase()} | TYPE: ${insight.contentType?.toUpperCase()}`,
      `GAME THEORY SCORE: ${insight.viralityScore}/10`,
      ``,
      perf.gameTheoryMove ? `DOMINANT STRATEGY MOVE\n${perf.gameTheoryMove}` : "",
      perf.missionAlignment ? `MISSION ALIGNMENT: ${perf.missionAlignment}` : "",
      ``,
      `OPTIMISED TITLE\n${insight.optimizedTitle}`,
      ``,
      strengths.length ? `STRATEGIC STRENGTHS\n${strengths.map((s: string) => `+ ${s}`).join("\n")}` : "",
      ``,
      recs.length ? `STRATEGIC MOVES\n${recs.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}` : "",
      ``,
      tags.length ? `PESTEL SIGNAL TAGS\n${tags.join("  ")}` : "",
      ``,
      `— ViralBeat Africa Political Intelligence | viralbeat.io`,
    ].filter(Boolean).join("\n");
  };

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Top bar ── */}
      <div className="shrink-0 border-b border-border/50 bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Title */}
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-lg tracking-tight">Intelligence Workspace</span>
          </div>

          {/* Geo scope */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center rounded-lg border border-border/50 overflow-hidden text-xs">
              {(["continental","regional","country"] as GeoLayer[]).map(l => (
                <button
                  key={l}
                  onClick={() => setGeoLayer(l)}
                  className={`px-3 py-1.5 capitalize transition-colors ${geoLayer === l ? "bg-cyan-500/20 text-cyan-400 font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {l === "continental" ? <Globe className="w-3.5 h-3.5 inline mr-1" /> : <MapPin className="w-3.5 h-3.5 inline mr-1" />}
                  {l === "continental" ? "Africa" : l}
                </button>
              ))}
            </div>

            {geoLayer === "regional" && (
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AFRICA_REGIONS.map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {geoLayer === "country" && (
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AFRICA_COUNTRIES.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* PESTEL filter chips */}
          <div className="flex items-center gap-1">
            {PESTEL.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedCategory(p.id)}
                className={`px-2 py-1 rounded-md border text-[11px] font-bold transition-all ${selectedCategory === p.id ? `${p.bg} ${p.color}` : "border-border/40 text-muted-foreground hover:border-border"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* hidden file input — triggered from chat input row */}
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.csv" className="hidden" onChange={handleFileUpload} />

      {/* ── Main split pane ── */}
      <div className="flex-1 overflow-hidden grid lg:grid-cols-5">

        {/* ══ LEFT — Signal feed ══ */}
        <div className="lg:col-span-2 border-r border-border/50 overflow-y-auto flex flex-col">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Signals</p>
            {signalsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>

          <div className="flex-1 p-3 space-y-2">
            {signalsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
              ))
            ) : signals && signals.length > 0 ? (
              signals.map((signal: any, idx: number) => {
                const pestelDim = signal.pestelCategory as PestelCategory | undefined;
                const p = PESTEL.find(x => x.id === pestelDim) ?? PESTEL[0];
                const isActive = activeSignal?.id === signal.id || activeSignal?.topic === signal.topic;
                return (
                  <motion.div
                    key={signal.id ?? idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <button
                      className={`w-full text-left rounded-xl border p-3 transition-all group ${isActive ? "border-cyan-500/50 bg-cyan-500/8" : "border-border/40 hover:border-border/80 hover:bg-muted/30"}`}
                      onClick={() => handleAnalyzeSignal({ id: signal.id ?? String(idx), topic: signal.topic, summary: signal.summary, geoScope: scopeKey, pestelCategory: pestelDim })}
                    >
                      <div className="flex items-start gap-2">
                        {/* Rank badge */}
                        <span className="text-[10px] font-black text-muted-foreground shrink-0 mt-0.5 w-4 text-right">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug line-clamp-2">{signal.topic}</p>
                          {signal.summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{signal.summary}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {pestelDim && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${p.bg} ${p.color}`}>{pestelDim.toUpperCase().slice(0, 3)}</span>
                            )}
                            {signal.trendScore != null && (
                              <span className="text-[10px] text-muted-foreground">Score {signal.trendScore}</span>
                            )}
                            <span className="ml-auto text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                              Analyse <ChevronRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Star rating row */}
                      <div className="flex items-center gap-0.5 mt-2 ml-6" onClick={e => e.stopPropagation()}>
                        {[1,2,3,4,5].map(star => (
                          <button
                            key={star}
                            onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [signal.id ?? idx]: star }))}
                            onMouseLeave={() => setHoverRatings(prev => { const n = { ...prev }; delete n[signal.id ?? idx]; return n; })}
                            onClick={() => handleRateSignal(signal.id ?? String(idx), star)}
                            className="p-0.5"
                          >
                            <Star className={`w-3 h-3 ${star <= (hoverRatings[signal.id ?? idx] ?? ratings[signal.id ?? idx] ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
                          </button>
                        ))}
                      </div>
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No signals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different geo scope or PESTEL dimension</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT — Analysis workspace ══ */}
        <div className="lg:col-span-3 flex flex-col overflow-hidden">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 px-4 pt-3 border-b border-border/40">
              <TabsList className="grid w-full max-w-lg grid-cols-4 h-8">
                <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                <TabsTrigger value="analyze" className="text-xs">Game Theory</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
                <TabsTrigger value="forecast" className="text-xs flex items-center gap-1">
                  Forecast {hasPremium ? null : <span className="text-[9px] text-amber-400">★</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── CHAT TAB ── */}
            <TabsContent
              value="chat"
              className="flex-1 flex flex-col overflow-hidden m-0 p-0 data-[state=active]:flex relative"
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
              onDrop={handleDrop}
            >
              {/* Drag-over overlay */}
              <AnimatePresence>
                {dragOver && (
                  <motion.div
                    key="drag-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-400 bg-cyan-500/10 pointer-events-none"
                  >
                    <FileText className="w-10 h-10 text-cyan-400 mb-3" />
                    <p className="text-sm font-bold text-cyan-400">Drop to upload</p>
                    <p className="text-xs text-cyan-400/70 mt-1">PDF · TXT · MD · CSV</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Context banners */}
              <div className="shrink-0 px-4 pt-3 space-y-2">
                <AnimatePresence>
                  {activeSignal && (
                    <motion.div
                      key="signal-ctx"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-cyan-500/25 bg-cyan-500/8 px-4 py-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Signal Context</span>
                            {analysisLoading && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
                          </div>
                          <p className="text-xs text-gray-300 line-clamp-1">{activeSignal.topic}</p>
                        </div>
                        <button onClick={() => { setActiveSignal(null); setSignalAnalysis(""); }} className="text-gray-600 hover:text-gray-300 shrink-0">
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {signalAnalysis && (
                        <div className="mt-2 ml-6">
                          <Streamdown className="text-xs text-muted-foreground">{signalAnalysis}</Streamdown>
                        </div>
                      )}
                    </motion.div>
                  )}
                  {attachedFile && (
                    <motion.div
                      key="doc-ctx"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Research Context Active</span>
                            <span className="text-[10px] text-gray-500">Grounding all analyses ✓</span>
                          </div>
                          <p className="text-xs text-gray-300 truncate">{attachedFile.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{Math.round(attachedFile.content.length / 1000)}k chars extracted</p>
                        </div>
                        <button onClick={() => setAttachedFile(null)} className="text-gray-600 hover:text-gray-300 shrink-0">
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {conversations && conversations.length > 0 ? (
                  <>
                    {conversations.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${msg.role === "user" ? "bg-cyan-600 text-white" : "bg-card border border-border/60"}`}>
                          {msg.role === "assistant" ? (
                            <Streamdown className="text-sm">{msg.message}</Streamdown>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* In-chat loading indicator */}
                    {(sendMessage.isPending || fileExtracting) && (
                      <div className="flex justify-start">
                        <div className="bg-card border border-border/60 rounded-xl px-4 py-3 flex items-center gap-2.5">
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {fileExtracting ? "Extracting document…" : "Analysing…"}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                    {fileExtracting ? (
                      <>
                        <Loader2 className="w-10 h-10 mb-3 text-cyan-400 animate-spin" />
                        <p className="font-semibold text-muted-foreground">Extracting document…</p>
                        <p className="text-xs text-muted-foreground mt-1">Reading content and preparing analysis</p>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-10 h-10 mb-3 text-cyan-400/40" />
                        <p className="font-semibold text-muted-foreground">Intelligence workspace ready</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">Click a signal on the left to analyse it, or ask a question below.</p>
                        <div className="mt-6 w-full max-w-xs">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={fileExtracting}
                            className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border/50 hover:border-cyan-500/40 hover:bg-cyan-500/5 px-4 py-5 transition-all group"
                          >
                            <Paperclip className="w-6 h-6 text-muted-foreground/50 group-hover:text-cyan-400 transition-colors" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Upload a research document</p>
                              <p className="text-xs text-muted-foreground/60 mt-0.5">PDF · TXT · MD · CSV — drag & drop or click</p>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 px-4 pb-4 pt-2 border-t border-border/40 space-y-2">
                {/* File type hint — shown only when no file attached */}
                {!attachedFile && !fileExtracting && (
                  <p className="text-[10px] text-muted-foreground/50 text-center">
                    Drag & drop a PDF, TXT, MD or CSV into this window — or use the paperclip
                  </p>
                )}
                <div className="flex gap-2 items-center">
                  {/* Paperclip — prominent, left of input */}
                  <button
                    title={attachedFile ? `Remove ${attachedFile.name}` : "Attach a document (PDF, TXT, MD, CSV)"}
                    onClick={() => attachedFile ? setAttachedFile(null) : fileInputRef.current?.click()}
                    disabled={fileExtracting}
                    className={`shrink-0 h-9 w-9 rounded-lg border flex items-center justify-center transition-all ${
                      fileExtracting
                        ? "border-border/30 text-muted-foreground/40 cursor-wait"
                        : attachedFile
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        : "border-border/50 text-muted-foreground hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/5"
                    }`}
                  >
                    {fileExtracting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : attachedFile
                      ? <FileText className="w-4 h-4" />
                      : <Paperclip className="w-4 h-4" />}
                  </button>

                  <Input
                    placeholder={
                      fileExtracting ? "Extracting document — please wait…" :
                      activeSignal    ? `Follow up on "${activeSignal.topic.slice(0, 40)}…"` :
                      attachedFile    ? `Ask about ${attachedFile.name.replace(/\.[^.]+$/, "")}…` :
                                        "Ask an intelligence question…"
                    }
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    disabled={sendMessage.isPending || fileExtracting}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessage.isPending || fileExtracting || (!chatMessage.trim() && !attachedFile)}
                    size="icon"
                    className="shrink-0"
                  >
                    {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── GAME THEORY TAB ── */}
            <TabsContent value="analyze" className="flex-1 overflow-y-auto p-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-5 h-5" />
                    Game Theory Analyser
                  </CardTitle>
                  <CardDescription className="text-xs">Drop a title — ViralMind scores strategic value, maps the Nash position, and identifies the dominant move.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="gt-title" className="text-xs">Content Title or Thesis *</Label>
                    <Input
                      id="gt-title"
                      placeholder="e.g., Ghana's Anti-LGBTQ Law and the International Aid Payoff Matrix"
                      value={gtTitle}
                      onChange={e => setGtTitle(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gt-url" className="text-xs">Content URL (optional)</Label>
                    <Input id="gt-url" placeholder="https://…" value={gtUrl} onChange={e => setGtUrl(e.target.value)} className="mt-1 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Content Type</Label>
                      <Select value={gtType} onValueChange={(v: any) => setGtType(v)}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text" className="text-xs">Text / Article</SelectItem>
                          <SelectItem value="video" className="text-xs">Video</SelectItem>
                          <SelectItem value="audio" className="text-xs">Audio / Podcast</SelectItem>
                          <SelectItem value="research" className="text-xs">Research Document</SelectItem>
                          <SelectItem value="image" className="text-xs">Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <Select value={gtPlatform} onValueChange={(v: any) => setGtPlatform(v)}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twitter" className="text-xs">Twitter/X</SelectItem>
                          <SelectItem value="youtube" className="text-xs">YouTube</SelectItem>
                          <SelectItem value="tiktok" className="text-xs">TikTok</SelectItem>
                          <SelectItem value="instagram" className="text-xs">Instagram</SelectItem>
                          <SelectItem value="journal" className="text-xs">Journal / Newspaper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {gtTitleHint && !gtTitle.trim() && (
                    <p className="text-xs text-muted-foreground/60 italic -mt-2">
                      Tip: a specific title produces a more targeted analysis — or run without one for a general Africa political landscape assessment.
                    </p>
                  )}
                  <Button
                    onClick={() => {
                      if (!gtTitle.trim()) setGtTitleHint(true);
                      analyzeContent.mutate({
                        title: gtTitle.trim() || "General Africa political intelligence landscape",
                        contentUrl: gtUrl || undefined,
                        contentType: gtType,
                        platform: gtPlatform,
                      });
                    }}
                    disabled={analyzeContent.isPending}
                    className="w-full"
                  >
                    {analyzeContent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Run Game Theory Analysis
                  </Button>

                  {analyzeContent.data && (
                    <div className="space-y-3 border-t pt-4">
                      {analyzeContent.data.gameTheoryMove && (
                        <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3">
                          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Dominant Strategy Move</p>
                          <p className="text-sm">{analyzeContent.data.gameTheoryMove}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">GT Score</p>
                          <p className="text-3xl font-black text-cyan-400">{analyzeContent.data.viralityScore}<span className="text-xs text-muted-foreground font-normal">/10</span></p>
                        </div>
                        <div className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Mission Alignment</p>
                          <p className={`text-xl font-black ${analyzeContent.data.missionAlignment?.startsWith("High") ? "text-green-400" : analyzeContent.data.missionAlignment?.startsWith("Medium") ? "text-yellow-400" : "text-red-400"}`}>
                            {analyzeContent.data.missionAlignment?.split(" — ")[0]}
                          </p>
                        </div>
                      </div>
                      {analyzeContent.data.optimizedTitle && (
                        <div className="rounded-xl bg-muted/20 border border-border/50 px-4 py-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Optimised Title (Nash Signal)</p>
                          <p className="text-sm font-semibold">{analyzeContent.data.optimizedTitle}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {analyzeContent.data.strengths?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1.5">Strengths</p>
                            <ul className="space-y-1">{analyzeContent.data.strengths.map((s: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-green-400 shrink-0">+</span>{s}</li>)}</ul>
                          </div>
                        )}
                        {analyzeContent.data.weaknesses?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Gaps</p>
                            <ul className="space-y-1">{analyzeContent.data.weaknesses.map((w: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-red-400 shrink-0">−</span>{w}</li>)}</ul>
                          </div>
                        )}
                      </div>
                      {analyzeContent.data.recommendations?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">Strategic Moves</p>
                          <ol className="space-y-1">{analyzeContent.data.recommendations.map((r: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>{r}</li>)}</ol>
                        </div>
                      )}
                      {analyzeContent.data.optimizedHashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {analyzeContent.data.optimizedHashtags.map((tag: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── INSIGHTS TAB ── */}
            <TabsContent value="insights" className="flex-1 overflow-y-auto p-4 m-0 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  Game Theory Analysis History
                </h2>
                <Badge variant="outline" className="text-xs">{insights?.length ?? 0} analyses</Badge>
              </div>

              {insights && insights.length > 0 ? insights.map((insight: any) => {
                const perf = safeJson(insight.predictedPerformance, {});
                const recs: string[] = safeJson(insight.recommendations, []);
                const strengths: string[] = safeJson(insight.strengths, []);
                const tags: string[] = safeJson(insight.optimizedHashtags, []);
                const gtMove: string = perf.gameTheoryMove || "";
                const missionAlign: string = perf.missionAlignment || insight.missionAlignment || "";
                const alignColor = missionAlign.startsWith("High") ? "text-green-400" : missionAlign.startsWith("Medium") ? "text-yellow-400" : "text-red-400";
                return (
                  <Card key={insight.id} className="border border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm leading-snug">{insight.contentTitle}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] capitalize">{insight.platform}</Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">{insight.contentType}</Badge>
                            <span className="text-[10px] text-muted-foreground">{new Date(insight.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-cyan-400">{insight.viralityScore}<span className="text-xs text-muted-foreground font-normal">/10</span></p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2.5 pt-0">
                      {gtMove && (
                        <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/25 px-3 py-2">
                          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Dominant Strategy Move</p>
                          <p className="text-xs">{gtMove}</p>
                        </div>
                      )}
                      {missionAlign && (
                        <p className="text-xs"><span className="text-muted-foreground">Mission Alignment: </span><span className={alignColor + " font-semibold"}>{missionAlign.split(" — ")[0]}</span></p>
                      )}
                      {insight.optimizedTitle && (
                        <div className="rounded-lg bg-muted/20 px-3 py-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Optimised Title</p>
                          <p className="text-xs font-semibold">{insight.optimizedTitle}</p>
                        </div>
                      )}
                      {(strengths.length > 0 || recs.length > 0) && (
                        <div className="grid grid-cols-2 gap-3">
                          {strengths.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Strengths</p>
                              <ul className="space-y-0.5">{strengths.slice(0, 3).map((s, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-green-400 shrink-0">+</span>{s}</li>)}</ul>
                            </div>
                          )}
                          {recs.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Moves</p>
                              <ol className="space-y-0.5">{recs.slice(0, 3).map((r, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>{r}</li>)}</ol>
                            </div>
                          )}
                        </div>
                      )}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">{tag}</span>)}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => handleShareAnalysis(insight)}>
                          {copiedInsight ? <Check className="w-3 h-3 mr-1.5" /> : <Share2 className="w-3 h-3 mr-1.5" />}Share
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => handleDownloadAnalysis(insight)}>
                          <Download className="w-3 h-3 mr-1.5" />Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Target className="w-10 h-10 mb-3 opacity-30" />
                  <p className="font-semibold text-muted-foreground text-sm">No analyses yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Run your first Game Theory analysis in the tab above.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setRightTab("analyze")}>Open Game Theory Analyser</Button>
                </div>
              )}
            </TabsContent>

            {/* ── FORECAST TAB ── */}
            <TabsContent value="forecast" className="flex-1 overflow-y-auto p-4 m-0 space-y-4">
              {!hasPremium ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                    <Crown className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-base mb-1">Predictive Forecasting</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mb-2">AI-powered 7-day and 30-day signal forecasts with virality scoring, growth trajectory, and confidence levels.</p>
                  <p className="text-xs text-amber-400/80 mb-6">Premium feature — 100 VBT / 30 days</p>
                  <a href="/marketplace">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                      Unlock in Marketplace
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Signal or Topic to Forecast</Label>
                      <Input
                        className="mt-1 text-sm"
                        placeholder={activeSignal?.topic ?? "e.g. Kenya election integrity, Ethiopia Tigray ceasefire…"}
                        value={forecastTopic}
                        onChange={e => setForecastTopic(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Optional — leave blank to forecast the current active signal</p>
                    </div>
                    <div>
                      <Label className="text-xs">Timeframe</Label>
                      <Select value={forecastTimeframe} onValueChange={(v: any) => setForecastTimeframe(v)}>
                        <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7days" className="text-xs">7 Days</SelectItem>
                          <SelectItem value="30days" className="text-xs">30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={forecastLoading || insightsLoading}
                    onClick={() => { setForecastRun(true); runForecast(); runInsights(); }}
                  >
                    {(forecastLoading || insightsLoading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Run Forecast
                  </Button>

                  {forecastData && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          {forecastTimeframe === "7days" ? "7-Day" : "30-Day"} Forecast — {forecastData.topic}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Virality</p>
                            <p className="text-xl font-black text-amber-400">{forecastData.forecast?.viralityScore ?? "—"}<span className="text-xs text-muted-foreground">/10</span></p>
                          </div>
                          <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Growth</p>
                            <p className="text-xl font-black text-green-400">{forecastData.forecast?.growthRate ?? "—"}%</p>
                          </div>
                          <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Confidence</p>
                            <p className="text-xl font-black text-blue-400">{forecastData.forecast?.confidenceLevel ?? "—"}%</p>
                          </div>
                        </div>
                        {forecastData.forecast?.keyFactors?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Key Factors</p>
                            <ul className="space-y-1">
                              {forecastData.forecast.keyFactors.map((f: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-amber-400 shrink-0">•</span>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {insightsData && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          Advanced Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Streamdown className="text-sm text-muted-foreground">{insightsData.insights}</Streamdown>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Mentions", val: insightsData.metrics?.totalMentions },
                            { label: "Avg Engagement", val: insightsData.metrics?.averageEngagement },
                            { label: "Sentiment", val: insightsData.metrics?.sentimentScore ? `${insightsData.metrics.sentimentScore}/10` : null },
                            { label: "Reach Est.", val: insightsData.metrics?.reachEstimate },
                          ].map(({ label, val }) => val != null && (
                            <div key={label} className="rounded-lg bg-muted/30 px-3 py-2">
                              <p className="text-[10px] text-muted-foreground">{label}</p>
                              <p className="text-sm font-bold">{typeof val === "number" ? val.toLocaleString() : val}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function safeJson<T>(val: any, fallback: T): T {
  try { return JSON.parse(val ?? ""); } catch { return fallback; }
}
