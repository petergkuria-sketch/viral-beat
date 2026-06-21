import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Twitter, TrendingUp, MessageCircle, Heart, Repeat2, Send, Sparkles,
  RefreshCw, User, Bot, Zap, Globe, Building2, ChevronRight,
  Landmark, Coins, Users, Leaf, Scale, Cpu, MapPin, Flag,
} from "lucide-react";
import { Streamdown } from "streamdown";

// ── Types ──────────────────────────────────────────────────────────────────
type PestelCategory = "political" | "economic" | "social" | "technological" | "environmental" | "legal";
type GeoLayer = "continental" | "regional" | "country";

const AFRICA_REGIONS = [
  { value: "east-africa",     label: "East Africa",     color: "#22d3ee" },
  { value: "west-africa",     label: "West Africa",     color: "#a78bfa" },
  { value: "southern-africa", label: "Southern Africa", color: "#34d399" },
  { value: "north-africa",    label: "North Africa",    color: "#fb923c" },
  { value: "central-africa",  label: "Central Africa",  color: "#f87171" },
];

const AFRICA_COUNTRIES = [
  { value: "kenya",    label: "Kenya",        flag: "🇰🇪" },
  { value: "nigeria",  label: "Nigeria",      flag: "🇳🇬" },
  { value: "ghana",    label: "Ghana",        flag: "🇬🇭" },
  { value: "ethiopia", label: "Ethiopia",     flag: "🇪🇹" },
  { value: "tanzania", label: "Tanzania",     flag: "🇹🇿" },
  { value: "southafrica", label: "South Africa", flag: "🇿🇦" },
  { value: "egypt",    label: "Egypt",        flag: "🇪🇬" },
  { value: "rwanda",   label: "Rwanda",       flag: "🇷🇼" },
];

const PESTEL: { value: PestelCategory; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { value: "political",      label: "Political",      icon: <Landmark className="w-3.5 h-3.5" />,  color: "#f87171", desc: "Governance, elections, policy" },
  { value: "economic",       label: "Economic",       icon: <Coins className="w-3.5 h-3.5" />,     color: "#34d399", desc: "Markets, trade, development" },
  { value: "social",         label: "Social",         icon: <Users className="w-3.5 h-3.5" />,     color: "#a78bfa", desc: "Civil society, movements, rights" },
  { value: "technological",  label: "Tech",           icon: <Cpu className="w-3.5 h-3.5" />,       color: "#22d3ee", desc: "Digital, innovation, fintech" },
  { value: "environmental",  label: "Environment",    icon: <Leaf className="w-3.5 h-3.5" />,      color: "#86efac", desc: "Climate, energy, resources" },
  { value: "legal",          label: "Legal",          icon: <Scale className="w-3.5 h-3.5" />,     color: "#fb923c", desc: "Rule of law, judiciary, rights" },
];

const GEO_LAYERS: { value: GeoLayer; label: string; icon: React.ReactNode }[] = [
  { value: "continental", label: "Continental (AU)", icon: <Globe className="w-3.5 h-3.5" /> },
  { value: "regional",    label: "Regional",         icon: <MapPin className="w-3.5 h-3.5" /> },
  { value: "country",     label: "Country",          icon: <Flag className="w-3.5 h-3.5" /> },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isWelcome?: boolean;
}

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toString() || "0";
}

function EngagementBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

export default function XTrends() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<PestelCategory>("political");
  const [geoLayer, setGeoLayer] = useState<GeoLayer>("continental");
  const [selectedRegion, setSelectedRegion] = useState("east-africa");
  const [selectedCountry, setSelectedCountry] = useState("kenya");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 I'm the **Africa Signal Monitor**. I track political, economic, social, tech, environmental, and legal signals across 55 African nations — sourced from AU organs, regional bodies, and verified media.\n\nSelect a PESTEL filter and a geographic layer (Continental / Regional / Country), then click any signal card to get a Claude-powered analysis.",
      timestamp: new Date(),
      isWelcome: true,
    },
  ]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [inputMessage, setInputMessage] = useState("");
  const [selectedTrend, setSelectedTrend] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Build the category string passed to the server: "<layer>:<scope>:<pestel>"
  const scopeKey = geoLayer === "continental" ? "au"
    : geoLayer === "regional" ? selectedRegion
    : selectedCountry;
  const queryCategory = `${geoLayer}:${scopeKey}:${selectedCategory}` as any;

  const { data: trendingData, isLoading: trendsLoading, refetch: refetchTrends } = trpc.xTrends.getTrending.useQuery(
    { category: queryCategory },
    { refetchOnWindowFocus: false }
  );

  const chatMutation = trpc.xTrends.chat.useMutation({
    onSuccess: (data) => {
      setChatMessages((prev) => [...prev, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: typeof data.response === "string" ? data.response : String(data.response),
        timestamp: new Date(data.timestamp),
      }]);
    },
  });

  const summarizeMutation = trpc.xTrends.summarizeTrends.useMutation();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Re-fetch when geo layer or scope changes
  useEffect(() => { refetchTrends(); }, [geoLayer, selectedRegion, selectedCountry, selectedCategory]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: inputMessage, timestamp: new Date() };
    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    chatMutation.mutate({
      message: inputMessage,
      context: selectedTrend ? { currentTopic: selectedTrend.topic, recentTweets: selectedTrend.tweets?.map((t: any) => t.text) || [] } : undefined,
    });
  };

  const handleAnalyzeTrend = async (trend: any) => {
    setSelectedTrend(trend);
    const analysisMessage: ChatMessage = {
      id: `user-analyze-${Date.now()}`,
      role: "user",
      content: `Analyse this Africa signal: "${trend.topic}" from @${trend.source.username} — PESTEL: ${selectedCategory}, Scope: ${scopeKey}`,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, analysisMessage]);
    const result = await summarizeMutation.mutateAsync({
      topic: trend.topic,
      tweets: trend.tweets?.map((t: any) => ({ text: t.text, likes: t.likes, retweets: t.retweets })),
    });
    setChatMessages((prev) => [...prev, {
      id: `assistant-summary-${Date.now()}`,
      role: "assistant",
      content: typeof result.summary === "string" ? result.summary : String(result.summary),
      timestamp: new Date(result.generatedAt),
    }]);
  };

  const maxEngagement = Math.max(...((trendingData?.trends ?? []).map((t: any) => t.engagement).concat([1])));
  const catColor = PESTEL.find(c => c.value === selectedCategory)?.color || "#22d3ee";
  const activeRegionLabel = AFRICA_REGIONS.find(r => r.value === selectedRegion)?.label || "";
  const activeCountry = AFRICA_COUNTRIES.find(c => c.value === selectedCountry);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* ── PAGE HEADER ── */}
      <div className="border-b border-border/50 bg-card/40 backdrop-blur-sm px-4 sm:px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg">Africa Signal Monitor</h1>
              <p className="text-xs text-muted-foreground">PESTEL intelligence across 55 African nations · AU + Regional + Country</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchTrends()} disabled={trendsLoading}>
              <RefreshCw className={`w-4 h-4 ${trendsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* GEO LAYER selector */}
        <div className="flex gap-2">
          {GEO_LAYERS.map((layer) => (
            <button
              key={layer.value}
              onClick={() => setGeoLayer(layer.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                geoLayer === layer.value
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                  : "bg-transparent border-border/40 text-muted-foreground hover:border-border"
              }`}
            >
              {layer.icon}
              {layer.label}
            </button>
          ))}

          {/* Region sub-selector */}
          {geoLayer === "regional" && (
            <div className="flex gap-1 ml-2 overflow-x-auto">
              {AFRICA_REGIONS.map(r => (
                <button key={r.value} onClick={() => setSelectedRegion(r.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all ${
                    selectedRegion === r.value
                      ? "border-transparent text-white"
                      : "border-border/40 text-muted-foreground hover:border-border"
                  }`}
                  style={selectedRegion === r.value ? { background: r.color + "30", borderColor: r.color + "80", color: r.color } : {}}
                >{r.label}</button>
              ))}
            </div>
          )}

          {/* Country sub-selector */}
          {geoLayer === "country" && (
            <div className="flex gap-1 ml-2 overflow-x-auto">
              {AFRICA_COUNTRIES.map(c => (
                <button key={c.value} onClick={() => setSelectedCountry(c.value)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all ${
                    selectedCountry === c.value
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "border-border/40 text-muted-foreground hover:border-border"
                  }`}
                >
                  <span>{c.flag}</span>{c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PESTEL filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {PESTEL.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat.value
                  ? "text-white border-transparent"
                  : "bg-transparent border-border/50 text-muted-foreground hover:border-border"
              }`}
              style={selectedCategory === cat.value ? { background: cat.color, boxShadow: `0 0 12px ${cat.color}40` } : {}}
              title={cat.desc}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
          {/* Scope label */}
          <span className="ml-auto flex items-center text-[10px] text-muted-foreground px-2 whitespace-nowrap">
            {geoLayer === "continental" && "🌍 African Union"}
            {geoLayer === "regional" && `📍 ${activeRegionLabel}`}
            {geoLayer === "country" && `${activeCountry?.flag} ${activeCountry?.label}`}
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-hidden grid lg:grid-cols-5 gap-0">

        {/* ── LEFT: SIGNAL CARDS ── */}
        <div className="lg:col-span-2 border-r border-border/50 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {trendsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading signals…</p>
                </div>
              ) : (trendingData?.trends?.length ?? 0) > 0 ? (
                <AnimatePresence mode="popLayout">
                  {(trendingData?.trends ?? []).map((trend: any, index: number) => (
                    <motion.div
                      key={trend.id || `trend-${index}`}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative rounded-2xl border p-4 cursor-pointer transition-all overflow-hidden ${
                        selectedTrend?.id === trend.id
                          ? "border-cyan-500/60 bg-cyan-500/5"
                          : "border-border/50 bg-card/50 hover:border-border hover:bg-card/80"
                      }`}
                      onClick={() => handleAnalyzeTrend(trend)}
                    >
                      {/* Rank */}
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: `${catColor}15`, color: catColor }}>
                        {index + 1}
                      </div>

                      {/* Source */}
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={trend.source.profileImage || "/placeholder-avatar.png"}
                          alt={trend.source.name}
                          className="w-6 h-6 rounded-full object-cover bg-muted"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-avatar.png"; }}
                        />
                        <span className="text-xs text-muted-foreground font-medium">@{trend.source.username}</span>
                        {trend.source.verified && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">✓</span>}
                        {trend.isFallback && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">sample</span>}
                        <span className="text-[10px] text-muted-foreground ml-auto mr-8">{formatNumber(trend.source.followers)} followers</span>
                      </div>

                      <h3 className="font-bold text-sm mb-1 pr-8 group-hover:text-primary transition-colors">{trend.topic}</h3>
                      {trend.hashtag && !trend.hashtag.includes(":") && (
                        <p className="text-xs font-medium mb-3" style={{ color: catColor }}>{trend.hashtag}</p>
                      )}

                      <EngagementBar value={trend.engagement} max={maxEngagement} color={catColor} />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">Signal strength</span>
                        <span className="text-[10px] font-bold" style={{ color: catColor }}>{formatNumber(trend.engagement)}</span>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full mt-3 h-7 text-xs font-semibold hover:bg-cyan-500/10 hover:text-cyan-400"
                        onClick={(e) => { e.stopPropagation(); handleAnalyzeTrend(trend); }}
                        disabled={summarizeMutation.isPending}
                      >
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        Analyse with Claude
                        <ChevronRight className="w-3 h-3 ml-auto" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Globe className="w-10 h-10 opacity-30" />
                  <p className="text-sm">No signals available</p>
                  <Button variant="outline" size="sm" onClick={() => refetchTrends()}>Refresh</Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Selected trend tweets */}
          {selectedTrend && (
            <div className="border-t border-border/50 bg-card/30">
              <div className="px-4 py-2 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-bold">Recent Posts</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">{selectedTrend.tweets?.length || 0}</Badge>
              </div>
              <ScrollArea className="h-[180px]">
                <div className="px-4 pb-4 space-y-2">
                  {selectedTrend.tweets?.length > 0 ? selectedTrend.tweets.map((tweet: any, i: number) => (
                    <div key={tweet.id || i} className="p-3 rounded-xl bg-muted/20 border border-border/30 text-xs">
                      <p className="mb-2 leading-relaxed line-clamp-3 text-foreground/90">{tweet.text}</p>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" />{formatNumber(tweet.likes)}</span>
                        <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3 text-green-400" />{formatNumber(tweet.retweets)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-blue-400" />{formatNumber(tweet.replies || 0)}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No posts available</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* ── RIGHT: AI CHAT ── */}
        <div className="lg:col-span-3 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 py-3 border-b border-border/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">Africa Intelligence Agent</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Online · Claude-powered
              </div>
            </div>
            <Badge variant="secondary" className="ml-auto bg-purple-500/10 text-purple-400 text-xs">
              <Sparkles className="w-3 h-3 mr-1" /> AI
            </Badge>
          </div>

          <ScrollArea className="flex-1 px-4 sm:px-6 py-4">
            <div className="space-y-4 max-w-2xl mx-auto">
              <AnimatePresence initial={false}>
                {chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-md">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-cyan-500/15 border border-cyan-500/30 rounded-br-sm"
                        : "bg-muted/40 border border-border/40 rounded-bl-sm"
                    }`}>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Streamdown>{message.content}</Streamdown>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">{message.timestamp.toLocaleTimeString()}</p>
                      {message.role === "assistant" && !message.isWelcome && (
                        <div className="mt-3 pt-3 border-t border-border/30">
                          {ratings[message.id] ? (
                            <p className="text-[11px] text-emerald-400 font-medium">
                              Thanks for rating this analysis {["", "⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"][ratings[message.id]]}
                            </p>
                          ) : (
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-2">Rate this analysis</p>
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => setRatings((r) => ({ ...r, [message.id]: star }))}
                                    className="text-lg leading-none transition-transform hover:scale-125 text-muted-foreground hover:text-yellow-400"
                                    title={["", "Poor", "Fair", "Good", "Very good", "Excellent"][star]}
                                  >
                                    ☆
                                  </button>
                                ))}
                                <span className="text-[10px] text-muted-foreground ml-1">1 – 5</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-cyan-400" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {(chatMutation.isPending || summarizeMutation.isPending) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted/40 border border-border/40 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                          animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">Analysing signal…</span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {chatMessages.length <= 1 && (
            <div className="px-4 sm:px-6 pb-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  "What are the top political risks in East Africa right now?",
                  "Summarise AU economic signals this week",
                  "Which country has the highest social unrest signals?",
                  "Analyse Kenya's legal and governance signals",
                ].map((prompt) => (
                  <button key={prompt} onClick={() => setInputMessage(prompt)}
                    className="shrink-0 text-xs px-3 py-2 rounded-xl bg-muted/40 border border-border/50 hover:border-purple-500/40 hover:bg-purple-500/5 hover:text-purple-400 transition-all text-muted-foreground whitespace-nowrap">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 sm:px-6 py-4 border-t border-border/50 bg-card/30">
            <div className="flex gap-2 max-w-2xl mx-auto">
              <Input
                placeholder="Ask about Africa signals, governance risks, or PESTEL analysis…"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                disabled={chatMutation.isPending || summarizeMutation.isPending}
                className="flex-1 bg-background/60 border-border/60 focus-visible:ring-purple-500/50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending || summarizeMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/20 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
