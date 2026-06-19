import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { getCountryConfig } from "@/lib/countries/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, Radio, ArrowLeft, Filter } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
  politics: "#f87171",
  business: "#34d399",
  general: "#60a5fa",
  enterprise: "#a78bfa",
};

export default function CountryNewsfeed() {
  const { code = "ke" } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const country = getCountryConfig(code);

  if (!country) {
    return <div className="p-6 text-muted-foreground">Country not found.</div>;
  }

  const categories = ["all", ...Array.from(new Set(country.rssFeeds.map(f => f.category)))];
  const filtered = activeCategory === "all"
    ? country.rssFeeds
    : country.rssFeeds.filter(f => f.category === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <button onClick={() => setLocation(`/country/${code}`)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="w-3 h-3" /> {country.name} Overview
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag}</span>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              {country.name} Newsfeed
            </h1>
            <p className="text-xs text-muted-foreground">Verified intelligence sources · {country.rssFeeds.length} active feeds</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
            <Radio className="w-3 h-3 animate-pulse" /> Live
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((feed, i) => {
            const color = CATEGORY_COLORS[feed.category] ?? "#94a3b8";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Newspaper className="w-5 h-5" style={{ color }} />
                  </div>
                  <Badge className="text-[10px] capitalize" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
                    {feed.category}
                  </Badge>
                </div>
                <h3 className="font-bold text-sm mb-1">{feed.name}</h3>
                <p className="text-[10px] text-muted-foreground mb-4 font-mono break-all">{feed.url}</p>
                <div className="flex gap-2">
                  <a
                    href={feed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
                  >
                    Open Feed <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs text-muted-foreground uppercase">{feed.language}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No feeds in this category yet.</p>
          </div>
        )}

        <div className="bg-card/50 border border-border/30 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">
            These RSS feeds are indexed by Viral Beat's intelligence pipeline. Content is verified before appearing in your dashboard.
          </p>
          <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setLocation(`/country/${code}`)}>
            ← Back to {country.name} Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
