import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { 
  TrendingUp, 
  Zap, 
  Coins, 
  BarChart3, 
  Users, 
  ArrowRight,
  Sparkles,
  Brain,
  Trophy,
  Play,
  ChevronRight,
  X,
  ArrowUp,
  ArrowDown,
  Menu,
  Flame,
  Eye,
  Star,
  Target,
  DollarSign,
  Activity,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast, Toaster } from "sonner";
import { ThemeSelector } from "@/components/ThemeSelector";

// Sparkline mini-chart using SVG
function Sparkline({ values, color = "#22d3ee", height = 32 }: { values: number[]; color?: string; height?: number }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts.split(" ").pop()?.split(",")[0]} cy={pts.split(" ").pop()?.split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

// Animated virality bar
function ViralityBar({ score, color = "#22d3ee" }: { score: number; color?: string }) {
  return (
    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden w-full">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(score, 100)}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

// Platform badge
function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, { label: string; color: string }> = {
    youtube: { label: "YT", color: "bg-red-500" },
    tiktok: { label: "TK", color: "bg-pink-500" },
    twitter: { label: "X", color: "bg-sky-500" },
    instagram: { label: "IG", color: "bg-purple-500" },
  };
  const p = map[platform?.toLowerCase()] || { label: "?", color: "bg-gray-500" };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-white text-[9px] font-bold ${p.color}`}>
      {p.label}
    </span>
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [previousTopTrend, setPreviousTopTrend] = useState<string | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Fetch live trending topics
  const { data: trendingTopics } = trpc.trends.search.useQuery(
    { query: "" },
    { refetchInterval: 30000 }
  );

  // Detect new trending topics and show notifications
  useEffect(() => {
    if (!trendingTopics?.youtube || trendingTopics.youtube.length === 0) return;
    const topTrend = trendingTopics.youtube[0];
    const currentTime = Date.now();
    const oneMinute = 60000;
    if (currentTime - lastNotificationTime < oneMinute) return;
    if (previousTopTrend && topTrend.title !== previousTopTrend) {
      const viralityScore = topTrend.viralityScore || 0;
      if (viralityScore > 7.5) {
        toast(
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-1">🔥 New Hot Trend Detected!</p>
              <p className="text-xs text-gray-400 line-clamp-2 mb-2">{topTrend.title}</p>
              <Badge variant="outline" className="text-xs">{viralityScore.toFixed(1)}/10 Virality</Badge>
            </div>
          </div>,
          { duration: 8000, action: { label: "View Now", onClick: () => user ? setLocation("/x-trends") : (window.location.href = getLoginUrl()) } }
        );
        setLastNotificationTime(currentTime);
      }
    }
    if (topTrend) setPreviousTopTrend(topTrend.title);
  }, [trendingTopics, previousTopTrend, lastNotificationTime, user, setLocation]);

  const testimonials = [
    { name: "Sarah Chen", role: "YouTube Creator", followers: "2.3M", quote: "Viral Beat helped me predict the AI art trend 3 days before it exploded. My video got 5M views!", earnings: "12,500 VBT", avatar: "SC", platform: "youtube", color: "from-red-500 to-orange-500" },
    { name: "Marcus Johnson", role: "TikTok Influencer", followers: "1.8M", quote: "I earned 8,000 VBT just by sharing trending topics. The AI predictions are scary accurate.", earnings: "8,000 VBT", avatar: "MJ", platform: "tiktok", color: "from-pink-500 to-purple-500" },
    { name: "Elena Rodriguez", role: "Instagram Creator", followers: "950K", quote: "Finally, a platform that rewards creators for being early. I'm making passive income from my trend insights!", earnings: "15,200 VBT", avatar: "ER", platform: "instagram", color: "from-purple-500 to-blue-500" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (user) setLocation("/onboarding");
    else window.location.href = getLoginUrl();
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Generate sparkline data for trends
  const generateSparkline = (seed: number) => {
    const pts: number[] = [];
    let v = 50 + seed * 3;
    for (let i = 0; i < 8; i++) {
      v += (Math.random() - 0.4) * 15;
      pts.push(Math.max(20, Math.min(100, v)));
    }
    return pts;
  };

  const trendColors = ["#22d3ee", "#a78bfa", "#34d399", "#fb923c", "#f472b6"];

  const liveTrends = trendingTopics?.youtube?.slice(0, 5).map((t: any, i: number) => ({
    ...t,
    sparkline: generateSparkline(i),
    color: trendColors[i % trendColors.length],
    platform: "youtube",
  })) || Array.from({ length: 5 }, (_, i) => ({
    topic: `Trend ${i + 1}`,
    viralityScore: 70 + i * 5,
    sparkline: generateSparkline(i),
    color: trendColors[i],
    platform: "youtube",
  }));

  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* ── NAVIGATION ── */}
        <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <button
              className="flex items-center gap-2.5 focus:outline-none group"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
                <TrendingUp className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">The Viral Beat</span>
            </button>

            <div className="hidden md:flex items-center gap-1">
              {[["trends", "Live Trends"], ["how-it-works", "How It Works"], ["earn", "Earn VBT"], ["testimonials", "Creators"]].map(([id, label]) => (
                <button key={id} onClick={() => scrollToSection(id)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-all">
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <ThemeSelector />
              {user ? (
                <Button onClick={() => setLocation("/dashboard")} size="sm" className="shadow-lg shadow-primary/20">
                  Go to Dashboard <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
                  <Button size="sm" onClick={handleGetStarted} className="shadow-lg shadow-primary/20">Get Started Free</Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-border bg-background/98 backdrop-blur-xl px-4 py-4 flex flex-col gap-1">
              {[["trends", "Live Trends"], ["how-it-works", "How It Works"], ["earn", "Earn VBT"], ["testimonials", "Creators"]].map(([id, label]) => (
                <button key={id} onClick={() => scrollToSection(id)} className="text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-all">{label}</button>
              ))}
              <div className="pt-3 border-t border-border flex flex-col gap-2 mt-1">
                {!user && <Button variant="outline" className="w-full" onClick={() => { setMobileMenuOpen(false); window.location.href = getLoginUrl(); }}>Sign In</Button>}
                <Button className="w-full" onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}>{user ? "Go to Dashboard" : "Get Started Free"}</Button>
              </div>
            </motion.div>
          )}
        </nav>

        {/* ── HERO ── */}
        <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Text */}
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium text-primary">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Trend Intelligence
                  <span className="ml-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                  Predict Viral<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-300 to-purple-400">
                    Trends Early
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Discover trending topics <strong className="text-foreground">3–7 days before they explode</strong>. Create viral content and earn VBT tokens for your insights.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="text-base px-7 py-5 shadow-xl shadow-primary/25 font-semibold" onClick={handleGetStarted}>
                    Start Predicting Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="text-base px-7 py-5 border-border/60 hover:border-primary/50" onClick={() => setShowVideoModal(true)}>
                    <Play className="mr-2 w-4 h-4 fill-current" />
                    Watch Demo
                  </Button>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-6 pt-2">
                  {[["10K+", "Active Creators"], ["2.5M+", "Trends Predicted"], ["87%", "Accuracy Rate"]].map(([val, label]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-2xl font-black text-primary">{val}</span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right: Live Trend Cards */}
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
                {/* Floating label */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Trending Now</span>
                </div>

                <div className="space-y-3">
                  {liveTrends.slice(0, 4).map((trend: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="group relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer"
                      onClick={handleGetStarted}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{ background: `${trend.color}20`, color: trend.color }}>
                          #{i + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <PlatformBadge platform={trend.platform} />
                            <span className="text-sm font-semibold truncate">
                              {trend.topic || trend.name || `Trending Topic ${i + 1}`}
                            </span>
                          </div>
                          <ViralityBar score={trend.viralityScore || 75 + i * 4} color={trend.color} />
                        </div>

                        {/* Sparkline */}
                        <div className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Sparkline values={trend.sparkline} color={trend.color} />
                        </div>

                        {/* Score */}
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-bold" style={{ color: trend.color }}>
                            {Math.round(trend.viralityScore || 75 + i * 4)}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">viral</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA overlay at bottom */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-4 text-center">
                  <button onClick={handleGetStarted} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 mx-auto transition-colors">
                    See all live trends <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── LIVE TRENDS SECTION ── */}
        <section id="trends" className="py-20 px-4 bg-muted/20" style={{ scrollMarginTop: "4rem" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Feed</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black">Trending Right Now</h2>
                <p className="text-muted-foreground mt-1 text-sm">Real-time trends our AI is tracking · Updates every 30 seconds</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleGetStarted} className="hidden sm:flex items-center gap-1.5">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {liveTrends.map((trend: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="group relative bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden"
                    onClick={handleGetStarted}
                  >
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20" style={{ background: trend.color }} />

                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <PlatformBadge platform={trend.platform} />
                          <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: trend.color }}>
                          <Flame className="w-3 h-3" />
                          {Math.round(trend.viralityScore || 75 + i * 4)}%
                        </div>
                      </div>

                      {/* Topic */}
                      <h3 className="font-bold text-sm leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {trend.topic || trend.name || `Trending Topic ${i + 1}`}
                      </h3>

                      {/* Sparkline */}
                      <div className="mb-3">
                        <Sparkline values={trend.sparkline} color={trend.color} height={28} />
                      </div>

                      {/* Virality bar */}
                      <ViralityBar score={trend.viralityScore || 75 + i * 4} color={trend.color} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="text-center mt-8 sm:hidden">
              <Button variant="outline" onClick={handleGetStarted}>
                See All Trends <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-20 px-4" style={{ scrollMarginTop: "4rem" }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-black mb-3">How It Works</h2>
              <p className="text-muted-foreground text-lg">Three steps to viral success</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Brain, step: "01", title: "AI Scans Millions of Posts", description: "Our AI monitors YouTube, TikTok, X, and Instagram in real-time to detect emerging patterns before they trend.", color: "from-cyan-500 to-blue-500", glow: "shadow-cyan-500/20" },
                { icon: Target, step: "02", title: "Get 3–7 Day Early Predictions", description: "Receive personalised trend forecasts with virality scores, sentiment analysis, and growth trajectories.", color: "from-purple-500 to-pink-500", glow: "shadow-purple-500/20" },
                { icon: Coins, step: "03", title: "Create Content & Earn VBT", description: "Post on trending topics early, share insights, and earn VBT tokens. Convert to crypto or spend in the marketplace.", color: "from-orange-500 to-yellow-500", glow: "shadow-orange-500/20" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className={`relative bg-card border border-border/50 rounded-3xl p-8 hover:shadow-2xl ${item.glow} transition-all group overflow-hidden`}
                >
                  {/* Step number watermark */}
                  <div className="absolute top-4 right-6 text-7xl font-black text-foreground/5 leading-none select-none">
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{item.description}</p>

                  {/* Connector arrow (not on last) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <div className="w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center">
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EARN VBT ── */}
        <section id="earn" className="py-20 px-4 bg-muted/20" style={{ scrollMarginTop: "4rem" }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-black mb-3">Multiple Ways to Earn</h2>
              <p className="text-muted-foreground text-lg">Turn your creator insights into real VBT rewards</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: TrendingUp, title: "Share Trends", reward: "50–200", unit: "VBT", description: "Submit trending topics early. Higher rewards for first movers.", color: "#22d3ee", bg: "from-cyan-500/10 to-cyan-500/5" },
                { icon: BarChart3, title: "Rate Content", reward: "10–50", unit: "VBT", description: "Vote on trend virality. Accurate predictions earn bonus tokens.", color: "#a78bfa", bg: "from-purple-500/10 to-purple-500/5" },
                { icon: Users, title: "Humans As Agents", reward: "500–2000", unit: "VBT", description: "Premium rewards for human-sourced viral data with verified links.", color: "#34d399", bg: "from-emerald-500/10 to-emerald-500/5" },
                { icon: Trophy, title: "Create Content", reward: "100–1000", unit: "VBT", description: "Generate AI content or share your own. Top performers get multipliers.", color: "#fb923c", bg: "from-orange-500/10 to-orange-500/5" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative bg-gradient-to-br ${item.bg} border border-border/50 rounded-3xl p-6 hover:border-primary/30 transition-all group`}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${item.color}20` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-bold text-base mb-1">{item.title}</h3>
                  <div className="text-3xl font-black mb-1" style={{ color: item.color }}>
                    {item.reward}
                    <span className="text-sm font-semibold ml-1 text-muted-foreground">{item.unit}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonials" className="py-20 px-4" style={{ scrollMarginTop: "4rem" }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-black mb-3">Creators Love Viral Beat</h2>
              <p className="text-muted-foreground text-lg">Real success stories from our community</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative bg-card border rounded-3xl p-7 transition-all ${i === activeTestimonial ? "border-primary/50 shadow-xl shadow-primary/10 scale-[1.02]" : "border-border/50"}`}
                  onClick={() => setActiveTestimonial(i)}
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-bold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role} · {t.followers} followers</div>
                      <div className="mt-1 inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                        <Coins className="w-3 h-3" /> {t.earnings}
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">"{t.quote}"</p>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)} className={`rounded-full transition-all ${i === activeTestimonial ? "bg-primary w-8 h-2" : "bg-muted-foreground/30 w-2 h-2"}`} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-primary via-cyan-400 to-purple-500 rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-semibold text-white mb-6">
                  <Zap className="w-4 h-4" /> Join 10,000+ creators
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-5">Ready to Go Viral?</h2>
                <p className="text-lg text-white/85 mb-8 max-w-lg mx-auto">
                  Start predicting trends and earning VBT tokens today. No credit card required.
                </p>
                <Button size="lg" variant="secondary" className="text-base px-8 py-5 font-bold shadow-2xl hover:scale-105 transition-transform" onClick={handleGetStarted}>
                  Start Free Now <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
                <p className="text-sm text-white/60 mt-4">Free forever · No hidden fees · Cancel anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-14 px-4 border-t border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">The Viral Beat</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">AI-powered trend prediction for creators who want to stay ahead of the curve.</p>
              </div>
              {[
                { title: "Product", links: ["Features", "Pricing", "API"] },
                { title: "Company", links: ["About", "Blog", "Careers"] },
                { title: "Legal", links: ["Privacy", "Terms", "Security"] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="font-semibold mb-4 text-sm">{col.title}</h4>
                  <ul className="space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <p>© 2026 The Viral Beat. All rights reserved.</p>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Available worldwide</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Video Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-4xl aspect-video bg-card rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowVideoModal(false)} className="absolute top-4 right-4 z-10 w-9 h-9 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-primary fill-primary" />
                  </div>
                  <p className="text-lg font-semibold">Video Demo Coming Soon</p>
                  <p className="text-sm text-muted-foreground mt-2">We're putting the finishing touches on it.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
