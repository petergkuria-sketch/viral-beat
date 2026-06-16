import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Users, TrendingUp, TrendingDown, Minus, Activity,
  Calendar, ChevronRight, Zap, AlertCircle, CheckCircle,
  Clock, SlidersHorizontal, ArrowUpDown, Search, X,
  BarChart2, ExternalLink, Newspaper, Globe, Twitter,
  MapPin, Flag, Target, History, ArrowRight, Loader2,
  Image, Play, Film,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Config maps ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  political_movement: "Political",
  civic_movement: "Civic",
  protest_movement: "Protest",
  social_movement: "Social",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: any }> = {
  active:  { label: "Active",   color: "text-green-400 bg-green-400/10 border-green-400/20",  dot: "bg-green-400",  icon: CheckCircle },
  evolved: { label: "Evolved",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20",    dot: "bg-blue-400",   icon: Activity },
  dormant: { label: "Dormant",  color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", dot: "bg-yellow-400", icon: Clock },
};

const MOMENTUM_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  rising:   { icon: TrendingUp,   color: "text-green-400",  label: "Rising" },
  stable:   { icon: Minus,        color: "text-yellow-400", label: "Stable" },
  declining:{ icon: TrendingDown, color: "text-red-400",    label: "Declining" },
};

const SORT_OPTIONS = [
  { value: "sentiment_desc", label: "Sentiment: High → Low" },
  { value: "sentiment_asc",  label: "Sentiment: Low → High" },
  { value: "name_asc",       label: "Name: A → Z" },
  { value: "name_desc",      label: "Name: Z → A" },
  { value: "momentum",       label: "Momentum: Rising first" },
  { value: "upcoming",       label: "Upcoming events first" },
];

const MODAL_TABS = ["Overview", "News", "Key Figures", "Milestones", "Media"] as const;
type ModalTab = typeof MODAL_TABS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sentimentColor(score: number) {
  if (score >= 65) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SentimentRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = sentimentColor(score);
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color, fontSize: size < 50 ? 10 : 12 }}>{score}</span>
    </div>
  );
}

function MovementCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="w-14 h-14 bg-muted rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-4/5 bg-muted rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-muted rounded-full" />
        <div className="h-6 w-16 bg-muted rounded-full" />
      </div>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/25">
      {label}
      <button onClick={onRemove} className="hover:text-primary/60 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Movement Detail Modal ────────────────────────────────────────────────────

function MovementModal({
  movementId,
  movementColor,
  onClose,
}: {
  movementId: string;
  movementColor: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ModalTab>("Overview");

  const { data: movement, isLoading: loadingMovement } = trpc.kenya.movements.getMovement.useQuery(
    { id: movementId },
    { enabled: !!movementId }
  );

  const { data: news, isLoading: loadingNews } = trpc.kenya.movements.getMovementNews.useQuery(
    { id: movementId },
    { enabled: !!movementId && activeTab === "News" }
  );

  const { data: sentiment, isLoading: loadingSentiment } = trpc.kenya.movements.getMovementSentiment.useQuery(
    { id: movementId },
    { enabled: !!movementId }
  );

  const { data: media, isLoading: loadingMedia } = trpc.kenya.movements.getMovementMedia.useQuery(
    { id: movementId },
    { enabled: !!movementId && activeTab === "Media" }
  );

  const [lightboxItem, setLightboxItem] = useState<{ url: string; caption: string; isVideo: boolean } | null>(null);

  if (loadingMovement) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!movement) return null;

  const statusCfg = STATUS_CONFIG[movement.status] || STATUS_CONFIG.active;
  const StatusIcon = statusCfg.icon;
  const momentumCfg = MOMENTUM_CONFIG[(movement as any).momentum ?? "stable"] || MOMENTUM_CONFIG.stable;
  const MomentumIcon = momentumCfg.icon;
  const score = (movement as any).sentimentScore ?? sentiment?.score ?? 65;

  // Combine recentEvents and upcomingEvents into a chronological timeline
  const allEvents = [
    ...((movement as any).recentEvents || []).map((e: any) => ({ ...e, kind: "past" })),
    ...((movement as any).upcomingEvents || []).map((e: any) => ({ ...e, kind: "upcoming" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Modal header */}
      <div
        className="relative p-6 rounded-t-lg overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${movementColor}18 0%, transparent 60%)` }}
      >
        <div
          className="absolute top-0 left-0 w-1 h-full rounded-tl-lg"
          style={{ backgroundColor: movementColor }}
        />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusCfg.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                {TYPE_LABELS[movement.type] ?? movement.type}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${momentumCfg.color}`}>
                <MomentumIcon className="w-3 h-3" />
                {momentumCfg.label}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground leading-tight">{movement.name}</h2>
            {(movement as any).swahili && (
              <p className="text-sm text-muted-foreground italic mt-0.5">{(movement as any).swahili}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {(movement as any).founded && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Founded {(movement as any).founded}
                </span>
              )}
              {(movement as any).website && (
                <a href={(movement as any).website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Globe className="w-3 h-3" />
                  Website
                </a>
              )}
              {(movement as any).twitter && (
                <a href={`https://twitter.com/${(movement as any).twitter}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-sky-400 hover:underline">
                  <Twitter className="w-3 h-3" />
                  @{(movement as any).twitter}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <SentimentRing score={score} size={72} />
            <span className="text-xs text-muted-foreground">Sentiment</span>
          </div>
        </div>

        {/* Sentiment bar */}
        {sentiment && !loadingSentiment && (
          <div className="mt-4 p-3 bg-card/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">{sentiment.summary}</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-muted-foreground">
                Public Support: <span className="text-foreground font-medium">{sentiment.publicSupport}%</span>
              </span>
              <span className="text-muted-foreground">
                Media Attention: <span className="text-foreground font-medium">{sentiment.mediaAttention}%</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-6 bg-card/30">
        {MODAL_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="ml-auto flex items-center py-2">
          <Link href={`/kenya/movements/${movementId}`} onClick={onClose}>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary">
              Full Page <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── Overview Tab ── */}
        {activeTab === "Overview" && (
          <>
            {/* Mission */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Mission
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{movement.mission}</p>
            </div>

            {/* Key Demands */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Key Demands
              </h3>
              <ul className="space-y-1.5">
                {(movement as any).keyDemands?.map((demand: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${movementColor}25`, color: movementColor }}
                    >
                      {i + 1}
                    </span>
                    {demand}
                  </li>
                ))}
              </ul>
            </div>

            {/* Upcoming Events */}
            {(movement as any).upcomingEvents?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">Upcoming Actions</span>
                </h3>
                <div className="space-y-2">
                  {(movement as any).upcomingEvents.map((event: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-400">{formatDate(event.date)}</p>
                        <p className="text-sm text-foreground mt-0.5">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked party */}
            {(movement as any).linkedParty && (
              <div className="p-3 bg-card border border-border rounded-lg">
                <p className="text-xs text-muted-foreground mb-0.5">Linked Political Party</p>
                <p className="text-sm font-medium text-foreground">{(movement as any).linkedParty}</p>
              </div>
            )}
          </>
        )}

        {/* ── News Tab ── */}
        {activeTab === "News" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" /> Recent Coverage
              </h3>
              {loadingNews && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {loadingNews ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 w-3/4 bg-muted rounded mb-1.5" />
                    <div className="h-3 w-full bg-muted rounded mb-1" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : !news || news.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Newspaper className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No recent news articles found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Check back later for live coverage</p>
              </div>
            ) : (
              <div className="space-y-4">
                {news.map((article: any, i: number) => (
                  <a
                    key={i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </p>
                        {article.summary && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {article.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground/60">{article.source}</span>
                          <span className="text-xs text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground/60">{timeAgo(article.publishedAt)}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Key Figures Tab ── */}
        {activeTab === "Key Figures" && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Leadership & Key Figures
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(movement as any).leaders?.map((leader: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl"
                  style={{ borderTopColor: i === 0 ? movementColor : undefined, borderTopWidth: i === 0 ? "2px" : undefined }}
                >
                  {/* Avatar placeholder */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: `${movementColor}20`, color: movementColor }}
                  >
                    {leader.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">{leader.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{leader.role}</p>
                    {leader.party && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground border border-border">
                        {leader.party}
                      </span>
                    )}
                  </div>
                  {i === 0 && (
                    <Badge variant="outline" className="text-xs flex-shrink-0" style={{ color: movementColor, borderColor: `${movementColor}40` }}>
                      Primary
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Media Tab ── */}
        {activeTab === "Media" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" /> Media Gallery
              </h3>
              {loadingMedia && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            {loadingMedia ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !media || media.total === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Film className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No media available yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Images and videos will appear here as they are added</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Videos section */}
                {media.videos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Play className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Videos ({media.videos.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {media.videos.map((video: any, i: number) => {
                        const videoId = video.url.includes("youtube.com/watch?v=")
                          ? video.url.split("v=")[1]?.split("&")[0]
                          : video.url.includes("youtu.be/")
                          ? video.url.split("youtu.be/")[1]?.split("?")[0]
                          : null;
                        return (
                          <div
                            key={i}
                            className="group relative rounded-xl overflow-hidden border border-border bg-card cursor-pointer"
                            onClick={() => setLightboxItem({ url: video.url, caption: video.caption, isVideo: true })}
                          >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-muted overflow-hidden">
                              {video.thumbnail ? (
                                <img
                                  src={video.thumbnail}
                                  alt={video.caption}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <Play className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                              )}
                              {/* Play overlay */}
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                </div>
                              </div>
                              {/* Duration badge */}
                              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                                Video
                              </div>
                            </div>
                            {/* Caption */}
                            <div className="p-3">
                              <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{video.caption}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs text-muted-foreground/60">{video.source}</span>
                                {video.date && (
                                  <>
                                    <span className="text-xs text-muted-foreground/40">·</span>
                                    <span className="text-xs text-muted-foreground/60">{formatDate(video.date)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Images section */}
                {media.images.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Photos ({media.images.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {media.images.map((img: any, i: number) => (
                        <div
                          key={i}
                          className="group relative rounded-xl overflow-hidden border border-border bg-card cursor-pointer"
                          onClick={() => setLightboxItem({ url: img.url, caption: img.caption, isVideo: false })}
                        >
                          <div className="relative aspect-video bg-muted overflow-hidden">
                            <img
                              src={img.url}
                              alt={img.caption}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const el = e.target as HTMLImageElement;
                                el.style.display = "none";
                                el.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>`;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <ExternalLink className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs text-foreground line-clamp-2 leading-snug">{img.caption}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground/60">{img.source}</span>
                              {img.date && (
                                <>
                                  <span className="text-xs text-muted-foreground/40">·</span>
                                  <span className="text-xs text-muted-foreground/60">{formatDate(img.date)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lightbox */}
            {lightboxItem && (
              <div
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                onClick={() => setLightboxItem(null)}
              >
                <button
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  onClick={() => setLightboxItem(null)}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
                  {lightboxItem.isVideo ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                      {lightboxItem.url.includes("youtube.com") || lightboxItem.url.includes("youtu.be") ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${lightboxItem.url.includes("v=") ? lightboxItem.url.split("v=")[1]?.split("&")[0] : lightboxItem.url.split("youtu.be/")[1]?.split("?")[0]}?autoplay=1`}
                          className="w-full h-full"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          title={lightboxItem.caption}
                        />
                      ) : (
                        <video src={lightboxItem.url} controls autoPlay className="w-full h-full" />
                      )}
                    </div>
                  ) : (
                    <img src={lightboxItem.url} alt={lightboxItem.caption} className="w-full max-h-[70vh] object-contain rounded-xl" />
                  )}
                  {lightboxItem.caption && (
                    <p className="text-center text-sm text-white/70 mt-3">{lightboxItem.caption}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Milestones Tab ── */}
        {activeTab === "Milestones" && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Historical Timeline
            </h3>
            {allEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No recorded milestones yet</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4 pl-10">
                  {allEvents.map((event: any, i: number) => {
                    const isUpcoming = event.kind === "upcoming";
                    return (
                      <div key={i} className="relative">
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[26px] w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isUpcoming
                              ? "border-amber-400 bg-amber-400/20"
                              : "border-border bg-card"
                          }`}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isUpcoming ? "#f59e0b" : movementColor }}
                          />
                        </div>

                        <div className={`p-3 rounded-lg border ${
                          isUpcoming
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-card border-border"
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${isUpcoming ? "text-amber-400" : "text-muted-foreground"}`}>
                              {formatDate(event.date)}
                            </span>
                            {isUpcoming && (
                              <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 py-0 h-4">
                                Upcoming
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground leading-snug">{event.description}</p>
                          {event.location && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground/60">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KenyaMovements() {
  const { data: movements, isLoading } = trpc.kenya.movements.listMovements.useQuery();

  // Filter state
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<string[]>([]);
  const [typeFilter, setType]       = useState<string[]>([]);
  const [minSentiment, setMinSent]  = useState<number | null>(null);
  const [maxSentiment, setMaxSent]  = useState<number | null>(null);
  const [sortBy, setSortBy]         = useState("sentiment_desc");

  // Modal state
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#00C853");

  // Derived filtered + sorted list
  const filtered = useMemo(() => {
    if (!movements) return [];
    let list = [...movements];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.mission.toLowerCase().includes(q) ||
          (m.swahili && m.swahili.toLowerCase().includes(q))
      );
    }

    if (statusFilter.length > 0) list = list.filter((m) => statusFilter.includes(m.status));
    if (typeFilter.length > 0)   list = list.filter((m) => typeFilter.includes(m.type));
    if (minSentiment !== null)   list = list.filter((m) => (m.sentimentScore ?? 0) >= minSentiment);
    if (maxSentiment !== null)   list = list.filter((m) => (m.sentimentScore ?? 0) <= maxSentiment);

    switch (sortBy) {
      case "sentiment_desc": list.sort((a, b) => (b.sentimentScore ?? 0) - (a.sentimentScore ?? 0)); break;
      case "sentiment_asc":  list.sort((a, b) => (a.sentimentScore ?? 0) - (b.sentimentScore ?? 0)); break;
      case "name_asc":       list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name_desc":      list.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "momentum":
        list.sort((a, b) => {
          const order = { rising: 0, stable: 1, declining: 2 };
          return (order[a.momentum as keyof typeof order] ?? 1) - (order[b.momentum as keyof typeof order] ?? 1);
        });
        break;
      case "upcoming":
        list.sort((a, b) => (b.upcomingEventsCount ?? 0) - (a.upcomingEventsCount ?? 0));
        break;
    }
    return list;
  }, [movements, search, statusFilter, typeFilter, minSentiment, maxSentiment, sortBy]);

  const activeFilterCount =
    statusFilter.length + typeFilter.length +
    (minSentiment !== null ? 1 : 0) +
    (maxSentiment !== null ? 1 : 0);

  const clearAll = () => {
    setSearch(""); setStatus([]); setType([]); setMinSent(null); setMaxSent(null); setSortBy("sentiment_desc");
  };

  const toggleStatus = (s: string) =>
    setStatus((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleType = (t: string) =>
    setType((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const currentSort = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort";

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/kenya" className="hover:text-primary transition-colors">Kenya Intelligence</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Civic Movements</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Civic Movements Tracker</h1>
            <p className="text-muted-foreground max-w-xl text-sm">
              Real-time intelligence on Kenya's major civic and political movements ahead of 2027.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live Monitoring</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search movements…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-card border-border text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 bg-card border-border">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-3 bg-card border-border" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuLabel className="text-xs text-muted-foreground px-0 pb-1">Status</DropdownMenuLabel>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => toggleStatus(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    statusFilter.includes(key) ? cfg.color : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40"
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                </button>
              ))}
            </div>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuLabel className="text-xs text-muted-foreground px-0 pb-1">Type</DropdownMenuLabel>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => toggleType(key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    typeFilter.includes(key) ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuLabel className="text-xs text-muted-foreground px-0 pb-1">Sentiment Score</DropdownMenuLabel>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {[
                { label: "High (65+)", min: 65, max: null },
                { label: "Mid (40–64)", min: 40, max: 64 },
                { label: "Low (< 40)", min: null, max: 39 },
              ].map((band) => {
                const active = minSentiment === band.min && maxSentiment === band.max;
                return (
                  <button key={band.label}
                    onClick={() => { if (active) { setMinSent(null); setMaxSent(null); } else { setMinSent(band.min); setMaxSent(band.max); } }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      active ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40"
                    }`}>
                    {band.label}
                  </button>
                );
              })}
            </div>
            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator className="my-2" />
                <button onClick={clearAll} className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors text-left">
                  Clear all filters
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 bg-card border-border">
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">{currentSort}</span>
              <span className="sm:hidden">Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-card border-border">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => setSortBy(opt.value)}
                className={`text-sm cursor-pointer ${sortBy === opt.value ? "text-primary font-medium" : ""}`}>
                {sortBy === opt.value && <span className="mr-1.5">✓</span>}
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-xs text-muted-foreground ml-auto">
          {isLoading ? "Loading…" : `${filtered.length} of ${movements?.length ?? 0} movements`}
        </span>
      </div>

      {/* ── Active filter pills ──────────────────────────────────────────────── */}
      {(statusFilter.length > 0 || typeFilter.length > 0 || minSentiment !== null || maxSentiment !== null) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Active:</span>
          {statusFilter.map((s) => <FilterPill key={s} label={STATUS_CONFIG[s]?.label ?? s} onRemove={() => toggleStatus(s)} />)}
          {typeFilter.map((t) => <FilterPill key={t} label={TYPE_LABELS[t] ?? t} onRemove={() => toggleType(t)} />)}
          {(minSentiment !== null || maxSentiment !== null) && (
            <FilterPill
              label={
                minSentiment !== null && maxSentiment !== null ? `Sentiment ${minSentiment}–${maxSentiment}`
                : minSentiment !== null ? `Sentiment ≥ ${minSentiment}`
                : `Sentiment ≤ ${maxSentiment}`
              }
              onRemove={() => { setMinSent(null); setMaxSent(null); }}
            />
          )}
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline">
            Clear all
          </button>
        </div>
      )}

      {/* ── Movements Grid ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <MovementCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No movements match your filters</p>
          <p className="text-sm text-muted-foreground/60 mt-1 mb-4">Try adjusting the filters or search query</p>
          <Button variant="outline" size="sm" onClick={clearAll}>Clear all filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((movement) => {
            const statusCfg = STATUS_CONFIG[movement.status] || STATUS_CONFIG.active;
            const StatusIcon = statusCfg.icon;
            const momentumCfg = MOMENTUM_CONFIG[movement.momentum ?? "stable"] || MOMENTUM_CONFIG.stable;
            const MomentumIcon = momentumCfg.icon;
            const score = movement.sentimentScore ?? 0;

            return (
              <div
                key={movement.id}
                onClick={() => { setSelectedId(movement.id); setSelectedColor(movement.color); }}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer card-hover group transition-all"
                style={{ borderLeftColor: movement.color, borderLeftWidth: "3px" }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
                      {movement.name}
                    </h3>
                    {movement.swahili && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">{movement.swahili}</p>
                    )}
                  </div>
                  <SentimentRing score={score} />
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                    <StatusIcon className="w-3 h-3" />{statusCfg.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                    {TYPE_LABELS[movement.type] ?? movement.type}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${momentumCfg.color}`}>
                    <MomentumIcon className="w-3 h-3" />{momentumCfg.label}
                  </span>
                </div>

                {/* Sentiment bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Public Sentiment</span>
                    <span style={{ color: sentimentColor(score) }} className="font-semibold">{score}/100</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score}%`, backgroundColor: sentimentColor(score) }} />
                  </div>
                </div>

                {/* Mission snippet */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{movement.mission}</p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{movement.leaderCount} leaders</span>
                  </div>
                  {(movement.upcomingEventsCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{movement.upcomingEventsCount} upcoming</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{movement.keyDemandsCount} demands</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Events Banner */}
      <div className="mt-8 bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-amber-400 text-sm">Upcoming Actions</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground w-24 flex-shrink-0">Jun 25–27, 2026</span>
            <span className="text-foreground">Linda Mwananchi — Nationwide 3-day demonstrations planned</span>
            <Badge variant="outline" className="ml-auto text-amber-400 border-amber-400/30 flex-shrink-0">High Alert</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground w-24 flex-shrink-0">Ongoing</span>
            <span className="text-foreground">Niko Kadi — Voter registration drives across 47 counties</span>
            <Badge variant="outline" className="ml-auto text-blue-400 border-blue-400/30 flex-shrink-0">Active</Badge>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-border">
          <DialogHeader className="sr-only">
            <DialogTitle>Movement Details</DialogTitle>
          </DialogHeader>
          {selectedId && (
            <MovementModal
              movementId={selectedId}
              movementColor={selectedColor}
              onClose={() => setSelectedId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
