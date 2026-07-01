import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Globe, Shield, TrendingUp, ArrowRight, ChevronRight, X, Menu,
  Zap, Users, Newspaper, AlertTriangle, BarChart3, Coins,
  CheckCircle2, Star, Activity, MapPin, Code2, Calendar,
  Rss, Brain, Database, Clock, FileText, LayoutGrid, Rows, Smartphone, Leaf,
  Building2, ExternalLink, ChevronDown, Settings as SettingsIcon, Check,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type ThemeName } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import IntelligenceTicker from "@/components/IntelligenceTicker";
import { EXCHANGE_SMES, boardOf, ersBand, ERS_GATE, type ExchangeSME } from "@/lib/exchangeData";
import { COUNTRIES, composite, VERDICT_LABELS } from "@/lib/scannerData";
import { trpc } from "@/lib/trpc";

const RISK: Record<string, { label: string; cls: string }> = {
  low:      { label: "Low Risk",      cls: "bg-green-500/20 text-green-400 border-green-500/30" },
  medium:   { label: "Medium Risk",   cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  high:     { label: "High Risk",     cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  critical: { label: "Critical Risk", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const DEMO_INTEL = [
  { flag: "🇰🇪", name: "Kenya",    code: "KE", stability: 68, risk: "medium",   movement: "Gen Z Coalition" },
  { flag: "🇳🇬", name: "Nigeria",  code: "NG", stability: 54, risk: "high",     movement: "ENDSARS Revival" },
  { flag: "🇿🇦", name: "S. Africa",code: "ZA", stability: 72, risk: "medium",   movement: "MK Party Surge" },
  { flag: "🇬🇭", name: "Ghana",    code: "GH", stability: 81, risk: "low",      movement: "Election Watch" },
  { flag: "🇪🇹", name: "Ethiopia", code: "ET", stability: 41, risk: "critical", movement: "Tigray Monitor" },
  { flag: "🇸🇳", name: "Senegal",  code: "SN", stability: 77, risk: "low",      movement: "Youth Diaspora" },
];

// Upcoming African elections — hyperlinks to country deep-dive
const ELECTIONS = [
  { flag: "🇳🇬", country: "Nigeria",       date: "Feb 2027", type: "General Election",     code: "NG", urgent: false },
  { flag: "🇰🇪", country: "Kenya",         date: "Aug 2027", type: "General Election",     code: "KE", urgent: false },
  { flag: "🇿🇦", country: "South Africa",  date: "May 2026", type: "Municipal Elections",  code: "ZA", urgent: true  },
  { flag: "🇸🇳", country: "Senegal",       date: "Nov 2026", type: "Legislative",          code: "SN", urgent: false },
  { flag: "🇹🇿", country: "Tanzania",      date: "Oct 2026", type: "General Election",     code: "TZ", urgent: false },
  { flag: "🇨🇮", country: "Côte d'Ivoire", date: "Oct 2026", type: "Presidential",         code: "CI", urgent: false },
];

function StabilityBar({ score }: { score: number }) {
  const color = score >= 70 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{score}<span className="text-gray-600 font-normal">/100</span></span>
    </div>
  );
}

// ── Persona gate data ─────────────────────────────────────────────────────────

type PersonaId = "investor" | "analyst" | "ngo" | "journalist" | "researcher" | "enthusiast";

const PERSONAS: Array<{
  id: PersonaId;
  icon: React.ElementType;
  label: string;
  sub: string;
  accent: string;
  cta: string;
  path: string;
  steps: Array<{ step: string; title: string; desc: string; tag: string }>;
}> = [
  {
    id: "investor",
    icon: TrendingUp,
    label: "Investor",
    sub: "PE · DFI · VC · infrastructure funds",
    accent: "#22d3ee",
    cta: "Open Africa Scanner",
    path: "/scanner",
    steps: [
      { step: "01", title: "Rank all 55 markets", desc: "Africa Scanner scores every AU nation on composite PESTEL+IR. Sort by score, filter by region.", tag: "Africa Scanner" },
      { step: "02", title: "Run Investor DD", desc: "AI agent produces sovereign risk score, regulatory pipeline, exit scenarios, and entry/exit signals.", tag: "AI Agents Hub" },
      { step: "03", title: "Export the brief", desc: "Download board-ready output with citation key. Set a signal watchlist for ongoing country monitoring.", tag: "Archive + Watchlist" },
    ],
  },
  {
    id: "analyst",
    icon: BarChart3,
    label: "Policy analyst",
    sub: "Government · think-tank · multilateral",
    accent: "#a78bfa",
    cta: "Open AI Agents Hub",
    path: "/ai-agents",
    steps: [
      { step: "01", title: "Select country + dimension", desc: "Drill into any PESTEL+IR dimension for a live signal feed with severity scoring.", tag: "Country Intel" },
      { step: "02", title: "Generate policy brief", desc: "Policy Analyst agent tracks the legislative pipeline, maps stakeholders, and flags compliance risk.", tag: "AI Agents Hub" },
      { step: "03", title: "Deep analysis", desc: "Port the brief to Intelligence Workspace for document-grounded scenario modelling.", tag: "Intelligence Workspace" },
    ],
  },
  {
    id: "ngo",
    icon: Shield,
    label: "NGO / humanitarian",
    sub: "Field ops · advocacy · reporting",
    accent: "#34d399",
    cta: "View live signals",
    path: "/scanner",
    steps: [
      { step: "01", title: "Monitor live signals", desc: "Field contributors submit verified alerts — protests, displacement, policy shifts — classified by PESTEL dimension.", tag: "Field Signals" },
      { step: "02", title: "Run Crisis SitRep", desc: "AI agent produces a formal citation-ready SitRep with actor positions, alert level, and recommended response.", tag: "AI Agents Hub" },
      { step: "03", title: "Set alert watchlist", desc: "Pin countries and severity thresholds. Get notified the moment signals cross your threshold.", tag: "Signal Watchlist" },
    ],
  },
  {
    id: "journalist",
    icon: Newspaper,
    label: "Journalist",
    sub: "Investigative · broadcast · editorial",
    accent: "#fb923c",
    cta: "Open Intelligence Workspace",
    path: "/intelligence",
    steps: [
      { step: "01", title: "Track breaking signals", desc: "The live ticker surfaces political events across all 55 nations — sourced, severity-ranked, structured.", tag: "Breaking Signals" },
      { step: "02", title: "Run the Intel Pipeline", desc: "Click a signal → PESTEL analysis → game theory actor map → choose thread or newsletter format.", tag: "Intelligence Pipeline" },
      { step: "03", title: "Publish ready-to-use output", desc: "Corroborated thread copy, newsletter lead, or diplomatic cable — each with a confidence tier stated.", tag: "Intelligence Workspace" },
    ],
  },
  {
    id: "researcher",
    icon: Brain,
    label: "Researcher",
    sub: "Academic · think-tank · policy studies",
    accent: "#f472b6",
    cta: "Browse the Archive",
    path: "/archive",
    steps: [
      { step: "01", title: "Browse the archive", desc: "Public report archive — briefs, country profiles, SitReps — each with a citable VB citation key.", tag: "Report Archive" },
      { step: "02", title: "Upload your document", desc: "Attach your own research to Intelligence Workspace. VB cross-references it against live signals and PESTEL.", tag: "Intelligence Workspace" },
      { step: "03", title: "Generate a country brief", desc: "Country Intel Brief agent produces a full PESTEL+IR snapshot with Go/No-Go score — exportable.", tag: "AI Agents Hub" },
    ],
  },
  {
    id: "enthusiast",
    icon: Globe,
    label: "Curious citizen",
    sub: "Africa-watchers · diaspora · general",
    accent: "#22c55e",
    cta: "Explore free",
    path: "/scanner",
    steps: [
      { step: "01", title: "See what's moving", desc: "Africa Scanner shows stability scores, breaking alerts, and trending signals across all 55 nations.", tag: "Africa Scanner" },
      { step: "02", title: "Ask any question", desc: 'Type "What\'s happening in Sudan?" into the AI agent. Get a structured brief in plain language.', tag: "AI Agents Hub" },
      { step: "03", title: "Follow with signals", desc: "Set a watchlist for any country. Get notified when major signals break — alerts only, no noise.", tag: "Signal Watchlist" },
    ],
  },
];

export default function LandingPage() {
  const [, setLocation] = useLocation();

  // Live approved SME Exchange listings for the teaser (falls back to seed sample).
  const approvedListings = trpc.exchange.listApproved.useQuery();
  const liveSMEs: ExchangeSME[] = (approvedListings.data ?? []).map(r => ({
    id: `db-${r.id}`, listingId: r.id, name: r.name, sector: r.sector,
    country: r.countryName, countryCode: r.countryCode, location: r.location ?? r.countryName,
    ers: r.ers ?? 0,
    pillars: { governance: r.governance ?? 0, financial: r.financial ?? 0, innovation: r.innovation ?? 0, market: r.market ?? 0 },
    status: (r.statusTags as string[]) ?? [], summary: r.summary ?? "", sample: false,
  }));
  const teaserSMEs = liveSMEs.length ? liveSMEs : EXCHANGE_SMES;
  const teaserCapital = teaserSMEs.find(s => boardOf(s) === "capital_ready") ?? teaserSMEs[0];
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIdx, setCarouselIdx]   = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [carouselProgress, setCarouselProgress] = useState(0);
  const carouselElapsed  = useRef(0);
  const carouselT0       = useRef<number | null>(null);
  const carouselRaf      = useRef<number | null>(null);
  const CAROUSEL_N       = 6;
  const CAROUSEL_DUR     = 6000;
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | null>(null);

  // ── view mode (icon / classic) ──
  const [viewMode, setViewMode] = useState<"icon" | "classic">(() => {
    try { return (localStorage.getItem("vb_landing_view") as "icon" | "classic") || "classic"; } catch { return "classic"; }
  });
  const setView = (v: "icon" | "classic") => {
    setViewMode(v);
    try { localStorage.setItem("vb_landing_view", v); } catch {}
  };
  const { theme, setTheme } = useTheme();
  const themeList: ThemeName[] = ["dark", "light", "neon", "minimal", "ocean"];

  // ── Live hero data (Bloomberg-style board + feed) ──────────────────────────
  const verdictColour = (v: string) => v === "go-market" ? "#22c55e" : v === "monitor" ? "#84cc16" : v === "caution" ? "#f59e0b" : "#ef4444";
  const boardRows = [...COUNTRIES].sort((a, b) => composite(b) - composite(a)).slice(0, 6);
  const avgComposite = boardRows.length ? Math.round(boardRows.reduce((s, c) => s + composite(c), 0) / boardRows.length) : 0;
  const totalSignals = COUNTRIES.reduce((n, c) => n + (c.signals?.length ?? 0), 0);

  // Live feed that ticks (P: make it tick) — rotate a window of 4 through the pool.
  const signalPool = COUNTRIES.flatMap(c => (c.signals ?? []).map(s => ({ ...s, flag: c.flag, country: c.name })));
  const [feedStart, setFeedStart] = useState(0);
  const [ago, setAgo] = useState(0);
  useEffect(() => {
    if (signalPool.length === 0) return;
    const feed = setInterval(() => setFeedStart(i => (i + 1) % signalPool.length), 3500);
    const clock = setInterval(() => setAgo(a => (a + 1) % 60), 1000);
    return () => { clearInterval(feed); clearInterval(clock); };
  }, [signalPool.length]);
  const liveFeed = Array.from({ length: Math.min(4, signalPool.length) }, (_, k) => signalPool[(feedStart + k) % signalPool.length]);

  const handleExplore = () => {
    if (user) setLocation("/africa");
    else window.location.href = getLoginUrl();
  };

  const handleCreator = () => {
    if (user) {
      let onboarded = "1";
      try { onboarded = localStorage.getItem("vb_onboarded") ?? ""; } catch {}
      setLocation(onboarded === "1" ? "/dashboard" : "/onboarding");
    } else window.location.href = getLoginUrl();
  };

  const handleCountry = (code: string) => {
    if (user) setLocation(`/country/${code.toLowerCase()}`);
    else window.location.href = getLoginUrl();
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Not on the landing page — navigate there with hash
      window.location.href = `/#${id}`;
    }
  };

  const CAROUSEL_SLIDES = [
    {
      type: "stats",
      cta: { label: "Open Africa Scanner", path: "/scanner" },
    },
    {
      type: "quote",
      avatar: "AM", avatarBg: "linear-gradient(135deg,#0e7490,#0284c7)",
      name: "Amara Mensah", role: "Political Risk Analyst · Accra",
      saving: "Replaced 2 services",
      quote: "First platform I've found that produces a composite PESTEL+IR score I can actually <b>defend in a board briefing</b>. We replaced two expensive subscription services.",
      cta: { label: "See a Go/No-Go Brief", path: "/scanner/ken/brief" },
    },
    {
      type: "signals",
      cta: { label: "Unlock full feed — free", path: "/register" },
    },
    {
      type: "quote",
      avatar: "DO", avatarBg: "linear-gradient(135deg,#15803d,#16a34a)",
      name: "David Okonkwo", role: "Market Entry Director · Lagos",
      saving: "3 weeks saved",
      quote: "The Go/No-Go Brief <b>saved us three weeks of desk research</b> on our West Africa expansion. The risk matrix alone was worth the subscription — structured, cited, exportable.",
      cta: { label: "Pick a country, get a brief", path: "/scanner" },
    },
    {
      type: "compare",
      cta: { label: "See access options", path: "/pricing" },
    },
    {
      type: "sme",
      cta: { label: "Explore the SME Exchange", path: "/exchange" },
    },
    {
      type: "quote",
      avatar: "FK", avatarBg: "linear-gradient(135deg,#7c3aed,#9333ea)",
      name: "Fatou Kouyaté", role: "DFI Programme Analyst · Dakar",
      saving: "4 tools → 1",
      quote: "The Investment Readiness Scores alongside PESTEL give us a single view that <b>used to require four different tools</b>. The scanner is our first stop for any new market.",
      cta: { label: "Open Africa Scanner", path: "/scanner" },
    },
  ] as const;

  const carouselStop = useCallback(() => {
    if (carouselRaf.current) cancelAnimationFrame(carouselRaf.current);
  }, []);

  const carouselStart = useCallback(() => {
    carouselStop();
    carouselT0.current = performance.now() - carouselElapsed.current;
    const tick = (now: number) => {
      const el = now - carouselT0.current!;
      carouselElapsed.current = el;
      const pct = Math.min(el / CAROUSEL_DUR * 100, 100);
      setCarouselProgress(pct);
      if (el < CAROUSEL_DUR) {
        carouselRaf.current = requestAnimationFrame(tick);
      } else {
        carouselElapsed.current = 0;
        setCarouselIdx(i => (i + 1) % CAROUSEL_N);
      }
    };
    carouselRaf.current = requestAnimationFrame(tick);
  }, [carouselStop]);

  const carouselGoTo = useCallback((idx: number, userNav = false) => {
    const next = ((idx % CAROUSEL_N) + CAROUSEL_N) % CAROUSEL_N;
    setCarouselIdx(next);
    carouselElapsed.current = 0;
    setCarouselProgress(0);
    if (!userNav || !carouselPaused) {
      carouselStop();
      carouselT0.current = null;
    }
  }, [carouselPaused, carouselStop]);

  useEffect(() => {
    if (!carouselPaused) carouselStart();
    return carouselStop;
  }, [carouselIdx, carouselPaused, carouselStart, carouselStop]);

  // Scroll to hash section on mount (e.g. navigating to /#methodology from another page)
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, []);

  // Surface auth errors passed back from OAuth redirect
  const [authError, setAuthError] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    if (auth === "failed" || auth === "error") {
      const reason = params.get("reason");
      setAuthError(reason ? `Sign-in failed: ${reason}` : "Sign-in failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#050b1a] text-white overflow-x-hidden">

      {/* Auth error banner */}
      {authError && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-red-900/90 border-b border-red-700 px-4 py-3 flex items-center justify-between text-sm text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            {authError}
          </div>
          <button onClick={() => setAuthError(null)} className="text-red-400 hover:text-white ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full bg-[#050b1a]/90 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button className="flex items-center gap-3 focus:outline-none" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img src="/logo.png" alt="ViralBeat" className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-cyan-500/20" />
            <span className="font-bold text-lg tracking-tight text-white">ViralBeat</span>
            {/* Single, unified context badge */}
            <Badge className="hidden sm:inline-flex bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] ml-1" title="Africa Intelligence Scanner">Africa Intelligence</Badge>
          </button>

          {/* Primary links — the 6 most-used */}
          <div className="hidden md:flex items-center gap-0.5">
            {[["investment-facilitation", "OSS"], ["sme-exchange", "SME Exchange"], ["green-investment", "Green"], ["technicals", "The Technicals"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="px-3.5 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                {label}
              </button>
            ))}
            <button onClick={() => setLocation("/about#methodology")} className="px-3.5 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
              Methodology
            </button>

            {/* More ▾ — lower-frequency destinations */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3.5 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all inline-flex items-center gap-1 focus:outline-none">
                More <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => scrollTo("technicals")}>The Technicals</DropdownMenuItem>
                <DropdownMenuItem onClick={() => scrollTo("api")}>Developer API</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/exchange")}>SME Exchange</DropdownMenuItem>
                <DropdownMenuItem onClick={() => scrollTo("download-app")}>Get the app</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/about")}>About</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right zone — exactly three: Pricing · Settings · CTA */}
          <div className="flex items-center gap-2">
            <button onClick={() => setLocation("/pricing")} className="hidden sm:inline-flex px-3 py-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition-all">
              Access
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hidden sm:inline-flex border-white/10 text-gray-300">
                  <SettingsIcon className="w-4 h-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Landing view</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setView("icon")}>
                  <LayoutGrid className="w-4 h-4 mr-2" /> Icon view
                  {viewMode === "icon" && <Check className="w-4 h-4 ml-auto text-cyan-400" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("classic")}>
                  <Rows className="w-4 h-4 mr-2" /> Classic view
                  {viewMode === "classic" && <Check className="w-4 h-4 ml-auto text-cyan-400" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                {themeList.map(t => (
                  <DropdownMenuItem key={t} onClick={() => setTheme(t)} className="capitalize">
                    {t}
                    {theme === t && <Check className="w-4 h-4 ml-auto text-cyan-400" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <Button onClick={() => setLocation("/africa")} size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20">
                Open Dashboard <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleExplore} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20">Get Access</Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-gray-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-white/5 bg-[#050b1a] px-4 py-4 flex flex-col gap-1">
            {[["investment-facilitation", "OSS"], ["sme-exchange", "SME Exchange"], ["green-investment", "Green"], ["technicals", "The Technicals"], ["api", "API"]].map(([id, label]) => (
              <button key={id} onClick={() => { setMobileMenuOpen(false); scrollTo(id); }} className="text-left px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5">{label}</button>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); setLocation("/about#methodology"); }} className="text-left px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5">Methodology</button>
            <button onClick={() => { setMobileMenuOpen(false); setLocation("/exchange"); }} className="text-left px-3 py-2.5 text-sm font-semibold text-cyan-300 rounded-lg hover:bg-cyan-500/10">SME Exchange</button>
            <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
              {!user && <Button variant="outline" className="w-full border-white/10 text-white" onClick={() => { setMobileMenuOpen(false); window.location.href = getLoginUrl(); }}>Sign In / Register</Button>}
              <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold" onClick={() => { setMobileMenuOpen(false); handleExplore(); }}>Get Access</Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── INTELLIGENCE TICKER ────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30">
        <IntelligenceTicker />
      </div>

      {/* ── PHONE / ICON VIEW ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {viewMode === "icon" && (
          <motion.div
            key="icon-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen pt-16 flex flex-col items-center justify-center bg-[#050b1a] px-4 pb-8"
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl" />
            </div>

            {/* Phone frame */}
            <div className="relative w-full max-w-[520px] bg-[#0a0a0f] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl shadow-cyan-500/5 mt-6">
              {/* Status bar */}
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <span className="text-xs font-medium text-white/80">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-white/60" />
                  <Rss className="w-3 h-3 text-white/60" />
                </div>
              </div>

              {/* Brand */}
              <div className="text-center py-3">
                <p className="text-[11px] font-bold tracking-[3px] text-cyan-400 uppercase">Viral Beat</p>
                <p className="text-[9px] text-slate-500 tracking-wider mt-0.5">The Africa Intelligence Beat for Decision Makers</p>

              </div>

              {/* Live signal strip */}
              <div className="mx-4 mb-4 flex items-center gap-2 bg-cyan-500/8 border border-cyan-500/20 rounded-xl px-3 py-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shrink-0" />
                <span className="text-[9px] text-cyan-300/80 truncate">3 new signals · AU Commission · East Africa</span>
              </div>

              {/* App grid */}
              <div className="grid grid-cols-4 gap-y-6 gap-x-4 px-8 pb-4">
                {[
                  { emoji: "🌍", label: "Africa Hub",       path: "/africa",              badge: 0, bg: "from-[#0d2e1a] to-[#0a4a28]" },
                  { emoji: "📡", label: "Scanner",          path: "/scanner",             badge: 3, bg: "from-[#0d1e40] to-[#0a3070]" },
                  { emoji: "🧠", label: "Intelligence",     path: "/intelligence",        badge: 0, bg: "from-[#1a0d30] to-[#360060]" },
                  { emoji: "⚡", label: "Signals",          path: "/aggregator",          badge: 0, bg: "from-[#2d0d30] to-[#5a1060]" },
                  { emoji: "📋", label: "Go/No-Go",         path: "/scanner/ken/brief",   badge: 0, bg: "from-[#0a2a0a] to-[#1a4a1a]" },
                  { emoji: "🏗️", label: "IRS Score",       path: "/doing-business",      badge: 0, bg: "from-[#2a1500] to-[#5a3000]" },
                  { emoji: "🇰🇪", label: "Kenya Intel",     path: "/kenya",               badge: 0, bg: "from-[#001a30] to-[#002a50]" },
                  { emoji: "🗺️", label: "Elections",        path: "/africa",              badge: 0, bg: "from-[#1a0a30] to-[#350060]" },
                  { emoji: "💎", label: "Access",           path: "/pricing",             badge: 0, bg: "from-[#0a200a] to-[#1a3a1a]" },
                  { emoji: "📖", label: "About",            path: "/about",               badge: 0, bg: "from-[#151522] to-[#252540]" },
                  { emoji: "✉️", label: "Newsletter",       path: "/newsletter",          badge: 0, bg: "from-[#0d1a1a] to-[#1a2e2e]" },
                  { emoji: "⚙️", label: "Settings",         path: "/settings",            badge: 0, bg: "from-[#181818] to-[#2e2e2e]" },
                ].map(app => (
                  <button
                    key={app.path + app.label}
                    onClick={() => user ? setLocation(app.path) : (window.location.href = getLoginUrl())}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-[20px] bg-gradient-to-br ${app.bg} flex items-center justify-center text-3xl border border-white/6 transition-transform group-hover:scale-105 group-active:scale-95`}>
                        {app.emoji}
                      </div>
                      {app.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-[#0a0a0f]">{app.badge}</span>
                      )}
                    </div>
                    <span className="text-[9px] text-white/70 text-center leading-tight">{app.label}</span>
                  </button>
                ))}
              </div>

              {/* Dock */}
              <div className="mx-3 mb-4 bg-white/6 backdrop-blur rounded-2xl px-4 py-3 flex justify-around border border-white/8">
                {[
                  { emoji: "📡", label: "Scanner",   path: "/scanner" },
                  { emoji: "🌍", label: "Africa",    path: "/africa" },
                  { emoji: "⚡", label: "Signals",   path: "/aggregator" },
                  { emoji: "👤", label: "Profile",   path: "/contributor" },
                ].map(d => (
                  <button key={d.path} onClick={() => user ? setLocation(d.path) : (window.location.href = getLoginUrl())} className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-[15px] bg-white/8 flex items-center justify-center text-xl transition-transform group-hover:scale-105 group-active:scale-95">{d.emoji}</div>
                    <span className="text-[8px] text-white/50">{d.label}</span>
                  </button>
                ))}
              </div>

              {/* Home bar */}
              <div className="flex justify-center pb-3">
                <div className="w-24 h-1 bg-white/20 rounded-full" />
              </div>
            </div>

            {/* Switch hint */}
            <p className="text-[10px] text-slate-600 mt-4">
              Switch to <button onClick={() => setView("classic")} className="text-cyan-600 hover:text-cyan-400 underline-offset-2 underline">Classic view</button> for the full overview
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CLASSIC VIEW (hero + all sections + footer) ────────────────────── */}
      {viewMode === "classic" && <>

      {/* ── PERSONA GATE HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>
        <div className="relative max-w-6xl mx-auto">

          <div className="grid lg:grid-cols-2 gap-10 items-center mb-12">

            {/* LEFT — message (P4) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 text-sm font-medium text-cyan-400 mb-6">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                55 African nations · Live now
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-5" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                You are the Investor.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400">
                  Get your feet on the ground before you book the ticket.
                </span>
              </h1>
              <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 mb-6">
                Real-time political intelligence for all 55 African nations — from journalists, NGO officers and civic researchers who are{" "}
                <span className="text-white font-semibold">already there.</span>{" "}
                Live PESTEL+IR scores, Go/No-Go briefs and field signals. Free while in beta.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-3">
                <Button size="lg" className="text-base px-7 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-xl shadow-cyan-500/20" onClick={() => user ? setLocation("/scanner/ken/brief") : (window.location.href = getLoginUrl())}>
                  Read the Kenya brief free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-7 py-5 border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/40" onClick={() => user ? setLocation("/scanner") : (window.location.href = getLoginUrl())}>
                  See all 55 nations
                </Button>
              </div>
              <p className="text-xs text-gray-600 mb-6">No card required · Free during beta · Brief ready in 30 seconds</p>

              {/* Authority rail (P7) */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-5 gap-y-1.5 text-[11px] text-gray-500 border-t border-white/5 pt-4">
                <span><b className="text-white">55</b> nations</span>
                <span className="text-gray-700">·</span>
                <span><b className="text-white">{totalSignals}</b> signals tracked</span>
                <span className="text-gray-700">·</span>
                <span><b className="text-white">Ground-truth</b> field contributors</span>
                <span className="text-gray-700">·</span>
                <span>Sources: S&amp;P · IMF · national bodies</span>
              </div>
            </motion.div>

            {/* RIGHT — live markets board (P1/P2/P5/P6) + feed (P3) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <div className="rounded-2xl border border-[#1e3a5f] bg-[#0a1628]/80 backdrop-blur overflow-hidden shadow-2xl shadow-black/40">
                {/* Index header (P2) */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a5f]">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live · Africa markets
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-cyan-400 tabular-nums">{avgComposite}</span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-500">Composite idx</span>
                  </div>
                </div>
                {/* Rows (P1 + P6 deltas) */}
                {boardRows.map(c => {
                  const comp = composite(c);
                  const up = c.change30d >= 0;
                  const vc = verdictColour(c.verdict);
                  return (
                    <button key={c.code} onClick={() => user ? setLocation(`/scanner/${c.code}`) : (window.location.href = getLoginUrl())}
                      className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors text-left">
                      <span className="text-base w-6 shrink-0">{c.flag}</span>
                      <span className="text-sm text-white font-medium flex-1 truncate">{c.name}</span>
                      <span className="text-sm font-black text-white tabular-nums w-8 text-right">{comp}</span>
                      <span className={`text-xs font-bold tabular-nums w-14 text-right ${up ? "text-emerald-400" : "text-red-400"}`}>
                        {up ? "▲" : "▼"} {up ? "+" : ""}{c.change30d}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded w-[70px] text-center shrink-0"
                        style={{ color: vc, background: `${vc}18`, border: `1px solid ${vc}33` }}>
                        {VERDICT_LABELS[c.verdict]}
                      </span>
                    </button>
                  );
                })}
                <div className="px-4 py-2 text-[10px] text-slate-600">Updated 2m ago · composite = PESTEL ×0.6 + IRS ×0.4 · 30-day Δ</div>
              </div>

              {/* Live signals feed (P3 + P5 provenance) */}
              <div className="mt-3 rounded-2xl border border-[#1e3a5f] bg-[#0a1628]/80 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Live signals — updating now
                  </div>
                  <span className="text-[10px] text-slate-600 tabular-nums">{ago}s ago</span>
                </div>
                <motion.div key={feedStart} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-2">
                  {liveFeed.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${s.impact === "pos" ? "bg-emerald-400" : s.impact === "neg" ? "bg-red-400" : "bg-slate-500"}`} />
                      <div className="min-w-0">
                        <div className="text-[12px] text-slate-300 leading-snug truncate">{s.flag} {s.text}</div>
                        <div className="text-[10px] text-slate-600">{s.source} · {s.time} · <span className="text-emerald-500/70">✓ verified</span></div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Persona selector */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Who are you? Get to your goal faster.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {PERSONAS.map((p) => {
                const Icon = p.icon;
                const active = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(active ? null : p.id)}
                    className={`group relative text-left rounded-2xl border p-4 transition-all duration-200 ${
                      active
                        ? "border-cyan-500/60 bg-cyan-500/8 shadow-lg shadow-cyan-500/10"
                        : "border-[#1e3a5f] bg-[#0a1628] hover:border-[#2a4a7f] hover:bg-[#0d1e3a]"
                    }`}
                  >
                    {active && <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: active ? `${p.accent}22` : "rgba(255,255,255,0.05)" }}>
                      <Icon className="w-4 h-4" style={{ color: active ? p.accent : "#6b7280" }} />
                    </div>
                    <div className="font-semibold text-sm text-white mb-0.5">{p.label}</div>
                    <div className="text-[11px] text-gray-500 leading-snug">{p.sub}</div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Path panel — persona-specific 3-step route */}
          <AnimatePresence mode="wait">
            {selectedPersona && (() => {
              const p = PERSONAS.find(x => x.id === selectedPersona)!;
              return (
                <motion.div
                  key={selectedPersona}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="rounded-2xl border overflow-hidden mb-8"
                  style={{ borderColor: `${p.accent}40`, background: `${p.accent}08` }}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${p.accent}20` }}>
                        <p.icon className="w-4 h-4" style={{ color: p.accent }} />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{p.label} fast path</div>
                        <div className="text-xs text-gray-500">Your 3-step route to decision-ready intelligence</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => user ? setLocation(p.path) : (window.location.href = getLoginUrl())}
                      size="sm"
                      className="font-bold text-black shrink-0"
                      style={{ background: p.accent }}
                    >
                      {p.cta} <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
                    {p.steps.map((s, i) => (
                      <div key={i} className="px-5 py-4">
                        <div className="text-[10px] font-bold mb-2" style={{ color: p.accent }}>Step {s.step}</div>
                        <div className="font-semibold text-white text-sm mb-1.5">{s.title}</div>
                        <div className="text-xs text-gray-400 leading-relaxed mb-3">{s.desc}</div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                          style={{ color: p.accent, borderColor: `${p.accent}40`, background: `${p.accent}10` }}>
                          {s.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Persona path panel */}
          {!selectedPersona && (
            <div className="flex flex-wrap justify-center gap-8 pt-2">
              {[["55", "Nations monitored"], ["312+", "Signals this week"], ["PESTEL+IR", "7-dimension framework"], ["1/40×", "vs Oxford Analytica cost"]].map(([val, label]) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-2xl font-black text-cyan-400">{val}</span>
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BEFORE / AFTER PAIN SECTION ─────────────────────────────────────── */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="grid sm:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-[#1e3a5f]">
              {/* Without */}
              <div className="bg-[#140a0a] border-r border-[#1e3a5f] p-7">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-widest mb-5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Without ViralBeat
                </div>
                {[
                  "A 3-month-old country PDF from a consulting firm",
                  "Google search and Wikipedia for political context",
                  "Book flights. Arrive. Discover things have changed.",
                  "$10,000+/yr for a generic global subscription",
                  "No one on the ground to tell you what's really happening",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 mb-3.5">
                    <div className="w-4 h-4 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-red-400 text-[9px] font-black">✕</span>
                    </div>
                    <span className="text-sm text-gray-400 leading-snug">{item}</span>
                  </div>
                ))}
                <div className="mt-5 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 text-sm text-red-300 font-medium">
                  $50,000 wasted on a trip that should have been a 30-second brief.
                </div>
              </div>
              {/* With */}
              <div className="bg-[#060c1e] p-7">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-5">
                  <MapPin className="w-3.5 h-3.5" /> With ViralBeat
                </div>
                {[
                  "Live PESTEL+IR score updated by contributors in-country today",
                  "Field signals from journalists and NGO officers on the ground",
                  "Go/No-Go brief in 30 seconds — cited, exportable, defensible",
                  "Free while in beta — no card required",
                  "People in Nairobi, Lagos, Dakar filing intelligence right now",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 mb-3.5">
                    <div className="w-4 h-4 rounded-full bg-cyan-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
                    </div>
                    <span className="text-sm text-gray-300 leading-snug">{item}</span>
                  </div>
                ))}
                <div className="mt-5 rounded-xl bg-cyan-500/8 border border-cyan-500/20 px-4 py-3 text-sm text-cyan-300 font-medium">
                  You are the Investor. Get your feet on the ground before you book the ticket.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ────────────────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-white/[0.02] py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-8 text-xs text-gray-500 font-medium uppercase tracking-wider">
          {[["55", "Nations"], ["PESTEL+IR", "7 Dimensions"], ["Composite", "Go/No-Go Score"], ["Go-Market", "Entry Verdict"], ["Open", "Developer API"]].map(([val, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-cyan-400 font-black">{val}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── OSS INVESTMENT FACILITATION HOOK ───────────────────────────────── */}
      <section id="investment-facilitation" className="py-24 px-4" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>

            {/* Section header */}
            <div className="text-left mb-12 max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Investment Facilitation</Badge>
                <span className="text-xs text-emerald-400/80 border border-emerald-500/20 bg-emerald-500/5 rounded-full px-3 py-1">● 8 countries · live data</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black mb-4">
                The Market Is Open.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">OSS Confirms It.</span>
              </h2>
              <p className="text-gray-300 text-lg">
                Beyond PESTEL scores and IRS rankings — a country's One-Stop-Shop for investment is the single clearest signal that the market is ready and open for business. ViralBeat maps every active OSS across Africa so you know exactly where the door is open.
              </p>
            </div>

            {/* Two-column layout: explanation left, Rwanda card right */}
            <div className="grid lg:grid-cols-2 gap-10 items-start mb-12">

              {/* Left — what OSS means */}
              <div className="space-y-6">
                {[
                  { icon: CheckCircle2, color: "#22c55e", title: "Single-window entry", desc: "Company registration, investment permits, immigration, tax clearances, and sector licences — under one roof, one process." },
                  { icon: Zap,          color: "#22d3ee", title: "Digital-first processing", desc: "Leading OSS centres offer fully online portals. Rwanda's RDB processes company registration in 1 day." },
                  { icon: Shield,       color: "#a78bfa", title: "Legal mandate & accountability", desc: "Each OSS is established by law — giving investors a clear counterparty with enforceable service-level obligations." },
                  { icon: Building2,    color: "#f59e0b", title: "Verified contact access", desc: "Analyst and Enterprise subscribers get direct officer contacts — the people who actually move your application." },
                ].map(({ icon: Icon, color, title, desc }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                    className="flex gap-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right — Rwanda OSS preview card */}
              <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }}
                className="rounded-2xl border border-emerald-500/20 bg-[#060f0b] overflow-hidden">

                {/* Card header */}
                <div className="px-6 pt-6 pb-4 border-b border-[#0f2a1e]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60">One-Stop-Shop</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/22 text-emerald-400">Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇷🇼</span>
                        <div>
                          <div className="text-sm font-bold text-white">Rwanda Development Board (RDB)</div>
                          <div className="text-[10px] text-slate-500">Est. 2009 · Law No. 26/2008 · Kigali</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mt-4">
                    Facilitates all investor needs under one roof — company registration, investment permits, immigration, tax, environmental clearances, and sector licences.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-0 border-b border-[#0f2a1e]">
                  {[
                    { v: "8/8", l: "Services",  c: "#22c55e" },
                    { v: "7",   l: "Digital",   c: "#22d3ee" },
                    { v: "1d",  l: "Fastest",   c: "#a78bfa" },
                  ].map(({ v, l, c }, i) => (
                    <div key={i} className={`py-4 text-center ${i < 2 ? "border-r border-[#0f2a1e]" : ""}`}>
                      <div className="text-xl font-extrabold" style={{ color: c }}>{v}</div>
                      <div className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>

                {/* 3 services preview */}
                <div className="border-b border-[#0f2a1e]">
                  {["Company Registration", "Investment Certificate", "Immigration & Work Permit"].map((svc, i) => (
                    <div key={i} className={`flex items-center gap-3 px-5 py-2.5 ${i < 2 ? "border-b border-[#0a1a12]" : ""}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs text-slate-300 flex-1">{svc}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/8 border border-cyan-500/18 text-cyan-400">Online</span>
                    </div>
                  ))}
                  <div className="px-5 py-2 text-[10px] text-slate-600 italic">+ 5 more services…</div>
                </div>

                {/* Locked contacts teaser */}
                <div className="px-5 py-4 flex items-center gap-3 bg-[#0a1a12]/60">
                  <Shield className="w-4 h-4 text-slate-600 shrink-0" />
                  <p className="text-xs text-slate-500 flex-1">Direct OSS officer contacts visible to <span className="text-emerald-400 font-semibold">Analyst</span> and <span className="text-emerald-400 font-semibold">Enterprise</span> subscribers.</p>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5 pt-3">
                  <button
                    onClick={() => user ? setLocation("/scanner/rwa") : (window.location.href = getLoginUrl())}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/18 border border-emerald-500/25 hover:border-emerald-500/45 text-emerald-400 text-xs font-bold transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Rwanda Investment Facilitation Profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Country chips row */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-4 uppercase tracking-widest">OSS coverage live across</p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {[
                  { flag: "🇰🇪", name: "Kenya",    code: "ken" },
                  { flag: "🇷🇼", name: "Rwanda",   code: "rwa" },
                  { flag: "🇬🇭", name: "Ghana",    code: "gha" },
                  { flag: "🇸🇳", name: "Senegal",  code: "sen" },
                  { flag: "🇪🇹", name: "Ethiopia", code: "eth" },
                  { flag: "🇳🇬", name: "Nigeria",  code: "nga" },
                  { flag: "🇿🇦", name: "S. Africa",code: "zaf" },
                  { flag: "🇹🇿", name: "Tanzania", code: "tza" },
                ].map(({ flag, name, code }) => (
                  <button key={code}
                    onClick={() => user ? setLocation(`/scanner/${code}`) : (window.location.href = getLoginUrl())}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 bg-white/[0.03] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-xs text-gray-400 hover:text-emerald-400">
                    {flag} {name}
                  </button>
                ))}
              </div>
              <Button size="lg" onClick={() => user ? setLocation("/scanner") : (window.location.href = getLoginUrl())}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-xl shadow-emerald-500/20">
                Explore Investment Facilitation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SME EXCHANGE SECTION ────────────────────────────────────────────── */}
      <section id="sme-exchange" className="py-24 px-4" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>

            {/* Header */}
            <div className="text-left mb-12 max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">SME Exchange</Badge>
                <span className="text-xs text-cyan-400/80 border border-cyan-500/20 bg-cyan-500/5 rounded-full px-3 py-1">● Phase 1 · discovery only</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ fontFamily: "Georgia, serif" }}>
                List small. Prove it.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Graduate up.</span>
              </h2>
              <p className="text-gray-300 text-lg">
                A stock-market-style ladder for African enterprise. SMEs build a verified Enterprise Readiness Score
                and graduate from the open floor to the capital-ready board at ERS {ERS_GATE}.
              </p>
            </div>

            {/* Two boards */}
            <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-5 items-stretch mb-10">

              {/* Open board */}
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold text-emerald-300">Open Innovation board</div>
                  <span className="text-[11px] text-emerald-300/80 bg-emerald-500/10 rounded-full px-2.5 py-0.5">ERS &lt; {ERS_GATE}</span>
                </div>
                <div className="text-xs text-gray-500 mb-5">Discovery &amp; collaboration · capacity building</div>
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                  <Building2 className="w-7 h-7 text-slate-700 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-gray-300 mb-1">Be the first on the floor</div>
                  <p className="text-xs text-gray-500 mb-4">List your SME, complete the governance checklist, and build your ERS toward graduation.</p>
                  <Button size="sm" className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 gap-1.5"
                    onClick={() => setLocation("/exchange/list")}>
                    List your SME <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Graduation gate */}
              <div className="hidden lg:flex flex-col items-center justify-center gap-2">
                <div className="text-[11px] text-amber-400 text-center leading-tight">graduate<br />ERS {ERS_GATE}</div>
                <ArrowRight className="w-7 h-7 text-amber-400" />
              </div>

              {/* Capital-ready board */}
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.05] p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold text-purple-300">Capital-Ready board</div>
                  <span className="text-[11px] text-purple-300/80 bg-purple-500/12 rounded-full px-2.5 py-0.5">ERS {ERS_GATE}+</span>
                </div>
                <div className="text-xs text-gray-500 mb-5">Investor screening · partner matchmaking</div>
                {(() => {
                  const sme = teaserCapital;
                  if (!sme) return null;
                  const band = ersBand(sme.ers);
                  const clickable = sme.listingId != null;
                  return (
                    <div onClick={() => { if (clickable) setLocation(`/exchange/sme/${sme.listingId}`); }}
                      className={`rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 ${clickable ? "cursor-pointer hover:border-cyan-500/40 hover:bg-white/[0.05] transition-colors" : ""}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="text-base font-black text-white truncate">{sme.name}</div>
                          <div className="text-xs text-gray-500">{sme.sector} · {sme.country}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black" style={{ color: band.color }}>{sme.ers}</div>
                          <div className="text-[9px] uppercase tracking-widest text-gray-500">ERS</div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden mb-3">
                        <div className="h-full rounded-full" style={{ width: `${sme.ers}%`, background: band.color }} />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold border"
                          style={{ color: band.color, background: `${band.color}14`, borderColor: `${band.color}33` }}>{band.label}</span>
                        {sme.status.slice(0, 2).map(s => (
                          <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-gray-300">{s}</span>
                        ))}
                      </div>
                      {clickable && (
                        <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-cyan-400 font-semibold">
                          View profile <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="text-center">
              <Button onClick={() => setLocation("/exchange")} className="bg-cyan-500 hover:bg-cyan-400 text-[#04222b] font-bold gap-2">
                Explore the SME Exchange <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-[11px] text-gray-600 mt-3">
                Phase 1 discovery only · {liveSMEs.length ? `${liveSMEs.length} listing${liveSMEs.length === 1 ? "" : "s"} live` : "sample listing shown"}
              </p>
            </div>

          </motion.div>
        </div>
      </section>


      {/* ── GREEN INVESTMENT (GIaaS) ────────────────────────────────────────── */}
      <section id="green-investment" className="py-32 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-4">
                <Leaf className="w-3 h-3 mr-1" /> Green Intelligence — GIaaS × VB
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                Africa's Green Investment<br />
                <span className="text-emerald-400">Validation Layer</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Citizen-validated ESG project intelligence across all 55 AU nations. Cut through greenwashing with ground-truth data. Earn VBT for field observations.
              </p>
            </motion.div>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                emoji: "🌍",
                color: "#34d399",
                title: "Project Registry",
                desc: "Every recognised renewable energy, REIT, and sustainable agriculture project across Africa — scored, ranked, and continuously updated by the VB Agent.",
                badge: "Browse",
                href: "/green",
              },
              {
                emoji: "👁️",
                color: "#a78bfa",
                title: "Citizen Validation",
                desc: "Local observers submit field data, photos, and community reports to validate or dispute developer claims. Divergence scores flag greenwashing in real time.",
                badge: "Validate",
                href: "/green",
              },
              {
                emoji: "🪙",
                color: "#fbbf24",
                title: "VBT Rewards",
                desc: "Earn ViralBeat Tokens for every approved field observation. Disputes earn a higher bonus — honest ground-truth reporting is the most valuable signal on the network.",
                badge: "Earn",
                href: "/green",
              },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
                onClick={() => user ? setLocation(item.href) : (window.location.href = getLoginUrl())}
                className="bg-[#0a1f0f] border border-emerald-900/40 rounded-2xl p-7 hover:border-emerald-500/40 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${item.color}15` }}>{item.emoji}</div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border" style={{ color: item.color, borderColor: `${item.color}40`, background: `${item.color}10` }}>{item.badge}</span>
                </div>
                <h3 className="font-bold text-lg text-white mb-2 group-hover:text-emerald-300 transition-colors">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.desc}</p>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: item.color }}>
                  Open {item.title} <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats bar */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-[#0a1f0f] border border-emerald-900/40 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6 mb-10">
            {[
              { value: "55", label: "Nations Covered", color: "text-emerald-400" },
              { value: "3", label: "Sectors Tracked", color: "text-emerald-400" },
              { value: "VBT", label: "Token Rewards", color: "text-yellow-400" },
              { value: "AI", label: "Greenwashing Detection", color: "text-purple-400" },
            ].map((stat, i) => (
              <div key={i} className="text-center flex-1 min-w-[120px]">
                <div className={`text-2xl font-black ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg"
              onClick={() => user ? setLocation("/green") : (window.location.href = getLoginUrl())}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xl shadow-emerald-900/30 mr-3">
              <Leaf className="w-4 h-4 mr-2" /> Explore Green Projects
            </Button>
            <Button size="lg" variant="outline"
              onClick={() => user ? setLocation("/green/register") : (window.location.href = getLoginUrl())}
              className="border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/20">
              Register a Project
            </Button>
          </div>
        </div>
      </section>

      {/* ── THE TECHNICALS (clustered pillars) ──────────────────────────────── */}
      <section id="technicals" className="py-32 px-4" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-left mb-12 max-w-3xl">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">The Technicals</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">How the intelligence layer works</h2>
            <p className="text-gray-300 text-lg">
              Four pillars turn raw, on-the-ground signal into a defensible entry decision — scored, verified, and ready to build on.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: BarChart3, color: "#22d3ee", tag: "Scan · Analyse · Decide", title: "From Signal to Decision", desc: "Every African market scored on a Composite Index (PESTEL x 0.6 + IRS x 0.4). Scan 55 nations, deep-dive any country, and generate a structured Go/No-Go brief.", bullets: ["55 AU markets ranked", "Full PESTEL+IR deep dive", "Exportable Go/No-Go brief"], cta: "Open Africa Scanner", onClick: () => user ? setLocation("/scanner") : (window.location.href = getLoginUrl()) },
              { icon: Calendar, color: "#fb923c", tag: "Electoral Calendar", title: "Transitional Leadership", desc: "Track elections, leadership transitions, and political risk across all 55 nations — with the intelligence brief behind every date.", bullets: ["Elections for 55 nations", "Imminent-transition alerts", "One click to country brief"], cta: "View electoral calendar", onClick: () => handleExplore() },
              { icon: Shield, color: "#34d399", tag: "Ground Truth", title: "Field-Verified Signals", desc: "Journalists, NGO officers, and researchers file signals that pass a 4-stage validation gate before they move a country's composite score.", bullets: ["Verified contributor network", "4-stage validation gate", "Auditable source chain"], cta: "Meet the field network", onClick: () => scrollTo("creator-network") },
              { icon: Code2, color: "#60a5fa", tag: "Developer API", title: "Open API & Embedding", desc: "A clean REST API delivers real-time scores, briefings, PESTEL+IR signals, and Investment Readiness Scores — ready to integrate in minutes.", bullets: ["Composite score endpoints", "Go/No-Go brief by country", "Elections + IRS feeds"], cta: "See the API", onClick: () => scrollTo("api") },
            ].map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                className="flex flex-col bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-6 hover:border-cyan-500/30 transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${p.color}15` }}>
                  <p.icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: p.color }}>{p.tag}</span>
                <h3 className="font-bold text-lg text-white mb-2 leading-tight">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{p.desc}</p>
                <ul className="space-y-1.5 mb-5">
                  {p.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: p.color }} />{b}
                    </li>
                  ))}
                </ul>
                <button onClick={p.onClick} className="mt-auto flex items-center gap-1 text-xs font-semibold hover:gap-1.5 transition-all" style={{ color: p.color }}>
                  {p.cta} <ArrowRight className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── API / DEVELOPER ──────────────────────────────────────────────────── */}
      <section id="api" className="py-32 px-4" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">Developer API</Badge>
              <h2 className="text-4xl font-black mb-5 text-white">Embed Africa Intelligence in Your Product</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                A clean REST API gives your app real-time stability scores, country briefings, civic movement data, PESTEL+IR signals, and Investment Readiness Scores — ready to integrate in minutes.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  ["GET /v1/scanner/:code",           "Composite score + verdict for any AU nation"],
                  ["GET /v1/scanner/:code/brief",     "Full Go/No-Go brief with risk matrix"],
                  ["GET /v1/pestel/:code/signals",    "PESTEL+IR signals by country"],
                  ["GET /v1/africa/:code/news",       "Live news articles by country"],
                  ["GET /v1/elections/calendar",      "Upcoming elections for all 55 nations"],
                  ["GET /v1/irs/:code",               "Investment Readiness Score + B-READY indicators"],
                ].map(([endpoint, desc]) => (
                  <div key={endpoint} className="flex items-center gap-3 bg-[#0f2240] border border-[#1e3a5f] rounded-lg px-4 py-2.5">
                    <code className="text-xs text-cyan-400 font-mono flex-1 truncate">{endpoint}</code>
                    <span className="text-[10px] text-gray-500 shrink-0">{desc}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => user ? setLocation("/developer-hub") : (window.location.href = getLoginUrl())} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                <Code2 className="mr-2 w-4 h-4" /> Get API Keys
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e3a5f] bg-white/[0.02]">
                  <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/60" /></div>
                  <span className="text-xs text-gray-500 font-mono ml-1">GET /v1/africa/NG/brief</span>
                </div>
                <pre className="p-5 text-xs font-mono text-gray-300 leading-relaxed overflow-x-auto">{`{
  "country": "Nigeria",
  "pestelScore": 58,
  "irs": 51,
  "compositeScore": 55,
  "verdict": "caution",
  "riskLevel": "high",
  "headOfState": "Bola Tinubu",
  "pestelBreak": {
    "P": 55, "E": 58, "S": 62,
    "T": 60, "En": 52, "L": 56,
    "IR": 51
  },
  "topSector": {
    "name": "Fintech / Mobile Money",
    "score": 78,
    "verdict": "go"
  },
  "nextElection": "Feb 2027"
}`}</pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CREATOR NETWORK ─────────────────────────────────────────────────── */}
      <section id="creator-network" className="py-32 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">Field Contributors</Badge>
              <h2 className="text-4xl sm:text-5xl font-black mb-5">
                Ground Truth <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Earns Its Own Weight</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
                Observers, Analysts, and Correspondents submit verified field signals that feed the PESTEL+IR intelligence pipeline. Every submission is cross-referenced, tiered by contributor credibility, and surfaced in the Intelligence Workspace. The value chain runs through verification — not volume — giving institutional users data they can defend.
              </p>
            </div>

            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-5 mb-8">
              {[
                ["Verified Contributor Tiers", "Observer → Analyst → Correspondent → Partner. Each tier reflects the depth and credibility of your intelligence contributions — earned, not bought."],
                ["PESTEL+IR Signal Pipeline", "Every field signal is auto-classified across Political, Economic, Social, Tech, Environmental, Legal, and Investor Readiness dimensions — then surfaced in the Intelligence Workspace."],
                ["Contributor Verification", "Verified contributors receive credibility badges, elevated signal weighting, and priority placement in the intelligence feed."],
                ["Cite It Publicly", "Contributors reference the methodology openly, so the intelligence you file becomes defensible evidence for institutional users."],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm">{title}</div>
                    <div className="text-gray-400 text-sm leading-snug">{desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            {/* VBT rewards — slim strip (reputation, not payment) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 mb-8 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Coins className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 font-semibold">VBT rewards</span> · reputation, not payment
              </div>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <span><b className="text-purple-300">+500</b> <span className="text-gray-500 text-xs">file a signal</span></span>
                <span><b className="text-cyan-300">+50</b> <span className="text-gray-500 text-xs">validate</span></span>
                <span><b className="text-emerald-300">+200</b> <span className="text-gray-500 text-xs">tier bonus / mo</span></span>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={() => user ? setLocation("/haa") : (window.location.href = getLoginUrl())} variant="outline" className="border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400/50">
                Join as a Contributor <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SOCIAL PROOF CAROUSEL ───────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black mb-2">Why Choose ViralBeat</h2>
            <p className="text-gray-500 text-sm">Pause any slide to go deeper</p>
          </div>

          {/* Progress bar */}
          <div className="h-[2px] bg-white/5 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full transition-none" style={{ width: `${carouselProgress}%` }} />
          </div>

          {/* Viewport */}
          <div
            className="relative overflow-hidden rounded-2xl"
            onMouseEnter={() => { if (!carouselPaused) carouselStop(); }}
            onMouseLeave={() => { if (!carouselPaused) carouselStart(); }}
          >
            {/* Track */}
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
            >
              {CAROUSEL_SLIDES.map((slide, idx) => (
                <div key={idx} className="min-w-full">
                  <div className="relative bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-7">

                    {/* ── Slide content ── */}
                    {slide.type === "stats" && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[["55", "African nations covered"], ["1/40×", "vs Oxford Analytica cost"], ["312+", "Signals this week"], ["Live", "People on the ground"]].map(([num, lbl]) => (
                          <div key={lbl} className="text-center p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                            <span className="block text-2xl font-black text-cyan-400 mb-1">{num}</span>
                            <span className="text-[11px] text-gray-500 leading-snug">{lbl}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {slide.type === "quote" && (
                      <>
                        <div className="flex gap-0.5 mb-4">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}</div>
                        <p className="text-sm leading-relaxed text-gray-300 mb-5 italic"
                          dangerouslySetInnerHTML={{ __html: `"${(slide as any).quote}"` }} />
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: (slide as any).avatarBg }}>{(slide as any).avatar}</div>
                          <div>
                            <div className="text-sm font-semibold text-white">{(slide as any).name}</div>
                            <div className="text-xs text-gray-500">{(slide as any).role}</div>
                          </div>
                          <div className="ml-auto text-[11px] font-medium text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-md">{(slide as any).saving}</div>
                        </div>
                      </>
                    )}

                    {slide.type === "signals" && (
                      <>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest mb-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          Live signals — updating now
                        </div>
                        {[
                          { flag: "🇰🇪", headline: "Kenya: Pre-election risk elevated — opposition coalition forming", meta: "Political · 4 min ago · VB Field Contributor, Nairobi", badge: "Caution", cls: "text-orange-400 bg-orange-400/10", blur: false },
                          { flag: "🇷🇼", headline: "Rwanda: IRS score 81/100 — #1 ease of doing business, East Africa", meta: "Economic · 22 min ago · RDB Official", badge: "Go-market", cls: "text-green-400 bg-green-400/10", blur: false },
                          { flag: "🇳🇬", headline: "Nigeria: Parallel FX divergence widens — central bank pressure", meta: "Economic · 1 hr ago", badge: "No-go", cls: "text-red-400 bg-red-400/10", blur: true },
                        ].map((s, i) => (
                          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-1.5 ${s.blur ? "blur-sm opacity-40 pointer-events-none" : ""}`}>
                            <span className="text-base">{s.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-gray-200 truncate">{s.headline}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">{s.meta}</div>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${s.cls}`}>{s.badge}</span>
                          </div>
                        ))}
                        <div className="mt-3 text-center text-[11px] text-gray-400 bg-cyan-500/5 border border-cyan-500/15 rounded-lg py-2">
                          Showing 2 of <span className="text-cyan-400 font-semibold">312 signals</span> this week — sign up free to unlock all 55 nations
                        </div>
                      </>
                    )}

                    {slide.type === "compare" && (
                      <>
                        <div className="text-xs text-gray-500 mb-3">How ViralBeat compares</div>
                        <div className="grid grid-cols-3 text-[10px] text-gray-600 uppercase tracking-wider mb-2 gap-2">
                          <span />
                          <span className="text-center">Oxford Analytica / EIU</span>
                          <span className="text-center text-cyan-400">ViralBeat</span>
                        </div>
                        {[
                          ["Africa-specific", "— Generic global", "✓ All 55 AU nations"],
                          ["Field contributors", "—", "✓ Ground-truth data"],
                          ["Instant Go/No-Go brief", "— Custom project", "✓ Instant · PDF"],
                          ["API access", "— Enterprise only", "✓ All tiers"],
                        ].map(([feat, them, us]) => (
                          <div key={feat} className="grid grid-cols-3 gap-2 py-2 border-b border-white/[0.05] text-[11px]">
                            <span className="text-gray-500">{feat}</span>
                            <span className="text-center text-gray-600">{them}</span>
                            <span className="text-center text-green-400 font-medium">{us}</span>
                          </div>
                        ))}
                        <div className="flex justify-around items-center mt-4">
                          <div className="text-center"><div className="text-base font-black text-red-400">$10,000+/yr</div><div className="text-[10px] text-gray-600">Oxford Analytica</div></div>
                          <div className="text-gray-700 text-lg">→</div>
                          <div className="text-center"><div className="text-base font-black text-cyan-400">Free in beta</div><div className="text-[10px] text-gray-600">ViralBeat</div></div>
                        </div>
                      </>
                    )}

                    {slide.type === "sme" && (
                      <>
                        <div className="flex items-center gap-2 text-[10px] text-cyan-400 uppercase tracking-widest mb-3">
                          <Building2 className="w-3.5 h-3.5" /> SME Exchange · a pathway to market discovery
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">From intelligence to opportunity</h3>
                        <p className="text-sm text-gray-300 leading-relaxed mb-4">
                          The scanner tells you a market is open — the <span className="text-cyan-300 font-semibold">SME Exchange</span> shows you who to work with in it.
                          Discover verified, investment-ready African SMEs by their Enterprise Readiness Score, then connect safely on-platform.
                        </p>
                        <div className="grid grid-cols-3 gap-3 mb-2">
                          {[
                            ["Discover", "Filter SMEs by country, sector & ERS"],
                            ["Verify", "Ground-truth readiness, not self-claims"],
                            ["Connect", "Safe, on-platform introductions"],
                          ].map(([t, d]) => (
                            <div key={t} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                              <div className="text-sm font-bold text-cyan-300 mb-0.5">{t}</div>
                              <div className="text-[11px] text-gray-500 leading-snug">{d}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-3">For investors, enterprises & DFIs seeking their next African partner.</div>
                      </>
                    )}

                    {/* ── CTA overlay — visible when paused ── */}
                    <AnimatePresence>
                      {carouselPaused && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 rounded-2xl bg-[#060c1e]/75 flex items-center justify-center"
                        >
                          <button
                            onClick={() => {
                              setCarouselPaused(false);
                              user ? setLocation(slide.cta.path) : (window.location.href = getLoginUrl());
                            }}
                            className="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-xl shadow-cyan-500/20"
                          >
                            {slide.cta.label} <ArrowRight className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={() => { carouselStop(); carouselGoTo(carouselIdx - 1, true); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Previous"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>

            {CAROUSEL_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { carouselStop(); carouselGoTo(i, true); }}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === carouselIdx ? "w-5 bg-cyan-400" : "w-1.5 bg-white/15"}`}
              />
            ))}

            <button
              onClick={() => { carouselStop(); carouselGoTo(carouselIdx + 1, true); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCarouselPaused(p => !p)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs transition-all ${carouselPaused ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/5" : "border-white/10 text-gray-500 bg-white/[0.03] hover:text-gray-300"}`}
            >
              {carouselPaused
                ? <><Activity className="w-3 h-3" /> Resume</>
                : <><Clock className="w-3 h-3" /> Pause</>
              }
            </button>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD APP ─────────────────────────────────────────────────────── */}
      <section id="download-app" className="py-32 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Mobile App</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Africa Intelligence<br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">In Your Pocket</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">
              Live signals, PESTEL alerts, and field reports from all 55 nations — on iOS and Android. Get notified the moment a signal matches your country watchlist.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* App Store */}
            <a
              href="https://apps.apple.com/app/viralbeat"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-white/8 rounded-2xl px-6 py-5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Download on the</p>
                <p className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">App Store</p>
                <p className="text-xs text-gray-500">iOS 16+ · iPhone & iPad</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
            </a>

            {/* Google Play */}
            <a
              href="https://play.google.com/store/apps/details?id=io.viralbeat"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-white/8 rounded-2xl px-6 py-5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                  <path d="M3.18 23.76a2 2 0 0 1-1.18-1.8V2.04A2 2 0 0 1 3.18.28L14.1 12 3.18 23.72z" fill="#EA4335"/>
                  <path d="M17.84 15.66l-3.74-3.66 3.74-3.66 4.34 2.48a2 2 0 0 1 0 2.36l-4.34 2.48z" fill="#FBBC04"/>
                  <path d="M3.18 23.72L14.1 12l3.74 3.66-12.84 7.32a2 2 0 0 1-1.82-.26z" fill="#34A853"/>
                  <path d="M3.18.28a2 2 0 0 1 1.82-.26L17.84 7.34 14.1 11z" fill="#4285F4"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Get it on</p>
                <p className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Google Play</p>
                <p className="text-xs text-gray-500">Android 9+ · Phone & Tablet</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {["Push alerts for country watchlist", "Offline signal cache", "Biometric login", "Dark mode"].map(f => (
              <span key={f} className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-purple-600/20 border border-cyan-500/20 rounded-3xl p-14 overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 text-sm font-semibold text-cyan-400 mb-6">
                <Zap className="w-4 h-4" />
                Free to explore · API access available
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-5">Start with Your Country</h2>
              <p className="text-lg text-gray-300 mb-8 max-w-lg mx-auto">
                Sign up and the platform geo-detects your country. Your intelligence dashboard is ready in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="text-base px-8 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-2xl shadow-cyan-500/20" onClick={handleExplore}>
                  Explore the Intelligence <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 py-5 border-white/10 text-gray-300 hover:text-white" onClick={() => setLocation("/contributor")}>
                  Become a Contributor
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METHODOLOGY HUB (collapses explanatory detail) ──────────────────── */}
      <section id="how-it-works" className="py-20 px-4" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-white/5 text-gray-300 border-white/10">Under the hood</Badge>
              <span className="text-xs text-gray-500">The detail, without the clutter</span>
            </div>
            <h2 className="text-2xl font-black mb-2">How it works &amp; how we verify</h2>
            <p className="text-gray-400 text-sm max-w-2xl mb-5">
              The top of this page is about the market, the value, and what's on offer. The methodology, scale and verification detail lives here — jump straight to what you need.
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                ["Methodology & scoring", "How PESTEL+IR composites are built", "/about#methodology"],
                ["How data is validated", "Four-stage ground-truth verification", "/about#methodology"],
                ["Intelligence at scale", "Coverage, feeds and the workspace", "#technicals"],
                ["API & embedding", "Build on the intelligence layer", "#api"],
                ["Why ViralBeat exists", "The mission behind the platform", "/about"],
                ["Field contributors", "Who files the signals, and how they're tiered", "#creator-network"],
              ].map(([t, d, href]) => (
                <button key={t as string}
                  onClick={() => (href as string).startsWith("#") ? scrollTo((href as string).slice(1)) : setLocation(href as string)}
                  className="text-left flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-cyan-500/30 hover:bg-white/[0.04] transition-colors p-3.5">
                  <div>
                    <div className="text-sm font-semibold text-white">{t}</div>
                    <div className="text-[11px] text-gray-500 leading-snug">{d}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION ─────────────────────────────────────────────────────────── */}

      {/* ── METHODOLOGY SUMMARY ──────────────────────────────────────────────── */}

      {/* ── TEAM ─────────────────────────────────────────────────────────────── */}
      <section id="team" className="py-32 px-4 bg-white/[0.015] border-t border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">The Team</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">The People Behind the Platform</h2>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              A cross-disciplinary team of journalists, engineers, and policy researchers — all embedded in Africa's political landscape.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { role: "Founder & CEO",               focus: "Political intelligence strategy and Africa policy research",       initials: "F" },
              { role: "Head of Intelligence",         focus: "Editorial oversight, source verification, 55-nation coverage",    initials: "E" },
              { role: "Lead Engineer",                focus: "Platform architecture, data pipelines, and developer API",        initials: "T" },
              { role: "Director of Contributor Network", focus: "On-the-ground contributor network and signal verification",   initials: "S" },
              { role: "Partnerships & Growth",        focus: "NGO, media, and institutional relationships across Africa",       initials: "G" },
            ].map(m => (
              <motion.div key={m.role} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="bg-[#0d1e36] border border-[#1e3a5f] rounded-xl p-6 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {m.initials}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm mb-1">{m.role}</div>
                  <div className="text-gray-400 text-xs leading-relaxed">{m.focus}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm mb-4">Want to contribute intelligence from the ground?</p>
            <Button onClick={() => setLocation("/contributor")} variant="outline" className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10">
              Become a Contributor <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="py-14 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-black" />
                </div>
                <span className="font-bold text-lg text-white">Viral Beat</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">The intelligence layer for Africa — political briefings, civic movements, and trend signals for all 55 nations.</p>
            </div>
            {[
              { title: "Scan & Monitor", links: [
                { label: "Africa Scanner",            href: "/scanner" },
                { label: "Green Intelligence",        href: "/green" },
                { label: "Signal Aggregator",         href: "/aggregator" },
                { label: "PESTEL Trending",           href: "/trending" },
                { label: "Field Signals",             href: "/haa" },
                { label: "Electoral Calendar",        href: "/africa" },
              ]},
              { title: "Analyse & Decide", links: [
                { label: "Country Deep Dive",         href: "/scanner/ken" },
                { label: "Go/No-Go Brief Generator",  href: "/scanner/ken/brief" },
                { label: "Intelligence Workspace",    href: "/intelligence" },
                { label: "Intelligence Archive",      href: "/archive" },
                { label: "Newsletter Archive",        href: "/bulletins" },
                { label: "Investment Readiness",      href: "/doing-business" },
                { label: "Developer API",             href: "#api" },
              ]},
              { title: "Contribute & Cite", links: [
                { label: "Contributor Profile",   href: "/contributor" },
                { label: "VBT Token Rewards",     href: "/contributor" },
                { label: "Our Methodology",       href: "/about#methodology" },
                { label: "Who We Are",            href: "/about" },
                { label: "Access",               href: "/pricing" },
              ]},
              { title: "Legal", links: [
                { label: "Privacy",     href: "#" },
                { label: "Terms",       href: "#" },
                { label: "Security",    href: "#" },
                { label: "Data Policy", href: "#" },
              ]},
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold mb-4 text-sm text-white">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <button
                        onClick={() => {
                          if (link.href === "#") return;
                          if (link.href.startsWith("#")) { scrollTo(link.href.slice(1)); return; }
                          const [path, hash] = link.href.split("#");
                          setLocation(path);
                          if (hash) setTimeout(() => { window.location.hash = hash; }, 200);
                        }}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors text-left"
                      >{link.label}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <p>© 2026 Viral Beat. All rights reserved.</p>
            <div className="flex items-center gap-2 text-gray-500">
              <Globe className="w-3.5 h-3.5" />
              <span>55 African Nations</span>
            </div>
          </div>
        </div>
      </footer>
      </>}
    </div>
  );
}
