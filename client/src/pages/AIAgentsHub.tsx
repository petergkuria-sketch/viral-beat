import { useState, useEffect } from "react";
import { useViewPreference } from "@/_core/hooks/useViewPreference";
import { ViewToggle } from "@/components/ViewToggle";
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
    tagline: "Triangulate. Validate. Publish.",
    desc: "Enter a raw signal — the agent applies PESTEL analysis, maps actor Game Theory, assesses source confidence, then packages the validated intelligence for X threads, newsletters, NGO SitReps, and diplomatic cables.",
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
  const [agentView, setAgentView] = useViewPreference("ai_agents", "icon");
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
  const [adaptorSignal, setAdaptorSignal] = useState("");
  const [adaptorCountry, setAdaptorCountry] = useState("");
  const [adaptorActors, setAdaptorActors] = useState("");
  const [adaptorPestel, setAdaptorPestel] = useState<string[]>(["political"]);
  const [adaptorConfidence, setAdaptorConfidence] = useState<any>("single-source");
  const [adaptorFormats, setAdaptorFormats] = useState<string[]>(["thread", "newsletter"]);
  const [adaptedOutputs, setAdaptedOutputs] = useState<any[]>([]);
  const [adaptorMeta, setAdaptorMeta] = useState<{ signal: string; pestel: string[]; confidence: string } | null>(null);

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
      setAdaptorMeta({ signal: data.signal, pestel: data.pestelDimensions, confidence: data.confidenceTier });
      toast.success("Intelligence brief triangulated.");
    },
    onError: (err: any) => toast.error("Triangulation failed: " + err.message),
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
          <ViewToggle
            options={[{ value: "icon", label: "Icon" }, { value: "classic", label: "Classic" }]}
            current={agentView}
            onChange={setAgentView}
          />
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* Agent selector — icon mode */}
        {agentView === "icon" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {AGENTS.map(agent => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`group flex flex-col items-center gap-2.5 rounded-2xl border px-3 py-4 transition-all ${
                  activeAgent === agent.id ? `${agent.bg} ${agent.border}` : "bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ background: activeAgent === agent.id ? `${agent.accent}22` : "rgba(255,255,255,0.05)" }}>
                  <agent.icon className="w-6 h-6" style={{ color: activeAgent === agent.id ? agent.accent : "#6b7280" }} />
                </div>
                <p className={`text-xs font-bold text-center leading-tight ${activeAgent === agent.id ? "text-white" : "text-gray-300"}`}>
                  {agent.name}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Agent selector — classic mode */}
        {agentView === "classic" && (
          <div className="flex flex-col gap-2">
            {AGENTS.map(agent => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left ${
                  activeAgent === agent.id ? `${agent.bg} ${agent.border}` : "bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15"
                }`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: activeAgent === agent.id ? `${agent.accent}20` : "rgba(255,255,255,0.05)" }}>
                  <agent.icon className="w-4 h-4" style={{ color: activeAgent === agent.id ? agent.accent : "#6b7280" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${activeAgent === agent.id ? "text-white" : "text-gray-300"}`}>{agent.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{agent.tagline}</p>
                </div>
              </button>
            ))}
          </div>
        )}

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
                    onClick={() => {
                      const audienceLabels: Record<string, string> = {
                        educational: "Journalist / Editor",
                        entertainment: "General Public",
                        promotional: "NGO / Researcher",
                        storytelling: "Policy / Government",
                      };
                      generateBrief.mutate({
                        topic: `${briefCountry} — ${PESTEL.find(p => p.value === briefPestel)?.label} Intelligence Brief — Audience: ${audienceLabels[briefAudience] ?? briefAudience}`,
                        platform: "twitter",
                        duration: briefDuration,
                        tone: briefRegister,
                      });
                    }}
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
              <div className="space-y-5">

                {/* Triangulation explainer */}
                <div className="flex gap-3 text-xs text-gray-400 bg-pink-500/5 border border-pink-500/15 rounded-xl px-4 py-3">
                  <span className="text-pink-400 font-bold shrink-0">▲</span>
                  <span>Briefs are triangulated across three axes before output — <strong className="text-gray-200">PESTEL</strong> (what forces are active), <strong className="text-gray-200">Game Theory</strong> (actors, dominant strategies, Nash equilibrium), and <strong className="text-gray-200">Source Confidence</strong>. The same validated intelligence core is packaged for each target format.</span>
                </div>

                <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
                  {/* ── INPUT PANEL ── */}
                  <div className="space-y-4">

                    {/* Signal */}
                    <div>
                      <Label className="text-gray-300">Intelligence Signal</Label>
                      <Textarea
                        placeholder="Describe the event, development, or signal to triangulate — e.g. 'Kenya government announced fuel levy increase amid opposition protests in Nairobi, Kisumu and Mombasa'"
                        value={adaptorSignal}
                        onChange={e => setAdaptorSignal(e.target.value)}
                        className="mt-1.5 bg-[#050b1a] border-[#1e3a5f] text-white min-h-[100px] text-sm"
                      />
                      <p className="text-xs text-gray-600 mt-1 italic">Optional — a specific signal gives targeted output. Leave blank to run a general Africa political landscape triangulation.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Country */}
                      <div>
                        <Label className="text-gray-300">Country / Region</Label>
                        <Input
                          placeholder="e.g., Kenya, West Africa…"
                          value={adaptorCountry}
                          onChange={e => setAdaptorCountry(e.target.value)}
                          className="mt-1.5 bg-[#050b1a] border-[#1e3a5f] text-white text-sm"
                        />
                      </div>
                      {/* Confidence tier */}
                      <div>
                        <Label className="text-gray-300">Source Confidence</Label>
                        <Select value={adaptorConfidence} onValueChange={setAdaptorConfidence}>
                          <SelectTrigger className="mt-1.5 bg-[#050b1a] border-[#1e3a5f] text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                            <SelectItem value="corroborated">Corroborated (3+ sources)</SelectItem>
                            <SelectItem value="single-source">Single-Source</SelectItem>
                            <SelectItem value="unverified">Unverified / Signal only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Actors */}
                    <div>
                      <Label className="text-gray-300">Key Actors <span className="text-gray-500 font-normal">(optional)</span></Label>
                      <Input
                        placeholder="e.g., Ruto, opposition coalition, IMF, Kenya police…"
                        value={adaptorActors}
                        onChange={e => setAdaptorActors(e.target.value)}
                        className="mt-1.5 bg-[#050b1a] border-[#1e3a5f] text-white text-sm"
                      />
                      <p className="text-[11px] text-gray-600 mt-1">Game Theory axis: payoff matrices and dominant strategies will be mapped for these actors</p>
                    </div>

                    {/* PESTEL dimensions */}
                    <div>
                      <Label className="text-gray-300 block mb-1.5">Active PESTEL Dimensions</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { v: "political",      l: "Political",      c: "pink" },
                          { v: "economic",       l: "Economic",       c: "pink" },
                          { v: "social",         l: "Social",         c: "pink" },
                          { v: "technological",  l: "Technological",  c: "pink" },
                          { v: "environmental",  l: "Environmental",  c: "pink" },
                          { v: "legal",          l: "Legal",          c: "pink" },
                        ].map(dim => {
                          const active = adaptorPestel.includes(dim.v);
                          return (
                            <button key={dim.v}
                              onClick={() => setAdaptorPestel(active
                                ? adaptorPestel.filter(d => d !== dim.v)
                                : [...adaptorPestel, dim.v])}
                              className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                active
                                  ? "bg-pink-500/15 border-pink-500/40 text-pink-300"
                                  : "bg-[#050b1a] border-[#1e3a5f] text-gray-500 hover:border-pink-500/20"
                              }`}>
                              {dim.l}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Output formats */}
                    <div>
                      <Label className="text-gray-300 block mb-1.5">Output Formats</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { v: "thread",     l: "X / Twitter Thread",        sub: "6–8 tweets, hook → Nash position" },
                          { v: "newsletter", l: "Intelligence Newsletter",    sub: "PESTEL breakdown + actor matrix" },
                          { v: "sitrep",     l: "NGO Situation Report",       sub: "Formal, citation-ready, risk matrix" },
                          { v: "cable",      l: "Diplomatic Intelligence Cable", sub: "Actor positions + regional implications" },
                        ].map(fmt => {
                          const active = adaptorFormats.includes(fmt.v);
                          return (
                            <label key={fmt.v}
                              className={`flex flex-col gap-0.5 p-3 rounded-lg border cursor-pointer transition-all ${
                                active
                                  ? "bg-pink-500/10 border-pink-500/35"
                                  : "bg-[#050b1a] border-[#1e3a5f] hover:border-pink-500/20"
                              }`}>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={active}
                                  onChange={e => setAdaptorFormats(e.target.checked
                                    ? [...adaptorFormats, fmt.v]
                                    : adaptorFormats.filter(f => f !== fmt.v))}
                                  className="w-3.5 h-3.5 accent-pink-500 shrink-0"
                                />
                                <span className={`text-xs font-semibold ${active ? "text-pink-300" : "text-gray-300"}`}>{fmt.l}</span>
                              </div>
                              <p className="text-[10px] text-gray-600 ml-5">{fmt.sub}</p>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      onClick={() => adaptBrief.mutate({
                        signal: adaptorSignal.trim() || "General Africa political landscape — surface the most significant current PESTEL signals",
                        country: adaptorCountry || undefined,
                        actors: adaptorActors || undefined,
                        pestelDimensions: adaptorPestel as any,
                        confidenceTier: adaptorConfidence,
                        targetFormats: adaptorFormats as any,
                      })}
                      disabled={adaptBrief.isPending || adaptorPestel.length === 0 || adaptorFormats.length === 0}
                      className="w-full bg-pink-500 hover:bg-pink-400 text-white font-bold"
                    >
                      {adaptBrief.isPending
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Triangulating…</>
                        : <><FileOutput className="w-4 h-4 mr-2" />Triangulate & Generate</>}
                    </Button>
                  </div>

                  {/* ── OUTPUT PANEL ── */}
                  <div className="space-y-4 max-h-[720px] overflow-y-auto">

                    {adaptorMeta && (
                      <div className="bg-[#050b1a] border border-pink-500/20 rounded-xl px-4 py-3 space-y-1.5">
                        <p className="text-[11px] font-bold text-pink-400 uppercase tracking-wider">Triangulation Receipt</p>
                        <p className="text-xs text-gray-300"><span className="text-gray-500">Signal: </span>{adaptorMeta.signal}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {adaptorMeta.pestel.map(d => (
                            <Badge key={d} className="bg-pink-500/10 text-pink-400 border-pink-500/25 text-[10px] capitalize">{d}</Badge>
                          ))}
                          <Badge className={`text-[10px] border ${
                            adaptorMeta.confidence === "corroborated"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                              : adaptorMeta.confidence === "single-source"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/25"
                              : "bg-red-500/10 text-red-400 border-red-500/25"
                          }`}>
                            {adaptorMeta.confidence === "corroborated" ? "✓ Corroborated"
                              : adaptorMeta.confidence === "single-source" ? "⚠ Single-Source"
                              : "⚡ Unverified"}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {adaptedOutputs.length > 0 ? (
                      <>
                        {/* Download All button */}
                        {adaptedOutputs.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              className="inline-flex items-center gap-1.5 h-7 px-3 text-xs rounded border border-pink-500/40 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 transition-colors"
                              onClick={() => {
                                const combined = adaptedOutputs.map(o =>
                                  `=== ${(o.format ?? o.platform).toUpperCase()} ===\n\n${o.content}`
                                ).join("\n\n---\n\n");
                                handleDownload(combined, `viralbeat-brief-adaptor-${Date.now()}.txt`);
                              }}
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download All ({adaptedOutputs.length} formats)
                            </button>
                          </div>
                        )}

                        {adaptedOutputs.map((out, i) => (
                          <div key={i} className="bg-[#050b1a] border border-[#1e3a5f] rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e3a5f]">
                              <p className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                                {out.format ?? out.platform}
                              </p>
                              <div className="flex gap-1.5">
                                <button className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                  onClick={() => handleCopy(out.content)}>
                                  {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                  {copied ? "Copied" : "Copy"}
                                </button>
                                <button className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                  onClick={() => handleDownload(out.content, `viralbeat-${out.platform ?? out.format}-${Date.now()}.txt`)}>
                                  <Download className="w-3 h-3" />
                                  Download
                                </button>
                              </div>
                            </div>
                            <div className="p-4">
                              <Streamdown className="prose prose-invert prose-sm max-w-none">{out.content}</Streamdown>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <FileOutput className="w-10 h-10 text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500">Triangulated outputs appear here</p>
                        <p className="text-[11px] text-gray-600 mt-1.5 max-w-[240px] leading-relaxed">Enter a signal, select PESTEL dimensions and target formats, then run triangulation</p>
                      </div>
                    )}
                  </div>
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
