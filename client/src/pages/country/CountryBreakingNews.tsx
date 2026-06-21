import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getCountryConfig } from "@shared/countryConfig";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Radio, Zap, Clock, ExternalLink,
  RefreshCw, AlertTriangle, Loader2, Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const URGENCY: Record<string, { label: string; color: string; dot: string }> = {
  breaking: { label: "Breaking",  color: "#ef4444", dot: "bg-red-400 animate-ping" },
  urgent:   { label: "Urgent",    color: "#f97316", dot: "bg-orange-400 animate-pulse" },
  latest:   { label: "Latest",    color: "#fbbf24", dot: "bg-yellow-400" },
  update:   { label: "Update",    color: "#60a5fa", dot: "bg-blue-400" },
};

function urgencyForIndex(i: number): keyof typeof URGENCY {
  if (i === 0) return "breaking";
  if (i <= 2) return "urgent";
  if (i <= 8) return "latest";
  return "update";
}

export default function CountryBreakingNews() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const country = getCountryConfig(code);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const { data, isLoading, isError, refetch, isFetching } = trpc.country.newsfeed.useQuery(
    { code: code.toLowerCase(), category: "all", limit: 30 },
    { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false }
  );

  // Auto-refresh every 5 min
  useEffect(() => {
    const id = setInterval(() => {
      refetch();
      setLastRefresh(Date.now());
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [refetch]);

  if (!country) return <div className="p-6 text-muted-foreground">Country not found.</div>;

  const articles = data?.articles ?? [];
  const top = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <button
          onClick={() => setLocation(`/country/${code}`)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> {country.name} Overview
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
              {country.name} Breaking News
            </h1>
            <p className="text-xs text-muted-foreground">
              {articles.length} stories · refreshed {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block" />
              Live
            </div>
            <Button size="sm" variant="ghost" onClick={() => { refetch(); setLastRefresh(Date.now()); }} disabled={isFetching} className="h-8 w-8 p-0">
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">

        {isLoading && (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Scanning feeds…</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center py-20 gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-muted-foreground">Failed to load news.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}

        {/* Hero story */}
        {top && (
          <motion.a
            href={top.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group block bg-gradient-to-br from-red-500/10 to-card border border-red-500/30 rounded-2xl p-6 hover:border-red-400/50 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
              </span>
              <span className="text-xs font-black text-red-400 uppercase tracking-widest">Breaking</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{top.source}</span>
            </div>
            <h2 className="text-lg font-black leading-snug text-foreground group-hover:text-primary transition-colors mb-2">
              {top.title}
            </h2>
            {top.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{top.description}</p>
            )}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              {top.publishedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(top.publishedAt), { addSuffix: true })}
                </span>
              )}
              <span className="flex items-center gap-1 text-red-400 font-semibold group-hover:text-red-300">
                Read full story <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </motion.a>
        )}

        {/* News ticker list */}
        {rest.length > 0 && (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-black">Latest Updates</span>
            </div>
            <AnimatePresence>
              {rest.map((article, i) => {
                const urgency = URGENCY[urgencyForIndex(i + 1)];
                const timeAgo = article.publishedAt
                  ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
                  : null;
                return (
                  <motion.a
                    key={article.id}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group flex items-start gap-4 px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5 w-20">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgency.dot.split(" ")[0]}`} />
                      <span className="text-[10px] font-semibold" style={{ color: urgency.color }}>
                        {urgency.label}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{article.source}</span>
                        {timeAgo && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{timeAgo}</span>}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {data && articles.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No breaking news right now.</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()}>Check again</Button>
          </div>
        )}

      </div>
    </div>
  );
}
