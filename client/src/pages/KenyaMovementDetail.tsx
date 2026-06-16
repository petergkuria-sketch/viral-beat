import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useRoute } from "wouter";
import {
  Users, TrendingUp, TrendingDown, Minus, Activity,
  Calendar, ExternalLink, ChevronRight, MessageSquare,
  Globe, Twitter, Send, Loader2, AlertCircle, CheckCircle,
  Clock, Newspaper, Target, Zap, ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const MOVEMENT_COLORS: Record<string, string> = {
  "linda-mwananchi": "#00C853",
  "niko-kadi": "#2196F3",
  "occupy-parliament": "#FF5722",
  "end-femicide": "#E91E63",
};

const MOMENTUM_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  rising: { icon: TrendingUp, color: "text-green-400", label: "Rising" },
  stable: { icon: Minus, color: "text-yellow-400", label: "Stable" },
  declining: { icon: TrendingDown, color: "text-red-400", label: "Declining" },
};

function SentimentRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const radius = (size / 2) - 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-lg font-bold text-white">{score}</span>
    </div>
  );
}

export default function KenyaMovementDetail() {
  const [, params] = useRoute("/kenya/movements/:id");
  const movementId = params?.id || "linda-mwananchi";
  const color = MOVEMENT_COLORS[movementId] || "#00C853";

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  const { data: movement, isLoading: movLoading } = trpc.kenya.movements.getMovement.useQuery({ id: movementId });
  const { data: sentiment, isLoading: sentLoading } = trpc.kenya.movements.getMovementSentiment.useQuery({ id: movementId });
  const { data: news, isLoading: newsLoading } = trpc.kenya.movements.getMovementNews.useQuery({ id: movementId });

  const chatMutation = trpc.kenya.movements.chatAboutMovement.useMutation({
    onSuccess: (data) => {
      setChatHistory((prev) => [...prev, { role: "ai" as const, text: String(data.response) }]);
    },
  });

  const handleChat = () => {
    if (!chatMessage.trim()) return;
    setChatHistory((prev) => [...prev, { role: "user", text: chatMessage }]);
    chatMutation.mutate({ movementId, message: chatMessage });
    setChatMessage("");
  };

  if (movLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Movement not found</p>
          <Link href="/kenya/movements">
            <Button variant="outline" className="mt-4">Back to Movements</Button>
          </Link>
        </div>
      </div>
    );
  }

  const momentumCfg = MOMENTUM_CONFIG[sentiment?.momentum || "stable"];
  const MomentumIcon = momentumCfg.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}22 0%, transparent 60%)` }}
      >
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${color} 0%, transparent 50%)`,
        }} />
        <div className="relative p-6 pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/kenya" className="hover:text-primary transition-colors">Kenya Intelligence</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/kenya/movements" className="hover:text-primary transition-colors">Movements</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">{movement.name}</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: color + "33", border: `2px solid ${color}` }}
                >
                  {movement.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{movement.name}</h1>
                  <p className="text-sm italic" style={{ color }}>{movement.swahili}</p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-2xl mt-3 leading-relaxed">{movement.mission}</p>

              {/* Social links */}
              <div className="flex items-center gap-3 mt-4">
                {movement.website && (
                  <a href={movement.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
                {movement.twitter && (
                  <a href={`https://x.com/${movement.twitter}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Twitter className="w-3.5 h-3.5" />
                    @{movement.twitter}
                  </a>
                )}
                {movement.linkedParty && (
                  <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: color + "40", color }}>
                    {movement.linkedParty}
                  </span>
                )}
              </div>
            </div>

            {/* Sentiment ring */}
            {!sentLoading && sentiment && (
              <div className="hidden md:flex flex-col items-center gap-2">
                <SentimentRing score={sentiment.score} color={color} size={90} />
                <div className={`flex items-center gap-1 text-xs font-medium ${momentumCfg.color}`}>
                  <MomentumIcon className="w-3.5 h-3.5" />
                  {momentumCfg.label}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sentiment metrics */}
          {!sentLoading && sentiment && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Movement Intelligence
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color }}>{sentiment.score}</div>
                  <div className="text-xs text-muted-foreground mt-1">Sentiment Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{sentiment.publicSupport}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Public Support</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{sentiment.mediaAttention}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Media Attention</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${momentumCfg.color}`}>{momentumCfg.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">Momentum</div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Public Support</span><span>{sentiment.publicSupport}%</span>
                  </div>
                  <Progress value={sentiment.publicSupport} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Media Attention</span><span>{sentiment.mediaAttention}%</span>
                  </div>
                  <Progress value={sentiment.mediaAttention} className="h-1.5" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed italic">
                "{sentiment.summary}"
              </p>
            </div>
          )}

          {/* Leaders */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Key Leaders & Allies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {movement.leaders.map((leader: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: color + "33", border: `1.5px solid ${color}` }}
                  >
                    {leader.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">{leader.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{leader.role}</div>
                    {leader.party && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground mt-0.5 inline-block">
                        {leader.party}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Demands */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Key Demands
            </h3>
            <div className="space-y-2">
              {movement.keyDemands.map((demand: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-background rounded-lg border border-border">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                    style={{ backgroundColor: color }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-sm text-foreground">{demand}</span>
                </div>
              ))}
            </div>
          </div>

          {/* News Feed */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" />
              Latest News
            </h3>
            {newsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-1 h-16 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-4/5" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : news && news.length > 0 ? (
              <div className="space-y-3">
                {news.map((article: any, i: number) => (
                  <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                    className="flex gap-3 group hover:bg-background p-2 rounded-lg transition-colors">
                    <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </div>
                      {article.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span>{article.source}</span>
                        <span>·</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent news found for this movement</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column — events + AI chat */}
        <div className="space-y-6">
          {/* Recent Events */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Timeline
            </h3>
            <div className="space-y-3">
              {/* Upcoming */}
              {movement.upcomingEvents.map((event: any, i: number) => (
                <div key={`up-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                    <div className="w-px flex-1 bg-border mt-1" />
                  </div>
                  <div className="pb-3">
                    <div className="text-xs text-amber-400 font-medium mb-0.5">
                      {new Date(event.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · Upcoming
                    </div>
                    <div className="text-sm text-foreground">{event.description}</div>
                  </div>
                </div>
              ))}
              {/* Recent */}
              {movement.recentEvents.map((event: any, i: number) => (
                <div key={`re-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: color }} />
                    {i < movement.recentEvents.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-3">
                    <div className="text-xs text-muted-foreground mb-0.5">
                      {new Date(event.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      {event.location && ` · ${event.location}`}
                    </div>
                    <div className="text-sm text-foreground">{event.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Chat */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Ask AI Analyst
            </h3>

            {/* Quick prompts */}
            {chatHistory.length === 0 && (
              <div className="space-y-2 mb-4">
                {[
                  `What is ${movement.name}'s strategy for 2027?`,
                  `Who are the key leaders and their roles?`,
                  `What are the main demands?`,
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setChatMessage(prompt);
                    }}
                    className="w-full text-left text-xs p-2.5 bg-background border border-border rounded-lg hover:border-primary/50 hover:text-primary transition-all text-muted-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Chat history */}
            {chatHistory.length > 0 && (
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto scrollbar-hide">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "text-white rounded-br-sm"
                        : "bg-background border border-border text-foreground rounded-bl-sm"
                    }`} style={msg.role === "user" ? { backgroundColor: color } : {}}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-background border border-border rounded-xl rounded-bl-sm px-3 py-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="Ask about this movement..."
                className="flex-1 min-h-[60px] resize-none text-xs"
              />
              <Button
                onClick={handleChat}
                disabled={!chatMessage.trim() || chatMutation.isPending}
                size="sm"
                className="self-end"
                style={{ backgroundColor: color }}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
