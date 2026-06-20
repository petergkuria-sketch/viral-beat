import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Globe, Shield, TrendingUp, ArrowRight, ChevronRight, X, Menu,
  Zap, Users, Newspaper, AlertTriangle, BarChart3, Coins,
  CheckCircle2, Star, Activity, MapPin, Code2, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ThemeSelector } from "@/components/ThemeSelector";

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
  { flag: "🇹🇿", country: "Tanzania",      date: "Oct 2025", type: "General Election",     code: "TZ", urgent: true  },
  { flag: "🇨🇮", country: "Côte d'Ivoire", date: "Oct 2025", type: "Presidential",         code: "CI", urgent: true  },
];

function StabilityBar({ score }: { score: number }) {
  const color = score >= 70 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const testimonials = [
    { avatar: "AM", name: "Amara Mensah",    role: "Political Risk Analyst, Accra",  quote: "First platform I've found that gives me live stability scores and civic movement tracking across all 55 nations. We've replaced two expensive subscription services.", color: "from-cyan-500 to-blue-500" },
    { avatar: "OJ", name: "Obiageli Johnson", role: "Newsroom Editor, Lagos",          quote: "The breaking-news alerts from Viral Beat flagged the Kano protests 48 hours before the wire services. That's competitive advantage.", color: "from-emerald-500 to-teal-500" },
    { avatar: "FK", name: "Fatou Kouyaté",   role: "NGO Programme Lead, Dakar",       quote: "The geo-defaulting to your country's intelligence is brilliant. My team opens the app and immediately sees what's relevant to their work.", color: "from-purple-500 to-pink-500" },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#050b1a] text-white overflow-x-hidden">

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
            {[["people-signal", "People Signal"], ["intelligence", "Intelligence"], ["elections", "Elections"], ["creator-network", "Creators"], ["api", "API"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                {label}
              </button>
            ))}
            <button onClick={() => setLocation("/pricing")} className="px-4 py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition-all">
              Pricing
            </button>
          </div>

          <div className="flex items-center gap-2">
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
            {[["people-signal", "People Signal"], ["intelligence", "Intelligence"], ["elections", "Elections"], ["creator-network", "Creators"], ["api", "API"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-left px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5">{label}</button>
            ))}
            <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
              {!user && <Button variant="outline" className="w-full border-white/10 text-white" onClick={() => { setMobileMenuOpen(false); window.location.href = getLoginUrl(); }}>Sign In / Register</Button>}
              <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold" onClick={() => { setMobileMenuOpen(false); handleExplore(); }}>Get Access</Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 text-sm font-medium text-cyan-400">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                Real-Time African Political Intelligence
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                The Intelligence<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400">
                  Layer for Africa
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-lg">
                Political briefings, live civic movement tracking, and stability scores for all <strong className="text-white">55 African nations</strong> — powered by people on the ground, delivered in real time.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="text-base px-7 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-xl shadow-cyan-500/25" onClick={handleExplore}>
                  Explore Intelligence <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-7 py-5 border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/40" onClick={() => scrollTo("api")}>
                  <Code2 className="mr-2 w-4 h-4" /> View API Docs
                </Button>
              </div>

              <div className="flex flex-wrap gap-8 pt-2">
                {[["55", "Nations Covered"], ["6", "African Regions"], ["Live", "News Feeds"], ["People", "Verified Signal"]].map(([val, label]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-2xl font-black text-cyan-400">{val}</span>
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Live Intelligence Feed</span>
              </div>
              <div className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a5f]">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Africa Political Monitor
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Live</Badge>
                </div>
                <div className="divide-y divide-[#1e3a5f]">
                  {DEMO_INTEL.map((c, i) => (
                    <motion.div key={c.code} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                      className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => handleCountry(c.code)}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl leading-none">{c.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-white">{c.name}</span>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${RISK[c.risk]?.cls}`}>{RISK[c.risk]?.label}</Badge>
                          </div>
                          <StabilityBar score={c.stability} />
                          <div className="mt-1 text-[10px] text-gray-500 flex items-center gap-1">
                            <Activity className="w-2.5 h-2.5" />{c.movement}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button onClick={handleExplore} className="w-full py-3 text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-center gap-1 border-t border-[#1e3a5f] hover:bg-cyan-500/5 transition-all">
                  View all 55 nations <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ────────────────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-white/[0.02] py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-8 text-xs text-gray-500 font-medium uppercase tracking-wider">
          {[["55", "Nations"], ["6", "Regions"], ["Real-Time", "News Feeds"], ["People", "Verified Signal"], ["Open", "Developer API"]].map(([val, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-cyan-400 font-black">{val}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PEOPLE SIGNAL — new first section ───────────────────────────────── */}
      <section id="people-signal" className="py-24 px-4" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">People-Powered Signal</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Intelligence Starts with People</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Journalists, activists, researchers, and community voices on the ground submit civic signals. That raw human intelligence is then structured and verified — giving you ground truth, not just headlines.
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
                title: "Trend Engine",
                desc: "Cross-platform tracking across YouTube, TikTok, and X surfaces emerging narratives before they reach mainstream media — with virality scores and sentiment classification.",
                bullets: ["Multi-platform monitoring", "Virality scoring 0–100", "Sentiment classification", "48–72h early signal window"],
              },
              {
                icon: Shield,
                color: "#34d399",
                title: "Structured & Verified",
                desc: "Raw signals are structured into stability scores, risk classifications, and country briefings — combining the depth of local knowledge with the clarity of organised intelligence.",
                bullets: ["Stability score 0–100", "Risk classification", "Country briefings", "Civic movement tracker"],
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
        </div>
      </section>

      {/* ── INTELLIGENCE SECTION ────────────────────────────────────────────── */}
      <section id="intelligence" className="py-24 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Country Intelligence</Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Political Intelligence at Scale</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              What used to require expensive consultancies is now available on demand, for every African country, every day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: MapPin,
                color: "#22d3ee",
                title: "Country Briefings",
                desc: "On-demand intelligence briefs for all 55 nations covering government structure, stability scores, key political figures, recent events, and economic outlook. Updated as news breaks.",
                bullets: ["Stability score 0–100", "Head of State + key figures", "Risk classification", "Economic outlook"],
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
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
                className="bg-[#0f2240] border border-[#1e3a5f] rounded-2xl p-7 hover:border-cyan-500/30 transition-all">
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
      <section id="elections" className="py-24 px-4" style={{ scrollMarginTop: "4rem" }}>
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
      <section id="creator-network" className="py-24 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">Creator Signal Network</Badge>
              <h2 className="text-4xl sm:text-5xl font-black mb-5">
                Creators Validate<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">the Intelligence</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                African creators and journalists on the ground submit viral content, civic signals, and local observations. This crowd-sourced layer validates and enriches the intelligence — and rewards contributors with VBT tokens.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  ["Humans As Agents", "Submit viral local content with analysis. First-movers earn the highest rewards."],
                  ["Trend Engine", "Cross-platform trend tracking (YouTube, TikTok, X) surfaces emerging narratives before they go mainstream."],
                  ["VBT Token Rewards", "Contributors earn VBT tokens redeemable in the marketplace — turning local knowledge into real value."],
                  ["Creator Verification", "Verified creators get credibility badges and premium placement in the intelligence feed."],
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
              <Button onClick={handleCreator} variant="outline" className="border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400/50">
                Join as a Creator <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-2 gap-4">
              {[
                { icon: Users,     title: "Humans As Agents", reward: "500–2000", color: "#a78bfa", desc: "Verified local submissions" },
                { icon: TrendingUp,title: "Submit Trends",    reward: "50–200",   color: "#22d3ee", desc: "Early first-mover rewards" },
                { icon: BarChart3, title: "Rate Virality",    reward: "10–50",    color: "#34d399", desc: "Accurate prediction bonus" },
                { icon: Coins,     title: "VBT Tokens",      reward: "Tradeable",color: "#fb923c", desc: "Marketplace & crypto bridge" },
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
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Who Uses Viral Beat</h2>
            <p className="text-gray-400">Analysts, newsrooms, NGOs, and creators across Africa</p>
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
      <section id="api" className="py-24 px-4 bg-white/[0.015] border-y border-white/5" style={{ scrollMarginTop: "4rem" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">Developer API</Badge>
              <h2 className="text-4xl font-black mb-5 text-white">Embed Africa Intelligence in Your Product</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                A clean REST API gives your app real-time stability scores, country briefings, civic movement data, and trend forecasts — ready to integrate in minutes.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  ["GET /v1/africa/:code/brief",      "Full country intelligence brief"],
                  ["GET /v1/africa/:code/news",       "Live news articles by country"],
                  ["GET /v1/trends/virality?topic=",  "Virality score for any topic"],
                  ["POST /v1/africa/:code/sentiment", "Sentiment analysis on any text"],
                  ["GET /v1/elections/calendar",      "Upcoming elections for all 55 nations"],
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
  "stabilityScore": 54,
  "riskLevel": "high",
  "headOfState": "Bola Tinubu",
  "governmentType": "Federal Republic",
  "economicOutlook": "moderate",
  "keyFigures": [
    { "name": "Peter Obi",
      "title": "Opposition Leader",
      "sentiment": "positive" }
  ],
  "civicMovements": [
    { "name": "ENDSARS Revival",
      "status": "active",
      "summary": "Youth-led accountability..." }
  ],
  "nextElection": "Feb 2027"
}`}</pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
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
                  Open Intelligence Dashboard <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 py-5 border-white/10 text-gray-300 hover:text-white" onClick={handleCreator}>
                  Join as Creator
                </Button>
              </div>
            </div>
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
              { title: "Intelligence", links: ["Africa Hub", "Kenya Deep-Dive", "Country Briefings", "Civic Movements", "Electoral Calendar"] },
              { title: "Platform",     links: ["Trend Engine", "Creator Network", "Developer API", "Pricing", "Who We Are"] },
              { title: "Legal",        links: ["Privacy", "Terms", "Security", "Data Policy"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold mb-4 text-sm text-white">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link}</a></li>
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
    </div>
  );
}
