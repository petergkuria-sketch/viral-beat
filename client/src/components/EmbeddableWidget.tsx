import { useState, useEffect } from "react";
import { TrendingUp, Zap, Activity, Eye, Heart, Share2 } from "lucide-react";

export interface WidgetConfig {
  topic: string;
  theme: "dark" | "light" | "neon" | "minimal";
  size: "small" | "medium" | "large";
  showScore: boolean;
  showTrend: boolean;
  showEngagement: boolean;
  showPlatforms: boolean;
  primaryColor: string;
  accentColor: string;
  borderRadius: number;
  showBranding: boolean;
}

interface WidgetData {
  viralityScore: number;
  trendChange: number;
  views: number;
  likes: number;
  shares: number;
  platforms: { name: string; percentage: number }[];
}

interface EmbeddableWidgetProps {
  config: WidgetConfig;
  data?: WidgetData;
  isPreview?: boolean;
}

const defaultData: WidgetData = {
  viralityScore: 87,
  trendChange: 12,
  views: 2500000,
  likes: 850000,
  shares: 120000,
  platforms: [
    { name: "TikTok", percentage: 50 },
    { name: "Twitter", percentage: 25 },
    { name: "YouTube", percentage: 15 },
    { name: "Other", percentage: 10 },
  ],
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

export function EmbeddableWidget({ config, data = defaultData, isPreview = false }: EmbeddableWidgetProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(data.viralityScore);
    }, 100);
    return () => clearTimeout(timer);
  }, [data.viralityScore]);

  // Theme styles
  const themes = {
    dark: {
      bg: "bg-gradient-to-br from-[#0a1628] to-[#0d1e36]",
      border: "border-[#1e3a5f]",
      text: "text-white",
      subtext: "text-gray-400",
      card: "bg-[#0d1e36]/80",
    },
    light: {
      bg: "bg-gradient-to-br from-white to-gray-50",
      border: "border-gray-200",
      text: "text-gray-900",
      subtext: "text-gray-500",
      card: "bg-white/80",
    },
    neon: {
      bg: "bg-gradient-to-br from-purple-900 to-black",
      border: "border-purple-500",
      text: "text-white",
      subtext: "text-purple-300",
      card: "bg-purple-900/50",
    },
    minimal: {
      bg: "bg-white",
      border: "border-gray-100",
      text: "text-gray-800",
      subtext: "text-gray-500",
      card: "bg-gray-50",
    },
  };

  const sizeStyles = {
    small: { width: "280px", padding: "p-3", fontSize: "text-xs", scoreSize: "text-3xl" },
    medium: { width: "360px", padding: "p-4", fontSize: "text-sm", scoreSize: "text-4xl" },
    large: { width: "480px", padding: "p-6", fontSize: "text-base", scoreSize: "text-5xl" },
  };

  const theme = themes[config.theme];
  const size = sizeStyles[config.size];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div
      className={`${theme.bg} ${theme.border} border-2 ${size.padding} ${theme.text} shadow-xl overflow-hidden transition-all duration-300`}
      style={{
        width: size.width,
        borderRadius: `${config.borderRadius}px`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: config.primaryColor }}
          >
            VB
          </div>
          <span className={`${size.fontSize} font-semibold truncate max-w-[180px]`}>
            {config.topic || "Trending Topic"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className={`${size.fontSize} ${theme.subtext}`}>Live</span>
        </div>
      </div>

      {/* Virality Score */}
      {config.showScore && (
        <div className="text-center mb-4">
          <div className="relative inline-block">
            <div
              className={`${size.scoreSize} font-bold ${getScoreColor(animatedScore)} transition-all duration-1000`}
              style={{ textShadow: config.theme === "neon" ? "0 0 20px currentColor" : "none" }}
            >
              {animatedScore.toFixed(1)}
            </div>
            <div className={`${size.fontSize} ${theme.subtext} mt-1`}>Virality Score</div>
          </div>
        </div>
      )}

      {/* Trend Change */}
      {config.showTrend && (
        <div
          className={`flex items-center justify-center gap-2 ${size.fontSize} mb-4 ${theme.card} rounded-lg py-2`}
        >
          <TrendingUp
            className={`w-4 h-4 ${data.trendChange >= 0 ? "text-green-400" : "text-red-400"}`}
          />
          <span className={data.trendChange >= 0 ? "text-green-400" : "text-red-400"}>
            {data.trendChange >= 0 ? "+" : ""}
            {data.trendChange}% today
          </span>
        </div>
      )}

      {/* Engagement Stats */}
      {config.showEngagement && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className={`${theme.card} rounded-lg p-2 text-center`}>
            <Eye className="w-4 h-4 mx-auto mb-1" style={{ color: config.accentColor }} />
            <div className={`${size.fontSize} font-semibold`}>{formatNumber(data.views)}</div>
            <div className={`text-xs ${theme.subtext}`}>Views</div>
          </div>
          <div className={`${theme.card} rounded-lg p-2 text-center`}>
            <Heart className="w-4 h-4 mx-auto mb-1" style={{ color: config.accentColor }} />
            <div className={`${size.fontSize} font-semibold`}>{formatNumber(data.likes)}</div>
            <div className={`text-xs ${theme.subtext}`}>Likes</div>
          </div>
          <div className={`${theme.card} rounded-lg p-2 text-center`}>
            <Share2 className="w-4 h-4 mx-auto mb-1" style={{ color: config.accentColor }} />
            <div className={`${size.fontSize} font-semibold`}>{formatNumber(data.shares)}</div>
            <div className={`text-xs ${theme.subtext}`}>Shares</div>
          </div>
        </div>
      )}

      {/* Platform Distribution */}
      {config.showPlatforms && (
        <div className={`${theme.card} rounded-lg p-3`}>
          <div className={`${size.fontSize} font-medium mb-2`}>Platform Distribution</div>
          <div className="space-y-2">
            {data.platforms.map((platform) => (
              <div key={platform.name} className="flex items-center gap-2">
                <span className={`${size.fontSize} ${theme.subtext} w-16`}>{platform.name}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${platform.percentage}%`,
                      backgroundColor: config.accentColor,
                    }}
                  />
                </div>
                <span className={`${size.fontSize} ${theme.subtext} w-10 text-right`}>
                  {platform.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branding */}
      {config.showBranding && (
        <div className={`mt-4 pt-3 border-t ${theme.border} flex items-center justify-center gap-2`}>
          <Zap className="w-3 h-3" style={{ color: config.primaryColor }} />
          <span className={`text-xs ${theme.subtext}`}>
            Powered by <span className="font-semibold" style={{ color: config.primaryColor }}>The Viral Beat</span>
          </span>
        </div>
      )}
    </div>
  );
}

export const defaultWidgetConfig: WidgetConfig = {
  topic: "AI Technology",
  theme: "dark",
  size: "medium",
  showScore: true,
  showTrend: true,
  showEngagement: true,
  showPlatforms: true,
  primaryColor: "#06b6d4",
  accentColor: "#22d3ee",
  borderRadius: 16,
  showBranding: true,
};
