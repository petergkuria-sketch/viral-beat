import { useState, useEffect } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Loader2, Copy, CheckCircle2, Sparkles, FileText, TrendingUp, Users, DollarSign, Repeat, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { showTokenNotification } from "@/lib/tokenNotifications";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { LogIn } from "lucide-react";

const agents = [
  {
    id: "script-writer",
    name: "Script Writer",
    description: "Generate viral video scripts optimized for each platform",
    icon: FileText,
    color: "from-purple-500 to-pink-500",
    cost: 30,
  },
  {
    id: "trend-forecaster",
    name: "Trend Forecaster",
    description: "Predict which topics will go viral 24-72 hours ahead",
    icon: TrendingUp,
    color: "from-cyan-500 to-blue-500",
    cost: 25,
  },
  {
    id: "collab-matchmaker",
    name: "Collaboration Matchmaker",
    description: "Find potential creator partnerships and collaborations",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    cost: 20,
  },
  {
    id: "sponsorship-finder",
    name: "Sponsorship Finder",
    description: "Match with relevant brand deals and sponsorships",
    icon: DollarSign,
    color: "from-yellow-500 to-orange-500",
    cost: 20,
  },
  {
    id: "content-repurposer",
    name: "Content Repurposer",
    description: "Adapt content across multiple platforms",
    icon: Repeat,
    color: "from-pink-500 to-rose-500",
    cost: 15,
  },
];

export default function AIAgentsHub() {
  const { user, loading } = useAuth();
  const [activeAgent, setActiveAgent] = useState("script-writer");
  const [copied, setCopied] = useState(false);

  // Script Writer state
  const [scriptTopic, setScriptTopic] = useState("");
  const [scriptPlatform, setScriptPlatform] = useState<"tiktok" | "youtube" | "instagram" | "twitter">("tiktok");
  const [scriptContentType, setScriptContentType] = useState<"educational" | "entertainment" | "promotional" | "storytelling">("educational");
  const [scriptDuration, setScriptDuration] = useState<"15-30s" | "30-60s" | "1-3min" | "3-5min" | "5-10min">("30-60s");
  const [scriptTone, setScriptTone] = useState<"casual" | "professional" | "humorous" | "inspirational">("casual");
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);

  // Trend Forecaster state
  const [forecastCategory, setForecastCategory] = useState<"general" | "tech" | "entertainment" | "sports" | "politics" | "business">("general");
  const [forecastTimeframe, setForecastTimeframe] = useState<"24h" | "48h" | "72h">("48h");
  const [trendPredictions, setTrendPredictions] = useState<any[]>([]);

  // Collaboration Matchmaker state
  const [collabNiche, setCollabNiche] = useState("");
  const [collabAudienceSize, setCollabAudienceSize] = useState<"micro" | "mid" | "macro" | "mega">("mid");
  const [collabPlatform, setCollabPlatform] = useState<"tiktok" | "youtube" | "instagram" | "twitter" | "all">("all");
  const [collabMatches, setCollabMatches] = useState<any[]>([]);

  // Sponsorship Finder state
  const [sponsorNiche, setSponsorNiche] = useState("");
  const [sponsorAudienceSize, setSponsorAudienceSize] = useState<"micro" | "mid" | "macro" | "mega">("mid");
  const [sponsorContentType, setSponsorContentType] = useState<"educational" | "entertainment" | "lifestyle" | "tech" | "gaming">("entertainment");
  const [sponsorOpportunities, setSponsorOpportunities] = useState<any[]>([]);

  // Content Repurposer state
  const [repurposeContent, setRepurposeContent] = useState("");
  const [repurposeOriginalPlatform, setRepurposeOriginalPlatform] = useState<"tiktok" | "youtube" | "instagram" | "twitter">("youtube");
  const [repurposeTargetPlatforms, setRepurposeTargetPlatforms] = useState<("tiktok" | "youtube" | "instagram" | "twitter")[]>(["tiktok", "instagram"]);
  const [repurposedContent, setRepurposedContent] = useState<any[]>([]);

  // Get token balance for notifications
  const { data: tokenBalance } = trpc.tokens.getBalance.useQuery();

  // Mutations
  const generateScript = trpc.aiAgents.generateScript.useMutation({
    onSuccess: (data: any) => {
      setGeneratedScript(data.script);
      toast.success("Script generated!");
      
      // Show token notification
      if (tokenBalance) {
        showTokenNotification("spend_ai_agent", {
          amount: -30,
          newBalance: tokenBalance.balance - 30,
          description: "Script Writer",
        });
      }
    },
    onError: (error: any) => {
      toast.error("Failed to generate script: " + error.message);
    },
  });

  const { data: trendsData, refetch: fetchTrends, isFetching: isFetchingTrends } = trpc.aiAgents.forecastTrends.useQuery(
    { category: forecastCategory, timeframe: forecastTimeframe },
    { enabled: false }
  );

  // Update predictions when data changes
  useEffect(() => {
    if (trendsData) {
      setTrendPredictions((trendsData as any).predictions);
      toast.success("Trends forecasted!");
    }
  }, [trendsData]);

  const { data: collabData, refetch: fetchCollaborators, isFetching: isFetchingCollabs } = trpc.aiAgents.findCollaborators.useQuery(
    { niche: collabNiche, audienceSize: collabAudienceSize, platform: collabPlatform },
    { enabled: false }
  );

  // Update collab matches when data changes
  useEffect(() => {
    if (collabData) {
      setCollabMatches((collabData as any).matches);
      toast.success("Collaborators found!");
    }
  }, [collabData]);

  const { data: sponsorData, refetch: fetchSponsorships, isFetching: isFetchingSponsorships } = trpc.aiAgents.findSponsorships.useQuery(
    { niche: sponsorNiche, audienceSize: sponsorAudienceSize, contentType: sponsorContentType },
    { enabled: false }
  );

  // Update sponsor opportunities when data changes
  useEffect(() => {
    if (sponsorData) {
      setSponsorOpportunities((sponsorData as any).opportunities);
      toast.success("Sponsorships found!");
    }
  }, [sponsorData]);

  const repurposeContentMutation = trpc.aiAgents.repurposeContent.useMutation({
    onSuccess: (data: any) => {
      setRepurposedContent(data.adaptations);
      toast.success("Content repurposed!");
    },
    onError: (error: any) => {
      toast.error("Failed to repurpose content: " + error.message);
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const currentAgent = agents.find(a => a.id === activeAgent)!;

  // Show login prompt if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center p-6">
        <Card className="bg-[#0d1e36] border-[#1e3a5f] max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <LogIn className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold">Sign In Required</h2>
            <p className="text-gray-400">
              AI Agents Hub is a premium feature. Sign in to access powerful AI tools for content creation, trend forecasting, and more.
            </p>
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
              onClick={() => window.location.href = getLoginUrl()}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackToDashboard />
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${currentAgent.color} rounded-lg flex items-center justify-center`}>
            <currentAgent.icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Agents Hub</h1>
            <p className="text-gray-400">Supercharge your content creation with AI-powered tools</p>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id)}
              className={`p-4 rounded-lg border-2 transition-all relative ${
                activeAgent === agent.id
                  ? `border-transparent bg-gradient-to-br ${agent.color}`
                  : "border-[#1e3a5f] bg-[#0d1e36] hover:border-[#2e4a6f]"
              }`}
            >
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-semibold">{agent.cost}</span>
              </div>
              <agent.icon className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold text-center">{agent.name}</p>
            </button>
          ))}
        </div>

        {/* Agent Content */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <currentAgent.icon className="w-5 h-5" />
              {currentAgent.name}
            </CardTitle>
            <CardDescription>{currentAgent.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeAgent} className="w-full">
              {/* Script Writer */}
              <TabsContent value="script-writer" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Input
                        placeholder="e.g., AI in Art"
                        value={scriptTopic}
                        onChange={(e) => setScriptTopic(e.target.value)}
                        className="bg-[#050b1a] border-[#1e3a5f]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Platform</Label>
                        <Select value={scriptPlatform} onValueChange={(v: any) => setScriptPlatform(v)}>
                          <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Select value={scriptDuration} onValueChange={(v: any) => setScriptDuration(v)}>
                          <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                            <SelectItem value="15-30s">15-30s</SelectItem>
                            <SelectItem value="30-60s">30-60s</SelectItem>
                            <SelectItem value="1-3min">1-3min</SelectItem>
                            <SelectItem value="3-5min">3-5min</SelectItem>
                            <SelectItem value="5-10min">5-10min</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select value={scriptContentType} onValueChange={(v: any) => setScriptContentType(v)}>
                          <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                            <SelectItem value="educational">Educational</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="promotional">Promotional</SelectItem>
                            <SelectItem value="storytelling">Storytelling</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tone</Label>
                        <Select value={scriptTone} onValueChange={(v: any) => setScriptTone(v)}>
                          <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="humorous">Humorous</SelectItem>
                            <SelectItem value="inspirational">Inspirational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      onClick={() => generateScript.mutate({
                        topic: scriptTopic,
                        platform: scriptPlatform,
                        contentType: scriptContentType,
                        duration: scriptDuration,
                        tone: scriptTone,
                      })}
                      disabled={generateScript.isPending || !scriptTopic}
                      className={`w-full bg-gradient-to-r ${currentAgent.color}`}
                    >
                      {generateScript.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Script
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="bg-[#050b1a] rounded-lg p-4 max-h-[500px] overflow-y-auto">
                    {generatedScript ? (
                      <>
                        <div className="flex justify-end mb-2">
                          <Button size="sm" variant="outline" onClick={() => handleCopy(generatedScript)}>
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Streamdown className="prose prose-invert max-w-none">
                          {generatedScript}
                        </Streamdown>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Generated script will appear here
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Trend Forecaster */}
              <TabsContent value="trend-forecaster" className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <Select value={forecastCategory} onValueChange={(v: any) => setForecastCategory(v)}>
                    <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f] w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="tech">Tech</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="politics">Politics</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={forecastTimeframe} onValueChange={(v: any) => setForecastTimeframe(v)}>
                    <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f] w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="48h">48 hours</SelectItem>
                      <SelectItem value="72h">72 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => fetchTrends()}
                    disabled={isFetchingTrends}
                    className={`bg-gradient-to-r ${currentAgent.color}`}
                  >
                    {isFetchingTrends ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Forecasting...
                      </>
                    ) : (
                      "Forecast Trends"
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {trendPredictions.map((prediction, idx) => (
                    <Card key={idx} className="bg-[#050b1a] border-[#1e3a5f]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">{prediction.topic}</h3>
                          <Badge className="bg-cyan-500/20 text-cyan-400">
                            {prediction.confidence}% confidence
                          </Badge>
                        </div>
                        <Progress value={prediction.confidence} className="h-2 mb-3" />
                        <p className="text-sm text-gray-400 mb-2">
                          <strong>Peak Time:</strong> {prediction.peakTime}
                        </p>
                        <p className="text-sm text-gray-300 mb-2">{prediction.reasoning}</p>
                        <div className="bg-[#0d1e36] p-3 rounded mt-2">
                          <p className="text-xs text-cyan-400 font-semibold mb-1">Recommended Action:</p>
                          <p className="text-sm">{prediction.action}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {trendPredictions.length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                      Click "Forecast Trends" to see predictions
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Collaboration Matchmaker */}
              <TabsContent value="collab-matchmaker" className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <Input
                    placeholder="Your niche (e.g., Tech Reviews)"
                    value={collabNiche}
                    onChange={(e) => setCollabNiche(e.target.value)}
                    className="bg-[#050b1a] border-[#1e3a5f]"
                  />
                  <Select value={collabAudienceSize} onValueChange={(v: any) => setCollabAudienceSize(v)}>
                    <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f] w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                      <SelectItem value="micro">Micro</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="macro">Macro</SelectItem>
                      <SelectItem value="mega">Mega</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={collabPlatform} onValueChange={(v: any) => setCollabPlatform(v)}>
                    <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f] w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => fetchCollaborators()}
                    disabled={isFetchingCollabs || !collabNiche}
                    className={`bg-gradient-to-r ${currentAgent.color}`}
                  >
                    {isFetchingCollabs ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Finding...
                      </>
                    ) : (
                      "Find Collaborators"
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collabMatches.map((match, idx) => (
                    <Card key={idx} className="bg-[#050b1a] border-[#1e3a5f]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{match.creator}</h3>
                          <Badge className="bg-green-500/20 text-green-400">
                            {match.matchScore}% match
                          </Badge>
                        </div>
                        <Progress value={match.matchScore} className="h-2 mb-3" />
                        <div className="space-y-1 text-sm">
                          <p><strong>Audience Overlap:</strong> {match.audienceOverlap}%</p>
                          <p><strong>Type:</strong> {match.collaborationType}</p>
                          <p><strong>Reach:</strong> {match.expectedReach}</p>
                          <p className="text-gray-400 mt-2">{match.reasoning}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {collabMatches.length === 0 && (
                    <div className="col-span-2 text-center text-gray-500 py-12">
                      Enter your niche and click "Find Collaborators"
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Sponsorship Finder */}
              <TabsContent value="sponsorship-finder" className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <Input
                    placeholder="Your niche (e.g., Gaming)"
                    value={sponsorNiche}
                    onChange={(e) => setSponsorNiche(e.target.value)}
                    className="bg-[#050b1a] border-[#1e3a5f]"
                  />
                  <Select value={sponsorAudienceSize} onValueChange={(v: any) => setSponsorAudienceSize(v)}>
                    <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f] w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                      <SelectItem value="micro">Micro</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="macro">Macro</SelectItem>
                      <SelectItem value="mega">Mega</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sponsorContentType} onValueChange={(v: any) => setSponsorContentType(v)}>
                    <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f] w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="tech">Tech</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => fetchSponsorships()}
                    disabled={isFetchingSponsorships || !sponsorNiche}
                    className={`bg-gradient-to-r ${currentAgent.color}`}
                  >
                    {isFetchingSponsorships ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Finding...
                      </>
                    ) : (
                      "Find Sponsors"
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sponsorOpportunities.map((opp, idx) => (
                    <Card key={idx} className="bg-[#050b1a] border-[#1e3a5f]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{opp.brand}</h3>
                          <Badge className="bg-yellow-500/20 text-yellow-400">
                            {opp.fitScore}% fit
                          </Badge>
                        </div>
                        <Progress value={opp.fitScore} className="h-2 mb-3" />
                        <div className="space-y-1 text-sm">
                          <p><strong>Deal Value:</strong> {opp.dealValue}</p>
                          <p><strong>Campaign:</strong> {opp.campaignType}</p>
                          <p><strong>Requirements:</strong> {opp.requirements}</p>
                          <p className="text-gray-400 mt-2">{opp.reasoning}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {sponsorOpportunities.length === 0 && (
                    <div className="col-span-2 text-center text-gray-500 py-12">
                      Enter your niche and click "Find Sponsors"
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Content Repurposer */}
              <TabsContent value="content-repurposer" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Original Content</Label>
                      <Textarea
                        placeholder="Paste your content here..."
                        value={repurposeContent}
                        onChange={(e) => setRepurposeContent(e.target.value)}
                        className="bg-[#050b1a] border-[#1e3a5f] min-h-[200px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Original Platform</Label>
                      <Select value={repurposeOriginalPlatform} onValueChange={(v: any) => setRepurposeOriginalPlatform(v)}>
                        <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Platforms (select multiple)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["tiktok", "youtube", "instagram", "twitter"].map((platform) => (
                          <label
                            key={platform}
                            className="flex items-center gap-2 p-2 rounded bg-[#050b1a] border border-[#1e3a5f] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={repurposeTargetPlatforms.includes(platform as any)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRepurposeTargetPlatforms([...repurposeTargetPlatforms, platform as any]);
                                } else {
                                  setRepurposeTargetPlatforms(repurposeTargetPlatforms.filter(p => p !== platform));
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="capitalize">{platform}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => repurposeContentMutation.mutate({
                        originalContent: repurposeContent,
                        originalPlatform: repurposeOriginalPlatform,
                        targetPlatforms: repurposeTargetPlatforms,
                      })}
                      disabled={repurposeContentMutation.isPending || !repurposeContent || repurposeTargetPlatforms.length === 0}
                      className={`w-full bg-gradient-to-r ${currentAgent.color}`}
                    >
                      {repurposeContentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Repurposing...
                        </>
                      ) : (
                        <>
                          <Repeat className="w-4 h-4 mr-2" />
                          Repurpose Content
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {repurposedContent.map((adaptation, idx) => (
                      <Card key={idx} className="bg-[#050b1a] border-[#1e3a5f]">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span className="capitalize">{adaptation.platform}</span>
                            <Button size="sm" variant="outline" onClick={() => handleCopy(adaptation.content)}>
                              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Streamdown className="prose prose-invert prose-sm max-w-none">
                            {adaptation.content}
                          </Streamdown>
                        </CardContent>
                      </Card>
                    ))}
                    {repurposedContent.length === 0 && (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Repurposed content will appear here
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
