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

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "critical": return "bg-red-600 text-white";
    case "high": return "bg-orange-500 text-white";
    case "medium": return "bg-yellow-500 text-black";
    default: return "bg-green-500 text-white";
  }
};

const getRiskBorderColor = (risk: string) => {
  switch (risk) {
    case "critical": return "border-l-red-600";
    case "high": return "border-l-orange-500";
    case "medium": return "border-l-yellow-500";
    default: return "border-l-green-500";
  }
};

const COLORS = ["#22c55e", "#ef4444", "#6b7280"];

export default function NewsfeedAgent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"divisiveness" | "recent">("divisiveness");
  const [useRealData, setUseRealData] = useState(true);

  // Fetch real RSS data
  const { data: rssData, isLoading, error, refetch, isFetching } = trpc.kenya.rssFeed.getAll.useQuery(
    undefined,
    { 
      enabled: useRealData,
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
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
    
    // Sort
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

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Newspaper className="w-8 h-8" />
                <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Newsfeed Agent</h2>
              </div>
              <p className="text-muted-foreground font-mono">
                Real-time monitoring of Kenya news for divisive content and hate speech patterns.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Data Source Toggle */}
              <button
                onClick={() => setUseRealData(!useRealData)}
                className={`flex items-center gap-2 px-4 py-2 border-2 border-border font-mono text-sm uppercase transition-colors ${
                  useRealData ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}
              >
                {useRealData ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {useRealData ? "LIVE RSS" : "DEMO DATA"}
              </button>
              
              {/* Refresh Button */}
              <button 
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-border font-mono text-sm uppercase hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? "SYNCING..." : "REFRESH"}
              </button>
            </div>
          </div>
          
          {/* Last Updated */}
          {rssData?.lastUpdated && (
            <div className="mt-3 flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Clock className="w-3 h-3" />
              Last updated: {new Date(rssData.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-mono text-lg">Fetching live news from Kenya RSS feeds...</p>
              <p className="font-mono text-sm text-muted-foreground mt-2">
                Analyzing content for divisive patterns
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="border-2 border-red-500 bg-red-50 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="font-mono font-bold text-red-800">Failed to fetch RSS feeds</h3>
            </div>
            <p className="font-mono text-sm text-red-700">{error.message}</p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-red-600 text-white font-mono text-sm uppercase"
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
              <div className="brutalist-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span className="font-mono text-xs uppercase text-muted-foreground">Articles</span>
                </div>
                <div className="text-3xl font-bold font-mono">{stats.total}</div>
                <div className="text-xs font-mono text-muted-foreground">from {rssData.summary.topSources.length} sources</div>
              </div>
              
              <div className="brutalist-card p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-red-600" />
                  <span className="font-mono text-xs uppercase text-muted-foreground">Critical Risk</span>
                </div>
                <div className="text-3xl font-bold font-mono text-red-600">{stats.critical}</div>
                <div className="text-xs font-mono text-red-700">require attention</div>
              </div>
              
              <div className="brutalist-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  <span className="font-mono text-xs uppercase text-muted-foreground">Avg Divisiveness</span>
                </div>
                <div className="text-3xl font-bold font-mono">{stats.avgDivisiveness}%</div>
                <div className="text-xs font-mono text-muted-foreground">across all articles</div>
              </div>
              
              <div className="brutalist-card p-4 bg-orange-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="font-mono text-xs uppercase text-muted-foreground">High Risk</span>
                </div>
                <div className="text-3xl font-bold font-mono text-orange-600">{stats.highRisk}</div>
                <div className="text-xs font-mono text-orange-700">articles flagged</div>
              </div>
            </div>

            {/* Trending Topics */}
            {rssData.trendingTopics && rssData.trendingTopics.length > 0 && (
              <div className="brutalist-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="font-mono font-bold uppercase">Trending Divisive Topics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {rssData.trendingTopics.slice(0, 5).map((topic: TrendingTopic, idx: number) => (
                    <div key={topic.topic} className="border-2 border-border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-muted-foreground">#{idx + 1}</span>
                        <span className={`px-2 py-0.5 text-xs font-mono uppercase ${getRiskColor(topic.riskLevel)}`}>
                          {topic.riskLevel}
                        </span>
                      </div>
                      <div className="font-bold text-sm capitalize truncate">{topic.topic}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-1">
                        {topic.count} articles • {topic.avgDivisiveScore}% avg
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Distribution */}
            {rssData.summary.topSources && rssData.summary.topSources.length > 0 && (
              <div className="brutalist-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper className="w-5 h-5" />
                  <h3 className="font-mono font-bold uppercase">Source Distribution</h3>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rssData.summary.topSources}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1f2937" name="Articles" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-secondary border-2 border-border">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="font-mono text-sm uppercase">Filters:</span>
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border-2 border-border bg-background font-mono text-sm uppercase"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
                ))}
              </select>
              
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="px-3 py-1.5 border-2 border-border bg-background font-mono text-sm uppercase"
              >
                {riskLevels.map(risk => (
                  <option key={risk} value={risk}>{risk === "all" ? "All Levels" : risk}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 border-2 border-border bg-background font-mono text-sm uppercase"
              >
                <option value="divisiveness">Sort: Divisiveness</option>
                <option value="recent">Sort: Recent</option>
              </select>
              
              <div className="ml-auto font-mono text-sm">
                Showing {filteredArticles.length} of {stats.total} articles
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-4">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border">
                  <Newspaper className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-mono text-muted-foreground">No articles match your filters</p>
                </div>
              ) : (
                filteredArticles.map((article: AnalyzedNewsArticle) => (
                  <div 
                    key={article.id} 
                    className={`brutalist-card border-l-4 ${getRiskBorderColor(article.analysis.riskLevel)} hover:bg-secondary/50 transition-colors`}
                  >
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Main Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs font-mono font-bold uppercase ${getRiskColor(article.analysis.riskLevel)}`}>
                                {article.analysis.riskLevel} RISK
                              </span>
                              <span className="px-2 py-0.5 text-xs font-mono uppercase bg-gray-100 text-gray-700">
                                {article.category}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg leading-tight">{article.title}</h3>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mb-3">
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
                        
                        {/* Summary */}
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {article.summary}
                        </p>
                        
                        {/* Detected Terms */}
                        {article.analysis.detectedTerms.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-mono uppercase text-muted-foreground mb-1">
                              Divisive Terms Detected:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {article.analysis.detectedTerms.slice(0, 5).map((term, idx) => (
                                <span 
                                  key={idx}
                                  className={`px-2 py-0.5 text-xs font-mono ${
                                    term.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                    term.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}
                                  title={term.translation || term.category}
                                >
                                  "{term.term}"
                                </span>
                              ))}
                              {article.analysis.detectedTerms.length > 5 && (
                                <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-600">
                                  +{article.analysis.detectedTerms.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Targeted Groups */}
                        {article.analysis.targetedGroups.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-mono uppercase text-muted-foreground mb-1">
                              Targeted Groups:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {article.analysis.targetedGroups.map((group, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2 py-0.5 text-xs font-mono bg-purple-100 text-purple-800"
                                >
                                  {group}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Metrics Sidebar */}
                      <div className="lg:w-64 space-y-3 lg:border-l-2 lg:border-border lg:pl-4">
                        {/* Divisiveness Score */}
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="uppercase">Divisiveness</span>
                            <span className="font-bold">{article.analysis.divisiveScore}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 border border-border">
                            <div 
                              className={`h-full ${
                                article.analysis.divisiveScore >= 70 ? 'bg-red-500' :
                                article.analysis.divisiveScore >= 50 ? 'bg-orange-500' :
                                article.analysis.divisiveScore >= 25 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${article.analysis.divisiveScore}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Sentiment Breakdown */}
                        <div>
                          <div className="text-xs font-mono uppercase mb-1">Sentiment</div>
                          <div className="flex gap-1 text-xs font-mono">
                            <span className="px-1 bg-green-100 text-green-800">
                              +{article.analysis.sentimentBreakdown.positive}%
                            </span>
                            <span className="px-1 bg-red-100 text-red-800">
                              -{article.analysis.sentimentBreakdown.negative}%
                            </span>
                            <span className="px-1 bg-gray-100 text-gray-600">
                              ~{article.analysis.sentimentBreakdown.neutral}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Topics */}
                        {article.analysis.topics.length > 0 && (
                          <div>
                            <div className="text-xs font-mono uppercase mb-1">Topics</div>
                            <div className="flex flex-wrap gap-1">
                              {article.analysis.topics.slice(0, 3).map((topic, idx) => (
                                <span key={idx} className="px-1 text-xs font-mono bg-blue-100 text-blue-800 capitalize">
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
                            className="flex items-center gap-1 px-3 py-1.5 border-2 border-border text-xs font-mono uppercase hover:bg-secondary"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Read
                          </a>
                          <button className="flex items-center gap-1 px-3 py-1.5 border-2 border-border text-xs font-mono uppercase hover:bg-secondary">
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
