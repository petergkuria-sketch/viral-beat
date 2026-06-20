import React, { useState, useMemo } from "react";

import {
  Newspaper,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Flame,
  Shield,
  ExternalLink,
  Clock,
  Users,
  BarChart3,
  Filter,
  RefreshCw,
  Eye,
  ThumbsDown,
  Zap,
  Wifi,
  WifiOff,
  Database
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { trpc } from "@/lib/trpc";

// Types matching backend
interface DivisiveAnalysis {
  divisiveScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedTerms: Array<{
    term: string;
    category: string;
    severity: string;
    translation?: string;
  }>;
  targetedGroups: string[];
  topics: string[];
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface AnalyzedNewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  url: string;
  source: string;
  sourceUrl: string;
  author: string | null;
  publishedAt: Date | string;
  category: string;
  imageUrl: string | null;
  analysis: DivisiveAnalysis;
}

interface TrendingTopic {
  topic: string;
  count: number;
  avgDivisiveScore: number;
  riskLevel: string;
}

const getRiskBadgeStyle = (risk: string) => {
  switch (risk) {
    case "critical": return "bg-red-500/10 border-red-500/20 text-red-300";
    case "high": return "bg-orange-500/10 border-orange-500/20 text-orange-300";
    case "medium": return "bg-amber-500/10 border-amber-500/20 text-amber-300";
    default: return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
  }
};

const getRiskBorderColor = (risk: string) => {
  switch (risk) {
    case "critical": return "border-l-red-500";
    case "high": return "border-l-orange-500";
    case "medium": return "border-l-amber-500";
    default: return "border-l-emerald-500";
  }
};

const COLORS = ["#22c55e", "#ef4444", "#6b7280"];

export default function NewsfeedAgent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"divisiveness" | "recent">("divisiveness");
  const [useRealData, setUseRealData] = useState(true);

  const { data: rssData, isLoading, error, refetch, isFetching } = trpc.kenya.rssFeed.getAll.useQuery(
    undefined,
    {
      enabled: useRealData,
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000
    }
  );

  const categories = ["all", "general", "politics", "business", "counties"];
  const riskLevels = ["all", "critical", "high", "medium", "low"];

  const filteredArticles = useMemo(() => {
    if (!rssData?.articles) return [];

    let articles = [...rssData.articles];

    if (selectedCategory !== "all") {
      articles = articles.filter(a => a.category === selectedCategory);
    }

    if (selectedRisk !== "all") {
      articles = articles.filter(a => a.analysis.riskLevel === selectedRisk);
    }

    switch (sortBy) {
      case "divisiveness":
        articles.sort((a, b) => b.analysis.divisiveScore - a.analysis.divisiveScore);
        break;
      case "recent":
        articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
    }

    return articles;
  }, [rssData?.articles, selectedCategory, selectedRisk, sortBy]);

  const stats = useMemo(() => {
    if (!rssData?.summary) {
      return { total: 0, critical: 0, avgDivisiveness: 0, highRisk: 0 };
    }
    return {
      total: rssData.summary.totalArticles,
      critical: rssData.summary.criticalCount,
      avgDivisiveness: rssData.summary.avgDivisiveScore,
      highRisk: rssData.summary.criticalCount + rssData.summary.highCount
    };
  }, [rssData?.summary]);

  const formatTimeAgo = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const chartTooltipStyle = {
    backgroundColor: '#0d1525',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#e2e8f0'
  };

  const selectClass = "px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm focus:outline-none";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-5 bg-card/40">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Newspaper className="w-6 h-6 text-slate-400" />
              <h1 className="text-xl font-black text-slate-100">Newsfeed Agent</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Real-time monitoring of Kenya news for divisive content and hate speech patterns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUseRealData(!useRealData)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors ${
                useRealData
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-white/5 border-white/10 text-slate-400"
              }`}
            >
              {useRealData ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {useRealData ? "Live RSS" : "Demo Data"}
            </button>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-slate-100 rounded-xl text-sm hover:bg-white/15 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </div>

        {rssData?.lastUpdated && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            Last updated: {new Date(rssData.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-slate-400" />
              <p className="text-lg text-slate-200">Fetching live news from Kenya RSS feeds...</p>
              <p className="text-sm text-slate-400 mt-2">
                Analyzing content for divisive patterns
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-card border border-red-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6" style={{ color: '#f87171' }} />
              <h3 className="font-bold text-red-300">Failed to fetch RSS feeds</h3>
            </div>
            <p className="text-sm text-red-400">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm hover:bg-red-500/20 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && rssData && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-slate-400" />
                  <span className="text-xs text-slate-400">Articles</span>
                </div>
                <div className="text-3xl font-bold text-slate-100">{stats.total}</div>
                <div className="text-xs text-slate-400">from {rssData.summary.topSources.length} sources</div>
              </div>

              <div className="bg-card border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5" style={{ color: '#f87171' }} />
                  <span className="text-xs text-slate-400">Critical Risk</span>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#f87171' }}>{stats.critical}</div>
                <div className="text-xs text-red-400">require attention</div>
              </div>

              <div className="bg-card border border-border/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <span className="text-xs text-slate-400">Avg Divisiveness</span>
                </div>
                <div className="text-3xl font-bold text-slate-100">{stats.avgDivisiveness}%</div>
                <div className="text-xs text-slate-400">across all articles</div>
              </div>

              <div className="bg-card border border-orange-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <span className="text-xs text-slate-400">High Risk</span>
                </div>
                <div className="text-3xl font-bold text-orange-400">{stats.highRisk}</div>
                <div className="text-xs text-orange-400">articles flagged</div>
              </div>
            </div>

            {/* Trending Topics */}
            {rssData.trendingTopics && rssData.trendingTopics.length > 0 && (
              <div className="bg-card border border-border/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-slate-400" />
                  <h3 className="font-bold text-slate-300">Trending Divisive Topics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {rssData.trendingTopics.slice(0, 5).map((topic: TrendingTopic, idx: number) => (
                    <div key={topic.topic} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">#{idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getRiskBadgeStyle(topic.riskLevel)}`}>
                          {topic.riskLevel}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-slate-200 capitalize truncate">{topic.topic}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {topic.count} articles • {topic.avgDivisiveScore}% avg
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Distribution */}
            {rssData.summary.topSources && rssData.summary.topSources.length > 0 && (
              <div className="bg-card border border-border/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper className="w-5 h-5 text-slate-400" />
                  <h3 className="font-bold text-slate-300">Source Distribution</h3>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rssData.summary.topSources}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="source" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="count" fill="#34d399" name="Articles" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Filters:</span>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={selectClass}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
                ))}
              </select>

              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className={selectClass}
              >
                {riskLevels.map(risk => (
                  <option key={risk} value={risk}>{risk === "all" ? "All Levels" : risk}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={selectClass}
              >
                <option value="divisiveness">Sort: Divisiveness</option>
                <option value="recent">Sort: Recent</option>
              </select>

              <div className="ml-auto text-sm text-slate-400">
                Showing {filteredArticles.length} of {stats.total} articles
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-4">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl">
                  <Newspaper className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                  <p className="text-slate-400">No articles match your filters</p>
                </div>
              ) : (
                filteredArticles.map((article: AnalyzedNewsArticle) => (
                  <div
                    key={article.id}
                    className={`bg-card border border-border/50 rounded-2xl p-5 border-l-4 ${getRiskBorderColor(article.analysis.riskLevel)} hover:bg-white/5 transition-colors`}
                  >
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Main Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs border ${getRiskBadgeStyle(article.analysis.riskLevel)}`}>
                                {article.analysis.riskLevel} Risk
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-slate-400">
                                {article.category}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-100 leading-tight">{article.title}</h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Newspaper className="w-3 h-3" />
                            {article.source}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(article.publishedAt)}
                          </span>
                          {article.author && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {article.author}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {article.summary}
                        </p>

                        {article.analysis.detectedTerms.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-slate-400 mb-1">
                              Divisive Terms Detected:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {article.analysis.detectedTerms.slice(0, 5).map((term, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded-full text-xs border ${
                                    term.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                                    term.severity === 'high' ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' :
                                    'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                  }`}
                                  title={term.translation || term.category}
                                >
                                  "{term.term}"
                                </span>
                              ))}
                              {article.analysis.detectedTerms.length > 5 && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-slate-400">
                                  +{article.analysis.detectedTerms.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {article.analysis.targetedGroups.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-slate-400 mb-1">
                              Targeted Groups:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {article.analysis.targetedGroups.map((group, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                                >
                                  {group}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Metrics Sidebar */}
                      <div className="lg:w-64 space-y-3 lg:border-l lg:border-border/50 lg:pl-4">
                        {/* Divisiveness Score */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Divisiveness</span>
                            <span className="font-bold text-slate-200">{article.analysis.divisiveScore}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                article.analysis.divisiveScore >= 70 ? 'bg-red-500' :
                                article.analysis.divisiveScore >= 50 ? 'bg-orange-500' :
                                article.analysis.divisiveScore >= 25 ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                              style={{ width: `${article.analysis.divisiveScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Sentiment Breakdown */}
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Sentiment</div>
                          <div className="flex gap-1 text-xs">
                            <span className="px-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                              +{article.analysis.sentimentBreakdown.positive}%
                            </span>
                            <span className="px-1 rounded bg-red-500/10 border border-red-500/20 text-red-300">
                              -{article.analysis.sentimentBreakdown.negative}%
                            </span>
                            <span className="px-1 rounded bg-white/5 border border-white/10 text-slate-400">
                              ~{article.analysis.sentimentBreakdown.neutral}%
                            </span>
                          </div>
                        </div>

                        {/* Topics */}
                        {article.analysis.topics.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Topics</div>
                            <div className="flex flex-wrap gap-1">
                              {article.analysis.topics.slice(0, 3).map((topic, idx) => (
                                <span key={idx} className="px-1 text-xs rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 capitalize">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Read
                          </a>
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition-colors">
                            <Shield className="w-3 h-3" />
                            Flag
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
