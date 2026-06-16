import React, { useState, useMemo } from "react";

import {
  breakingNewsArticles,
  newsSources,
  newsAlerts,
  getSourceById,
  getBreakingNews,
  getArticlesByCategory,
  getArticlesBySentiment,
  getSourcesByRegion,
  getMostEngagedArticles,
  getAverageSentimentByRegion,
  getCategoryDistribution,
  getActiveAlerts,
  getCriticalAlerts,
  BreakingNewsArticle,
  NewsSource,
  NewsAlert
} from "@/lib/kenya/breaking-news-data";
import {
  Globe,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Search,
  Filter,
  Newspaper,
  Radio,
  Building,
  Wifi,
  Shield,
  BarChart3,
  MapPin,
  Users,
  Zap,
  Bell,
  ChevronRight,
  Share2,
  MessageSquare,
  BookOpen
} from "lucide-react";

const getSentimentColor = (score: number): string => {
  if (score >= 65) return "text-green-500";
  if (score >= 45) return "text-yellow-500";
  if (score >= 30) return "text-orange-500";
  return "text-red-500";
};

const getSentimentBg = (score: number): string => {
  if (score >= 65) return "bg-green-500";
  if (score >= 45) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
};

const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'critical': return 'bg-red-600 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-black';
    default: return 'bg-gray-400 text-white';
  }
};

const getCredibilityColor = (score: number): string => {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-yellow-600";
  return "text-orange-600";
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getSourceTypeIcon = (type: NewsSource['type']) => {
  switch (type) {
    case 'Wire Service': return Wifi;
    case 'Broadcaster': return Radio;
    case 'Newspaper': return Newspaper;
    case 'Digital': return Globe;
    default: return Building;
  }
};

const getRegionFlag = (region: string): string => {
  switch (region) {
    case 'Europe': return '🇪🇺';
    case 'Americas': return '🇺🇸';
    case 'Asia': return '🇨🇳';
    case 'Middle East': return '🇶🇦';
    case 'Africa': return '🌍';
    case 'Oceania': return '🇦🇺';
    default: return '🌐';
  }
};

interface ArticleCardProps {
  article: BreakingNewsArticle;
  source: NewsSource | undefined;
  onSelect: (article: BreakingNewsArticle) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, source, onSelect }) => {
  const TypeIcon = source ? getSourceTypeIcon(source.type) : Globe;
  
  return (
    <div 
      className={`brutalist-card bg-background cursor-pointer hover:bg-secondary/30 transition-colors ${
        article.isBreaking ? 'border-l-4 border-l-red-500' : ''
      }`}
      onClick={() => onSelect(article)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-secondary flex items-center justify-center">
            <TypeIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold">{source?.shortName || 'Unknown'}</div>
            <div className="text-[10px] text-muted-foreground">{source?.country}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {article.isBreaking && (
            <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-mono animate-pulse">
              BREAKING
            </span>
          )}
          <span className={`px-2 py-0.5 text-[10px] font-mono ${getUrgencyColor(article.urgency)}`}>
            {article.urgency.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Headline */}
      <h3 className="font-bold text-sm mb-2 line-clamp-2">{article.headline}</h3>

      {/* Summary */}
      <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{article.summary}</p>

      {/* Category & Keywords */}
      <div className="flex flex-wrap gap-1 mb-3">
        <span className="px-2 py-0.5 bg-foreground text-background text-[10px] font-mono">
          {article.category}
        </span>
        {article.keywords.slice(0, 2).map(keyword => (
          <span key={keyword} className="px-2 py-0.5 bg-secondary text-[10px] font-mono">
            {keyword}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {article.readTime}m
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${getSentimentColor(article.sentimentScore)}`}>
            {article.sentimentScore}%
          </span>
          {article.sentimentScore >= 50 ? (
            <TrendingUp className={`w-3 h-3 ${getSentimentColor(article.sentimentScore)}`} />
          ) : (
            <TrendingDown className={`w-3 h-3 ${getSentimentColor(article.sentimentScore)}`} />
          )}
        </div>
      </div>

      {/* Engagement */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Share2 className="w-3 h-3" />
          {formatNumber(article.engagement.shares)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {formatNumber(article.engagement.comments)}
        </span>
      </div>
    </div>
  );
};

export default function BreakingNewsAgent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSentiment, setFilterSentiment] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<BreakingNewsArticle | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'breaking' | 'sources' | 'analytics'>('feed');

  const filteredArticles = useMemo(() => {
    return breakingNewsArticles.filter(article => {
      const source = getSourceById(article.sourceId);
      const matchesSearch = article.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRegion = filterRegion === "all" || source?.region === filterRegion;
      const matchesCategory = filterCategory === "all" || article.category === filterCategory;
      const matchesSentiment = filterSentiment === "all" || article.sentiment === filterSentiment;
      return matchesSearch && matchesRegion && matchesCategory && matchesSentiment;
    });
  }, [searchTerm, filterRegion, filterCategory, filterSentiment]);

  const breakingNews = getBreakingNews();
  const criticalAlerts = getCriticalAlerts();
  const activeAlerts = getActiveAlerts();
  const mostEngaged = getMostEngagedArticles(5);
  const regionSentiment = getAverageSentimentByRegion();
  const categoryDist = getCategoryDistribution();

  const avgSentiment = Math.round(
    breakingNewsArticles.reduce((acc, a) => acc + a.sentimentScore, 0) / breakingNewsArticles.length
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-600 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Breaking News Agent</h2>
          </div>
          <p className="text-muted-foreground font-mono">
            Global news coverage of Kenya from {newsSources.length} international outlets across 6 regions.
          </p>
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <div className="bg-red-600 text-white p-4 border-2 border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <span className="font-mono font-bold uppercase">Critical Alerts</span>
            </div>
            <div className="space-y-2">
              {criticalAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between text-sm">
                  <span>{alert.headline}</span>
                  <span className="text-xs opacity-75">{formatDate(alert.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Total Articles</div>
            <div className="text-2xl font-bold">{breakingNewsArticles.length}</div>
            <div className="text-xs text-muted-foreground">Last 72h</div>
          </div>
          <div className="brutalist-card bg-red-50">
            <div className="text-xs font-mono uppercase text-red-800">Breaking</div>
            <div className="text-2xl font-bold text-red-700">{breakingNews.length}</div>
            <div className="text-xs text-red-600">Live Stories</div>
          </div>
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Sources</div>
            <div className="text-2xl font-bold">{newsSources.length}</div>
            <div className="text-xs text-muted-foreground">Global Outlets</div>
          </div>
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Avg Sentiment</div>
            <div className={`text-2xl font-bold ${getSentimentColor(avgSentiment)}`}>{avgSentiment}%</div>
            <div className="text-xs text-muted-foreground">Global Coverage</div>
          </div>
          <div className="brutalist-card bg-orange-50">
            <div className="text-xs font-mono uppercase text-orange-800">Active Alerts</div>
            <div className="text-2xl font-bold text-orange-700">{activeAlerts.length}</div>
            <div className="text-xs text-orange-600">Last 24h</div>
          </div>
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Regions</div>
            <div className="text-2xl font-bold">6</div>
            <div className="text-xs text-muted-foreground">Continents</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'feed', label: 'News Feed', icon: Newspaper },
            { id: 'breaking', label: `Breaking (${breakingNews.length})`, icon: Zap },
            { id: 'sources', label: 'Sources', icon: Globe },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-sm border-2 border-border whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-foreground text-background' 
                  : 'bg-background hover:bg-secondary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search headlines, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
                />
              </div>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
              >
                <option value="all">All Regions</option>
                <option value="Europe">Europe</option>
                <option value="Americas">Americas</option>
                <option value="Asia">Asia</option>
                <option value="Middle East">Middle East</option>
                <option value="Africa">Africa</option>
                <option value="Oceania">Oceania</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
              >
                <option value="all">All Categories</option>
                <option value="Politics">Politics</option>
                <option value="Economy">Economy</option>
                <option value="Security">Security</option>
                <option value="Diplomacy">Diplomacy</option>
                <option value="Human Rights">Human Rights</option>
                <option value="Environment">Environment</option>
              </select>
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                className="px-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
              >
                <option value="all">All Sentiment</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  source={getSourceById(article.sourceId)}
                  onSelect={setSelectedArticle}
                />
              ))}
            </div>
          </>
        )}

        {/* Breaking Tab */}
        {activeTab === 'breaking' && (
          <div className="space-y-6">
            {/* Live Alerts */}
            <div className="brutalist-card bg-red-50 border-red-500">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2 text-red-800">
                <Bell className="w-5 h-5" />
                Live News Alerts
              </h3>
              <div className="space-y-3">
                {activeAlerts.map(alert => {
                  const source = getSourceById(alert.sourceId);
                  return (
                    <div 
                      key={alert.id} 
                      className={`p-3 bg-white border-l-4 ${
                        alert.priority === 'critical' ? 'border-l-red-600' :
                        alert.priority === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-mono uppercase ${
                          alert.type === 'breaking' ? 'bg-red-600 text-white' :
                          alert.type === 'developing' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {alert.type}
                        </span>
                        <span className="text-xs text-muted-foreground">{source?.shortName}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{formatDate(alert.timestamp)}</span>
                      </div>
                      <p className="text-sm font-medium">{alert.headline}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breaking Stories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {breakingNews.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  source={getSourceById(article.sourceId)}
                  onSelect={setSelectedArticle}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            {/* Sources by Region */}
            {['Europe', 'Americas', 'Asia', 'Middle East', 'Africa', 'Oceania'].map(region => {
              const regionSources = getSourcesByRegion(region as NewsSource['region']);
              if (regionSources.length === 0) return null;
              
              return (
                <div key={region} className="brutalist-card bg-background">
                  <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                    <span className="text-xl">{getRegionFlag(region)}</span>
                    {region}
                    <span className="text-xs font-normal text-muted-foreground">({regionSources.length} sources)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regionSources.map(source => {
                      const TypeIcon = getSourceTypeIcon(source.type);
                      const articleCount = breakingNewsArticles.filter(a => a.sourceId === source.id).length;
                      
                      return (
                        <div key={source.id} className="p-4 bg-secondary/30 border border-border">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-background border border-border flex items-center justify-center">
                              <TypeIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono font-bold text-sm">{source.name}</div>
                              <div className="text-xs text-muted-foreground">{source.country}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-background text-[10px] font-mono">
                                  {source.type}
                                </span>
                                <span className={`text-xs font-bold ${getCredibilityColor(source.credibilityScore)}`}>
                                  {source.credibilityScore}% credibility
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                <span>{articleCount} articles</span>
                                <span className="capitalize">{source.bias}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Regional Sentiment */}
            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Sentiment by Region
              </h3>
              <div className="space-y-4">
                {regionSentiment.filter(r => r.articleCount > 0).map(item => (
                  <div key={item.region} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-mono flex items-center gap-2">
                        <span>{getRegionFlag(item.region)}</span>
                        {item.region}
                        <span className="text-xs text-muted-foreground">({item.articleCount} articles)</span>
                      </span>
                      <span className={getSentimentColor(item.avgSentiment)}>
                        {item.avgSentiment}%
                      </span>
                    </div>
                    <div className="h-3 bg-secondary">
                      <div 
                        className={`h-full ${getSentimentBg(item.avgSentiment)}`}
                        style={{ width: `${item.avgSentiment}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <div className="brutalist-card bg-background">
                <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Coverage by Category
                </h3>
                <div className="space-y-3">
                  {categoryDist.map(item => (
                    <div key={item.category} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-mono truncate">{item.category}</div>
                      <div className="flex-1 h-6 bg-secondary">
                        <div 
                          className="h-full bg-foreground flex items-center justify-end pr-2"
                          style={{ width: `${item.percentage}%` }}
                        >
                          <span className="text-[10px] text-background font-bold">{item.count}</span>
                        </div>
                      </div>
                      <div className="w-10 text-xs text-right">{item.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Engaged */}
              <div className="brutalist-card bg-background">
                <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Most Engaged Stories
                </h3>
                <div className="space-y-3">
                  {mostEngaged.map((article, i) => {
                    const source = getSourceById(article.sourceId);
                    return (
                      <div 
                        key={article.id}
                        className="p-3 bg-secondary/30 cursor-pointer hover:bg-secondary/50"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 bg-foreground text-background flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="text-xs font-mono">{source?.shortName}</span>
                        </div>
                        <p className="text-xs line-clamp-2 mb-2">{article.headline}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Share2 className="w-3 h-3" />
                            {formatNumber(article.engagement.shares)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {formatNumber(article.engagement.comments)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Source Credibility */}
            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Source Credibility Ranking
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[...newsSources]
                  .sort((a, b) => b.credibilityScore - a.credibilityScore)
                  .slice(0, 12)
                  .map((source, i) => (
                    <div key={source.id} className="p-3 bg-secondary/30 text-center">
                      <div className="text-xs font-mono font-bold mb-1">{source.shortName}</div>
                      <div className={`text-lg font-bold ${getCredibilityColor(source.credibilityScore)}`}>
                        {source.credibilityScore}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">{source.type}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Article Detail Modal */}
        {selectedArticle && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <div 
              className="brutalist-card bg-background max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const source = getSourceById(selectedArticle.sourceId);
                const TypeIcon = source ? getSourceTypeIcon(source.type) : Globe;
                
                return (
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-secondary flex items-center justify-center">
                          <TypeIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-mono font-bold">{source?.name}</div>
                          <div className="text-sm text-muted-foreground">{source?.country} · {source?.type}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {selectedArticle.isBreaking && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-mono">
                            BREAKING
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-mono ${getUrgencyColor(selectedArticle.urgency)}`}>
                          {selectedArticle.urgency.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h2 className="text-xl font-bold mb-4">{selectedArticle.headline}</h2>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(selectedArticle.publishedAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {selectedArticle.readTime} min read
                      </span>
                      <span className="px-2 py-0.5 bg-foreground text-background text-xs font-mono">
                        {selectedArticle.category}
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="text-sm mb-6">{selectedArticle.summary}</p>

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedArticle.keywords.map(keyword => (
                        <span key={keyword} className="px-2 py-1 bg-secondary text-xs font-mono">
                          {keyword}
                        </span>
                      ))}
                    </div>

                    {/* Related Politicians */}
                    {selectedArticle.relatedPoliticians.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-mono uppercase text-muted-foreground mb-2">Related Politicians</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedArticle.relatedPoliticians.map(politician => (
                            <span key={politician} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-mono">
                              {politician}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sentiment Analysis */}
                    <div className="p-4 bg-secondary/30 mb-6">
                      <h4 className="text-xs font-mono uppercase text-muted-foreground mb-3">Sentiment Analysis</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Sentiment Score</span>
                            <span className={`font-bold ${getSentimentColor(selectedArticle.sentimentScore)}`}>
                              {selectedArticle.sentimentScore}%
                            </span>
                          </div>
                          <div className="h-3 bg-background">
                            <div 
                              className={`h-full ${getSentimentBg(selectedArticle.sentimentScore)}`}
                              style={{ width: `${selectedArticle.sentimentScore}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-center px-4 border-l border-border">
                          <div className="text-lg font-bold capitalize">{selectedArticle.sentiment}</div>
                          <div className="text-xs text-muted-foreground">Tone</div>
                        </div>
                      </div>
                    </div>

                    {/* Engagement */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-secondary/30 text-center">
                        <Share2 className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xl font-bold">{formatNumber(selectedArticle.engagement.shares)}</div>
                        <div className="text-xs text-muted-foreground">Shares</div>
                      </div>
                      <div className="p-4 bg-secondary/30 text-center">
                        <MessageSquare className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xl font-bold">{formatNumber(selectedArticle.engagement.comments)}</div>
                        <div className="text-xs text-muted-foreground">Comments</div>
                      </div>
                    </div>

                    {/* Source Credibility */}
                    <div className="p-4 bg-green-50 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-mono uppercase text-green-800 mb-1">Source Credibility</h4>
                          <div className="text-sm text-green-700">
                            {source?.name} is rated as a {source?.credibilityScore}% credible source
                          </div>
                        </div>
                        <div className={`text-3xl font-bold ${getCredibilityColor(source?.credibilityScore || 0)}`}>
                          {source?.credibilityScore}%
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedArticle(null)}
                        className="flex-1 py-3 border-2 border-border font-mono text-sm hover:bg-secondary transition-colors"
                      >
                        Close
                      </button>
                      <a
                        href={selectedArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-foreground text-background font-mono text-sm hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Read Full Article
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
