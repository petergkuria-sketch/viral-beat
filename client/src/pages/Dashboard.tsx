import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useViewPreference } from "@/_core/hooks/useViewPreference";
import { ViewToggle } from "@/components/ViewToggle";
import { 
  TrendingUp, 
  Search,
  Zap,
  Youtube,
  Music2,
  ExternalLink,
  Loader2,
  Heart,
  Flame,
  BarChart3,
  ArrowUpRight,
  Activity,
  Sparkles,
  Eye,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkline, ViralityBar } from "@/components/Sparkline";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { BeatVote } from "@/components/BeatVote";
import { TokenBalanceIndicator } from "@/components/TokenBalanceIndicator";

// Sentiment donut using SVG
function SentimentDonut({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  const segments = [
    { value: positive, color: "#34d399", label: "Positive" },
    { value: negative, color: "#f87171", label: "Negative" },
    { value: neutral, color: "#6b7280", label: "Neutral" },
  ];
  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = (seg.value / 100) * circumference;
    const gap = circumference - dash;
    const rotation = (offset / 100) * 360 - 90;
    offset += seg.value;
    return { ...seg, dash, gap, rotation };
  });
  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="14"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={0}
            transform={`rotate(${arc.rotation} ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" fontSize="18" fontWeight="bold">{positive}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="9">positive</text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-bold ml-auto">{seg.value}%</span>
          </div>
        ))}
      </div>
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
  return <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-white text-[9px] font-bold ${p.color}`}>{p.label}</span>;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [topic, setTopic] = useState("");
  const [dashView, setDashView] = useViewPreference("dashboard", "widget");
  const [searchInput, setSearchInput] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<"all" | "youtube" | "tiktok" | "twitter" | "instagram">("all");
  const { user, loading: authLoading, logout } = useAuth();

  // Get topic from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topicParam = params.get("topic");
    if (topicParam) {
      setTopic(decodeURIComponent(topicParam));
      setSearchInput(decodeURIComponent(topicParam));
    }
  }, []);

  // Fetch trend data
  const { data: trendData, isLoading, error, refetch } = trpc.trends.search.useQuery(
    { query: topic, platform: selectedPlatform },
    { enabled: !!topic }
  );

  // Fetch live trending for empty state
  const { data: liveTrends } = trpc.trends.search.useQuery(
    { query: "" },
    { enabled: !topic, refetchInterval: 60000 }
  );

  // Check if topic is favorited
  const { data: favoriteStatus } = trpc.favorites.check.useQuery(
    { topic },
    { enabled: !!topic && !!user }
  );

  const utils = trpc.useUtils();
  const addFavorite = trpc.favorites.add.useMutation({
    onSuccess: () => { utils.favorites.check.invalidate({ topic }); utils.favorites.list.invalidate(); toast.success("Added to favorites!"); },
    onError: () => toast.error("Failed to add to favorites"),
  });
  const removeFavorite = trpc.favorites.remove.useMutation({
    onSuccess: () => { utils.favorites.check.invalidate({ topic }); utils.favorites.list.invalidate(); toast.success("Removed from favorites"); },
    onError: () => toast.error("Failed to remove from favorites"),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTopic(searchInput.trim());
      setLocation(`/dashboard?topic=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleToggleFavorite = () => {
    if (!user) { toast.error("Please sign in to save favorites"); return; }
    if (favoriteStatus?.isFavorite) {
      removeFavorite.mutate({ topic });
    } else {
      addFavorite.mutate({ topic, platform: "all", viralityScore: trendData?.viralityScore?.toString(), thumbnail: trendData?.youtube?.[0]?.thumbnail || trendData?.tiktok?.[0]?.thumbnail });
    }
  };

  const allVideos = [
    ...(trendData?.youtube || []),
    ...(trendData?.tiktok || []),
  ].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

  const trendColors = ["#22d3ee", "#a78bfa", "#34d399", "#fb923c", "#f472b6"];

  const generateSparkline = (seed: number) => {
    const pts: number[] = [];
    let v = 50 + seed * 3;
    for (let i = 0; i < 8; i++) { v += (Math.random() - 0.4) * 15; pts.push(Math.max(20, Math.min(100, v))); }
    return pts;
  };

  const viralityScore = trendData?.viralityScore || 0;
  const viralityPct = Math.min(viralityScore * 10, 100);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── SEARCH HERO ── */}
      <div className="relative bg-gradient-to-b from-card/80 to-background border-b border-border/50 px-4 sm:px-6 py-6">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Africa Political Intelligence Search</span>
            {user && <div className="ml-auto flex items-center gap-2"><TokenBalanceIndicator /><OnboardingTour tourId="dashboard" label="Site Tour" /></div>}
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1" id="dashboard-search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search a topic, election, movement, or country signal…"
                className="pl-10 h-12 bg-background/80 border-border/60 text-base focus-visible:ring-primary/50"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6 shadow-lg shadow-primary/20 font-semibold">
              Analyse <Zap className="ml-1.5 w-4 h-4" />
            </Button>
          </form>

          {/* Quick signals */}
          <div className="flex flex-wrap gap-2 mt-3">
            {["Kenya Elections", "Nigeria Economy", "Sudan Conflict", "Ethiopia Politics", "AU Summit"].map((s) => (
              <button key={s} onClick={() => { setSearchInput(s); setTopic(s); setLocation(`/dashboard?topic=${encodeURIComponent(s)}`); }}
                className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border/50 hover:border-primary/30 transition-all text-muted-foreground">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* ── LOADING ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <Zap className="absolute inset-0 m-auto w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium">Analyzing trend data for <span className="text-primary">"{topic}"</span>…</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <Activity className="w-7 h-7 text-destructive" />
            </div>
            <p className="text-muted-foreground">Failed to load trend data.</p>
            <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {!isLoading && !error && trendData && (
          <AnimatePresence mode="wait">
            <motion.div key={topic} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Topic header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black">{topic}</h1>
                    <p className="text-xs text-muted-foreground">Trend analysis · Updated just now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={favoriteStatus?.isFavorite ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleFavorite}
                    disabled={addFavorite.isPending || removeFavorite.isPending}
                    className={favoriteStatus?.isFavorite ? "bg-red-500 hover:bg-red-600 border-red-500" : ""}
                  >
                    <Heart className={`w-4 h-4 mr-1.5 ${favoriteStatus?.isFavorite ? "fill-current" : ""}`} />
                    {favoriteStatus?.isFavorite ? "Saved" : "Save"}
                  </Button>
                  <BeatVote topic={topic} variant="default" size="sm" />
                </div>
              </div>

              {/* ── KPI ROW ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Virality Score", value: viralityScore.toFixed(1), unit: "/10", color: "#22d3ee", icon: Flame, change: "+12%", bg: "from-cyan-500/10 to-cyan-500/5" },
                  { label: "YouTube Videos", value: trendData.youtube?.length || 0, unit: " found", color: "#f87171", icon: Youtube, change: "live", bg: "from-red-500/10 to-red-500/5" },
                  { label: "TikTok Videos", value: trendData.tiktok?.length || 0, unit: " found", color: "#a78bfa", icon: Music2, change: "live", bg: "from-purple-500/10 to-purple-500/5" },
                  { label: "Top Creators", value: trendData.topCreators?.length || 0, unit: " tracked", color: "#34d399", icon: BarChart3, change: "active", bg: "from-emerald-500/10 to-emerald-500/5" },
                ].map((kpi, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card className={`bg-gradient-to-br ${kpi.bg} border-border/50 overflow-hidden`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                            <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                            {kpi.change}
                          </span>
                        </div>
                        <div className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}<span className="text-sm font-normal text-muted-foreground">{kpi.unit}</span></div>
                        <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* ── CHART + SENTIMENT ── */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Trend Trajectory Chart */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
                  <Card className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle className="text-base font-bold">Trend Trajectory</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Last 7 days + AI forecast</p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                        <Zap className="w-3 h-3 mr-1" /> Live
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <Line
                          data={{
                            labels: trendData.trendData.map((d: { day: string }) => d.day),
                            datasets: [{
                              label: 'Trend Score',
                              data: trendData.trendData.map((d: { value: number }) => d.value),
                              borderColor: '#22d3ee',
                              backgroundColor: 'rgba(34,211,238,0.08)',
                              borderWidth: 2.5,
                              fill: true,
                              tension: 0.4,
                              pointRadius: 0,
                              pointHoverRadius: 5,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(34,211,238,0.3)', borderWidth: 1 } },
                            scales: {
                              x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 10 } } },
                              y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { size: 10 }, callback: (v) => `${v}M` } },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Sentiment Donut */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="border-border/50 h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        Sentiment
                        <Badge variant="secondary" className="bg-green-500/10 text-green-400 text-xs">AI</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SentimentDonut
                        positive={trendData.sentiment.positive}
                        negative={trendData.sentiment.negative}
                        neutral={trendData.sentiment.neutral}
                      />
                      {trendData.sentiment.summary && (
                        <p className="text-xs text-muted-foreground italic mt-4 border-t border-border pt-3 leading-relaxed">
                          "{trendData.sentiment.summary}"
                        </p>
                      )}
                      {trendData.sentiment.emotions?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {trendData.sentiment.emotions.slice(0, 4).map((e: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-primary/10 text-primary text-xs capitalize">{e}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* ── TOP VOICES ── */}
              {trendData.topCreators?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold">Top Field Contributors on This Signal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-3 gap-4">
                        {trendData.topCreators.slice(0, 3).map((creator: any, i: number) => (
                          <div
                            key={i}
                            className="group relative bg-muted/20 border border-border/50 rounded-2xl p-4 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer overflow-hidden"
                            onClick={() => setLocation(`/contributor`)}
                          >
                            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10" style={{ background: trendColors[i] }} />
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: `${trendColors[i]}20`, color: trendColors[i] }}>
                                #{creator.rank}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">{creator.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  {creator.platform}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <div><div className="text-muted-foreground mb-0.5">Signals</div><div className="font-black font-mono">{creator.formattedViews}</div></div>
                              <div className="text-right"><div className="text-muted-foreground mb-0.5">Accuracy</div><div className="font-black font-mono text-green-400">{creator.growth}</div></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ── VIDEO GRID ── */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">Trending Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all">
                      <TabsList className="mb-4 h-9">
                        <TabsTrigger value="all" className="text-xs">All ({allVideos.length})</TabsTrigger>
                        <TabsTrigger value="youtube" className="text-xs"><Youtube className="w-3 h-3 mr-1" />YouTube ({trendData.youtube.length})</TabsTrigger>
                        <TabsTrigger value="tiktok" className="text-xs"><Music2 className="w-3 h-3 mr-1" />TikTok ({trendData.tiktok.length})</TabsTrigger>
                      </TabsList>

                      {[["all", allVideos], ["youtube", trendData.youtube], ["tiktok", trendData.tiktok]].map(([tab, videos]: any) => (
                        <TabsContent key={tab} value={tab}>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {videos.slice(0, 6).map((video: any, i: number) => (
                              <VideoCard key={`${tab}-${video.id}-${i}`} video={video} index={i} />
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── EMPTY STATE: Intelligence Mission Control ── */}
        {!isLoading && !error && !topic && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* Mission control quick-action cards */}
            <div id="dashboard-mission-cards" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Africa Market Scanner", desc: "55 AU markets ranked by composite PESTEL+IR score — country deep dive, sector readiness & Go/No-Go brief generator", icon: "📈", href: "/scanner", color: "#00d4ff", badge: "New" },
                { label: "Intelligence Workspace", desc: "PESTEL+IR signal analysis with live AI briefings, reports & chat for any African country", icon: "📡", href: "/intelligence", color: "#a78bfa", badge: "Live AI" },
                { label: "Political Aggregator", desc: "PESTEL+IR signals from RSS, social media, chambers, APEX bodies & field contributors", icon: "⚡", href: "/aggregator", color: "#f472b6", badge: "Multi-Source" },
                { label: "Field Contributors", desc: "Ground-truth signals from Africa — submit, browse and verify intelligence from the network", icon: "🧑‍💻", href: "/haa", color: "#34d399", badge: "People-Powered" },
              ].map((item, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setLocation(item.href)}
                  className="group text-left w-full relative bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: item.color }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color: item.color, borderColor: `${item.color}40`, background: `${item.color}10` }}>{item.badge}</span>
                    </div>
                    <h3 className="font-black text-sm mb-1 group-hover:text-primary transition-colors">{item.label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Africa Intelligence Signals</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Search a topic above or click any signal to analyse it</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live
                </div>
                <ViewToggle
                  options={[{ value: "widget", label: "Widget" }, { value: "classic", label: "Classic" }]}
                  current={dashView}
                  onChange={setDashView}
                />
              </div>
            </div>

            {/* Widget view — icon tiles for quick navigation */}
            {dashView === "widget" && (
              <div id="dashboard-quick-access" className="grid grid-cols-3 sm:grid-cols-6 gap-3 pb-2">
                {[
                  { icon: "🌍", label: "Africa Hub", href: "/africa", color: "#22d3ee" },
                  { icon: "📡", label: "Intelligence", href: "/intelligence", color: "#a78bfa" },
                  { icon: "📈", label: "Mkt Scanner", href: "/scanner", color: "#00d4ff" },
                  { icon: "⚡", label: "Aggregator", href: "/aggregator", color: "#f472b6" },
                  { icon: "🏗️", label: "Inv. Readiness", href: "/doing-business", color: "#fb923c" },
                  { icon: "🧑‍💻", label: "Contributors", href: "/haa", color: "#34d399" },
                ].map((item) => (
                  <button
                    key={item.href}
                    onClick={() => setLocation(item.href)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-border/30 transition-transform group-hover:scale-105" style={{ background: `${item.color}18` }}>
                      {item.icon}
                    </div>
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className={dashView === "widget" ? "" : ""} />{/* spacer */}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {(liveTrends?.youtube?.slice(0, 10) || Array.from({ length: 10 }, (_, i) => ({ topic: `Trend ${i + 1}`, viralityScore: 70 + i * 3 }))).map((t: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group relative bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden"
                  onClick={() => { const q = t.topic || t.name || `Trend ${i + 1}`; setSearchInput(q); setTopic(q); setLocation(`/dashboard?topic=${encodeURIComponent(q)}`); }}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: trendColors[i % 5] }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: trendColors[i % 5] }}>
                        <Flame className="w-3 h-3" />{Math.round(t.viralityScore || 75)}%
                      </div>
                    </div>
                    <h3 className="font-bold text-sm leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {t.topic || t.name || `Trending Topic ${i + 1}`}
                    </h3>
                    <Sparkline values={generateSparkline(i)} color={trendColors[i % 5]} />
                    <div className="mt-2">
                      <ViralityBar score={t.viralityScore || 75} color={trendColors[i % 5]} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick access row */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Kenya Deep-Dive", desc: "The richest country intelligence module on the platform", icon: TrendingUp, href: "/kenya", color: "#22d3ee" },
                { label: "Investment Readiness", desc: "B-READY rankings, country comparator & FDI sector map for 20 AU economies", icon: BarChart3, href: "/doing-business", color: "#fb923c" },
                { label: "Developer API", desc: "Embed Africa intelligence in your product", icon: Zap, href: "/developer-hub", color: "#34d399" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <button
                    onClick={() => setLocation(item.href)}
                    className="w-full group flex items-center gap-4 bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/40 hover:bg-card/80 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Video Card Component — thumbnail-first grid layout
function VideoCard({ video, index }: { video: any; index: number }) {
  return (
    <motion.a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all bg-card"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-muted overflow-hidden">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            {video.platform === "youtube" ? <Youtube className="w-10 h-10 text-muted-foreground/40" /> : <Music2 className="w-10 h-10 text-muted-foreground/40" />}
          </div>
        )}
        {/* Platform badge overlay */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-white text-[10px] font-bold ${video.platform === "youtube" ? "bg-red-500" : "bg-pink-500"}`}>
            {video.platform === "youtube" ? "YT" : "TK"}
          </span>
        </div>
        {/* View count overlay */}
        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-0.5 flex items-center gap-1">
          <Eye className="w-3 h-3 text-white/70" />
          <span className="text-white text-[10px] font-medium">
            {typeof video.views === 'number' ? `${(video.views / 1000000).toFixed(1)}M` : video.views || "—"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <h4 className="font-semibold text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">{video.title}</h4>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{video.channel}</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
      </div>
    </motion.a>
  );
}
