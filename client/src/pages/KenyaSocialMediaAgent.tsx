import React, { useState, useMemo } from "react";

import {
  tweets,
  twitterUsers,
  trendingHashtags,
  getUserById,
  getFlaggedTweets,
  getHighDivisiveTweets,
  getHateSpeechTweets,
  getMostEngagedTweets,
  getMostDivisiveTweets,
  getAverageSentimentByCoalition,
  getTotalEngagement,
  Tweet,
  TwitterUser,
  TrendingHashtag
} from "@/lib/kenya/social-media-data";
import {
  MessageCircle,
  Heart,
  Repeat2,
  Quote,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Hash,
  Users,
  Shield,
  Flame,
  CheckCircle,
  XCircle,
  BarChart3,
  Clock,
  ExternalLink
} from "lucide-react";

const getSentimentColor = (score: number): string => {
  if (score >= 60) return "text-green-500";
  if (score >= 45) return "text-yellow-500";
  if (score >= 30) return "text-orange-500";
  return "text-red-500";
};

const getSentimentBg = (score: number): string => {
  if (score >= 60) return "bg-green-500";
  if (score >= 45) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
};

const getDivisiveColor = (score: number): string => {
  if (score >= 70) return "text-red-600";
  if (score >= 50) return "text-orange-500";
  if (score >= 30) return "text-yellow-500";
  return "text-green-500";
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

interface TweetCardProps {
  tweet: Tweet;
  user: TwitterUser | undefined;
  onSelect: (tweet: Tweet) => void;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet, user, onSelect }) => {
  return (
    <div 
      className={`brutalist-card bg-background cursor-pointer hover:bg-secondary/30 transition-colors ${
        tweet.flagged ? 'border-red-500 border-l-4' : ''
      }`}
      onClick={() => onSelect(tweet)}
    >
      {/* User Info */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          user?.coalition === 'Kenya Kwanza' ? 'bg-yellow-100' :
          user?.coalition === 'Azimio' ? 'bg-orange-100' : 'bg-gray-100'
        }`}>
          <span className="text-lg font-bold">
            {user?.displayName.charAt(0) || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold truncate">{user?.displayName || 'Unknown'}</span>
            {user?.verified && (
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
            {tweet.flagged && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-mono flex-shrink-0">
                FLAGGED
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>@{user?.username || 'unknown'}</span>
            <span>·</span>
            <span>{formatDate(tweet.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Tweet Text */}
      <p className="text-sm mb-3 whitespace-pre-wrap">{tweet.text}</p>

      {/* Hashtags */}
      {tweet.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tweet.hashtags.map(tag => (
            <span key={tag} className="text-xs text-blue-500 font-mono">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement Metrics */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5" />
          {formatNumber(tweet.replies)}
        </span>
        <span className="flex items-center gap-1">
          <Repeat2 className="w-3.5 h-3.5" />
          {formatNumber(tweet.retweets)}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-3.5 h-3.5" />
          {formatNumber(tweet.likes)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          {formatNumber(tweet.views)}
        </span>
      </div>

      {/* Analysis Scores */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Sentiment</div>
          <div className={`text-sm font-bold ${getSentimentColor(tweet.sentimentScore)}`}>
            {tweet.sentimentScore}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Divisive</div>
          <div className={`text-sm font-bold ${getDivisiveColor(tweet.divisiveScore)}`}>
            {tweet.divisiveScore}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Hate Speech</div>
          <div className={`text-sm font-bold ${tweet.hateSpeechScore >= 20 ? 'text-red-600' : 'text-green-500'}`}>
            {tweet.hateSpeechScore}%
          </div>
        </div>
      </div>

      {/* Flag Reason */}
      {tweet.flagged && tweet.flagReason && (
        <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {tweet.flagReason}
        </div>
      )}
    </div>
  );
};

export default function SocialMediaAgent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCoalition, setFilterCoalition] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'flagged' | 'trending' | 'analytics'>('feed');

  const filteredTweets = useMemo(() => {
    return tweets.filter(tweet => {
      const user = getUserById(tweet.userId);
      const matchesSearch = tweet.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tweet.hashtags.some(h => h.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCoalition = filterCoalition === "all" || user?.coalition === filterCoalition;
      const matchesType = filterType === "all" ||
        (filterType === "flagged" && tweet.flagged) ||
        (filterType === "divisive" && tweet.divisiveScore >= 70) ||
        (filterType === "hate" && tweet.hateSpeechScore >= 20);
      return matchesSearch && matchesCoalition && matchesType;
    });
  }, [searchTerm, filterCoalition, filterType]);

  const flaggedTweets = getFlaggedTweets();
  const highDivisiveTweets = getHighDivisiveTweets(70);
  const hateSpeechTweets = getHateSpeechTweets(20);
  const mostEngaged = getMostEngagedTweets(5);
  const mostDivisive = getMostDivisiveTweets(5);
  const coalitionSentiment = getAverageSentimentByCoalition();
  const totalEngagement = getTotalEngagement();

  const avgSentiment = Math.round(
    tweets.reduce((acc, t) => acc + t.sentimentScore, 0) / tweets.length
  );

  const avgDivisiveness = Math.round(
    tweets.reduce((acc, t) => acc + t.divisiveScore, 0) / tweets.length
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b-2 border-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <span className="text-white text-2xl font-bold">𝕏</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-mono font-bold uppercase">Social Media Agent</h2>
          </div>
          <p className="text-muted-foreground font-mono">
            Monitor political discourse on X (Twitter). Track sentiment, detect hate speech, and identify divisive content.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Total Posts</div>
            <div className="text-2xl font-bold">{tweets.length}</div>
            <div className="text-xs text-muted-foreground">Monitored</div>
          </div>
          <div className="brutalist-card bg-red-50">
            <div className="text-xs font-mono uppercase text-red-800">Flagged</div>
            <div className="text-2xl font-bold text-red-700">{flaggedTweets.length}</div>
            <div className="text-xs text-red-600">Requires Review</div>
          </div>
          <div className="brutalist-card bg-orange-50">
            <div className="text-xs font-mono uppercase text-orange-800">High Divisive</div>
            <div className="text-2xl font-bold text-orange-700">{highDivisiveTweets.length}</div>
            <div className="text-xs text-orange-600">&gt;70% Score</div>
          </div>
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Avg Sentiment</div>
            <div className={`text-2xl font-bold ${getSentimentColor(avgSentiment)}`}>{avgSentiment}%</div>
            <div className="text-xs text-muted-foreground">Overall</div>
          </div>
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Avg Divisive</div>
            <div className={`text-2xl font-bold ${getDivisiveColor(avgDivisiveness)}`}>{avgDivisiveness}%</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
          <div className="brutalist-card bg-background">
            <div className="text-xs font-mono uppercase text-muted-foreground">Engagement</div>
            <div className="text-2xl font-bold">{formatNumber(totalEngagement)}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'feed', label: 'Live Feed', icon: MessageCircle },
            { id: 'flagged', label: `Flagged (${flaggedTweets.length})`, icon: AlertTriangle },
            { id: 'trending', label: 'Trending', icon: TrendingUp },
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
                  placeholder="Search posts, users, or hashtags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
                />
              </div>
              <select
                value={filterCoalition}
                onChange={(e) => setFilterCoalition(e.target.value)}
                className="px-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
              >
                <option value="all">All Coalitions</option>
                <option value="Kenya Kwanza">Kenya Kwanza</option>
                <option value="Azimio">Azimio</option>
                <option value="Independent">Independent</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border-2 border-border bg-background font-mono text-sm focus:outline-none focus:border-foreground"
              >
                <option value="all">All Posts</option>
                <option value="flagged">Flagged Only</option>
                <option value="divisive">High Divisive</option>
                <option value="hate">Hate Speech</option>
              </select>
            </div>

            {/* Tweet Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTweets.map(tweet => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  user={getUserById(tweet.userId)}
                  onSelect={setSelectedTweet}
                />
              ))}
            </div>
          </>
        )}

        {/* Flagged Tab */}
        {activeTab === 'flagged' && (
          <div className="space-y-6">
            <div className="brutalist-card bg-red-50 border-red-500">
              <h3 className="font-mono font-bold uppercase mb-2 flex items-center gap-2 text-red-800">
                <Shield className="w-5 h-5" />
                Content Moderation Queue
              </h3>
              <p className="text-sm text-red-700">
                These posts have been flagged for potential hate speech, divisive content, or incitement.
                Review each post and take appropriate action.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flaggedTweets.map(tweet => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  user={getUserById(tweet.userId)}
                  onSelect={setSelectedTweet}
                />
              ))}
            </div>
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trending Hashtags */}
              <div className="brutalist-card bg-background">
                <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Trending Hashtags
                </h3>
                <div className="space-y-3">
                  {trendingHashtags.slice(0, 8).map((tag, i) => (
                    <div key={tag.tag} className="flex items-center gap-3 p-2 bg-secondary/30">
                      <span className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-mono text-sm font-bold">#{tag.tag}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(tag.tweetCount)} posts
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-mono ${
                          tag.sentiment === 'positive' ? 'text-green-500' :
                          tag.sentiment === 'negative' ? 'text-red-500' :
                          tag.sentiment === 'mixed' ? 'text-orange-500' : 'text-gray-500'
                        }`}>
                          {tag.sentiment}
                        </div>
                        <div className={`text-xs ${getDivisiveColor(tag.divisiveScore)}`}>
                          {tag.divisiveScore}% divisive
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Engaged Posts */}
              <div className="brutalist-card bg-background">
                <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  Most Engaged Posts
                </h3>
                <div className="space-y-3">
                  {mostEngaged.map((tweet, i) => {
                    const user = getUserById(tweet.userId);
                    return (
                      <div 
                        key={tweet.id} 
                        className="p-3 bg-secondary/30 cursor-pointer hover:bg-secondary/50"
                        onClick={() => setSelectedTweet(tweet)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 bg-[#dc2626] text-white flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="font-mono text-sm font-bold">@{user?.username}</span>
                          {tweet.flagged && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {tweet.text}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            {formatNumber(tweet.likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat2 className="w-3 h-3 text-green-500" />
                            {formatNumber(tweet.retweets)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatNumber(tweet.views)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Most Divisive Posts */}
            <div className="brutalist-card bg-red-50">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Most Divisive Content
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mostDivisive.map(tweet => (
                  <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                    user={getUserById(tweet.userId)}
                    onSelect={setSelectedTweet}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Coalition Sentiment Comparison */}
            <div className="brutalist-card bg-background">
              <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Coalition Sentiment Analysis
              </h3>
              <div className="space-y-4">
                {coalitionSentiment.map(item => (
                  <div key={item.coalition} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`font-mono font-bold ${
                        item.coalition === 'Kenya Kwanza' ? 'text-yellow-700' :
                        item.coalition === 'Azimio' ? 'text-orange-700' : 'text-gray-700'
                      }`}>
                        {item.coalition}
                      </span>
                      <span className={getSentimentColor(item.avgSentiment)}>
                        {item.avgSentiment}%
                      </span>
                    </div>
                    <div className="h-4 bg-secondary">
                      <div 
                        className={`h-full ${getSentimentBg(item.avgSentiment)}`}
                        style={{ width: `${item.avgSentiment}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Leaderboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="brutalist-card bg-background">
                <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Political Accounts
                </h3>
                <div className="space-y-3">
                  {twitterUsers.slice(0, 8).map((user, i) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 bg-secondary/30">
                      <span className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        user.coalition === 'Kenya Kwanza' ? 'bg-yellow-100' :
                        user.coalition === 'Azimio' ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        <span className="text-sm font-bold">{user.displayName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm font-bold truncate flex items-center gap-1">
                          {user.displayName}
                          {user.verified && <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                        </div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold">{formatNumber(user.followers)}</div>
                        <div className="text-[10px] text-muted-foreground">followers</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Type Breakdown */}
              <div className="brutalist-card bg-background">
                <h3 className="font-mono font-bold uppercase mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Content Analysis
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {tweets.filter(t => t.sentiment === 'positive').length}
                      </div>
                      <div className="text-xs font-mono text-green-600">Positive Posts</div>
                    </div>
                    <div className="p-4 bg-red-50 text-center">
                      <div className="text-2xl font-bold text-red-700">
                        {tweets.filter(t => t.sentiment === 'negative').length}
                      </div>
                      <div className="text-xs font-mono text-red-600">Negative Posts</div>
                    </div>
                    <div className="p-4 bg-gray-50 text-center">
                      <div className="text-2xl font-bold text-gray-700">
                        {tweets.filter(t => t.sentiment === 'neutral').length}
                      </div>
                      <div className="text-xs font-mono text-gray-600">Neutral Posts</div>
                    </div>
                    <div className="p-4 bg-orange-50 text-center">
                      <div className="text-2xl font-bold text-orange-700">
                        {tweets.filter(t => t.hasMedia).length}
                      </div>
                      <div className="text-xs font-mono text-orange-600">With Media</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-mono uppercase text-muted-foreground mb-3">Risk Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Low Risk (&lt;30%)</span>
                        <span className="font-bold text-green-600">
                          {tweets.filter(t => t.divisiveScore < 30).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Medium Risk (30-70%)</span>
                        <span className="font-bold text-yellow-600">
                          {tweets.filter(t => t.divisiveScore >= 30 && t.divisiveScore < 70).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>High Risk (&gt;70%)</span>
                        <span className="font-bold text-red-600">
                          {tweets.filter(t => t.divisiveScore >= 70).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tweet Detail Modal */}
        {selectedTweet && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTweet(null)}
          >
            <div 
              className="brutalist-card bg-background max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const user = getUserById(selectedTweet.userId);
                return (
                  <>
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        user?.coalition === 'Kenya Kwanza' ? 'bg-yellow-100' :
                        user?.coalition === 'Azimio' ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        <span className="text-xl font-bold">{user?.displayName.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{user?.displayName}</span>
                          {user?.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="text-sm text-muted-foreground">@{user?.username}</div>
                        <div className="text-xs text-muted-foreground">{user?.role}</div>
                      </div>
                    </div>

                    {/* Tweet Content */}
                    <p className="text-base mb-4 whitespace-pre-wrap">{selectedTweet.text}</p>

                    {/* Hashtags */}
                    {selectedTweet.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedTweet.hashtags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(selectedTweet.createdAt).toLocaleString()}
                    </div>

                    {/* Engagement */}
                    <div className="grid grid-cols-4 gap-4 py-4 border-y border-border mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatNumber(selectedTweet.replies)}</div>
                        <div className="text-xs text-muted-foreground">Replies</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatNumber(selectedTweet.retweets)}</div>
                        <div className="text-xs text-muted-foreground">Retweets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatNumber(selectedTweet.likes)}</div>
                        <div className="text-xs text-muted-foreground">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatNumber(selectedTweet.views)}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                    </div>

                    {/* Analysis Scores */}
                    <div className="space-y-3 mb-4">
                      <h4 className="font-mono text-sm font-bold uppercase">Content Analysis</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Sentiment Score</span>
                          <span className={`font-bold ${getSentimentColor(selectedTweet.sentimentScore)}`}>
                            {selectedTweet.sentimentScore}%
                          </span>
                        </div>
                        <div className="h-2 bg-secondary">
                          <div 
                            className={`h-full ${getSentimentBg(selectedTweet.sentimentScore)}`}
                            style={{ width: `${selectedTweet.sentimentScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Divisiveness Score</span>
                          <span className={`font-bold ${getDivisiveColor(selectedTweet.divisiveScore)}`}>
                            {selectedTweet.divisiveScore}%
                          </span>
                        </div>
                        <div className="h-2 bg-secondary">
                          <div 
                            className={`h-full ${
                              selectedTweet.divisiveScore >= 70 ? 'bg-red-500' :
                              selectedTweet.divisiveScore >= 50 ? 'bg-orange-500' :
                              selectedTweet.divisiveScore >= 30 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${selectedTweet.divisiveScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Hate Speech Score</span>
                          <span className={`font-bold ${selectedTweet.hateSpeechScore >= 20 ? 'text-red-600' : 'text-green-500'}`}>
                            {selectedTweet.hateSpeechScore}%
                          </span>
                        </div>
                        <div className="h-2 bg-secondary">
                          <div 
                            className={`h-full ${selectedTweet.hateSpeechScore >= 20 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${selectedTweet.hateSpeechScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Flag Status */}
                    {selectedTweet.flagged && (
                      <div className="p-3 bg-red-50 border-2 border-red-500 mb-4">
                        <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                          <AlertTriangle className="w-5 h-5" />
                          Content Flagged
                        </div>
                        <p className="text-sm text-red-600">{selectedTweet.flagReason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedTweet(null)}
                        className="flex-1 py-3 border-2 border-border font-mono text-sm hover:bg-secondary transition-colors"
                      >
                        Close
                      </button>
                      <button className="flex-1 py-3 bg-[#dc2626] text-white font-mono text-sm hover:bg-[#b91c1c] transition-colors flex items-center justify-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View on X
                      </button>
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
