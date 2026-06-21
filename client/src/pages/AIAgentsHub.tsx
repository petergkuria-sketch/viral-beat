import { useState, useEffect } from "react";
import { Loader2, Copy, CheckCircle2, Globe, Radio, Network, FileOutput, Landmark, LogIn, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

const AGENTS = [
  {
    id: "brief-writer",
    name: "Country Brief Writer",
    tagline: "Intelligence-grade country briefs on demand",
    desc: "Choose any African nation and a PESTEL lens — the agent produces a structured political intelligence brief you can cite, publish, or export.",
    icon: Globe,
    accent: "#22d3ee",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  {
    id: "signal-forecaster",
    name: "Signal Forecaster",
    tagline: "Emerging signals before they break",
    desc: "Scan PESTEL dimensions across Africa's regions and surface rising political, economic, or security signals 24–72 hours before mainstream coverage.",
    icon: Radio,
    accent: "#a78bfa",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  {
    id: "source-network",
    name: "Source Network",
    tagline: "Find who's already covering this",
    desc: "Discover journalists, analysts, NGOs, and institutions covering your focus country or theme — map the intelligence network around any African issue.",
    icon: Network,
    accent: "#34d399",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    id: "brief-adaptor",
    name: "Brief Adaptor",
    tagline: "One brief, every format",
    desc: "Paste a raw intelligence brief — the agent adapts it for X threads, newsletters, academic papers, NGO reports, or diplomatic summaries.",
    icon: FileOutput,
    accent: "#f472b6",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
  },
  {
    id: "funding-radar",
    name: "Funding Radar",
    tagline: "Institutional backing for your work",
    desc: "Surface journalism grants, NGO partnerships, research fellowships, and media development funds relevant to your Africa intelligence focus.",
    icon: Landmark,
    accent: "#fb923c",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
];

const PESTEL = [
  { value: "political",    label: "Political" },
  { value: "economic",     label: "Economic" },
  { value: "social",       label: "Social" },
  { value: "security",     label: "Security" },
  { value: "electoral",    label: "Electoral" },
  { value: "legal",        label: "Legal" },
];

const REGIONS = [
  { value: "east-africa",     label: "East Africa" },
  { value: "west-africa",     label: "West Africa" },
  { value: "southern-africa", label: "Southern Africa" },
  { value: "north-africa",    label: "North Africa" },
  { value: "central-africa",  label: "Central Africa" },
  { value: "pan-african",     label: "Pan-African" },
];

const BRIEF_FORMATS = [
  { value: "tiktok",     label: "X / Twitter Thread" },
  { value: "youtube",    label: "Long-form Newsletter" },
  { value: "instagram",  label: "NGO Situation Report" },
  { value: "twitter",    label: "Diplomatic Summary" },
];

const AUDIENCE_TIERS = [
  { value: "micro",  label: "Independent journalist" },
  { value: "mid",    label: "Regional media outlet" },
  { value: "macro",  label: "International NGO" },
  { value: "mega",   label: "Multilateral institution" },
];

const FUNDING_TYPES = [
  { value: "educational",   label: "Journalism grants" },
  { value: "entertainment", label: "Research fellowships" },
  { value: "lifestyle",     label: "NGO partnerships" },
  { value: "tech",          label: "Media development funds" },
  { value: "gaming",        label: "Institutional subscriptions" },
];

export default function AIAgentsHub() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeAgent, setActiveAgent] = useState("brief-writer");
  const [copied, setCopied] = useState(false);

  // Brief Writer state
  const [briefCountry, setBriefCountry] = useState("");
  const [briefPestel, setBriefPestel] = useState<any>("political");
  const [briefAudience, setBriefAudience] = useState<any>("educational");
  const [briefDuration, setBriefDuration] = useState<any>("1-3min");
  const [briefRegister, setBriefRegister] = useState<any>("professional");
  const [generatedBrief, setGeneratedBrief] = useState<string | null>(null);

  // Signal Forecaster state
  const [signalDimension, setSignalDimension] = useState<any>("political");
  const [signalTimeframe, setSignalTimeframe] = useState<any>("48h");
  const [signalPredictions, setSignalPredictions] = useState<any[]>([]);

  // Source Network state
  const [sourceCountry, setSourceCountry] = useState("");
  const [sourceTier, setSourceTier] = useState<any>("mid");
  const [sourceRegion, setSourceRegion] = useState<any>("east-africa");
  const [sourceMatches, setSourceMatches] = useState<any[]>([]);

  // Brief Adaptor state
  const [adaptorContent, setAdaptorContent] = useState("");
  const [adaptorSource, setAdaptorSource] = useState<any>("youtube");
  const [adaptorTargets, setAdaptorTargets] = useState<any[]>(["tiktok", "instagram"]);
  const [adaptedOutputs, setAdaptedOutputs] = useState<any[]>([]);

  // Funding Radar state
  const [fundingFocus, setFundingFocus] = useState("");
  const [fundingTier, setFundingTier] = useState<any>("mid");
  const [fundingType, setFundingType] = useState<any>("educational");
  const [fundingOpportunities, setFundingOpportunities] = useState<any[]>([]);

  // Brief Writer mutation
  const generateBrief = trpc.aiAgents.generateScript.useMutation({
    onSuccess: (data: any) => {
      setGeneratedBrief(data.script);
      toast.success("Brief generated.");
    },
    onError: (err: any) => toast.error("Failed to generate brief: " + err.message),
  });

  // Signal Forecaster query
  const { data: forecastData, refetch: fetchSignals, isFetching: isFetchingSignals } =
    trpc.aiAgents.forecastTrends.useQuery(
      { category: signalDimension, timeframe: signalTimeframe },
      { enabled: false }
    );
  useEffect(() => {
    if (forecastData) setSignalPredictions((forecastData as any).predictions ?? []);
  }, [forecastData]);

  // Source Network query
  const { data: sourceData, refetch: fetchSources, isFetching: isFetchingSources } =
    trpc.aiAgents.findCollaborators.useQuery(
      { niche: sourceCountry || "Africa", audienceSize: sourceTier, platform: "all" },
      { enabled: false }
    );
  useEffect(() => {
    if (sourceData) setSourceMatches((sourceData as any).matches ?? []);
  }, [sourceData]);

  // Brief Adaptor mutation
  const adaptBrief = trpc.aiAgents.repurposeContent.useMutation({
    onSuccess: (data: any) => {
      setAdaptedOutputs(data.adaptations ?? []);
      toast.success("Brief adapted.");
    },
    onError: (err: any) => toast.error("Failed to adapt brief: " + err.message),
  });

  // Funding Radar query
  const { data: fundingData, refetch: fetchFunding, isFetching: isFetchingFunding } =
    trpc.aiAgents.findSponsorships.useQuery(
      { niche: fundingFocus || "journalism", audienceSize: fundingTier, contentType: fundingType },
      { enabled: false }
    );
  useEffect(() => {
    if (fundingData) setFundingOpportunities((fundingData as any).opportunities ?? []);
  }, [fundingData]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const current = AGENTS.find(a => a.id === activeAgent)!;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-6">
        <Card className="bg-[#0d1e36] border-[#1e3a5f] max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
              <Globe className="w-7 h-7 text-cyan-400" />
            </div>
            <h2 className="text-xl font-black text-white">Intelligence Agents</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered agents built for Africa political intelligence — country briefs, signal forecasting, source networks, and more.
            </p>
            <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
              onClick={() => window.location.href = getLoginUrl()}>
              <LogIn className="w-4 h-4 mr-2" /> Sign in to access
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-white/10 px-4 sm:px-6 py-5 bg-[#0f1f38]/60">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl ${current.bg} border ${current.border} flex items-center justify-center shrink-0`}>
            <current.icon className="w-5 h-5" style={{ color: current.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white">Intelligence Agents</h1>
            <p className="text-xs text-gray-400 mt-0.5">AI-powered tools for Africa political intelligence — built for journalists, analysts, NGOs, and researchers</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* Agent selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id)}
              className={`group text-left rounded-xl border px-4 py-4 transition-all ${
                activeAgent === agent.id
                  ? `${agent.bg} ${agent.border}`
                  : "bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15"
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: activeAgent === agent.id ? `${agent.accent}20` : "rgba(255,255,255,0.05)" }}>
                <agent.icon className="w-4 h-4" style={{ color: activeAgent === agent.id ? agent.accent : "#6b7280" }} />
              </div>
              <p className={`text-sm font-bold leading-snug mb-1 ${activeAgent === agent.id ? "text-white" : "text-gray-300"}`}>
                {agent.name}
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{agent.tagline}</p>
            </button>
          ))}
        </div>

        {/* Active agent workspace */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${current.bg} border ${current.border} flex items-center justify-center shrink-0`}>
                <current.icon className="w-4 h-4" style={{ color: current.accent }} />
              </div>
              <div>
                <CardTitle className="text-white text-base">{current.name}</CardTitle>
                <CardDescription className="text-gray-400 text-sm mt-0.5 leading-relaxed">{current.desc}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">

            {/* ── COUNTRY BRIEF WRITER ── */}
            {activeAgent === "brief-writer" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Country or Territory</Label>
                    <Input
                      placeholder="e.g., Kenya, Ghana, Sudan, Ethiopia…"
                      value={briefCountry}
                      onChange={e => setBriefCountry(e.target.value)}
                      className="mt-1.5 bg-[#050b1a] border-[#1e3a5f] text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">PESTEL Dimension</Label>
                      <Select value={briefPestel} onValueChange={setBriefPestel}>
                        <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                          {PESTEL.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Brief Depth</Label>
                      <Select value={briefDuration} onValueChange={setBriefDuration}>
                        <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                          <SelectItem value="15-30s">Snapshot (2 min read)</SelectItem>
                          <SelectItem value="30-60s">Standard (5 min read)</SelectItem>
                          <SelectItem value="1-3min">Deep Brief (10 min read)</SelectItem>
                          <SelectItem value="3-5min">Full Analysis (15+ min)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Primary Audience</Label>
                      <Select value={briefAudience} onValueChange={setBriefAudience}>
                        <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                          <SelectItem value="educational">Journalist / Editor</SelectItem>
                          <SelectItem value="entertainment">General Public</SelectItem>
                          <SelectItem value="promotional">NGO / Researcher</SelectItem>
                          <SelectItem value="storytelling">Policy / Government</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Register</Label>
                      <Select value={briefRegister} onValueChange={setBriefRegister}>
                        <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                          <SelectItem value="professional">Formal / Analytical</SelectItem>
                          <SelectItem value="casual">Accessible / Journalistic</SelectItem>
                          <SelectItem value="inspirational">Narrative / Explanatory</SelectItem>
                          <SelectItem value="humorous">Data-led / Academic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => generateBrief.mutate({
                      topic: `${briefCountry} — ${PESTEL.find(p => p.value === briefPestel)?.label} Intelligence Brief`,
                      platform: briefAudience,
                      contentType: briefAudience,
                      duration: briefDuration,
                      tone: briefRegister,
                    })}
                    disabled={generateBrief.isPending || !briefCountry.trim()}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                  >
                    {generateBrief.isPending
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating brief…</>
                      : <><Globe className="w-4 h-4 mr-2" />Generate Intelligence Brief</>}
                  </Button>
                </div>

                <div className="bg-[#050b1a] border border-[#1e3a5f] rounded-xl p-4 min-h-[320px] max-h-[560px] overflow-y-auto">
                  {generatedBrief ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">Intelligence Brief</Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-400 hover:text-white"
                            onClick={() => handleCopy(generatedBrief)}>
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-400 hover:text-white"
                            onClick={() => handleDownload(generatedBrief, `viralbeat-brief-${briefCountry.toLowerCase().replace(/\s+/g,"-")}.txt`)}>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Streamdown className="prose prose-invert prose-sm max-w-none">{generatedBrief}</Streamdown>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <Globe className="w-10 h-10 text-gray-700 mb-3" />
                      <p className="text-sm text-gray-500">Your brief will appear here</p>
                      <p className="text-xs text-gray-600 mt-1">Select a country and PESTEL dimension to begin</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SIGNAL FORECASTER ── */}
            {activeAgent === "signal-forecaster" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-gray-300">PESTEL Dimension</Label>
                    <Select value={signalDimension} onValueChange={setSignalDimension}>
                      <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                        <SelectItem value="political">Political</SelectItem>
                        <SelectItem value="tech">Economic</SelectItem>
                        <SelectItem value="entertainment">Security</SelectItem>
                        <SelectItem value="sports">Electoral</SelectItem>
                        <SelectItem value="politics">Social</SelectItem>
                        <SelectItem value="business">Legal / Regulatory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <Label className="text-gray-300">Forecast Window</Label>
                    <Select value={signalTimeframe} onValueChange={setSignalTimeframe}>
                      <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                        <SelectItem value="24h">Next 24 hours</SelectItem>
                        <SelectItem value="48h">Next 48 hours</SelectItem>
                        <SelectItem value="72h">Next 72 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => fetchSignals()}
                    disabled={isFetchingSignals}
                    className="bg-purple-500 hover:bg-purple-400 text-white font-semibold"
                  >
                    {isFetchingSignals
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning signals…</>
                      : <><Radio className="w-4 h-4 mr-2" />Forecast Signals</>}
                  </Button>
                </div>

                {signalPredictions.length > 0 ? (
                  <div className="grid gap-4">
                    {signalPredictions.map((sig, i) => (
                      <div key={i} className="bg-[#050b1a] border border-[#1e3a5f] rounded-xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-white leading-snug flex-1 mr-3">{sig.topic}</h3>
                          <Badge className="shrink-0 bg-purple-500/10 text-purple-400 border-purple-500/30">
                            {sig.confidence}% confidence
                          </Badge>
                        </div>
                        <Progress value={sig.confidence} className="h-1.5 mb-3" />
                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                          <div><span className="text-gray-500">Peak signal:</span> <span className="text-gray-200 font-semibold">{sig.peakTime}</span></div>
                        </div>
                        <p className="text-sm text-gray-300 mb-3 leading-relaxed">{sig.reasoning}</p>
                        <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-3">
                          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Intelligence Action</p>
                          <p className="text-sm text-gray-200">{sig.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Radio className="w-10 h-10 text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">Select a dimension and run the forecaster</p>
                    <p className="text-xs text-gray-600 mt-1">Signals are ranked by emergence probability across all 55 nations</p>
                  </div>
                )}
              </div>
            )}

            {/* ── SOURCE NETWORK ── */}
            {activeAgent === "source-network" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-gray-300">Focus country or theme</Label>
                    <Input
                      placeholder="e.g., Kenya elections, Sudan conflict…"
                      value={sourceCountry}
                      onChange={e => setSourceCountry(e.target.value)}
                      className="mt-1.5 bg-[#050b1a] border-[#1e3a5f] text-white"
                    />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <Label className="text-gray-300">Organisation tier</Label>
                    <Select value={sourceTier} onValueChange={setSourceTier}>
                      <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                        {AUDIENCE_TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => fetchSources()}
                    disabled={isFetchingSources}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                  >
                    {isFetchingSources
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mapping network…</>
                      : <><Network className="w-4 h-4 mr-2" />Map Source Network</>}
                  </Button>
                </div>

                {sourceMatches.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {sourceMatches.map((match, i) => (
                      <div key={i} className="bg-[#050b1a] border border-[#1e3a5f] rounded-xl p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-white">{match.creator}</h3>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                            {match.matchScore}% relevance
                          </Badge>
                        </div>
                        <Progress value={match.matchScore} className="h-1.5 mb-3" />
                        <div className="space-y-1.5 text-xs text-gray-300">
                          <div><span className="text-gray-500">Audience overlap: </span>{match.audienceOverlap}%</div>
                          <div><span className="text-gray-500">Type: </span>{match.collaborationType}</div>
                          <div><span className="text-gray-500">Reach: </span>{match.expectedReach}</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed">{match.reasoning}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Network className="w-10 h-10 text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">Enter a focus area to map the source network</p>
                    <p className="text-xs text-gray-600 mt-1">Discovers journalists, analysts, NGOs, and institutions already covering this issue</p>
                  </div>
                )}
              </div>
            )}

            {/* ── BRIEF ADAPTOR ── */}
            {activeAgent === "brief-adaptor" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Intelligence Brief (paste raw text)</Label>
                    <Textarea
                      placeholder="Paste a ViralBeat brief, news summary, or intelligence note…"
                      value={adaptorContent}
                      onChange={e => setAdaptorContent(e.target.value)}
                      className="mt-1.5 bg-[#050b1a] border-[#1e3a5f] text-white min-h-[200px]"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Source format</Label>
                    <Select value={adaptorSource} onValueChange={setAdaptorSource}>
                      <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                        {BRIEF_FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Target formats</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      {BRIEF_FORMATS.map(fmt => (
                        <label key={fmt.value}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-[#050b1a] border border-[#1e3a5f] cursor-pointer hover:border-pink-500/30 transition-colors">
                          <input type="checkbox"
                            checked={adaptorTargets.includes(fmt.value)}
                            onChange={e => {
                              if (e.target.checked) setAdaptorTargets([...adaptorTargets, fmt.value]);
                              else setAdaptorTargets(adaptorTargets.filter((p: string) => p !== fmt.value));
                            }}
                            className="w-3.5 h-3.5 accent-pink-500"
                          />
                          <span className="text-xs text-gray-300">{fmt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => adaptBrief.mutate({
                      originalContent: adaptorContent,
                      originalPlatform: adaptorSource,
                      targetPlatforms: adaptorTargets,
                    })}
                    disabled={adaptBrief.isPending || !adaptorContent.trim() || adaptorTargets.length === 0}
                    className="w-full bg-pink-500 hover:bg-pink-400 text-white font-bold"
                  >
                    {adaptBrief.isPending
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adapting…</>
                      : <><FileOutput className="w-4 h-4 mr-2" />Adapt Brief</>}
                  </Button>
                </div>

                <div className="space-y-4 max-h-[560px] overflow-y-auto">
                  {adaptedOutputs.length > 0 ? adaptedOutputs.map((out, i) => (
                    <div key={i} className="bg-[#050b1a] border border-[#1e3a5f] rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e3a5f]">
                        <p className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                          {BRIEF_FORMATS.find(f => f.value === out.platform)?.label ?? out.platform}
                        </p>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-500 hover:text-white"
                            onClick={() => handleCopy(out.content)}>
                            {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-500 hover:text-white"
                            onClick={() => handleDownload(out.content, `viralbeat-brief-${out.platform}.txt`)}>
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <Streamdown className="prose prose-invert prose-sm max-w-none">{out.content}</Streamdown>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                      <FileOutput className="w-10 h-10 text-gray-700 mb-3" />
                      <p className="text-sm text-gray-500">Adapted formats will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── FUNDING RADAR ── */}
            {activeAgent === "funding-radar" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-gray-300">Your focus area or country</Label>
                    <Input
                      placeholder="e.g., Kenya investigative journalism, West Africa elections…"
                      value={fundingFocus}
                      onChange={e => setFundingFocus(e.target.value)}
                      className="mt-1.5 bg-[#050b1a] border-[#1e3a5f] text-white"
                    />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <Label className="text-gray-300">Organisation type</Label>
                    <Select value={fundingTier} onValueChange={setFundingTier}>
                      <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                        {AUDIENCE_TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <Label className="text-gray-300">Funding category</Label>
                    <Select value={fundingType} onValueChange={setFundingType}>
                      <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                        {FUNDING_TYPES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => fetchFunding()}
                    disabled={isFetchingFunding}
                    className="bg-orange-500 hover:bg-orange-400 text-white font-bold"
                  >
                    {isFetchingFunding
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning…</>
                      : <><Landmark className="w-4 h-4 mr-2" />Scan Funding</>}
                  </Button>
                </div>

                {fundingOpportunities.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {fundingOpportunities.map((opp, i) => (
                      <div key={i} className="bg-[#050b1a] border border-[#1e3a5f] rounded-xl p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-white leading-snug flex-1 mr-2">{opp.brand}</h3>
                          <Badge className="shrink-0 bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
                            {opp.fitScore}% fit
                          </Badge>
                        </div>
                        <Progress value={opp.fitScore} className="h-1.5 mb-3" />
                        <div className="space-y-1.5 text-xs text-gray-300">
                          <div><span className="text-gray-500">Value: </span>{opp.dealValue}</div>
                          <div><span className="text-gray-500">Type: </span>{opp.campaignType}</div>
                          <div><span className="text-gray-500">Requirements: </span>{opp.requirements}</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed">{opp.reasoning}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Landmark className="w-10 h-10 text-gray-700 mb-3" />
                    <p className="text-sm text-gray-500">Enter your focus area and scan for funding</p>
                    <p className="text-xs text-gray-600 mt-1">Surfaces grants, fellowships, and partnerships relevant to Africa intelligence journalism</p>
                  </div>
                )}
              </div>
            )}

          </CardContent>
        </Card>

        {/* Navigation to related tools */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Signal Monitor", desc: "Live PESTEL signals across all 55 nations", href: "/x-trends", color: "#a78bfa" },
            { label: "ViralMind", desc: "Game Theory content strategy from Africa signals", href: "/viralmind", color: "#22d3ee" },
            { label: "Africa Hub", desc: "Browse all 55 African nations", href: "/africa", color: "#34d399" },
          ].map((item, i) => (
            <button key={i} onClick={() => setLocation(item.href)}
              className="group flex items-center gap-3 bg-[#0d1e36] border border-[#1e3a5f] rounded-xl px-4 py-3 hover:border-white/20 transition-all text-left">
              <div className="w-2 h-8 rounded-full shrink-0" style={{ background: item.color, opacity: 0.6 }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-gray-500 truncate">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
