import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { getCountryConfig } from "@shared/countryConfig";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Newspaper, ExternalLink, Radio, ArrowLeft, Filter,
  Clock, RefreshCw, AlertCircle, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const CATEGORY_COLORS: Record<string, string> = {
  politics: "#f87171",
  business: "#34d399",
  general: "#60a5fa",
  enterprise: "#a78bfa",
};

type Category = "all" | "politics" | "business" | "general" | "enterprise";

export default function CountryNewsfeed() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<Category>("all");
  const country = getCountryConfig(code);

  const { data, isLoading, isError, refetch, isFetching } = trpc.country.newsfeed.useQuery(
    { code: code.toLowerCase(), category, limit: 60 },
    { staleTime: 1000 * 60 * 10, refetchOnWindowFocus: false }
  );

  if (!country) {
    return <div className="p-6 text-muted-foreground">Country not found.</div>;
  }

  const CATEGORIES: Category[] = ["all", "politics", "business", "general", "enterprise"];
  const availableCategories = CATEGORIES.filter(cat =>
    cat === "all" || country.rssFeeds.some(f => f.category === cat)
  );

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
              <Newspaper className="w-5 h-5 text-primary" />
              {country.name} Newsfeed
            </h1>
            <p className="text-xs text-muted-foreground">
              {country.rssFeeds.length} sources · {data?.articles.length ?? "—"} articles
              {data?.cached && <span className="ml-1 text-muted-foreground/60">(cached)</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
              <Radio className="w-3 h-3 animate-pulse" /> Live
            </div>
            <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching} className="h-8 w-8 p-0">
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${
                category === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching {country.rssFeeds.length} sources…</p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm">Failed to fetch feeds.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}

        {/* Articles grid */}
        {data && data.articles.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.articles.map((article, i) => {
              const color = CATEGORY_COLORS[article.category] ?? "#94a3b8";
              const timeAgo = article.publishedAt
                ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
                : null;
              return (
                <motion.a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.6) }}
                  className="group bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all flex flex-col gap-3"
                >
                  {/* Source + category */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
                      {article.source}
                    </span>
                    <Badge
                      className="text-[9px] capitalize shrink-0"
                      style={{ background: `${color}15`, color, borderColor: `${color}30` }}
                    >
                      {article.category}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-3">
                    {article.title}
                  </h3>

                  {/* Description */}
                  {article.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {article.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    {timeAgo ? (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Clock className="w-3 h-3" /> {timeAgo}
                      </span>
                    ) : <span />}
                    <span className="flex items-center gap-1 text-[10px] text-primary/60 group-hover:text-primary transition-colors font-semibold">
                      Read <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {data && data.articles.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No articles found</p>
            <p className="text-xs mt-1">RSS feeds may be temporarily unavailable.</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
