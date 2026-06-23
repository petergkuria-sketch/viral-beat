import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useViewPreference } from "@/_core/hooks/useViewPreference";
import { ViewToggle } from "@/components/ViewToggle";
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
  FileText, Star, Share2, Download, Check, Globe, MapPin, ChevronRight, AlertCircle, Crown, Copy,
  CheckCircle2, Lock, Plus, Link as LinkIcon, ClipboardPaste,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { AnimatePresence, motion } from "framer-motion";

// ── types ───────────────────────────────────────────────────────────────────

type GeoLayer = "continental" | "regional" | "country";
type PestelCategory = "political" | "economic" | "social" | "technological" | "environmental" | "legal" | "investor";

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
  { id: "legal",         label: "L",  color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30" },
  { id: "investor",      label: "IR", color: "text-rose-400",   bg: "bg-rose-500/15 border-rose-500/30" },
];

const AFRICA_REGIONS = [
  { id: "east-africa",    label: "East Africa" },
  { id: "west-africa",    label: "West Africa" },
  { id: "central-africa", label: "Central Africa" },
  { id: "north-africa",   label: "North Africa" },
  { id: "southern-africa",label: "Southern Africa" },
];

// All 55 AU member states with flag emoji, region grouping, and signal coverage tier
type SignalTier = "live" | "ai" | "none";
// key = backend countryAccounts key (lowercase full name); id = ISO-2 used in UI state
interface AfricaCountry { id: string; key: string; label: string; flag: string; region: string; tier: SignalTier }
const AFRICA_REGIONS_MAP: Record<string, string> = {
  "east":    "East Africa",
  "west":    "West Africa",
  "central": "Central Africa",
  "north":   "North Africa",
  "south":   "Southern Africa",
};
const AFRICA_COUNTRIES: AfricaCountry[] = [
  // East Africa
  { id:"ke",  key:"kenya",        label:"Kenya",          flag:"🇰🇪", region:"east",    tier:"live" },
  { id:"tz",  key:"tanzania",     label:"Tanzania",       flag:"🇹🇿", region:"east",    tier:"live" },
  { id:"ug",  key:"uganda",       label:"Uganda",         flag:"🇺🇬", region:"east",    tier:"live" },
  { id:"rw",  key:"rwanda",       label:"Rwanda",         flag:"🇷🇼", region:"east",    tier:"ai"   },
  { id:"et",  key:"ethiopia",     label:"Ethiopia",       flag:"🇪🇹", region:"east",    tier:"live" },
  { id:"sd",  key:"sudan",        label:"Sudan",          flag:"🇸🇩", region:"east",    tier:"live" },
  { id:"ss",  key:"south-sudan",  label:"South Sudan",    flag:"🇸🇸", region:"east",    tier:"ai"   },
  { id:"so",  key:"somalia",      label:"Somalia",        flag:"🇸🇴", region:"east",    tier:"ai"   },
  { id:"bi",  key:"burundi",      label:"Burundi",        flag:"🇧🇮", region:"east",    tier:"none" },
  { id:"dj",  key:"djibouti",     label:"Djibouti",       flag:"🇩🇯", region:"east",    tier:"none" },
  { id:"er",  key:"eritrea",      label:"Eritrea",        flag:"🇪🇷", region:"east",    tier:"none" },
  { id:"mg",  key:"madagascar",   label:"Madagascar",     flag:"🇲🇬", region:"east",    tier:"none" },
  // West Africa
  { id:"ng",  key:"nigeria",      label:"Nigeria",        flag:"🇳🇬", region:"west",    tier:"live" },
  { id:"gh",  key:"ghana",        label:"Ghana",          flag:"🇬🇭", region:"west",    tier:"live" },
  { id:"sn",  key:"senegal",      label:"Senegal",        flag:"🇸🇳", region:"west",    tier:"live" },
  { id:"ci",  key:"cote-divoire", label:"Côte d'Ivoire",  flag:"🇨🇮", region:"west",    tier:"live" },
  { id:"ml",  key:"mali",         label:"Mali",           flag:"🇲🇱", region:"west",    tier:"ai"   },
  { id:"bf",  key:"burkina-faso", label:"Burkina Faso",   flag:"🇧🇫", region:"west",    tier:"ai"   },
  { id:"ne",  key:"niger",        label:"Niger",          flag:"🇳🇪", region:"west",    tier:"ai"   },
  { id:"gn",  key:"guinea",       label:"Guinea",         flag:"🇬🇳", region:"west",    tier:"none" },
  { id:"sl",  key:"sierra-leone", label:"Sierra Leone",   flag:"🇸🇱", region:"west",    tier:"none" },
  { id:"lr",  key:"liberia",      label:"Liberia",        flag:"🇱🇷", region:"west",    tier:"none" },
  { id:"bj",  key:"benin",        label:"Benin",          flag:"🇧🇯", region:"west",    tier:"none" },
  { id:"tg",  key:"togo",         label:"Togo",           flag:"🇹🇬", region:"west",    tier:"none" },
  { id:"gw",  key:"guinea-bissau",label:"Guinea-Bissau",  flag:"🇬🇼", region:"west",    tier:"none" },
  { id:"gm",  key:"gambia",       label:"Gambia",         flag:"🇬🇲", region:"west",    tier:"none" },
  { id:"mr",  key:"mauritania",   label:"Mauritania",     flag:"🇲🇷", region:"west",    tier:"none" },
  { id:"cv",  key:"cape-verde",   label:"Cape Verde",     flag:"🇨🇻", region:"west",    tier:"none" },
  // Central Africa
  { id:"cd",  key:"dr-congo",     label:"DR Congo",       flag:"🇨🇩", region:"central", tier:"live" },
  { id:"cm",  key:"cameroon",     label:"Cameroon",       flag:"🇨🇲", region:"central", tier:"live" },
  { id:"ga",  key:"gabon",        label:"Gabon",          flag:"🇬🇦", region:"central", tier:"ai"   },
  { id:"td",  key:"chad",         label:"Chad",           flag:"🇹🇩", region:"central", tier:"ai"   },
  { id:"cf",  key:"car",          label:"Cen. Afr. Rep.", flag:"🇨🇫", region:"central", tier:"ai"   },
  { id:"cg",  key:"congo",        label:"Congo",          flag:"🇨🇬", region:"central", tier:"none" },
  { id:"gq",  key:"eq-guinea",    label:"Eq. Guinea",     flag:"🇬🇶", region:"central", tier:"none" },
  { id:"st",  key:"sao-tome",     label:"São Tomé",       flag:"🇸🇹", region:"central", tier:"none" },
  // North Africa
  { id:"eg",  key:"egypt",        label:"Egypt",          flag:"🇪🇬", region:"north",   tier:"live" },
  { id:"ma",  key:"morocco",      label:"Morocco",        flag:"🇲🇦", region:"north",   tier:"live" },
  { id:"dz",  key:"algeria",      label:"Algeria",        flag:"🇩🇿", region:"north",   tier:"live" },
  { id:"ly",  key:"libya",        label:"Libya",          flag:"🇱🇾", region:"north",   tier:"ai"   },
  { id:"tn",  key:"tunisia",      label:"Tunisia",        flag:"🇹🇳", region:"north",   tier:"ai"   },
  // Southern Africa
  { id:"za",  key:"south-africa", label:"South Africa",   flag:"🇿🇦", region:"south",   tier:"live" },
  { id:"zw",  key:"zimbabwe",     label:"Zimbabwe",       flag:"🇿🇼", region:"south",   tier:"live" },
  { id:"zm",  key:"zambia",       label:"Zambia",         flag:"🇿🇲", region:"south",   tier:"live" },
  { id:"ao",  key:"angola",       label:"Angola",         flag:"🇦🇴", region:"south",   tier:"ai"   },
  { id:"mz",  key:"mozambique",   label:"Mozambique",     flag:"🇲🇿", region:"south",   tier:"ai"   },
  { id:"bw",  key:"botswana",    label:"Botswana",  flag:"🇧🇼", region:"south",   tier:"none" },
  { id:"na",  key:"namibia",     label:"Namibia",   flag:"🇳🇦", region:"south",   tier:"none" },
  { id:"mw",  key:"malawi",      label:"Malawi",    flag:"🇲🇼", region:"south",   tier:"none" },
  { id:"sz",  key:"eswatini",    label:"Eswatini",  flag:"🇸🇿", region:"south",   tier:"none" },
  { id:"ls",  key:"lesotho",     label:"Lesotho",   flag:"🇱🇸", region:"south",   tier:"none" },
  { id:"mu",  key:"mauritius",   label:"Mauritius", flag:"🇲🇺", region:"south",   tier:"none" },
  { id:"km",  key:"comoros",     label:"Comoros",   flag:"🇰🇲", region:"south",   tier:"none" },
  { id:"sc",  key:"seychelles",  label:"Seychelles",flag:"🇸🇨", region:"south",   tier:"none" },
  { id:"re",  key:"reunion",     label:"Réunion",   flag:"🇷🇪", region:"south",   tier:"none" },
  { id:"yt",  key:"mayotte",     label:"Mayotte",   flag:"🇾🇹", region:"south",   tier:"none" },
];

// ── component ───────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pipelineGTMode = useRef(false);

  // ── incoming signal from Aggregator (?signal=...) ──
  const [location] = useLocation();
  const incomingSignal = (() => {
    try { return new URLSearchParams(window.location.search).get("signal") ?? ""; } catch { return ""; }
  })();
  const [pipelineIncoming, setPipelineIncoming] = useState(!!incomingSignal);
  const [incomingCountdown, setIncomingCountdown] = useState(3);

  // ── onboarding banner ──
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem("vb_intel_onboarded") !== "1"; } catch { return true; }
  });
  const dismissOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem("vb_intel_onboarded", "1"); } catch {}
  };

  // ── geo / PESTEL filter state ──
  // Read ?country= and ?dimension= from URL (e.g. from PESTEL Trending deep-link)
  const _urlParams = (() => { try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); } })();
  const _urlCountry = _urlParams.get("country") ?? "";
  const _urlDimension = (_urlParams.get("dimension") ?? "") as PestelCategory | "";
  const [geoLayer, setGeoLayer] = useState<GeoLayer>(_urlCountry ? "country" : "continental");
  const [selectedRegion, setSelectedRegion] = useState("east-africa");
  const [selectedCountry, setSelectedCountry] = useState(_urlCountry || "ke");
  // custom / forced country (free-text, not constrained to AFRICA_COUNTRIES)
  const [countrySearch, setCountrySearch] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [generatingSignals, setGeneratingSignals] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PestelCategory>(
    (_urlDimension && ["political","economic","social","technological","environmental","legal","investor"].includes(_urlDimension))
      ? _urlDimension
      : "political"
  );

  // ── PESTEL gate enrichment (doc + link attached before GT) ──
  const [pestelAttachUrl, setPestelAttachUrl] = useState("");
  const [pestelAttachUrlSaved, setPestelAttachUrlSaved] = useState("");
  const [pestelAttachDoc, setPestelAttachDoc] = useState<{ name: string; content: string } | null>(null);
  const pestelFileRef = useRef<HTMLInputElement>(null);

  // ── signal selection ──
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [signalAnalysis, setSignalAnalysis] = useState<string>("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // ── chat ──
  const [sessionId, setSessionId] = useState(() => `intel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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

  // ── pipeline ──
  type PipelineStage = "idle" | "confirming" | "pestel" | "pestel_done" | "gametheory" | "gametheory_done" | "reports" | "complete";
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [pipelineSignal, setPipelineSignal] = useState<Signal | null>(null);
  const [pestelOutput, setPestelOutput] = useState("");
  const [pestelEditing, setPestelEditing] = useState(false);
  const [gtOutput, setGtOutput] = useState<any>(null);
  const [reportFormats, setReportFormats] = useState<string[]>(["thread", "newsletter"]);
  const [reportsOutput, setReportsOutput] = useState<any[]>([]);
  const [reportsMeta, setReportsMeta] = useState<any>(null);

  // ── ratings ──
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});

  // ── signal feed view preference ──
  const [signalView, setSignalView] = useViewPreference("intelligence_signals", "cards");

  // ── user-injected signals ──
  const [customSignals, setCustomSignals] = useState<(Signal & { userAdded: true; sourceUrl?: string })[]>([]);
  const [continentalRegionFilter, setContinentalRegionFilter] = useState<string>("all");
  const [addSignalOpen, setAddSignalOpen] = useState(false);
  const [addSignalMode, setAddSignalMode] = useState<"url" | "paste">("url");
  const [addSignalUrl, setAddSignalUrl] = useState("");
  const [addSignalText, setAddSignalText] = useState("");
  const [addSignalTopic, setAddSignalTopic] = useState("");
  const [addSignalCategory, setAddSignalCategory] = useState<PestelCategory>("political");

  // ── derived scope ──
  // For country layer, use the backend's full-name key (e.g. "tanzania") not the ISO id ("tz")
  const scopeKey =
    geoLayer === "continental" ? "au" :
    geoLayer === "regional"    ? selectedRegion :
                                 (AFRICA_COUNTRIES.find(c => c.id === selectedCountry)?.key ?? selectedCountry);

  // Human-readable label for the active country (handles custom free-text entries)
  const activeCountryLabel =
    AFRICA_COUNTRIES.find(c => c.id === selectedCountry)?.label ??
    selectedCountry.toUpperCase();

  const queryCategory = `${geoLayer}:${scopeKey}:${selectedCategory}`;

  // ── tRPC ──
  const utils = trpc.useUtils();

  const { data: signals, isLoading: signalsLoading } = trpc.xTrends.getTrending.useQuery(
    { category: queryCategory },
    { refetchInterval: 120_000, staleTime: 0 }
  );

  // RSS news for country view — ISO-2 code from selected country
  const selectedCountryCode = geoLayer === "country"
    ? (AFRICA_COUNTRIES.find(c => c.id === selectedCountry)?.id.toUpperCase() ?? "")
    : "";
  const { data: countryNews, isLoading: countryNewsLoading } = trpc.africa.getCountryNews.useQuery(
    { countryCode: selectedCountryCode },
    { enabled: geoLayer === "country" && selectedCountryCode.length === 2, staleTime: 30 * 60 * 1000 }
  );

  // Keyword-based PESTEL classifier for RSS articles
  const classifyPestel = (text: string): PestelCategory => {
    const t = text.toLowerCase();
    if (/\b(gdp|inflation|budget|trade|currency|debt|market|econom|revenue|investment|bank|financ|tax|tariff|imf|world bank|fiscal|monetary|naira|shilling|cedi|dirham)\b/.test(t)) return "economic";
    if (/\b(health|education|protest|youth|migr|communit|welfare|employ|unemploy|poverty|food|water access|school|hospital|social|gender|women|refugee|displace)\b/.test(t)) return "social";
    if (/\b(ai|artificial intelligence|digital|technolog|cyber|internet|mobile|data|satellite|innovation|startup|software|platform|drone|5g|broadband)\b/.test(t)) return "technological";
    if (/\b(flood|drought|climate|water|land|forest|disaster|pollution|energy|solar|wind|renewable|carbon|emissions|rainfall|crop|harvest|famine|wildfire)\b/.test(t)) return "environmental";
    if (/\b(court|law|constitution|bill|amendment|judicial|prosecution|legislation|verdict|arrest|human rights|tribunal)\b/.test(t)) return "legal";
    if (/\b(invest|fdi|foreign direct|ease of doing business|investor|ipo|private equity|venture capital|capital market|stock exchange|bond|yield|rating|moody|fitch|s&p|credit rating|diaspora bond|infrastructure fund|development finance|dfi|ifc|adb|afdb|sovereign wealth|public private partnership|ppp|concession|privatis|privatiz|doing business|business environment|regulatory reform|investment climate|free zone|sez|special economic)\b/.test(t)) return "investor";
    return "political";
  };

  // Map RSS articles → Signal shape, auto-classified to PESTEL dimension
  const rssSignals: Signal[] = (countryNews?.articles ?? []).map((a, i) => ({
    id: `rss-${selectedCountryCode}-${i}`,
    topic: a.title ?? "Untitled",
    summary: a.summary ?? "",
    geoScope: selectedCountryCode,
    pestelCategory: classifyPestel(`${a.title ?? ""} ${a.summary ?? ""}`),
    trendScore: 5,
    source: a.source,
  }));

  // Signals matching the active PESTEL dimension
  const filteredRssSignals = rssSignals.filter(s => s.pestelCategory === selectedCategory);

  const { data: conversationsRaw } = trpc.aiAssistant.getConversations.useQuery({ sessionId });
  const conversations = conversationsRaw ? [...conversationsRaw].reverse() : [];
  const { data: insights } = trpc.aiAssistant.getAnalyses.useQuery({ limit: 10 });

  // Auto-open Chat when the selected PESTEL dimension has no signals
  useEffect(() => {
    if (
      geoLayer === "country" &&
      !countryNewsLoading &&
      !signalsLoading &&
      filteredRssSignals.length === 0 &&
      !(signals?.trends && signals.trends.length > 0) &&
      pipelineStage === "idle"
    ) {
      setRightTab("chat");
    }
  }, [selectedCategory, countryNewsLoading, signalsLoading, filteredRssSignals.length, signals?.trends?.length, geoLayer, pipelineStage]);

  const summarizeTrends = trpc.xTrends.summarizeTrends.useMutation({
    onSuccess: (data) => {
      setSignalAnalysis(data.summary || "");
      setAnalysisLoading(false);
    },
    onError: () => setAnalysisLoading(false),
  });

  const rateSignal = trpc.xTrends.rateSignal.useMutation();

  const sendMessage = trpc.aiAssistant.chat.useMutation({
    onSuccess: async (data) => {
      setSessionId(data.sessionId);
      setChatMessage("");
      setAttachedFile(null);
      await utils.aiAssistant.getConversations.invalidate();
    },
  });

  const analyzeContent = trpc.aiAssistant.analyzeContent.useMutation({
    onSuccess: async (data) => {
      if (pipelineGTMode.current) {
        // Called from pipeline — set GT output and advance stage; skip tab-switching
        pipelineGTMode.current = false;
        setGtOutput(data);
        setPipelineStage("gametheory_done");
      } else {
        // Called from standalone Game Theory tab
        toast.success("Game Theory analysis complete!");
        setGtTitle("");
        setGtUrl("");
        setRightTab("insights");
      }
      await utils.aiAssistant.getAnalyses.invalidate();
    },
    onError: (err) => {
      if (pipelineGTMode.current) {
        pipelineGTMode.current = false;
        toast.error("Game Theory failed: " + err.message);
        setPipelineStage("pestel_done");
      }
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

  // ── pipeline mutations ──
  const pipelinePestel = trpc.xTrends.summarizeTrends.useMutation();
  const pipelineReports = trpc.aiAgents.repurposeContent.useMutation();
  const saveRun = trpc.intelligence.savePipelineRun.useMutation();
  const { data: historyData } = trpc.intelligence.getRelevantHistory.useQuery(
    { geoScope: scopeKey, pestelCategory: selectedCategory, limit: 3 },
    { enabled: pipelineStage === "confirming" }
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
    if (sendMessage.isPending) return;
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

  // ── custom signal injection (defined after scopeKey so closure is correct) ──
  const handleAddCustomSignal = () => {
    const rawText = addSignalMode === "url" ? addSignalUrl.trim() : addSignalText.trim();
    if (!rawText) return;
    const isUrl = addSignalMode === "url";
    const autoTopic = isUrl
      ? (() => { try { return new URL(rawText).hostname.replace(/^www\./, ""); } catch { return rawText.slice(0, 60); } })()
      : rawText.split("\n")[0].slice(0, 80);
    const topic = addSignalTopic.trim() || autoTopic;
    const summary = isUrl ? undefined : rawText.split("\n").slice(1).join(" ").trim().slice(0, 300) || undefined;
    const sig: Signal & { userAdded: true; sourceUrl?: string } = {
      id: `custom-${Date.now()}`,
      topic,
      summary,
      geoScope: scopeKey,
      pestelCategory: addSignalCategory,
      userAdded: true,
      sourceUrl: isUrl ? rawText : undefined,
    };
    setCustomSignals(prev => [sig, ...prev]);
    setAddSignalUrl("");
    setAddSignalText("");
    setAddSignalTopic("");
    setAddSignalOpen(false);
  };

  // ── AI signal generation for forced countries ────────────────────────────
  const generateSignalsMutation = trpc.xTrends.summarizeTrends.useMutation();

  const handleGenerateSignals = async () => {
    setGeneratingSignals(true);
    const countryLabel = activeCountryLabel;
    const pestelLabel = selectedCategory;
    generateSignalsMutation.mutate(
      {
        // The topic IS the full generation prompt — the backend appends it to the user message.
        // We override normal analysis by making the request a JSON generation task.
        topic: `TASK: Generate exactly 5 distinct ${pestelLabel.toUpperCase()} intelligence signals for ${countryLabel}.\n\nIgnore the prose analysis format. Respond ONLY with a valid JSON array, no other text:\n[{"topic":"headline max 12 words","summary":"2-sentence brief with actors and implications","category":"${pestelLabel}"},...]`,
        geoScope: scopeKey,
        geoLayer: "country",
        pestelCategory: selectedCategory,
      },
      {
        onSuccess: (data) => {
          setGeneratingSignals(false);
          const raw = typeof data?.summary === "string" ? data.summary : "";
          // Extract JSON array from the LLM response
          try {
            // Strip markdown code fences if present, then extract JSON array
            const stripped = raw.replace(/```json?\s*/gi, "").replace(/```/g, "");
            const match = stripped.match(/\[[\s\S]*\]/);
            if (!match) throw new Error("No JSON array found");
            const parsed: { topic: string; summary?: string; category?: string }[] = JSON.parse(match[0]);
            const newSignals = parsed
              .filter(s => s.topic?.trim())
              .map((s, i): Signal & { userAdded: true; aiGenerated?: boolean } => ({
                id: `ai-${Date.now()}-${i}`,
                topic: s.topic.trim(),
                summary: s.summary?.trim(),
                geoScope: scopeKey,
                pestelCategory: (s.category ?? selectedCategory) as PestelCategory,
                userAdded: true,
                aiGenerated: true,
              }));
            if (newSignals.length === 0) {
              toast.error("AI couldn't parse signals — try again");
              return;
            }
            // Replace old AI-generated signals (for same country) but keep manually added ones
            setCustomSignals(prev => [...newSignals, ...prev.filter(s => !(s as any).aiGenerated)]);
            toast.success(`${newSignals.length} AI-generated signals added for ${countryLabel}`);
          } catch {
            toast.error("Could not parse AI signals. Try again.");
          }
        },
        onError: () => {
          setGeneratingSignals(false);
          toast.error("Signal generation failed");
        },
      }
    );
  };

  // ── pipeline handlers ────────────────────────────────────────────────────

  // Auto-start pipeline when arriving from Aggregator with ?signal=
  useEffect(() => {
    if (!incomingSignal || pipelineStage !== "idle") return;
    let count = 3;
    setIncomingCountdown(count);
    const tick = setInterval(() => {
      count -= 1;
      setIncomingCountdown(count);
      if (count <= 0) {
        clearInterval(tick);
        setPipelineIncoming(false);
        handleStartPipeline({
          id: `agg-${Date.now()}`,
          topic: incomingSignal,
          geoScope: scopeKey,
          pestelCategory: "political",
        });
      }
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSignal]);

  const handleStartPipeline = (signal: Signal) => {
    setPipelineSignal(signal);
    setPestelOutput("");
    setPestelEditing(false);
    setGtOutput(null);
    setReportsOutput([]);
    setReportsMeta(null);
    setPipelineStage("confirming");
  };

  const handleRunPestel = () => {
    if (!pipelineSignal) return;
    setPipelineStage("pestel");
    pipelinePestel.mutate(
      {
        topic: pipelineSignal.topic,
        geoScope: scopeKey,
        geoLayer,
        pestelCategory: selectedCategory,
        researchContext: [
          attachedFile?.content,
          historyData?.runs?.length
            ? `\n\n--- PRIOR ANALYSES (${historyData.runs.length} past runs for this region/category) ---\n` +
              (historyData.runs as any[]).map((r: any, i: number) =>
                `[${i+1}] Topic: ${r.signalTopic}\nPESTEL Summary: ${(r.pestelOutput ?? "").slice(0, 400)}...\nGT Score: ${r.gtScore ?? "N/A"}`
              ).join("\n\n")
            : undefined,
        ].filter(Boolean).join("\n\n") || undefined
      },
      {
        onSuccess: (data) => { setPestelOutput(data.summary || ""); setPipelineStage("pestel_done"); },
        onError: (err) => { toast.error("PESTEL failed: " + err.message); setPipelineStage("confirming"); },
      }
    );
  };

  const handleRunGameTheory = () => {
    if (!pipelineSignal || pipelineGTMode.current) return;
    setPipelineStage("gametheory");
    const geoLabel =
      geoLayer === "continental" ? "Africa (Continental)" :
      geoLayer === "regional" ? (AFRICA_REGIONS.find(r => r.id === selectedRegion)?.label ?? selectedRegion) :
      (activeCountryLabel);
    const gtTitleStr = `[${geoLabel} · ${selectedCategory.toUpperCase()}] ${pipelineSignal.topic}`;
    // Build enrichment description from PESTEL-gate attachments
    const enrichParts: string[] = [];
    if (pestelAttachUrlSaved) enrichParts.push(`Reference URL: ${pestelAttachUrlSaved}`);
    if (pestelAttachDoc) enrichParts.push(`Attached document (${pestelAttachDoc.name}):\n${pestelAttachDoc.content.slice(0, 4000)}`);
    if (pestelOutput) enrichParts.push(`PESTEL Analysis:\n${pestelOutput.slice(0, 2000)}`);
    pipelineGTMode.current = true;
    analyzeContent.mutate({
      title: gtTitleStr,
      contentType: "research",
      platform: "journal",
      ...(pestelAttachUrlSaved ? { contentUrl: pestelAttachUrlSaved } : {}),
      ...(enrichParts.length ? { description: enrichParts.join("\n\n---\n\n") } : {}),
    });
  };

  const handleRunReports = () => {
    if (!pipelineSignal || reportFormats.length === 0) return;
    setPipelineStage("reports");
    const geoLabel =
      geoLayer === "continental" ? "Africa" :
      geoLayer === "regional" ? (AFRICA_REGIONS.find(r => r.id === selectedRegion)?.label ?? selectedRegion) :
      (activeCountryLabel);
    pipelineReports.mutate(
      {
        signal: pipelineSignal.topic,
        pestelDimensions: [selectedCategory] as any,
        country: geoLabel,
        confidenceTier: "single-source",
        targetFormats: reportFormats as any,
      },
      {
        onSuccess: (data) => {
          setReportsOutput(data.adaptations ?? []);
          setReportsMeta(data);
          setPipelineStage("complete");
          saveRun.mutate({
            signalTopic: pipelineSignal!.topic,
            geoLayer,
            geoScope: scopeKey,
            pestelCategory: selectedCategory,
            pestelOutput,
            gtScore: gtOutput?.gtScore ?? undefined,
            gtDominantMove: gtOutput?.dominantStrategy ?? undefined,
            gtAlignment: gtOutput?.alignment ?? undefined,
            reportFormats,
          });
        },
        onError: (err) => { toast.error("Report generation failed: " + err.message); setPipelineStage("gametheory_done"); },
      }
    );
  };

  const handleResetPipeline = () => {
    setPipelineStage("idle");
    setPipelineSignal(null);
    setPestelOutput("");
    setGtOutput(null);
    setReportsOutput([]);
    setReportsMeta(null);
    setPestelAttachUrl("");
    setPestelAttachUrlSaved("");
    setPestelAttachDoc(null);
  };

  const handleDownloadReport = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMd = (content: string, basename: string) => {
    // text/plain ensures browser honours the .md extension without overriding it
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${basename}.md`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadPdf = async (content: string, basename: string) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxW = pageW - margin * 2;

      // Dark header bar
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(56, 189, 248);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("VIRALBEAT  ·  AFRICA POLITICAL INTELLIGENCE", margin, 14);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(
        new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        pageW - margin, 14, { align: "right" }
      );

      // Body — strip markdown, wrap lines, paginate
      doc.setTextColor(30, 30, 30);
      let y = 32;
      for (const raw of content.split("\n")) {
        const line = raw
          .replace(/^#{1,4}\s*/, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/`(.*?)`/g, "$1")
          .trim();
        if (!line) { y += 3; continue; }
        const isH = /^#{1,4}\s/.test(raw);
        const fontSize = isH ? 12 : 9;
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isH ? "bold" : "normal");
        const wrapped = doc.splitTextToSize(line, maxW);
        const lineH = isH ? 6 : 4.5;
        if (y + wrapped.length * lineH > pageH - 16) {
          doc.addPage();
          y = 20;
        }
        doc.text(wrapped, margin, y);
        y += wrapped.length * lineH + (isH ? 2 : 0);
      }

      // Footer on every page
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(7);
        doc.text(
          `viralbeat.io  ·  Page ${i} of ${totalPages}  ·  Confidential`,
          pageW / 2, pageH - 6, { align: "center" }
        );
      }

      // Use blob + anchor instead of doc.save() to avoid CSP issues
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url; a.download = `${basename}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("PDF generation failed — downloading as Markdown instead.");
      handleDownloadMd(content, basename);
    }
  };

  const [dlDropdown, setDlDropdown] = useState<string | null>(null);

  const PIPELINE_STEPS = [
    { key: "signal",     label: "Signal",      stages: ["confirming"] },
    { key: "pestel",     label: "PESTEL",       stages: ["pestel", "pestel_done"] },
    { key: "gametheory", label: "Game Theory",  stages: ["gametheory", "gametheory_done"] },
    { key: "reports",    label: "Reports",      stages: ["reports", "complete"] },
  ];

  const pipelineStepStatus = (stepIdx: number): "done" | "active" | "pending" => {
    const order: PipelineStage[] = ["confirming", "pestel", "pestel_done", "gametheory", "gametheory_done", "reports", "complete"];
    const cur = order.indexOf(pipelineStage);
    if (cur < 0) return "pending";
    const stepStart = [0, 1, 3, 5][stepIdx];
    const stepEnd = [0, 2, 4, 6][stepIdx];
    if (cur > stepEnd) return "done";
    if (cur >= stepStart) return "active";
    return "pending";
  };

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-100 bg-slate-900">

      {/* ── Command Bar ── */}
      <div className="shrink-0 border-b border-slate-700/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg shadow-black/20">
        {/* Row 1 — title + geo scope + country selector */}
        <div className="flex items-center gap-4 px-6 pt-3.5 pb-2.5 border-b border-slate-700/50">
          {/* Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white leading-none block">Intelligence Workspace</span>
              <span className="text-[10px] text-slate-500 leading-none">
                {geoLayer === "continental" ? "55 AU member states · continental view"
                  : geoLayer === "regional" ? `${AFRICA_REGIONS.find(r => r.id === selectedRegion)?.label ?? "Region"} · regional view`
                  : `${activeCountryLabel} · country view · ${selectedCategory.toUpperCase()}`}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700 shrink-0 mx-1" />

          {/* Geo scope pill toggle */}
          <div className="flex items-center rounded-lg border border-slate-600/80 overflow-hidden text-xs bg-slate-900/60">
            {(["continental","regional","country"] as GeoLayer[]).map(l => (
              <button
                key={l}
                onClick={() => setGeoLayer(l)}
                className={`px-3.5 py-2 font-semibold transition-all flex items-center gap-1.5 ${
                  geoLayer === l
                    ? "bg-cyan-500 text-slate-900"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                {l === "continental" ? <Globe className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                {l === "continental" ? "Africa" : l === "regional" ? "Regional" : "Country"}
              </button>
            ))}
          </div>

          {/* Regional selector */}
          {geoLayer === "regional" && (
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-9 w-40 text-xs bg-slate-900/60 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AFRICA_REGIONS.map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Country selector */}
          {geoLayer === "country" && (
            <div className="relative">
              <div className="flex items-center h-9 w-48 bg-slate-900/60 border border-slate-600/80 rounded-lg px-3 gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={countrySearch || activeCountryLabel}
                  onChange={e => { setCountrySearch(e.target.value); setCountryDropdownOpen(true); }}
                  onFocus={() => { setCountrySearch(""); setCountryDropdownOpen(true); }}
                  onBlur={() => setTimeout(() => setCountryDropdownOpen(false), 150)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && countrySearch.trim()) {
                      const slug = countrySearch.trim().toLowerCase().replace(/\s+/g, "-");
                      setSelectedCountry(slug); setCountrySearch(""); setCountryDropdownOpen(false);
                    }
                    if (e.key === "Escape") { setCountrySearch(""); setCountryDropdownOpen(false); }
                  }}
                  placeholder="Search country…"
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none min-w-0"
                />
              </div>
              {countryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                  {(() => {
                    const q = countrySearch.toLowerCase();
                    const filtered = AFRICA_COUNTRIES.filter(c => !q || c.label.toLowerCase().includes(q) || c.id.includes(q));
                    return (
                      <>
                        {filtered.map(c => (
                          <button key={c.id} type="button"
                            onMouseDown={() => { setSelectedCountry(c.id); setCountrySearch(""); setCountryDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700 transition-colors ${selectedCountry === c.id ? "text-cyan-400 bg-cyan-500/10" : "text-slate-200"}`}
                          >
                            {c.label}
                          </button>
                        ))}
                        {countrySearch.trim() && !AFRICA_COUNTRIES.find(c => c.label.toLowerCase() === countrySearch.toLowerCase()) && (
                          <button type="button"
                            onMouseDown={() => { const slug = countrySearch.trim().toLowerCase().replace(/\s+/g, "-"); setSelectedCountry(slug); setCountrySearch(""); setCountryDropdownOpen(false); }}
                            className="w-full text-left px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/10 border-t border-slate-700 flex items-center gap-1.5"
                          >
                            <Plus className="w-3 h-3" /> Force: "{countrySearch.trim()}"
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 2 — PESTEL dimension selector (full-width, prominent) */}
        <div className="flex items-center gap-0 px-6 py-2">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mr-3 shrink-0">PESTEL</span>
          <div className="flex items-center gap-1.5 flex-1">
            {PESTEL.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedCategory(p.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
                  selectedCategory === p.id
                    ? `${p.bg} ${p.color} border-current shadow-sm`
                    : "bg-slate-900/40 border-slate-700/60 text-slate-500 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <span className="font-black">{p.label}</span>
                <span className={`text-[9px] hidden sm:inline font-normal ${selectedCategory === p.id ? "opacity-80" : "opacity-50"}`}>
                  {p.id === "political" ? "Political" : p.id === "economic" ? "Economic" : p.id === "social" ? "Social" : p.id === "technological" ? "Tech" : p.id === "environmental" ? "Environ." : p.id === "legal" ? "Legal" : "Inv. Readiness"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* hidden file input — triggered from chat input row */}
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.csv" className="hidden" onChange={handleFileUpload} />

      {/* ── Main split pane ── */}
      <div className="flex-1 overflow-hidden grid lg:grid-cols-5">

        {/* ══ LEFT — Signal feed / 55-nation grid ══ */}
        <div className="lg:col-span-2 border-r border-slate-700 overflow-y-auto flex flex-col bg-slate-900">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-white uppercase tracking-widest">
                {geoLayer === "continental" ? "55 Nations" : "Live Signals"}
              </p>
              {signalsLoading && geoLayer !== "continental" && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            </div>
            <div className="flex items-center gap-2">
              {geoLayer !== "continental" && (
                <button
                  onClick={() => setAddSignalOpen(v => !v)}
                  title="Add your own signal"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-all ${addSignalOpen ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400" : "border-white/10 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400"}`}
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              )}
              {geoLayer !== "continental" && (
                <ViewToggle
                  options={[{ value: "cards", label: "Cards" }, { value: "feed", label: "Feed" }]}
                  current={signalView}
                  onChange={setSignalView}
                />
              )}
            </div>
          </div>

          {geoLayer === "continental" ? (
            /* ══ 55-Nation Africa Grid ══ */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Region filter chips */}
              <div className="px-3 py-2 border-b border-slate-700 flex gap-1.5 overflow-x-auto shrink-0">
                {[{ id: "all", label: "All 55" }, ...Object.entries(AFRICA_REGIONS_MAP).map(([id, label]) => ({ id, label }))].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setContinentalRegionFilter(r.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all ${continentalRegionFilter === r.id ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" : "border-white/8 text-slate-400 hover:text-slate-200 hover:border-white/20"}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Signal-tier legend */}
              <div className="px-3 py-1.5 border-b border-slate-700/60 flex items-center gap-3 shrink-0">
                {[
                  { tier: "live" as const, color: "bg-cyan-400", label: "Live signals" },
                  { tier: "ai"   as const, color: "bg-purple-400", label: "AI-generated" },
                  { tier: "none" as const, color: "bg-slate-600", label: "No coverage" },
                ].map(t => (
                  <span key={t.tier} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${t.color} ${t.tier === "live" ? "shadow-[0_0_4px_1px_rgba(34,211,238,0.5)]" : ""}`} />
                    <span className="text-[9px] text-slate-400">{t.label}</span>
                  </span>
                ))}
              </div>

              {/* Country cards grouped by region */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {Object.entries(AFRICA_REGIONS_MAP)
                  .filter(([regionId]) => continentalRegionFilter === "all" || continentalRegionFilter === regionId)
                  .map(([regionId, regionLabel]) => {
                    const countries = AFRICA_COUNTRIES.filter(c => c.region === regionId);
                    return (
                      <div key={regionId}>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-0.5">{regionLabel}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {countries.map(c => {
                            const tierDot =
                              c.tier === "live"   ? "bg-cyan-400 shadow-[0_0_5px_1px_rgba(34,211,238,0.6)]" :
                              c.tier === "ai"     ? "bg-purple-400 shadow-[0_0_5px_1px_rgba(168,85,247,0.5)]" :
                                                    "bg-slate-600";
                            const tierBorder =
                              c.tier === "live"   ? "border-cyan-500/30 hover:border-cyan-400/60 bg-slate-800/80" :
                              c.tier === "ai"     ? "border-purple-500/25 hover:border-purple-400/50 bg-slate-800/80" :
                                                    "border-white/6 hover:border-white/15 bg-slate-800/40";
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c.id);
                                  setGeoLayer("country");
                                }}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all cursor-pointer ${tierBorder}`}
                              >
                                <span className="text-base leading-none shrink-0">{c.flag}</span>
                                <span className="flex-1 min-w-0">
                                  <span className="block text-[11px] font-semibold text-slate-200 truncate">{c.label}</span>
                                  <span className="text-[9px] text-slate-500">
                                    {c.tier === "live" ? "Live" : c.tier === "ai" ? "AI signals" : "No data"}
                                  </span>
                                </span>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${tierDot}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <>
          {/* ── Inline add-signal panel ── */}
          {addSignalOpen && (
            <div className="border-b border-slate-700 bg-slate-800/60">
              <div className="p-3 space-y-2.5">
                {/* mode toggle */}
                <div className="flex gap-1.5">
                  {([["url", LinkIcon, "Paste URL"], ["paste", ClipboardPaste, "Paste Content"]] as const).map(([mode, Icon, lbl]) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setAddSignalMode(mode)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${addSignalMode === mode ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400" : "border-white/8 text-slate-400 hover:text-slate-200"}`}
                    >
                      <Icon className="w-3 h-3" />
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* main input */}
                {addSignalMode === "url" ? (
                  <input
                    type="url"
                    placeholder="https://article-or-source-url..."
                    value={addSignalUrl}
                    onChange={e => setAddSignalUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomSignal(); } }}
                    className="w-full bg-slate-900/70 border border-white/8 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                  />
                ) : (
                  <textarea
                    rows={3}
                    placeholder={"Paste article content or field notes...\nFirst line becomes the signal topic."}
                    value={addSignalText}
                    onChange={e => setAddSignalText(e.target.value)}
                    className="w-full bg-slate-900/70 border border-white/8 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 resize-none"
                  />
                )}

                {/* optional topic override */}
                <input
                  type="text"
                  placeholder="Signal topic (optional — auto-detected)"
                  value={addSignalTopic}
                  onChange={e => setAddSignalTopic(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomSignal(); } }}
                  className="w-full bg-slate-900/70 border border-white/8 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                />

                {/* PESTEL + submit row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 mr-0.5">PESTEL:</span>
                  {PESTEL.map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setAddSignalCategory(p.id)}
                      className={`w-6 h-6 rounded text-[10px] font-black border transition-all ${addSignalCategory === p.id ? `${p.bg} ${p.color}` : "border-white/8 text-slate-500 hover:text-slate-300"}`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCustomSignal}
                    disabled={addSignalMode === "url" ? !addSignalUrl.trim() : !addSignalText.trim()}
                    className="ml-auto px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-slate-900 hover:bg-cyan-400 disabled:opacity-40 transition-colors"
                  >
                    Add Signal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SIGNAL PRIORITY WATERFALL (country view) ──────────────────────
               Tier 1: Country RSS feeds (public / gov / private media)
               Tier 2: Nearest regional xTrends data (fallback)
               Tier 3: AI Claude-generated signals (last resort)
          ─────────────────────────────────────────────────────────────── */}
          {geoLayer === "country" && (
            <>
              {/* Tier 1 loading spinner */}
              {countryNewsLoading && (
                <div className="mx-3 mt-2 flex items-center gap-2 text-[10px] text-slate-500 px-2 py-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Fetching {activeCountryLabel} media feeds…
                </div>
              )}

              {/* Tier 1 — RSS cards filtered by active PESTEL dimension */}
              {!countryNewsLoading && rssSignals.length > 0 && (
                <div className="mx-3 mt-2 space-y-1.5">
                  <div className="flex items-center justify-between px-1 mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Media Feeds · {activeCountryLabel}</span>
                    </div>
                    <span className="text-[9px] text-slate-600">Tier 1 · RSS</span>
                  </div>

                  {filteredRssSignals.length === 0 ? (
                    /* No articles classified under this dimension — show AI prompt CTA */
                    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          No {selectedCategory.toUpperCase()} signals in media feeds
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Current feeds haven't published {selectedCategory} content for {activeCountryLabel}. The AI assistant is ready — ask a question or generate signals below.
                      </p>
                      <button
                        onClick={() => setRightTab("chat")}
                        className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/20 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" /> Open AI Assistant
                      </button>
                    </div>
                  ) : (
                    filteredRssSignals.map((sig) => {
                      const p = PESTEL.find(x => x.id === sig.pestelCategory) ?? PESTEL[0];
                      return (
                        <button
                          key={sig.id}
                          className="w-full text-left rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/8 p-3 transition-all group"
                          onClick={() => handleStartPipeline({ id: sig.id, topic: sig.topic, summary: sig.summary, geoScope: scopeKey, pestelCategory: sig.pestelCategory as PestelCategory })}
                        >
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded border bg-emerald-500/15 border-emerald-500/30 text-emerald-400 tracking-wide">RSS</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${p.bg} ${p.color}`}>{(sig.pestelCategory ?? "POL").toUpperCase().slice(0,3)}</span>
                            {sig.source && <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{sig.source}</span>}
                          </div>
                          <p className="text-xs font-semibold leading-snug line-clamp-2 text-white group-hover:text-emerald-100">{sig.topic}</p>
                          {sig.summary && (
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{sig.summary}</p>
                          )}
                          <p className="text-[9px] text-emerald-400/40 mt-1.5">Click to run through intelligence pipeline</p>
                        </button>
                      );
                    })
                  )}

                  {/* Divider before Tier 3 */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[9px] text-slate-600">AI supplement</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateSignals}
                    disabled={generatingSignals}
                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-bold border border-cyan-500/15 text-cyan-400/60 hover:bg-cyan-500/8 hover:border-cyan-500/35 hover:text-cyan-400 disabled:opacity-60 transition-all"
                  >
                    {generatingSignals
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating AI signals…</>
                      : <><Sparkles className="w-3 h-3" /> Generate AI signals for {activeCountryLabel}</>}
                  </button>
                </div>
              )}

              {/* Tier 2 — regional xTrends fallback header (only when filtered RSS is empty) */}
              {!countryNewsLoading && filteredRssSignals.length === 0 && rssSignals.length === 0 && !signalsLoading && signals?.trends && signals.trends.length > 0 && (
                <div className="mx-3 mt-2 space-y-1.5">
                  <div className="flex items-center justify-between px-1 mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Regional Fallback</span>
                    </div>
                    <span className="text-[9px] text-slate-600">Tier 2 · no country feeds</span>
                  </div>
                  <div className="px-2 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      No {activeCountryLabel}-specific feeds found. Showing nearest regional signals below.
                    </p>
                  </div>
                </div>
              )}

              {/* Tier 3 — AI CTA (only when both filtered RSS and regional data are empty) */}
              {!countryNewsLoading && !signalsLoading && filteredRssSignals.length === 0 && rssSignals.length === 0 && !(signals?.trends && signals.trends.length > 0) && (
                <div className="mx-3 mt-2 rounded-lg bg-slate-800/60 border border-slate-700/50 overflow-hidden">
                  <div className="px-3 py-2 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-300 font-semibold mb-0.5">No feeds or regional data for {activeCountryLabel}</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed">Tier 1 (RSS) and Tier 2 (regional) both returned no results. Generate AI intelligence signals below.</p>
                    </div>
                  </div>
                  <div className="px-3 pb-2.5">
                    <button
                      type="button"
                      onClick={handleGenerateSignals}
                      disabled={generatingSignals}
                      className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-600 to-purple-700 text-white hover:from-cyan-500 hover:to-purple-600 disabled:opacity-60 transition-all"
                    >
                      {generatingSignals
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating {activeCountryLabel} signals…</>
                        : <><Sparkles className="w-3.5 h-3.5" /> Generate {activeCountryLabel} · {selectedCategory.toUpperCase()} Signals</>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex-1 p-3 space-y-2">
            {/* ── User-injected custom signals ── */}
            {customSignals.map((signal) => {
              const pestelDim = signal.pestelCategory as PestelCategory | undefined;
              const p = PESTEL.find(x => x.id === pestelDim) ?? PESTEL[0];
              const isActive = pipelineSignal?.id === signal.id;
              return (
                <motion.div key={signal.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="relative">
                    {/* remove button */}
                    <button
                      onClick={() => setCustomSignals(prev => prev.filter(s => s.id !== signal.id))}
                      className="absolute top-1.5 right-1.5 z-10 w-4 h-4 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      <XIcon className="w-2.5 h-2.5" />
                    </button>
                    {(() => {
                      const isAI = !!(signal as any).aiGenerated;
                      const borderClass = isAI
                        ? (isActive ? "border-cyan-500/50 bg-cyan-500/8" : "border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5")
                        : (isActive ? "border-amber-500/50 bg-amber-500/8" : "border-amber-500/25 hover:border-amber-500/50 hover:bg-amber-500/5");
                      return (
                        <button
                          className={`w-full text-left rounded-xl border p-3 pr-6 transition-all group ${borderClass}`}
                          onClick={() => handleStartPipeline({ id: signal.id, topic: signal.topic, summary: signal.summary, geoScope: scopeKey, pestelCategory: pestelDim })}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                {isAI
                                  ? <span className="text-[9px] font-black px-1.5 py-0.5 rounded border bg-cyan-500/15 border-cyan-500/30 text-cyan-400 tracking-wide flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />AI SIGNAL</span>
                                  : <span className="text-[9px] font-black px-1.5 py-0.5 rounded border bg-amber-500/15 border-amber-500/30 text-amber-400 tracking-wide">SINGLE SOURCE</span>
                                }
                                {pestelDim && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${p.bg} ${p.color}`}>{pestelDim.toUpperCase().slice(0, 3)}</span>}
                              </div>
                              <p className="text-sm font-semibold leading-snug line-clamp-2 text-white">{signal.topic}</p>
                              {signal.summary && (
                                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{signal.summary}</p>
                              )}
                              {(signal as any).sourceUrl && (
                                <p className="text-[10px] text-slate-500 mt-1 truncate">{(signal as any).sourceUrl}</p>
                              )}
                              <p className={`text-[10px] mt-1.5 ${isAI ? "text-cyan-400/60" : "text-amber-400/70"}`}>
                                {isAI ? "AI-generated · validate before publishing" : "Awaiting wider validation"}
                              </p>
                            </div>
                          </div>
                          <span className="mt-2 ml-1 text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                            Analyse <ChevronRight className="w-2.5 h-2.5" />
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                </motion.div>
              );
            })}

            {signalsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-700/40 animate-pulse" />
              ))
            ) : signals?.trends && signals.trends.length > 0 && (geoLayer !== "country" || filteredRssSignals.length === 0) ? (
              signals.trends.map((signal: any, idx: number) => {
                const pestelDim = signal.pestelCategory as PestelCategory | undefined;
                const p = PESTEL.find(x => x.id === pestelDim) ?? PESTEL[0];
                const isActive = pipelineSignal?.id === signal.id || pipelineSignal?.topic === signal.topic;

                // ── Feed (compact) view ──
                if (signalView === "feed") {
                  return (
                    <motion.div key={signal.id ?? idx} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                      <button
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all group ${isActive ? "border-cyan-500/40 bg-cyan-500/8" : "border-white/6 hover:border-white/20 hover:bg-white/3"}`}
                        onClick={() => handleStartPipeline({ id: signal.id ?? String(idx), topic: signal.topic, summary: signal.summary, geoScope: scopeKey, pestelCategory: pestelDim })}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.color.replace("text-", "bg-").split(" ")[0]}`} style={{ background: isActive ? "#00d4ff" : undefined }} />
                        <span className="text-xs font-medium text-slate-200 flex-1 truncate">{signal.topic}</span>
                        {pestelDim && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${p.bg} ${p.color}`}>{pestelDim.toUpperCase().slice(0,3)}</span>}
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 opacity-0 group-hover:opacity-100" />
                      </button>
                    </motion.div>
                  );
                }

                // ── Cards (default) view ──
                return (
                  <motion.div
                    key={signal.id ?? idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <button
                      className={`w-full text-left rounded-xl border p-3 transition-all group ${isActive ? "border-cyan-500/50 bg-cyan-500/10" : "border-white/10 hover:border-white/25 hover:bg-white/5"}`}
                      onClick={() => handleStartPipeline({ id: signal.id ?? String(idx), topic: signal.topic, summary: signal.summary, geoScope: scopeKey, pestelCategory: pestelDim })}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-black text-slate-400 shrink-0 mt-0.5 w-4 text-right">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug line-clamp-2 text-white">{signal.topic}</p>
                          {(signal.summary || signal.tweets?.[0]?.text) && (
                            <p className="text-xs text-slate-300 mt-1.5 line-clamp-3 leading-relaxed">
                              {signal.summary || signal.tweets[0].text}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {pestelDim && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${p.bg} ${p.color}`}>{pestelDim.toUpperCase().slice(0, 3)}</span>
                            )}
                            {signal.engagement != null && (
                              <span className="text-[10px] text-slate-400">
                                {signal.engagement > 1000 ? `${(signal.engagement / 1000).toFixed(1)}k` : signal.engagement} eng.
                              </span>
                            )}
                            <span className="ml-auto text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                              Analyse <ChevronRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 mt-2 ml-6" onClick={e => e.stopPropagation()}>
                        {[1,2,3,4,5].map(star => (
                          <button
                            key={star}
                            onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [signal.id ?? idx]: star }))}
                            onMouseLeave={() => setHoverRatings(prev => { const n = { ...prev }; delete n[signal.id ?? idx]; return n; })}
                            onClick={() => handleRateSignal(signal.id ?? String(idx), star)}
                            className="p-0.5"
                          >
                            <Star className={`w-3 h-3 ${star <= (hoverRatings[signal.id ?? idx] ?? ratings[signal.id ?? idx] ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-400/40"}`} />
                          </button>
                        ))}
                      </div>
                    </button>
                  </motion.div>
                );
              })
            ) : geoLayer !== "country" ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-8 h-8 text-slate-500 mb-3" />
                <p className="text-sm text-slate-300 font-medium">No signals yet</p>
                <p className="text-xs text-slate-400 mt-1">Try a different geo scope or PESTEL dimension</p>
              </div>
            ) : null}
          </div>
            </>
          )}
        </div>

        {/* ══ RIGHT — Analysis workspace ══ */}
        <div className="lg:col-span-3 flex flex-col overflow-hidden bg-slate-900">

          {pipelineStage !== "idle" ? (
          /* ════════════════════════════════════════
             PIPELINE VIEW
          ════════════════════════════════════════ */
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Pipeline header + stepper */}
            <div className="shrink-0 px-4 pt-3 pb-3 border-b border-slate-700 bg-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span className="text-sm font-bold text-white">Intelligence Pipeline</span>
                </div>
                <button
                  onClick={handleResetPipeline}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <XIcon className="w-3 h-3" /> Exit
                </button>
              </div>

              {/* Stepper */}
              <div className="flex items-center">
                {PIPELINE_STEPS.map((step, idx) => {
                  const status = pipelineStepStatus(idx);
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                          status === "done"   ? "bg-emerald-500 text-white" :
                          status === "active" ? "bg-blue-500 text-white ring-2 ring-blue-500/30" :
                                               "bg-slate-700 text-slate-500 border border-slate-600"
                        }`}>
                          {status === "done" ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[9px] mt-1 font-semibold uppercase tracking-wider ${
                          status === "done" ? "text-emerald-400" : status === "active" ? "text-blue-400" : "text-slate-500"
                        }`}>{step.label}</span>
                      </div>
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${
                          pipelineStepStatus(idx) === "done" ? "bg-emerald-500" : "bg-slate-700"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pipeline body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* ── STAGE 1: Signal confirmation ── */}
              {pipelineStage === "confirming" && (
                <div className="space-y-4">
                  <div className="bg-slate-800 border border-cyan-500/30 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">Selected Signal</p>
                    <p className="text-sm font-semibold text-white leading-snug">{pipelineSignal?.topic}</p>
                    {pipelineSignal?.summary && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3">{pipelineSignal.summary}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {geoLayer === "continental" ? "🌍 Africa" :
                         geoLayer === "regional" ? `📍 ${AFRICA_REGIONS.find(r => r.id === selectedRegion)?.label}` :
                         `📍 ${activeCountryLabel}`}
                      </span>
                      {PESTEL.filter(p => p.id === selectedCategory).map(p => (
                        <span key={p.id} className={`text-[10px] px-2 py-0.5 rounded border font-bold ${p.bg} ${p.color}`}>
                          {p.id.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Signal memory badge */}
                  {historyData?.runs && (historyData.runs as any[]).length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/8 px-3 py-2">
                      <span className="text-[10px] text-violet-300 font-semibold">
                        ⚡ {(historyData.runs as any[]).length} prior {(historyData.runs as any[]).length === 1 ? "analysis" : "analyses"} found for this region — PESTEL will be enriched with past context.
                      </span>
                    </div>
                  )}

                  {/* Report format selection */}
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-2">Select Report Formats <span className="text-slate-500 font-normal">(generated at Stage 4)</span></p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: "thread",     label: "X / Twitter Thread",          desc: "6–8 tweets, hook → Nash position" },
                        { id: "newsletter", label: "Intelligence Newsletter",      desc: "PESTEL breakdown + actor matrix" },
                        { id: "sitrep",     label: "NGO Situation Report",         desc: "Formal, citation-ready, risk matrix" },
                        { id: "cable",      label: "Diplomatic Cable",             desc: "Actor positions + regional implications" },
                      ] as const).map(fmt => {
                        const on = reportFormats.includes(fmt.id);
                        return (
                          <button
                            key={fmt.id}
                            onClick={() => setReportFormats(prev => on ? prev.filter(f => f !== fmt.id) : [...prev, fmt.id])}
                            className={`rounded-xl p-3 text-left border transition-all ${on ? "border-pink-500/50 bg-pink-500/8" : "border-slate-600 bg-slate-800 hover:border-slate-500"}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${on ? "border-pink-500 bg-pink-500" : "border-slate-500"}`}>
                                {on && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className={`text-xs font-semibold ${on ? "text-pink-300" : "text-slate-300"}`}>{fmt.label}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1.5 ml-5">{fmt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional research document upload */}
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-2">Attach Research Document <span className="text-slate-500 font-normal">(optional — grounds PESTEL in your data)</span></p>
                    {attachedFile ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-2.5">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs text-emerald-300 flex-1 truncate">{attachedFile.name}</span>
                        <button onClick={() => setAttachedFile(null)} className="text-slate-500 hover:text-slate-300"><XIcon className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={fileExtracting}
                        className="w-full flex items-center gap-2 rounded-xl border border-dashed border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 px-3 py-2.5 transition-all group"
                      >
                        {fileExtracting ? <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /> : <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />}
                        <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                          {fileExtracting ? "Extracting…" : "PDF · TXT · MD · CSV — drag & drop or click"}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Geo mismatch warning in pipeline */}
                  {geoLayer === "country" && pipelineSignal && (() => {
                    const countryLabel = activeCountryLabel;
                    const signalMentionsCountry = pipelineSignal.topic.toLowerCase().includes(countryLabel.toLowerCase());
                    return !signalMentionsCountry ? (
                      <div className="bg-amber-500/8 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-0.5">Signal may not be {countryLabel}-specific</p>
                          <p className="text-xs text-slate-400">This signal appears to be regional, not country-level. The pipeline will analyse it in the <strong className="text-amber-300">{countryLabel}</strong> context — verify it's relevant before proceeding.</p>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 flex items-start gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Approval Gates Active</p>
                      <p className="text-xs text-slate-400">You review and approve each stage before the next one runs. Nothing proceeds without your confirmation.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleRunPestel}
                    disabled={reportFormats.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
                  >
                    Begin PESTEL Analysis <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── STAGE 2: PESTEL loading ── */}
              {pipelineStage === "pestel" && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
                  <p className="text-sm font-semibold text-white">Running PESTEL Analysis…</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">{pipelineSignal?.topic}</p>
                </div>
              )}

              {/* ── STAGE 2 DONE: PESTEL output + gate ── */}
              {pipelineStage === "pestel_done" && (
                <div className="space-y-4">
                  <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Stage 2 — PESTEL Analysis
                    </p>
                    {pestelEditing ? (
                      <textarea
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs text-slate-200 min-h-52 resize-none focus:outline-none focus:border-blue-500 font-mono"
                        value={pestelOutput}
                        onChange={e => setPestelOutput(e.target.value)}
                      />
                    ) : (
                      <div className="text-sm text-slate-200 [&_*]:text-slate-200 [&_strong]:text-white [&_li]:text-slate-200 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white">
                        <Streamdown>{pestelOutput}</Streamdown>
                      </div>
                    )}
                  </div>

                  {/* ── Enrichment attachments ── */}
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-700/60 flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrich Game Theory Analysis</span>
                      <span className="text-[9px] text-slate-600 ml-auto">optional — improves report veracity</span>
                    </div>
                    <div className="p-3 space-y-2.5">

                      {/* URL input */}
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1.5">Attach a reference URL (article, report, dataset)</p>
                        <div className="flex gap-1.5">
                          <input
                            type="url"
                            value={pestelAttachUrl}
                            onChange={e => setPestelAttachUrl(e.target.value)}
                            placeholder="https://…"
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <button
                            onClick={() => { if (pestelAttachUrl.trim()) { setPestelAttachUrlSaved(pestelAttachUrl.trim()); setPestelAttachUrl(""); } }}
                            disabled={!pestelAttachUrl.trim()}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold disabled:opacity-40 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        {pestelAttachUrlSaved && (
                          <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25">
                            <LinkIcon className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="text-[10px] text-blue-300 flex-1 truncate">{pestelAttachUrlSaved}</span>
                            <button onClick={() => setPestelAttachUrlSaved("")} className="text-slate-500 hover:text-slate-300 transition-colors"><XIcon className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>

                      {/* Document upload */}
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1.5">Or upload a document (PDF · TXT · MD · CSV)</p>
                        <input
                          ref={pestelFileRef}
                          type="file"
                          accept=".pdf,.txt,.md,.csv"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => setPestelAttachDoc({ name: file.name, content: ev.target?.result as string ?? "" });
                            reader.readAsText(file);
                            if (pestelFileRef.current) pestelFileRef.current.value = "";
                          }}
                        />
                        {pestelAttachDoc ? (
                          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                            <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="text-[10px] text-emerald-300 flex-1 truncate">{pestelAttachDoc.name}</span>
                            <span className="text-[9px] text-slate-600">{(pestelAttachDoc.content.length / 1000).toFixed(1)}k chars</span>
                            <button onClick={() => setPestelAttachDoc(null)} className="text-slate-500 hover:text-slate-300 transition-colors"><XIcon className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => pestelFileRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-600 hover:border-slate-400 text-slate-500 hover:text-slate-300 text-xs transition-colors"
                          >
                            <Paperclip className="w-3.5 h-3.5" /> Upload document
                          </button>
                        )}
                      </div>

                      {(pestelAttachUrlSaved || pestelAttachDoc) && (
                        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-cyan-500/8 border border-cyan-500/20">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                          <p className="text-[10px] text-cyan-300">
                            {[pestelAttachUrlSaved && "1 URL", pestelAttachDoc && "1 document"].filter(Boolean).join(" + ")} will be ingested into the Game Theory analysis
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-orange-500/5 border border-orange-500/40 rounded-xl p-3 flex items-start gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-orange-400 mb-0.5">Approval Gate — Stage 2 of 4</p>
                      <p className="text-xs text-slate-400">Review the PESTEL output. Approve to proceed to Game Theory, or edit before continuing.</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPestelEditing(!pestelEditing)}
                      className="flex-1 border border-slate-600 text-slate-300 hover:text-white text-sm rounded-xl py-2.5 transition-colors"
                    >
                      {pestelEditing ? "Preview" : "✏️ Edit"}
                    </button>
                    <button
                      onClick={handleRunGameTheory}
                      className="flex-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl py-2.5 px-5 transition-colors flex items-center justify-center gap-2"
                    >
                      Approve → Game Theory <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STAGE 3: Game Theory loading ── */}
              {pipelineStage === "gametheory" && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
                  <p className="text-sm font-semibold text-white">Building Strategic Briefing…</p>
                  <p className="text-xs text-slate-400 mt-1">Mapping who gains, who loses, and what happens next</p>
                </div>
              )}

              {/* ── STAGE 3 DONE: GT output — scenario narrative ── */}
              {pipelineStage === "gametheory_done" && gtOutput && (() => {
                const alignTier = gtOutput.missionAlignment?.startsWith("High") ? "high"
                  : gtOutput.missionAlignment?.startsWith("Medium") ? "medium" : "low";
                const score = gtOutput.viralityScore ?? 0;
                const urgency = score >= 8 ? "critical" : score >= 6 ? "elevated" : "watch";
                const urgencyLabel = urgency === "critical" ? "Critical Watch" : urgency === "elevated" ? "Elevated Risk" : "Monitor";
                const urgencyColor = urgency === "critical" ? "text-red-400 bg-red-500/10 border-red-500/30"
                  : urgency === "elevated" ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                  : "text-sky-400 bg-sky-500/10 border-sky-500/30";

                // Strip game theory bracket labels from recommendations for plain-language display
                const cleanRec = (r: string) => r.replace(/^\[.*?\]\s*/,"");

                // Map each recommendation to a scenario role
                const scenarioRoles = ["What's really happening", "Who holds the power", "The hidden pressure", "What happens next"];

                return (
                <div className="space-y-4">
                  <div className="bg-slate-800 border border-purple-500/30 rounded-xl overflow-hidden">

                    {/* Header bar */}
                    <div className="px-4 pt-4 pb-3 border-b border-slate-700/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Stage 3 — Strategic Briefing</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgencyColor}`}>{urgencyLabel}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${alignTier === "high" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : alignTier === "medium" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" : "text-red-400 bg-red-500/10 border-red-500/30"}`}>
                          {alignTier === "high" ? "High Impact" : alignTier === "medium" ? "Medium Impact" : "Low Impact"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">

                      {/* Headline framing */}
                      {gtOutput.optimizedTitle && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">The Story in One Line</p>
                          <p className="text-base font-bold text-white leading-snug">{gtOutput.optimizedTitle}</p>
                        </div>
                      )}

                      {/* The bottom line — what this means for ordinary people */}
                      {gtOutput.gameTheoryMove && (
                        <div className="rounded-xl bg-cyan-500/8 border border-cyan-500/20 px-3 py-3">
                          <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">What This Means for You</p>
                          <p className="text-sm text-slate-200 leading-relaxed">{gtOutput.gameTheoryMove}</p>
                        </div>
                      )}

                      {/* Scenario narrative cards */}
                      {gtOutput.recommendations?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">How This Plays Out — 4 Scenarios</p>
                          <div className="space-y-2">
                            {gtOutput.recommendations.slice(0, 4).map((r: string, i: number) => (
                              <div key={i} className="rounded-lg bg-slate-700/30 border border-slate-600/30 px-3 py-2.5">
                                <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-1">{scenarioRoles[i] ?? `Scenario ${i + 1}`}</p>
                                <p className="text-xs text-slate-300 leading-relaxed">{cleanRec(r)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Signal strength meter */}
                      <div className="flex items-center gap-3 pt-1">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest shrink-0">Signal Strength</p>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(score / 10) * 100}%`,
                              background: score >= 8 ? "#f87171" : score >= 6 ? "#fbbf24" : "#38bdf8"
                            }}
                          />
                        </div>
                        <p className="text-xs font-bold tabular-nums" style={{ color: score >= 8 ? "#f87171" : score >= 6 ? "#fbbf24" : "#38bdf8" }}>
                          {score}/10
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-500/5 border border-orange-500/40 rounded-xl p-3 flex items-start gap-2.5">
                    <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-orange-400 mb-0.5">Approval Gate — Stage 3 of 4</p>
                      <p className="text-xs text-slate-400">Approve to generate your {reportFormats.length} selected report format{reportFormats.length !== 1 ? "s" : ""}.</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPipelineStage("pestel_done")}
                      className="flex-1 border border-slate-600 text-slate-300 hover:text-white text-sm rounded-xl py-2.5 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleRunReports}
                      disabled={reportFormats.length === 0}
                      className="flex-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-2.5 px-5 transition-colors flex items-center justify-center gap-2"
                    >
                      Approve → Generate Reports <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })()}

              {/* ── STAGE 4: Reports loading ── */}
              {pipelineStage === "reports" && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Loader2 className="w-10 h-10 text-pink-400 animate-spin mb-4" />
                  <p className="text-sm font-semibold text-white">Generating {reportFormats.length} Report Format{reportFormats.length !== 1 ? "s" : ""}…</p>
                  <p className="text-xs text-slate-400 mt-1">Triangulating signal across all selected formats</p>
                </div>
              )}

              {/* ── STAGE COMPLETE: Report outputs ── */}
              {pipelineStage === "complete" && reportsOutput.length > 0 && (
                <div className="space-y-4">
                  {/* Completion receipt */}
                  <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-3 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-400 mb-0.5">Pipeline Complete — All 4 Stages</p>
                      <p className="text-xs text-slate-400">{pipelineSignal?.topic}</p>
                      {reportsMeta?.pestelDimensions && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {reportsMeta.pestelDimensions.map((d: string) => (
                            <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 capitalize">{d}</span>
                          ))}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">⚠ Single-Source</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Download All */}
                  {reportsOutput.length > 1 && (
                    <div className="flex justify-end">
                      <button
                        className="inline-flex items-center gap-1.5 h-7 px-3 text-xs rounded border border-pink-500/40 text-pink-400 hover:bg-pink-500/10 transition-colors"
                        onClick={() => {
                          const combined = reportsOutput.map(o =>
                            `=== ${(o.format ?? o.platform ?? "").toUpperCase()} ===\n\n${o.content}`
                          ).join("\n\n---\n\n");
                          handleDownloadReport(combined, `viralbeat-pipeline-${Date.now()}.txt`);
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download All ({reportsOutput.length} formats)
                      </button>
                    </div>
                  )}

                  {/* Per-format output cards */}
                  {reportsOutput.map((out: any, i: number) => {
                    const basename = `viralbeat-${out.platform ?? out.format}-${Date.now()}`;
                    const cardId = `card-${i}`;
                    return (
                      <div key={i} className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
                          <p className="text-xs font-bold text-pink-400 uppercase tracking-wider">{out.format ?? out.platform}</p>
                          <div className="flex gap-1.5 items-center">
                            <button
                              className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                              onClick={() => { navigator.clipboard.writeText(out.content); toast.success("Copied!"); }}
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                            {/* Download format picker */}
                            <div className="relative">
                              <button
                                className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-slate-600"
                                onClick={() => setDlDropdown(dlDropdown === cardId ? null : cardId)}
                              >
                                <Download className="w-3 h-3" /> Download <ChevronRight className={`w-3 h-3 transition-transform ${dlDropdown === cardId ? "rotate-90" : ""}`} />
                              </button>
                              {dlDropdown === cardId && (
                                <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden min-w-36">
                                  {[
                                    { label: "Markdown (.md)",  icon: "M", action: () => handleDownloadMd(out.content, basename) },
                                    { label: "PDF (.pdf)",       icon: "P", action: () => handleDownloadPdf(out.content, basename) },
                                    { label: "Text (.txt)",      icon: "T", action: () => handleDownloadReport(out.content, `${basename}.txt`) },
                                  ].map(fmt => (
                                    <button
                                      key={fmt.label}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-left"
                                      onClick={() => { fmt.action(); setDlDropdown(null); }}
                                    >
                                      <span className="w-5 h-5 rounded bg-slate-700 text-[9px] font-bold text-slate-400 flex items-center justify-center shrink-0">{fmt.icon}</span>
                                      {fmt.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-slate-200 [&_*]:text-slate-200 [&_strong]:text-white [&_li]:text-slate-200 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white">
                            <Streamdown>{out.content}</Streamdown>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleResetPipeline}
                      className="flex-1 border border-slate-600 text-slate-300 hover:text-white text-sm rounded-xl py-2.5 transition-colors"
                    >
                      ← New Pipeline
                    </button>
                    <button
                      onClick={handleResetPipeline}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl py-2.5 transition-colors"
                    >
                      Run Another Signal →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          ) : (
          /* ════════════════════════════════════════
             ORIGINAL TABS (idle state / free chat)
          ════════════════════════════════════════ */
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 px-4 pt-3 border-b border-white/10">
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
                          <Streamdown className="text-xs text-slate-200">{signalAnalysis}</Streamdown>
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
                        <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${msg.role === "user" ? "bg-cyan-600 text-white" : "bg-slate-700/80 border border-slate-600/60"}`}>
                          {msg.role === "assistant" ? (
                            <div className="text-sm text-slate-100 [&_*]:text-slate-100 [&_strong]:text-white [&_b]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_li]:text-slate-100 [&_p]:text-slate-100">
                              <Streamdown>{msg.message}</Streamdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap text-white">{msg.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* In-chat loading indicator */}
                    {(sendMessage.isPending || fileExtracting) && (
                      <div className="flex justify-start">
                        <div className="bg-slate-700/80 border border-slate-600/60 rounded-xl px-4 py-3 flex items-center gap-2.5">
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                          <span className="text-xs text-slate-400">
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
                        <p className="font-semibold text-slate-400">Extracting document…</p>
                        <p className="text-xs text-slate-400 mt-1">Reading content and preparing analysis</p>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-10 h-10 mb-3 text-cyan-400/40" />
                        <p className="font-semibold text-white">Intelligence workspace ready</p>
                        <p className="text-xs text-slate-300 mt-1 max-w-xs">Click a signal on the left to analyse it, or ask a question below.</p>
                        <div className="mt-6 w-full max-w-xs">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={fileExtracting}
                            className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 px-4 py-5 transition-all group"
                          >
                            <Paperclip className="w-6 h-6 text-slate-400/50 group-hover:text-cyan-400 transition-colors" />
                            <div>
                              <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Upload a research document</p>
                              <p className="text-xs text-slate-400 mt-0.5">PDF · TXT · MD · CSV — drag & drop or click</p>
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
              <div className="shrink-0 px-4 pb-4 pt-2 border-t border-white/10 space-y-2">
                {/* File type hint — shown only when no file attached */}
                {!attachedFile && !fileExtracting && (
                  <p className="text-[10px] text-slate-400/50 text-center">
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
                        ? "border-border/30 text-slate-400/40 cursor-wait"
                        : attachedFile
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        : "border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/5"
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
                    <p className="text-xs text-slate-400/60 italic -mt-2">
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
                        <div className="rounded-xl bg-slate-700/40 border border-white/10 px-4 py-3 text-center">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">GT Score</p>
                          <p className="text-3xl font-black text-cyan-400">{analyzeContent.data.viralityScore}<span className="text-xs text-slate-400 font-normal">/10</span></p>
                        </div>
                        <div className="rounded-xl bg-slate-700/40 border border-white/10 px-4 py-3 text-center">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Mission Alignment</p>
                          <p className={`text-xl font-black ${analyzeContent.data.missionAlignment?.startsWith("High") ? "text-green-400" : analyzeContent.data.missionAlignment?.startsWith("Medium") ? "text-yellow-400" : "text-red-400"}`}>
                            {analyzeContent.data.missionAlignment?.split(" — ")[0]}
                          </p>
                        </div>
                      </div>
                      {analyzeContent.data.optimizedTitle && (
                        <div className="rounded-xl bg-slate-700/30 border border-white/10 px-4 py-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Optimised Title (Nash Signal)</p>
                          <p className="text-sm font-semibold">{analyzeContent.data.optimizedTitle}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {analyzeContent.data.strengths?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1.5">Strengths</p>
                            <ul className="space-y-1">{analyzeContent.data.strengths.map((s: string, i: number) => <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-green-400 shrink-0">+</span>{s}</li>)}</ul>
                          </div>
                        )}
                        {analyzeContent.data.weaknesses?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">Gaps</p>
                            <ul className="space-y-1">{analyzeContent.data.weaknesses.map((w: string, i: number) => <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-red-400 shrink-0">−</span>{w}</li>)}</ul>
                          </div>
                        )}
                      </div>
                      {analyzeContent.data.recommendations?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">Strategic Moves</p>
                          <ol className="space-y-1">{analyzeContent.data.recommendations.map((r: string, i: number) => <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>{r}</li>)}</ol>
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
                  <Card key={insight.id} className="border border-white/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm leading-snug">{insight.contentTitle}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] capitalize">{insight.platform}</Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">{insight.contentType}</Badge>
                            <span className="text-[10px] text-slate-400">{new Date(insight.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-cyan-400">{insight.viralityScore}<span className="text-xs text-slate-400 font-normal">/10</span></p>
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
                        <p className="text-xs"><span className="text-slate-400">Mission Alignment: </span><span className={alignColor + " font-semibold"}>{missionAlign.split(" — ")[0]}</span></p>
                      )}
                      {insight.optimizedTitle && (
                        <div className="rounded-lg bg-slate-700/30 px-3 py-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Optimised Title</p>
                          <p className="text-xs font-semibold">{insight.optimizedTitle}</p>
                        </div>
                      )}
                      {(strengths.length > 0 || recs.length > 0) && (
                        <div className="grid grid-cols-2 gap-3">
                          {strengths.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Strengths</p>
                              <ul className="space-y-0.5">{strengths.slice(0, 3).map((s, i) => <li key={i} className="text-xs text-slate-400 flex gap-1"><span className="text-green-400 shrink-0">+</span>{s}</li>)}</ul>
                            </div>
                          )}
                          {recs.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Moves</p>
                              <ol className="space-y-0.5">{recs.slice(0, 3).map((r, i) => <li key={i} className="text-xs text-slate-400 flex gap-1"><span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>{r}</li>)}</ol>
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
                  <p className="font-semibold text-slate-400 text-sm">No analyses yet</p>
                  <p className="text-xs text-slate-400 mt-1">Run your first Game Theory analysis in the tab above.</p>
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
                  <p className="text-sm text-slate-400 max-w-xs mb-2">AI-powered 7-day and 30-day signal forecasts with virality scoring, growth trajectory, and confidence levels.</p>
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
                      <p className="text-[10px] text-slate-400/60 mt-1 italic">Optional — leave blank to forecast the current active signal</p>
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
                          <div className="rounded-lg bg-slate-700/40 px-3 py-2 text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Virality</p>
                            <p className="text-xl font-black text-amber-400">{forecastData.forecast?.viralityScore ?? "—"}<span className="text-xs text-slate-400">/10</span></p>
                          </div>
                          <div className="rounded-lg bg-slate-700/40 px-3 py-2 text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Growth</p>
                            <p className="text-xl font-black text-green-400">{forecastData.forecast?.growthRate ?? "—"}%</p>
                          </div>
                          <div className="rounded-lg bg-slate-700/40 px-3 py-2 text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Confidence</p>
                            <p className="text-xl font-black text-blue-400">{forecastData.forecast?.confidenceLevel ?? "—"}%</p>
                          </div>
                        </div>
                        {forecastData.forecast?.keyFactors?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Key Factors</p>
                            <ul className="space-y-1">
                              {forecastData.forecast.keyFactors.map((f: string, i: number) => (
                                <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-amber-400 shrink-0">•</span>{f}</li>
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
                        <Streamdown className="text-sm text-slate-400">{insightsData.insights}</Streamdown>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Mentions", val: insightsData.metrics?.totalMentions },
                            { label: "Avg Engagement", val: insightsData.metrics?.averageEngagement },
                            { label: "Sentiment", val: insightsData.metrics?.sentimentScore ? `${insightsData.metrics.sentimentScore}/10` : null },
                            { label: "Reach Est.", val: insightsData.metrics?.reachEstimate },
                          ].map(({ label, val }) => val != null && (
                            <div key={label} className="rounded-lg bg-slate-700/40 px-3 py-2">
                              <p className="text-[10px] text-slate-400">{label}</p>
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
          )} {/* end pipeline ternary */}
        </div>
      </div>

      {/* ── Incoming signal banner (from Political Aggregator) ── */}
      <AnimatePresence>
        {pipelineIncoming && incomingSignal && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
          >
            <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-cyan-500/10 overflow-hidden">
              {/* progress bar */}
              <motion.div
                className="h-0.5 bg-gradient-to-r from-cyan-500 to-purple-600"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
              <div className="px-4 py-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Signal received from Aggregator</span>
                    <span className="text-[10px] text-slate-500">· launching in {incomingCountdown}s</span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{incomingSignal}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    The <span className="text-white font-medium">PESTEL Intelligence Pipeline</span> will run automatically — you'll see Political, Economic, Social, Technological, Environmental and Legal analysis, followed by a Game Theory strategic assessment and downloadable reports.
                  </p>
                </div>
                <button
                  onClick={() => { setPipelineIncoming(false); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors shrink-0"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="px-4 pb-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    setPipelineIncoming(false);
                    handleStartPipeline({ id: `agg-${Date.now()}`, topic: incomingSignal, geoScope: scopeKey, pestelCategory: "political" });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-900 text-xs font-black hover:bg-cyan-400 transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> Start now
                </button>
                <span className="text-[10px] text-slate-600">or wait {incomingCountdown}s for auto-launch</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── First-time onboarding banner ── */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="shrink-0 border-t border-slate-700 bg-slate-800/95 px-5 py-4"
          >
            <div className="max-w-5xl mx-auto">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <p className="text-sm font-bold text-white">How the Intelligence Workspace works</p>
                </div>
                <button
                  onClick={dismissOnboarding}
                  className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                  aria-label="Dismiss"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                {[
                  { step: "1", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/8", icon: <Globe className="w-3.5 h-3.5" />, title: "Set your scope", body: "Choose Africa, a Region, or a Country at the top. Then pick a PESTEL dimension (P · E · S · T · En · L) to filter live signals." },
                  { step: "2", color: "text-blue-400 border-blue-500/30 bg-blue-500/8",  icon: <Zap className="w-3.5 h-3.5" />,  title: "Click a Live Signal", body: "Clicking any signal on the left starts the 4-stage pipeline. You can optionally attach a research document (PDF, TXT, MD) to ground the analysis." },
                  { step: "3", color: "text-purple-400 border-purple-500/30 bg-purple-500/8", icon: <Target className="w-3.5 h-3.5" />, title: "Approve each stage", body: "The pipeline runs PESTEL → Game Theory → Reports in sequence. You review and approve each output before the next stage runs — nothing proceeds without you." },
                  { step: "4", color: "text-pink-400 border-pink-500/30 bg-pink-500/8",   icon: <Download className="w-3.5 h-3.5" />, title: "Download your report", body: "Stage 4 generates your chosen formats (Thread · Newsletter · Sitrep · Cable). Download each as PDF, Markdown, or TXT — or grab all formats in one file." },
                ].map(({ step, color, icon, title, body }) => (
                  <div key={step} className={`rounded-xl border p-3 ${color}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-black w-4 h-4 rounded-full border flex items-center justify-center ${color}`}>{step}</span>
                      {icon}
                      <p className={`text-xs font-bold ${color.split(" ")[0]}`}>{title}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500">
                  The workspace remembers your last scope and PESTEL selection. Use the <span className="text-slate-400 font-medium">Chat</span> tab (idle state) for free-form intelligence questions without running the full pipeline.
                </p>
                <button
                  onClick={dismissOnboarding}
                  className="shrink-0 ml-4 bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
                >
                  Got it ✓
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function safeJson<T>(val: any, fallback: T): T {
  try { return JSON.parse(val ?? ""); } catch { return fallback; }
}
