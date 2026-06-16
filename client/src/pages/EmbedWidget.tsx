import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { EmbeddableWidget, WidgetConfig, defaultWidgetConfig } from "@/components/EmbeddableWidget";
import { trpc } from "@/lib/trpc";

export default function EmbedWidget() {
  const searchString = useSearch();
  const [config, setConfig] = useState<WidgetConfig>(defaultWidgetConfig);
  const [widgetData, setWidgetData] = useState({
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
  });

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    
    setConfig({
      topic: params.get("topic") || defaultWidgetConfig.topic,
      theme: (params.get("theme") as WidgetConfig["theme"]) || defaultWidgetConfig.theme,
      size: (params.get("size") as WidgetConfig["size"]) || defaultWidgetConfig.size,
      showScore: params.get("showScore") !== "false",
      showTrend: params.get("showTrend") !== "false",
      showEngagement: params.get("showEngagement") !== "false",
      showPlatforms: params.get("showPlatforms") !== "false",
      primaryColor: params.get("primaryColor") || defaultWidgetConfig.primaryColor,
      accentColor: params.get("accentColor") || defaultWidgetConfig.accentColor,
      borderRadius: parseInt(params.get("borderRadius") || "16"),
      showBranding: params.get("showBranding") !== "false",
    });
  }, [searchString]);

  // Fetch real data for the topic
  const { data: trendData } = trpc.trends.getWidgetData.useQuery(
    { topic: config.topic },
    { enabled: !!config.topic }
  );

  useEffect(() => {
    if (trendData) {
      setWidgetData({
        viralityScore: trendData.viralityScore,
        trendChange: trendData.trendChange,
        views: trendData.views,
        likes: trendData.likes,
        shares: trendData.shares,
        platforms: trendData.platforms,
      });
    }
  }, [trendData]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: config.theme === "light" || config.theme === "minimal" 
          ? "#f5f5f5" 
          : "#0a1628" 
      }}
    >
      <EmbeddableWidget config={config} data={widgetData} />
    </div>
  );
}
