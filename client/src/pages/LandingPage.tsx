import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Globe, Shield, TrendingUp, ArrowRight, ChevronRight, X, Menu,
  Zap, Users, Newspaper, AlertTriangle, BarChart3, Coins,
  CheckCircle2, Star, Activity, MapPin, Code2, Calendar,
  Rss, Brain, Database, Clock, FileText, LayoutGrid, Rows, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ThemeSelector } from "@/components/ThemeSelector";
import IntelligenceTicker from "@/components/IntelligenceTicker";

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
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | null>(null);

  // ── view mode (icon / classic) ──
  const [viewMode, setViewMode] = useState<"icon" | "classic">(() => {
    try { return (localStorage.getItem("vb_landing_view") as "icon" | "classic") || "classic"; } catch { return "classic"; }
  });
  const setView = (v: "icon" | "classic") => {
    setViewMode(v);
    try { localStorage.setItem("vb_landing_view", v); } catch {}
  };

  const handleExplore = () => {
    if (user) setLocation("/africa");
    else window.location.href = getLoginUrl();
  };

  const handleCreator = () => {
    if (user) setLocation("/dashboard");
    else window.location.href = getLoginUrl();
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

  const testimonials = [
    { avatar: "AM", name: "Amara Mensah",    role: "Political Risk Analyst, Accra",        quote: "First platform I've found that produces a composite PESTEL+IR score I can actually defend in a board briefing. We've replaced two expensive subscription services.", color: "from-cyan-500 to-blue-500" },
    { avatar: "DO", name: "David Okonkwo",   role: "Market Entry Director, Lagos",          quote: "The Go/No-Go Brief saved us three weeks of desk research on our West Africa expansion. The risk matrix alone was worth the subscription — structured, cited, exportable.", color: "from-emerald-500 to-teal-500" },
    { avatar: "FK", name: "Fatou Kouyaté",   role: "DFI Programme Analyst, Dakar",          quote: "The Investment Readiness Scores alongside PESTEL data give us a single view that used to require four different tools. The scanner is now our first stop for any new market.", color: "from-purple-500 to-pink-500" },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

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
          <button className="flex items-center gap-2.5 focus:outline-none" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Globe className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Viral Beat</span>
            <Badge className="hidden sm:inline-flex bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">Africa Intelligence</Badge>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {[["scanner-section", "Scanner"], ["intelligence", "Intelligence"], ["elections", "Elections"], ["people-signal", "Field Signals"], ["api", "API"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                {label}
              </button>
            ))}
            <button onClick={() => setLocation("/about#methodology")} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
              Methodology
            </button>
            <button onClick={() => setLocation("/pricing")} className="px-4 py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition-all">
              Pricing
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setView("icon")}
                title="Icon view"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${viewMode === "icon" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:text-white"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Icon
              </button>
              <button
                onClick={() => setView("classic")}
                title="Classic view"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${viewMode === "classic" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:text-white"}`}
              >
                <Rows className="w-3.5 h-3.5" /> Classic
              </button>
            </div>
            <ThemeSelector />
            {user ? (
              <Button onClick={() => setLocation("/africa")} size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20">
                Open Dashboard <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-gray-400 hover:text-white" onClick={() => window.location.href = getLoginUrl()}>Sign In / Register</Button>
                <Button size="sm" onClick={handleExplore} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20">Get Access</Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-gray-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-white/5 bg-[#050b1a] px-4 py-4 flex flex-col gap-1">
            {[["scanner-section", "Scanner"], ["intelligence", "Intelligence"], ["elections", "Elections"], ["people-signal", "Field Signals"], ["api", "API"]].map(([id, label]) => (
              <button key={id} onClick={() => { setMobileMenuOpen(false); scrollTo(id); }} className="text-left px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5">{label}</button>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); setLocation("/about#methodology"); }} className="text-left px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5">Methodology</button>
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
                  { emoji: "💎", label: "Pricing",          path: "/pricing",             badge: 0, bg: "from-[#0a200a] to-[#1a3a1a]" },
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
        <div className="relative max-w-5xl mx-auto">

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 text-sm font-medium text-cyan-400 mb-6">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              The Africa Intelligence Beat for Decision Makers · 55 Nations Live
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-5" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              The Africa<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400">
                Intelligence Beat
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Political briefings, sovereign risk scores, crisis alerts, and investor-grade intelligence for every African nation —{" "}
              <span className="text-white">powered by people on the ground.</span>
            </p>
          </motion.div>

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

          {/* Default CTAs when no persona selected */}
          {!selectedPersona && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button size="lg" className="text-base px-7 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-xl shadow-cyan-500/20" onClick={handleExplore}>
                Explore Intelligence <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-7 py-5 border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/40" onClick={() => scrollTo("api")}>
                <Code2 className="mr-2 w-4 h-4" /> View API Docs
              </Button>
            </motion.div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 pt-2">
            {[["55", "Nations monitored"], ["312+", "Signals this week"], ["PESTEL+IR", "7-dimension framework"], ["Citable", "VB citation keys"]].map(([val, label]) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-2xl font-black text-cyan-400">{val}</span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE SCANNER PREVIEW ─────────────────────────────────────────────── */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Africa Intelligence Scanner — live</span>
          </div>
          <div className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-[#1e3a5f]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  Composite Score · PESTEL×0.6 + IRS×0.4
                </div>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Live</Badge>
              </div>
              <div className="grid grid-cols-12 gap-1 text-[9px] text-gray-600 uppercase tracking-wider font-medium pt-1">
                <span className="col-span-4">Country</span>
                <span className="col-span-2 text-center">PESTEL</span>
                <span className="col-span-2 text-center">IRS</span>
                <span className="col-span-2 text-center">Score</span>
                <span className="col-span-2 text-center">Verdict</span>
              </div>
            </div>
            <div className="divide-y divide-[#1e3a5f]">
              {[
                { flag: "🇷🇼", name: "Rwanda",   pestel: 82, irs: 79, score: 81, verdict: "Go-Market", vc: "#22c55e", trend: [55,60,68,75,80,81] },
                { flag: "🇰🇪", name: "Kenya",    pestel: 79, irs: 74, score: 77, verdict: "Go-Market", vc: "#22c55e", trend: [60,63,70,74,76,77] },
                { flag: "🇬🇭", name: "Ghana",    pestel: 74, irs: 68, score: 72, verdict: "Monitor",   vc: "#84cc16", trend: [68,70,71,72,71,72] },
                { flag: "🇸🇳", name: "Senegal",  pestel: 71, irs: 65, score: 69, verdict: "Monitor",   vc: "#84cc16", trend: [60,63,65,67,68,69] },
                { flag: "🇳🇬", name: "Nigeria",  pestel: 58, irs: 51, score: 55, verdict: "Caution",   vc: "#f59e0b", trend: [58,56,55,57,54,55] },
                { flag: "🇪🇹", name: "Ethiopia", pestel: 44, irs: 38, score: 42, verdict: "No-Go",     vc: "#ef4444", trend: [50,47,44,43,41,42] },
              ].map((c, i) => {
                const mini = c.trend;
                const minV = Math.min(...mini), maxV = Math.max(...mini);
                const pts = mini.map((v, j) => `${(j / (mini.length - 1)) * 44},${12 - ((v - minV) / (maxV - minV + 1)) * 11}`).join(" ");
                return (
                  <motion.div key={c.name} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                    className="px-4 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer grid grid-cols-12 gap-1 items-center"
                    onClick={() => user ? setLocation(`/scanner/${c.name.slice(0,3).toUpperCase()}`) : (window.location.href = getLoginUrl())}>
                    <div className="col-span-4 flex items-center gap-2">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="text-xs font-semibold text-white truncate">{c.name}</span>
                    </div>
                    <span className="col-span-2 text-center text-xs font-mono text-gray-300">{c.pestel}</span>
                    <span className="col-span-2 text-center text-xs font-mono text-gray-300">{c.irs}</span>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <span className="text-xs font-black" style={{ color: c.vc }}>{c.score}</span>
                      <svg width="44" height="14" viewBox="0 0 44 14" className="opacity-70">
                        <polyline points={pts} fill="none" stroke={c.vc} strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border truncate" style={{ color: c.vc, borderColor: `${c.vc}40`, background: `${c.vc}12` }}>{c.verdict}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <button onClick={() => user ? setLocation("/scanner") : (window.location.href = getLoginUrl())} className="w-full py-3 text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-center gap-1 border-t border-[#1e3a5f] hover:bg-cyan-500/5 transition-all">
              Open Africa Scanner — all 55 nations <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
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

      {/* ── PEOPLE SIGNAL — new first section ───────────────────────────────── */}
      <section id="people-signal" className="py-32 px-4" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">Field Contributors</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Ground Truth, Not Just Headlines</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Journalists, activists, NGO officers, and researchers submit verified field signals — protests, policy shifts, voting discrepancies, county-level events. Signals are weighted by contributor tier, structured into PESTEL+IR categories, and surfaced as credible intelligence you can cite. Contributors earn VBT tokens for every verified submission.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Users,
                color: "#a78bfa",
                title: "On-the-Ground Contributors",
                desc: "A verified network of local journalists, NGO workers, and civic leaders across 55 countries submit real-time observations — protests, policy shifts, civic movements, and breaking events.",
                bullets: ["Verified contributor network", "Local-language signal capture", "First-mover early alerts", "Cross-border linkages"],
              },
              {
                icon: TrendingUp,
                color: "#22d3ee",
                title: "PESTEL+IR Signal Pipeline",
                desc: "RSS feeds, social sources, chamber bulletins, APEX body statements, and parliamentary records are ingested and classified across all 7 PESTEL+IR dimensions — 24h rolling signal intelligence.",
                bullets: ["RSS + social + parliament sources", "7-dimension PESTEL+IR tagging", "Signal intensity scoring", "24h rolling update window"],
              },
              {
                icon: Shield,
                color: "#34d399",
                title: "Structured & Verified",
                desc: "Raw signals pass a 4-stage validation gate before entering the intelligence layer — corroboration, tier weighting, AI classification, and editorial review. Only verified signals move the composite score.",
                bullets: ["4-stage validation gate", "Tier-weighted credibility scoring", "AI + editorial cross-check", "Composite score updated on pass"],
              },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
                className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-7 hover:border-purple-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <h3 className="font-bold text-lg text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: item.color }} />{b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* ── Validation methodology strip ────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }}
            className="bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs font-bold tracking-[2px] text-green-400 uppercase">How Intelligence Gets Validated</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-start">
              {[
                { step: "01", color: "#a78bfa", title: "Field Submission", desc: "Contributor files signal with location, category, and evidence — photo, document, or URL." },
                { step: "02", color: "#22d3ee", title: "Corroboration", desc: "3+ independent contributors or a senior analyst must independently confirm the event before it is accepted." },
                { step: "03", color: "#fb923c", title: "Tier Weighting", desc: "Signals are weighted by contributor tier — Observer, Analyst, Correspondent — and institutional affiliation." },
                { step: "04", color: "#f472b6", title: "AI Classification", desc: "VB engine auto-tags dimension (P/E/S/T/En/L/IR), severity, and estimated composite score impact (−20 to +20)." },
                { step: "05", color: "#34d399", title: "Score Update", desc: "Validated signals move the country's PESTEL+IR composite score and surface in the Intelligence Workspace as citable intelligence." },
              ].map((s, i) => (
                <div key={i} className="relative">
                  {i < 4 && (
                    <div className="hidden md:block absolute top-4 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent z-0" style={{ width: "calc(100% - 2rem)", left: "calc(100% - 1rem)" }} />
                  )}
                  <div className="relative z-10">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black mb-3" style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>{s.step}</div>
                    <div className="font-bold text-sm text-white mb-1">{s.title}</div>
                    <div className="text-xs text-gray-400 leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-400" />Signals that fail corroboration are flagged, not published</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-400" />Every validated signal carries a source chain you can audit</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-400" />Composite scores update within 24h of signal validation</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── AFRICA SCANNER SECTION ─────────────────────────────────────────── */}
      <section id="scanner-section" className="py-32 px-4" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Africa Scanner</Badge>
              <span className="text-xs text-green-400/80 border border-green-500/20 bg-green-500/5 rounded-full px-3 py-1">● Updated daily · 312 signals this week</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              From Signal to Decision<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">in One Flow</span>
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Every African market scored on a Composite Index (PESTEL × 0.6 + IRS × 0.4). Scan 55 nations, deep-dive into any country, and generate a structured Go/No-Go entry brief — all without leaving the platform.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { emoji: "📡", color: "#00d4ff", title: "Africa Scanner", desc: "55 AU markets ranked by composite PESTEL+IR score. Filter by region, sort by score, drill into any country.", badge: "Scan", href: "/scanner" },
              { emoji: "📊", color: "#a78bfa", title: "Country Deep Dive", desc: "Full PESTEL+IR breakdown, signals, sector readiness scores, risk matrix, and 9-month trend for any AU nation.", badge: "Analyse", href: "/scanner/ken" },
              { emoji: "📋", color: "#22c55e", title: "Go/No-Go Brief", desc: "Select country, sector, and horizon. Generate a structured entry verdict with risk matrix and PDF export.", badge: "Decide", href: "/scanner/ken/brief" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
                onClick={() => user ? setLocation(item.href) : (window.location.href = getLoginUrl())}
                className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-7 hover:border-cyan-500/40 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${item.color}15` }}>{item.emoji}</div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border" style={{ color: item.color, borderColor: `${item.color}40`, background: `${item.color}10` }}>{item.badge}</span>
                </div>
                <h3 className="font-bold text-lg text-white mb-2 group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.desc}</p>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: item.color }}>
                  Open {item.title} <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" onClick={() => user ? setLocation("/scanner") : (window.location.href = getLoginUrl())} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-xl shadow-cyan-500/20">
              Open Africa Scanner <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── INTELLIGENCE SECTION ────────────────────────────────────────────── */}
      <section id="intelligence" className="py-32 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">PESTEL+IR Intelligence</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Africa Intelligence at Scale</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              What used to require expensive consultancies and months of research is now available on demand — for every African country, every day, across political, economic, civic, and investor dimensions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: MapPin,
                color: "#22d3ee",
                title: "Country Briefings",
                desc: "On-demand PESTEL intelligence briefs for all 55 nations — government structure, stability scores, key political figures, and economic outlook. Updated as news breaks.",
                bullets: ["Stability score 0–100", "Head of State + key figures", "Risk classification", "PESTEL+IR overlay"],
              },
              {
                icon: Activity,
                color: "#a78bfa",
                title: "Civic Movement Tracker",
                desc: "Live tracking of active and emerging civic movements across Africa — from protest networks to diaspora coalitions — with RSS-backed news and sentiment signals.",
                bullets: ["Active / emerging / dormant", "Movement leadership & demands", "RSS news integration", "Cross-border linkages"],
              },
              {
                icon: Globe,
                color: "#34d399",
                title: "Geo-Personalised Default",
                desc: "The platform detects your country on signup and makes it your default intelligence profile. An analyst in Lagos opens to Nigeria. A researcher in Nairobi opens to Kenya.",
                bullets: ["IP & language detection", "Per-user country profile", "55 country coverage", "Instant onboarding"],
              },
              {
                icon: BarChart3,
                color: "#22c55e",
                title: "Go/No-Go Briefs",
                desc: "Composite entry verdict (PESTEL × 0.6 + IRS × 0.4) with sector readiness, risk matrix, and structured PDF export — built for the business prospector in a hurry.",
                bullets: ["Go-Market / Monitor / Caution / No-Go", "Sector entry recommendation", "Risk matrix + mitigations", "PDF export with branded header"],
                href: "/scanner/ken/brief",
                badge: "Decide",
              },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
                className={`bg-[#0f2240] border rounded-2xl p-7 hover:border-opacity-60 transition-all relative overflow-hidden ${i === 3 ? "border-orange-500/30 hover:border-orange-400/50" : "border-[#1e3a5f] hover:border-cyan-500/30"}`}
                onClick={i === 3 ? () => user ? setLocation("/scanner/ken/brief") : (window.location.href = getLoginUrl()) : undefined}
                style={i === 3 ? { cursor: "pointer" } : {}}
              >
                {"badge" in item && item.badge && (
                  <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400">{item.badge}</span>
                )}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <h3 className="font-bold text-lg text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: item.color }} />{b}
                    </li>
                  ))}
                </ul>
                {i === 3 && (
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-orange-400">
                    Generate a Go/No-Go Brief <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Kenya deep-dive callout */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-lg font-bold text-white mb-1">🇰🇪 Kenya — Deep Intelligence Module</div>
              <p className="text-gray-300 text-sm max-w-xl">
                Kenya has our most comprehensive coverage: live parliament tracker, all 47 county sentiment scores, ICC monitoring, governors & senators, civic movements, regional risk, and breaking-news alerts.
              </p>
            </div>
            <Button onClick={() => user ? setLocation("/country/ke") : (window.location.href = getLoginUrl())} className="shrink-0 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
              Open Kenya Intelligence <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── ELECTORAL CALENDAR ──────────────────────────────────────────────── */}
      <section id="elections" className="py-32 px-4" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-orange-500/10 text-orange-400 border-orange-500/20">Electoral Calendar</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Upcoming African Elections</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Track elections across all 55 nations. Click any country for the full intelligence brief.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {ELECTIONS.map((e, i) => (
              <motion.div key={e.code} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                onClick={() => handleCountry(e.code)}
                className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-5 hover:border-orange-500/40 hover:bg-[#111e38] transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{e.flag}</span>
                    <div>
                      <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">{e.country}</div>
                      <div className="text-xs text-gray-500">{e.type}</div>
                    </div>
                  </div>
                  {e.urgent && <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px]">Imminent</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3 h-3 text-orange-400" />
                    {e.date}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white" onClick={handleExplore}>
              View Full Electoral Calendar for All 55 Nations <ArrowRight className="ml-2 w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── CREATOR NETWORK ─────────────────────────────────────────────────── */}
      <section id="creator-network" className="py-32 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">Field Contributors</Badge>
              <h2 className="text-4xl sm:text-5xl font-black mb-5">
                Ground Truth<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Earns Its Own Weight</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Observers, Analysts, and Correspondents submit verified field signals that feed the PESTEL+IR intelligence pipeline. Every submission is cross-referenced, tiered by contributor credibility, and surfaced in the Intelligence Workspace. The value chain runs through verification — not volume. Contributors cite the methodology publicly, giving institutional users data they can defend.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  ["Verified Contributor Tiers", "Observer → Analyst → Correspondent → Partner. Each tier reflects the depth and credibility of your intelligence contributions, not just your subscription level."],
                  ["PESTEL+IR Signal Pipeline", "Every field signal is auto-classified across Political, Economic, Social, Tech, Environmental, Legal, and Investor Readiness dimensions — then surfaced in the Intelligence Workspace."],
                  ["VBT Token Rewards", "Earn VBT tokens by submitting and validating signals. Tokens reflect your contribution standing in the network — separate from paid subscription tiers that unlock premium features."],
                  ["Contributor Verification", "Verified contributors receive credibility badges, elevated signal weighting, and priority placement in the intelligence feed."],
                ].map(([title, desc]) => (
                  <li key={title} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white text-sm">{title}</div>
                      <div className="text-gray-300 text-sm">{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <Button onClick={() => user ? setLocation("/haa") : (window.location.href = getLoginUrl())} variant="outline" className="border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400/50">
                Join as a Contributor <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-2 gap-4">
              {[
                { icon: Users,     title: "File a Field Signal", reward: "+500 VBT", color: "#a78bfa", desc: "Per verified ground-truth submission" },
                { icon: TrendingUp,title: "Validate a Signal",  reward: "+50 VBT",  color: "#22d3ee", desc: "Per corroboration confirmed by 3+ analysts" },
                { icon: BarChart3, title: "Analyst Tier Bonus",  reward: "+200 VBT", color: "#34d399", desc: "Monthly reward for sustained accuracy" },
                { icon: Coins,     title: "VBT Tokens",          reward: "Earned",   color: "#fb923c", desc: "Contribution rewards — not payment tokens" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                  className="bg-[#0f2240] border border-[#1e3a5f] rounded-xl p-5 hover:border-purple-500/30 transition-all">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${item.color}15` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div className="text-xs text-gray-500 mb-0.5">{item.title}</div>
                  <div className="text-xl font-black mb-1" style={{ color: item.color }}>{item.reward}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Who Uses Viral Beat</h2>
            <p className="text-gray-400">Business prospectors, political risk analysts, DFIs, and NGO teams across Africa</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className={`bg-[#0f2240] border rounded-2xl p-7 transition-all cursor-pointer ${i === activeTestimonial ? "border-cyan-500/60 shadow-xl shadow-cyan-500/5" : "border-[#1e3a5f]"}`}
                onClick={() => setActiveTestimonial(i)}>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black`}>{t.avatar}</div>
                  <div>
                    <div className="font-bold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}</div>
                <p className="text-sm leading-relaxed text-gray-300">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── API / DEVELOPER ──────────────────────────────────────────────────── */}
      <section id="api" className="py-32 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
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

      {/* ── MISSION ─────────────────────────────────────────────────────────── */}
      <section id="mission" className="py-32 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Built for Africa. By Africans.</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Why ViralBeat Exists</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Africa's political and market intelligence should be produced, verified, and structured by the people who live it — and delivered as a decision tool, not a news feed.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Globe,   color: "#22d3ee", title: "Africa First",           desc: "Every product decision is made through the lens of what best serves African communities, businesses, and institutions entering the continent." },
              { icon: Users,   color: "#a78bfa", title: "People-Powered",         desc: "Ground truth comes from verified contributors on the ground — not scraped headlines. Local knowledge, structured into intelligence you can cite." },
              { icon: Shield,  color: "#34d399", title: "Verified Intelligence",  desc: "Every signal is cross-referenced before it reaches your dashboard. Confidence thresholds are published. We never fabricate a score." },
              { icon: Zap,     color: "#fb923c", title: "Decision-Ready",         desc: "Raw intelligence is only useful when it drives a decision. Every score on VB maps directly to a Go-Market, Monitor, Caution, or No-Go verdict." },
            ].map(v => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="bg-[#0d1e36] border border-[#1e3a5f] rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: v.color + "22" }}>
                  <v.icon className="w-5 h-5" style={{ color: v.color }} />
                </div>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METHODOLOGY SUMMARY ──────────────────────────────────────────────── */}
      <section id="methodology" className="py-32 px-4" style={{ scrollMarginTop: "5rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Published Methodology</Badge>
              <h2 className="text-4xl sm:text-5xl font-black mb-5">
                Scores You Can<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Cite in Public</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Every sentiment score, risk level, and stability index on ViralBeat is derived from a documented, auditable pipeline — not a black box. RSS ingestion, keyword analysis, LLM blending, and confidence thresholds are all published.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Rss,      color: "#22d3ee", label: "Country-Specific RSS Feeds", detail: "Each nation has its own geo-curated sources — GhanaWeb for Ghana, Punch for Nigeria, AllAfrica for regional signals — updated every 4 hours" },
                  { icon: Brain,    color: "#a78bfa", label: "LLM Sentiment Blend",   detail: "Rule-based scoring + Claude AI for Tier-1 figures, averaged for accuracy" },
                  { icon: Shield,   color: "#34d399", label: "Confidence Badges",      detail: "High (10+ articles), Medium (4–9), Low (1–3) — never fabricates data" },
                  { icon: Database, color: "#fb923c", label: "Field Signal Layer",     detail: "Verified contributor submissions weighted by tier and institutional affiliation" },
                ].map(s => (
                  <div key={s.label} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: s.color + "22" }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{s.label}</div>
                      <div className="text-gray-400 text-sm">{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setLocation("/about#methodology")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Read the full methodology <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="bg-[#0d1e36] border border-[#1e3a5f] rounded-2xl p-6 space-y-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Confidence Thresholds</div>
              {[
                { level: "High",   range: "10+ articles", color: "#22d3ee", badge: "bg-cyan-500/20 text-cyan-300",   desc: "Score published with full confidence" },
                { level: "Medium", range: "4–9 articles", color: "#a78bfa", badge: "bg-purple-500/20 text-purple-300", desc: "Score published with advisory note" },
                { level: "Low",    range: "1–3 articles", color: "#fb923c", badge: "bg-orange-500/20 text-orange-300", desc: "Score flagged — treat as indicative" },
                { level: "None",   range: "0 articles",   color: "#64748b", badge: "bg-slate-500/20 text-slate-400",  desc: "No score shown — never fabricated" },
              ].map(c => (
                <div key={c.level} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${c.badge}`}>{c.level}</span>
                  <span className="text-sm text-gray-400 flex-1">{c.range}</span>
                  <span className="text-xs text-gray-500">{c.desc}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-white/5 text-xs text-gray-600">
                All scores update every 4 hours from live RSS feeds. <br />
                Methodology audited quarterly. Last review: Q2 2026.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
                { label: "Investment Readiness",      href: "/doing-business" },
                { label: "Developer API",             href: "#api" },
              ]},
              { title: "Contribute & Cite", links: [
                { label: "Contributor Profile",   href: "/contributor" },
                { label: "VBT Token Rewards",     href: "/contributor" },
                { label: "Our Methodology",       href: "/about#methodology" },
                { label: "Who We Are",            href: "/about" },
                { label: "Pricing & Tiers",       href: "/pricing" },
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
