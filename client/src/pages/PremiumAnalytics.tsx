import { useState } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, TrendingUp, Users, BarChart3, Sparkles, Lock, Crown, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip);

export default function PremiumAnalytics() {
  const [, setLocation] = useLocation();
  const [topic, setTopic] = useState("");
  const [timeframe, setTimeframe] = useState<"7days" | "30days">("7days");
  
  const { data: accessData, isLoading: checkingAccess } = trpc.premiumAnalytics.checkAccess.useQuery();
  const hasAccess = accessData?.hasAccess || false;

  const { data: forecast, isLoading: forecastLoading, refetch: refetchForecast } = trpc.premiumAnalytics.getForecast.useQuery(
    { topic, timeframe },
    { enabled: false }
  );

  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights } = trpc.premiumAnalytics.getAdvancedInsights.useQuery(
    { topic },
    { enabled: false }
  );

  const handleAnalyze = () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic to analyze");
      return;
    }

    if (!hasAccess) {
      toast.error("Premium Analytics access required");
      return;
    }

    refetchForecast();
    refetchInsights();
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white">
        <BackToDashboard />
        
        <div className="container py-8">
          <Breadcrumb />
          
          <div className="flex items-center justify-center min-h-[70vh]">
            <Card className="bg-[#0d1e36] border-[#1e3a5f] max-w-2xl w-full">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <CardTitle className="text-3xl">Premium Analytics</CardTitle>
                <CardDescription className="text-lg">
                  Unlock advanced insights, competitor analysis, and AI-powered forecasting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Competitor Analysis</h3>
                      <p className="text-sm text-gray-400">Compare up to 5 creators side-by-side with detailed metrics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Advanced Insights</h3>
                      <p className="text-sm text-gray-400">Deep dive into engagement patterns, sentiment, and audience behavior</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Predictive Forecasting</h3>
                      <p className="text-sm text-gray-400">AI-powered predictions for 7-day and 30-day trends</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#050b1a] border border-[#1e3a5f] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Premium Analytics</p>
                      <p className="text-2xl font-bold">100 VBT</p>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      30 Days Access
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button
                  onClick={() => setLocation("/marketplace")}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Purchase in Marketplace
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                  className="border-[#1e3a5f] hover:bg-[#1e3a5f]"
                >
                  Back to Dashboard
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <BackToDashboard />
      
      <div className="container py-8 space-y-8">
        <div>
          <Breadcrumb />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                <Crown className="w-8 h-8 text-purple-400" />
                Premium Analytics
              </h1>
              <p className="text-gray-400 mt-2">
                Advanced insights, competitor analysis, and AI-powered forecasting
              </p>
            </div>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-4 py-2">
              Premium Active
            </Badge>
          </div>
        </div>

        {/* Analysis Input */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle>Analyze Trend</CardTitle>
            <CardDescription>Enter a topic to get advanced insights and predictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., AI in Art, Viral Dance Challenge"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-[#050b1a] border-[#1e3a5f]"
                />
              </div>
              <div>
                <Label htmlFor="timeframe">Forecast Timeframe</Label>
                <Select value={timeframe} onValueChange={(v: "7days" | "30days") => setTimeframe(v)}>
                  <SelectTrigger id="timeframe" className="bg-[#050b1a] border-[#1e3a5f]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">7 Days</SelectItem>
                    <SelectItem value="30days">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleAnalyze}
              disabled={forecastLoading || insightsLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {(forecastLoading || insightsLoading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Analyze Trend
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* Results */}
        {(forecast || insights) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictive Forecast */}
            {forecast && (
              <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-400" />
                    Predictive Forecast
                  </CardTitle>
                  <CardDescription>{timeframe === "7days" ? "7-Day" : "30-Day"} Prediction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {forecast.forecast?.predictions && forecast.forecast.predictions.length > 0 && (
                    <div className="h-64">
                      <Line
                        data={{
                          labels: forecast.forecast.predictions.map((d: { date: string }) => d.date),
                          datasets: [{
                            label: 'Engagement',
                            data: forecast.forecast.predictions.map((d: { engagement: number }) => d.engagement),
                            borderColor: '#a855f7',
                            backgroundColor: 'rgba(168,85,247,0.2)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { grid: { color: '#1e3a5f' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
                            y: { grid: { color: '#1e3a5f' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
                          },
                        }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#050b1a] border border-[#1e3a5f] rounded-lg p-3">
                      <p className="text-sm text-gray-400">Virality Score</p>
                      <p className="text-2xl font-bold text-purple-400">{forecast.forecast?.viralityScore || "N/A"}/10</p>
                    </div>
                    <div className="bg-[#050b1a] border border-[#1e3a5f] rounded-lg p-3">
                      <p className="text-sm text-gray-400">Growth Rate</p>
                      <p className="text-2xl font-bold text-green-400">{forecast.forecast?.growthRate || "N/A"}%</p>
                    </div>
                  </div>

                  {forecast.forecast?.keyFactors && forecast.forecast.keyFactors.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Key Factors</h4>
                      <ul className="space-y-1">
                        {forecast.forecast.keyFactors.map((factor: string, i: number) => (
                          <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-sm text-blue-400">
                      Confidence: {forecast.forecast?.confidenceLevel || "N/A"}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Advanced Insights */}
            {insights && (
              <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Advanced Insights
                  </CardTitle>
                  <CardDescription>Deep analysis of {insights.topic}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                      {insights.insights}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#050b1a] border border-[#1e3a5f] rounded-lg p-3">
                      <p className="text-xs text-gray-400">Total Mentions</p>
                      <p className="text-lg font-bold">{insights.metrics?.totalMentions?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div className="bg-[#050b1a] border border-[#1e3a5f] rounded-lg p-3">
                      <p className="text-xs text-gray-400">Avg Engagement</p>
                      <p className="text-lg font-bold">{insights.metrics?.averageEngagement?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div className="bg-[#050b1a] border border-[#1e3a5f] rounded-lg p-3">
                      <p className="text-xs text-gray-400">Sentiment Score</p>
                      <p className="text-lg font-bold text-green-400">{insights.metrics?.sentimentScore || "N/A"}/10</p>
                    </div>
                    <div className="bg-[#050b1a] border border-[#1e3a5f] rounded-lg p-3">
                      <p className="text-xs text-gray-400">Reach Estimate</p>
                      <p className="text-lg font-bold">{insights.metrics?.reachEstimate?.toLocaleString() || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
