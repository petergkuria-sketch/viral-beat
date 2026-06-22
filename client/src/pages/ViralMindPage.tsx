import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Sparkles, TrendingUp, Target, Lightbulb, CheckCircle2, ArrowRight, Download, Share2, Check, Zap, Paperclip, X as XIcon, FileText } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type OnboardingStep = "welcome" | "platforms" | "verification" | "style" | "goals" | "complete";

export default function ViralMindPage() {
  // Toast notifications via sonner
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("welcome");
  const [sessionId, setSessionId] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Onboarding form state
  const [niche, setNiche] = useState("");
  const [primaryPlatform, setPrimaryPlatform] = useState<"youtube" | "tiktok" | "instagram" | "twitter">("youtube");
  const [audienceSize, setAudienceSize] = useState("");
  const [tone, setTone] = useState("");
  const [format, setFormat] = useState("");
  const [contentTopics, setContentTopics] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  
  // Social media verification state
  const [socialHandles, setSocialHandles] = useState<Record<string, string>>({
    youtube: "",
    tiktok: "",
    instagram: "",
    twitter: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [selectedPlatformForVerification, setSelectedPlatformForVerification] = useState<"youtube" | "tiktok" | "instagram" | "twitter" | null>(null);

  // Tab control
  const [activeTab, setActiveTab] = useState("chat");

  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [fileExtracting, setFileExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Content analyzer state
  const [contentTitle, setContentTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentType, setContentType] = useState<"video" | "image" | "text" | "audio" | "research">("video");
  const [analysisPlatform, setAnalysisPlatform] = useState<"youtube" | "tiktok" | "instagram" | "twitter" | "journal">("youtube");
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);

  // Queries
  const utils = trpc.useUtils();

  const { data: profile, isLoading: profileLoading } = trpc.aiAssistant.getProfile.useQuery();
  const { data: conversations } = trpc.aiAssistant.getConversations.useQuery({ sessionId });
  const { data: insights } = trpc.aiAssistant.getAnalyses.useQuery({ limit: 10 });

  const { data: verificationStatus } = trpc.aiAssistant.getVerificationStatus.useQuery();

  // Mutations
  const completeOnboarding = trpc.aiAssistant.completeOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Profile created! ViralMind is ready to help you succeed.");
      setShowOnboarding(false);
    },
  });

  const sendMessage = trpc.aiAssistant.chat.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setChatMessage("");
      setAttachedFile(null);
    },
  });

  const analyzeContent = trpc.aiAssistant.analyzeContent.useMutation({
    onSuccess: async () => {
      toast.success("Game Theory analysis complete!");
      setContentTitle("");
      setContentUrl("");
      await utils.aiAssistant.getAnalyses.invalidate();
      setActiveTab("insights");
    },
  });

  const linkSocialHandle = trpc.aiAssistant.linkSocialHandle.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const generateVerificationCode = trpc.aiAssistant.generateVerificationCode.useMutation({
    onSuccess: (data) => {
      setVerificationCode(data.code);
      toast.success("Verification code generated! Follow the instructions to verify your account.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifySocialHandle = trpc.aiAssistant.verifySocialHandle.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setVerificationCode("");
      setSelectedPlatformForVerification(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Check if onboarding is needed
  useEffect(() => {
    if (!profileLoading && profile && !profile.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [profile, profileLoading]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  const handleOnboardingNext = () => {
    if (onboardingStep === "welcome") setOnboardingStep("platforms");
    else if (onboardingStep === "platforms") setOnboardingStep("verification");
    else if (onboardingStep === "verification") setOnboardingStep("style");
    else if (onboardingStep === "style") setOnboardingStep("goals");
    else if (onboardingStep === "goals") {
      completeOnboarding.mutate({
        niche,
        primaryPlatform,
        audienceSize: parseInt(audienceSize) || 0,
        averageViews: 0, // Will be updated based on actual content performance
        tone,
        format,
        contentTopics,
        goals: { shortTerm: goals[0] || "", longTerm: goals.slice(1).join(", ") || "" },
        challenges,
      });
      setOnboardingStep("complete");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileExtracting(true);
    try {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        // Dynamic import with CDN worker — avoids Vite bundler issues with pdfjs v6
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          // Reconstruct lines by grouping items with same Y position
          const lineMap = new Map<number, string[]>();
          for (const item of content.items as any[]) {
            const y = Math.round(item.transform[5]);
            if (!lineMap.has(y)) lineMap.set(y, []);
            lineMap.get(y)!.push(item.str);
          }
          const sortedY = [...lineMap.keys()].sort((a, b) => b - a);
          pages.push(sortedY.map(y => lineMap.get(y)!.join(" ")).join("\n"));
        }
        const text = pages.join("\n\n").trim();
        if (!text) throw new Error("No text found — the PDF may be image-based (scanned).");
        const capped = text.slice(0, 80000);
        setAttachedFile({ name: file.name, content: capped });
        toast.success(`Extracted ${pdf.numPages} pages (${Math.round(capped.length / 1000)}k chars) — ready to send`);
      } else {
        const text = (await file.text()).trim().slice(0, 80000);
        if (!text) throw new Error("File appears empty.");
        setAttachedFile({ name: file.name, content: text });
        toast.success(`${file.name} ready — ${Math.round(text.length / 1000)}k chars`);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Could not read this file. Try PDF or plain text.");
    } finally {
      setFileExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() && !attachedFile) return;
    const snapshot = attachedFile; // capture before any re-render
    sendMessage.mutate({
      message: chatMessage.trim() || `Analyse this document: ${snapshot?.name}`,
      sessionId: sessionId || undefined,
      fileContent: snapshot?.content,
      fileName: snapshot?.name,
    });
  };

  const handleAnalyzeContent = () => {
    if (!contentTitle.trim()) {
      toast.error("Please provide a content title.");
      return;
    }
    analyzeContent.mutate({
      title: contentTitle,
      contentUrl: contentUrl || undefined,
      contentType,
      platform: analysisPlatform,
    });
  };

  // Import last user message from chat into analyser title
  const handleImportFromChat = () => {
    const lastUserMsg = conversations?.find((m: any) => m.role === "user");
    if (lastUserMsg) {
      setContentTitle(lastUserMsg.message.slice(0, 120));
      setActiveTab("analyze");
      toast.success("Chat topic imported into analyser.");
    } else {
      toast.error("No chat messages found to import.");
    }
  };

  const buildAnalysisText = (insight: any) => {
    const perf = (() => { try { return JSON.parse(insight.predictedPerformance || "{}"); } catch { return {}; } })();
    const recs = (() => { try { return JSON.parse(insight.recommendations || "[]"); } catch { return []; } })();
    const strengths = (() => { try { return JSON.parse(insight.strengths || "[]"); } catch { return []; } })();
    const tags = (() => { try { return JSON.parse(insight.optimizedHashtags || "[]"); } catch { return []; } })();
    return [
      `VIRALBEAT — GAME THEORY CONTENT ANALYSIS`,
      `Generated: ${new Date(insight.createdAt).toLocaleDateString()}`,
      ``,
      `CONTENT: ${insight.contentTitle}`,
      `PLATFORM: ${insight.platform?.toUpperCase()} | TYPE: ${insight.contentType?.toUpperCase()}`,
      `GAME THEORY SCORE: ${insight.viralityScore}/10`,
      ``,
      perf.gameTheoryMove ? `DOMINANT STRATEGY MOVE\n${perf.gameTheoryMove}` : "",
      perf.missionAlignment ? `MISSION ALIGNMENT: ${perf.missionAlignment}` : "",
      ``,
      `OPTIMISED TITLE (NASH SIGNAL)\n${insight.optimizedTitle}`,
      ``,
      strengths.length ? `STRATEGIC STRENGTHS\n${strengths.map((s: string) => `+ ${s}`).join("\n")}` : "",
      ``,
      recs.length ? `STRATEGIC MOVES\n${recs.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}` : "",
      ``,
      tags.length ? `PESTEL SIGNAL TAGS\n${tags.join("  ")}` : "",
      ``,
      `— ViralBeat Africa Political Intelligence | viralbeat.io`,
    ].filter(Boolean).join("\n");
  };

  const handleShareAnalysis = async (insight: any) => {
    const text = buildAnalysisText(insight);
    if (navigator.share) {
      await navigator.share({ title: `ViralBeat GT Analysis — ${insight.contentTitle}`, text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedAnalysis(true);
      toast.success("Analysis copied to clipboard.");
      setTimeout(() => setCopiedAnalysis(false), 2000);
    }
  };

  const handleDownloadAnalysis = (insight: any) => {
    const text = buildAnalysisText(insight);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `viralbeat-gt-analysis-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Onboarding wizard
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <CardTitle className="text-2xl">Welcome to ViralMind</CardTitle>
            </div>
            <CardDescription>Your Game Theory strategist for Africa intelligence content — powered by ViralBeat signals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {onboardingStep === "welcome" && (
              <div className="space-y-4">
                <p className="text-lg">
                  ViralMind maps the Game Theory landscape of Africa intelligence — then tells you the dominant move for your content.
                </p>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Signal-to-Story</p>
                      <p className="text-sm text-muted-foreground">Turn PESTEL signals from 55 nations into content angles your audience hasn't seen yet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Game Theory Analyser</p>
                      <p className="text-sm text-muted-foreground">Score any piece of content for strategic value, Nash position, and mission alignment</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Intelligence-Backed Briefs</p>
                      <p className="text-sm text-muted-foreground">Generate citation-ready intelligence briefs for any African country or political moment</p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleOnboardingNext} className="w-full">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {onboardingStep === "platforms" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tell us about your content</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="niche">What's your niche?</Label>
                    <Input
                      id="niche"
                      placeholder="e.g., Tech reviews, Cooking, Gaming"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform">Primary Platform</Label>
                    <Select value={primaryPlatform} onValueChange={(v: any) => setPrimaryPlatform(v)}>
                      <SelectTrigger id="platform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="audience">Current Audience Size</Label>
                    <Input
                      id="audience"
                      type="number"
                      placeholder="e.g., 5000"
                      value={audienceSize}
                      onChange={(e) => setAudienceSize(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleOnboardingNext} className="w-full">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {onboardingStep === "verification" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Verify Your Social Media Accounts</h3>
                <p className="text-sm text-muted-foreground">
                  Link your social media handles to unlock personalized insights and activate ViralMind assistant.
                </p>
                <div className="space-y-4">
                  {(["youtube", "tiktok", "instagram", "twitter"] as const).map((platform) => (
                    <div key={platform} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="capitalize">{platform === "twitter" ? "Twitter/X" : platform}</Label>
                        {verificationStatus?.[platform]?.verified && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder={`@${platform}handle`}
                          value={socialHandles[platform]}
                          onChange={(e) =>
                            setSocialHandles({ ...socialHandles, [platform]: e.target.value })
                          }
                          disabled={verificationStatus?.[platform]?.verified}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (socialHandles[platform]) {
                              linkSocialHandle.mutate({
                                platform,
                                handle: socialHandles[platform],
                              });
                            }
                          }}
                          disabled={!socialHandles[platform] || verificationStatus?.[platform]?.verified}
                        >
                          Link
                        </Button>
                      </div>
                      {verificationStatus?.[platform]?.handle && !verificationStatus?.[platform]?.verified && (
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPlatformForVerification(platform);
                              generateVerificationCode.mutate({ platform });
                            }}
                            disabled={generateVerificationCode.isPending}
                          >
                            Generate Verification Code
                          </Button>
                          {selectedPlatformForVerification === platform && verificationCode && (
                            <div className="bg-muted p-3 rounded space-y-2">
                              <p className="text-sm font-mono font-bold">{verificationCode}</p>
                              <p className="text-xs text-muted-foreground">
                                Post "ViralBeat Verification: {verificationCode}" on your {platform} profile or bio.
                              </p>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Enter code to verify"
                                  onChange={(e) => setVerificationCode(e.target.value)}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    verifySocialHandle.mutate({
                                      platform,
                                      verificationCode,
                                    });
                                  }}
                                >
                                  Verify
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOnboardingStep("platforms")} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleOnboardingNext} className="flex-1">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {onboardingStep === "style" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Define your content style</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Input
                      id="tone"
                      placeholder="e.g., Casual, Professional, Humorous"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="format">Preferred Format</Label>
                    <Input
                      id="format"
                      placeholder="e.g., Short-form, Long-form, Tutorials"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="topics">Content Topics (comma-separated)</Label>
                    <Input
                      id="topics"
                      placeholder="e.g., AI trends, Product reviews, How-tos"
                      onChange={(e) => setContentTopics(e.target.value.split(",").map((t) => t.trim()))}
                    />
                  </div>
                </div>
                <Button onClick={handleOnboardingNext} className="w-full">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {onboardingStep === "goals" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Set your goals</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="goals">What do you want to achieve? (comma-separated)</Label>
                    <Textarea
                      id="goals"
                      placeholder="e.g., Reach 100K subscribers, Increase engagement by 50%, Monetize content"
                      onChange={(e) => setGoals(e.target.value.split(",").map((g) => g.trim()))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="challenges">What challenges do you face? (comma-separated)</Label>
                    <Textarea
                      id="challenges"
                      placeholder="e.g., Low engagement, Inconsistent posting, Finding trending topics"
                      onChange={(e) => setChallenges(e.target.value.split(",").map((c) => c.trim()))}
                    />
                  </div>
                </div>
                <Button onClick={handleOnboardingNext} className="w-full" disabled={completeOnboarding.isPending}>
                  {completeOnboarding.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Complete Setup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main ViralMind interface
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            ViralMind
          </h1>
          <p className="text-muted-foreground">Africa intelligence through Game Theory — strategy, signal, and story</p>
        </div>
        {profile && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {profile.niche || "Creator"} • {profile.primaryPlatform || "Multi-platform"}
            </Badge>
            {(profile.youtubeVerified || profile.tiktokVerified || profile.instagramVerified || profile.twitterVerified) && (
              <VerifiedBadge size="sm" variant="inline" tooltipText="Verified social media account" />
            )}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="analyze">Game Theory Analyser</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                ViralMind — Game Theory Strategist
              </CardTitle>
              <CardDescription>Explore dominant strategies, signal angles, and Nash positions in Africa's intelligence landscape — then build content that wins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-muted/20">
                {conversations && conversations.length > 0 ? (
                  conversations.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <Streamdown>{msg.message}</Streamdown>
                        ) : (
                          <p className="text-sm">{msg.message}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-semibold">What signal do you want to own?</p>
                    <p className="text-sm mt-1 max-w-sm mx-auto">Start with a country, theme, or political moment — ViralMind maps the Game Theory landscape and tells you the dominant move.</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* File attachment chip */}
              {attachedFile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-sm">
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-cyan-300 text-xs truncate flex-1">{attachedFile.name}</span>
                  <span className="text-gray-500 text-xs shrink-0">{Math.round(attachedFile.content.length / 1000)}k chars</span>
                  <button onClick={() => setAttachedFile(null)} className="text-gray-500 hover:text-white shrink-0">
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.csv,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {/* Upload button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fileExtracting || sendMessage.isPending}
                  title="Attach a document (PDF, TXT, CSV)"
                >
                  {fileExtracting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Paperclip className="w-4 h-4" />}
                </Button>

                <Input
                  placeholder={attachedFile ? "Add context or a specific question about this document…" : "e.g. What's the dominant strategy for Ghana legal content this week?"}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={sendMessage.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessage.isPending || (!chatMessage.trim() && !attachedFile)}
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {conversations && conversations.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={handleImportFromChat}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Analyse in Game Theory — Import last topic to Analyser
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Game Theory Content Analyser
              </CardTitle>
              <CardDescription>Drop a title, pick your platform — ViralMind scores the strategic value, finds the Nash position, and tells you the single move that dominates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="contentTitle">Content Title or Thesis *</Label>
                  <Input
                    id="contentTitle"
                    placeholder="e.g., Ghana's Anti-LGBTQ Law and the International Aid Payoff Matrix"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contentUrl">Content URL (optional)</Label>
                  <Input
                    id="contentUrl"
                    placeholder="https://..."
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select value={contentType} onValueChange={(v: any) => setContentType(v)}>
                      <SelectTrigger id="contentType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="text">Text / Article</SelectItem>
                        <SelectItem value="audio">Audio / Podcast</SelectItem>
                        <SelectItem value="research">Research Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="analysisPlatform">Platform</Label>
                    <Select value={analysisPlatform} onValueChange={(v: any) => setAnalysisPlatform(v)}>
                      <SelectTrigger id="analysisPlatform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="journal">Journal / Newspaper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAnalyzeContent} disabled={analyzeContent.isPending} className="w-full">
                  {analyzeContent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Run Game Theory Analysis
                </Button>
              </div>

              {analyzeContent.data && (
                <div className="mt-6 space-y-4 border-t pt-4">
                  {/* Dominant strategy move */}
                  {analyzeContent.data.gameTheoryMove && (
                    <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3">
                      <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Dominant Strategy Move</p>
                      <p className="text-sm text-white">{analyzeContent.data.gameTheoryMove}</p>
                    </div>
                  )}

                  {/* Score + mission alignment row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Game Theory Score</p>
                      <p className="text-3xl font-black text-cyan-400">{analyzeContent.data.viralityScore}<span className="text-sm text-muted-foreground font-normal">/10</span></p>
                    </div>
                    <div className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Mission Alignment</p>
                      <p className={`text-xl font-black ${analyzeContent.data.missionAlignment?.startsWith("High") ? "text-green-400" : analyzeContent.data.missionAlignment?.startsWith("Medium") ? "text-yellow-400" : "text-red-400"}`}>
                        {analyzeContent.data.missionAlignment?.split(" — ")[0] || analyzeContent.data.missionAlignment}
                      </p>
                      {analyzeContent.data.missionAlignment?.includes(" — ") && (
                        <p className="text-xs text-muted-foreground mt-1">{analyzeContent.data.missionAlignment.split(" — ")[1]}</p>
                      )}
                    </div>
                  </div>

                  {/* Optimised title */}
                  <div className="rounded-xl bg-muted/20 border border-border/50 px-4 py-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Optimised Title (Nash Signal)</p>
                    <p className="text-sm font-semibold text-white">{analyzeContent.data.optimizedTitle}</p>
                  </div>

                  {/* Strengths + weaknesses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Strategic Strengths</p>
                      <ul className="space-y-1">
                        {analyzeContent.data.strengths?.map((s: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-green-400 shrink-0">+</span>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Strategic Gaps</p>
                      <ul className="space-y-1">
                        {analyzeContent.data.weaknesses?.map((w: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-red-400 shrink-0">−</span>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Strategic Moves</p>
                    <ol className="space-y-1.5">
                      {analyzeContent.data.recommendations?.map((r: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>{r}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">PESTEL Signal Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analyzeContent.data.optimizedHashtags?.map((tag: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-cyan-400" />
              Game Theory Analysis History
            </h2>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {insights?.length || 0} analyses
            </Badge>
          </div>

          {insights && insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight: any) => {
                const perf = (() => { try { return JSON.parse(insight.predictedPerformance || "{}"); } catch { return {}; } })();
                const recs: string[] = (() => { try { return JSON.parse(insight.recommendations || "[]"); } catch { return []; } })();
                const strengths: string[] = (() => { try { return JSON.parse(insight.strengths || "[]"); } catch { return []; } })();
                const weaknesses: string[] = (() => { try { return JSON.parse(insight.weaknesses || "[]"); } catch { return []; } })();
                const tags: string[] = (() => { try { return JSON.parse(insight.optimizedHashtags || "[]"); } catch { return []; } })();
                const gtMove: string = perf.gameTheoryMove || "";
                const missionAlign: string = perf.missionAlignment || insight.missionAlignment || "";
                const alignTier = missionAlign.startsWith("High") ? "text-green-400" : missionAlign.startsWith("Medium") ? "text-yellow-400" : "text-red-400";

                return (
                  <Card key={insight.id} className="border border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base leading-snug">{insight.contentTitle}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs capitalize">{insight.platform}</Badge>
                            <Badge variant="outline" className="text-xs capitalize">{insight.contentType}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(insight.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-cyan-400">{insight.viralityScore}<span className="text-xs text-muted-foreground font-normal">/10</span></p>
                          <p className="text-xs text-muted-foreground">GT Score</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {gtMove && (
                        <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/25 px-3 py-2">
                          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Dominant Strategy Move</p>
                          <p className="text-xs text-foreground/80">{gtMove}</p>
                        </div>
                      )}

                      {missionAlign && (
                        <p className="text-xs"><span className="text-muted-foreground">Mission Alignment: </span><span className={alignTier + " font-semibold"}>{missionAlign.split(" — ")[0]}</span>{missionAlign.includes(" — ") && <span className="text-muted-foreground"> — {missionAlign.split(" — ")[1]}</span>}</p>
                      )}

                      {insight.optimizedTitle && (
                        <div className="rounded-lg bg-muted/20 px-3 py-2">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Optimised Title</p>
                          <p className="text-xs font-semibold">{insight.optimizedTitle}</p>
                        </div>
                      )}

                      {(strengths.length > 0 || weaknesses.length > 0) && (
                        <div className="grid grid-cols-2 gap-3">
                          {strengths.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">Strengths</p>
                              <ul className="space-y-0.5">{strengths.slice(0, 3).map((s, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-green-400 shrink-0">+</span>{s}</li>)}</ul>
                            </div>
                          )}
                          {weaknesses.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Gaps</p>
                              <ul className="space-y-0.5">{weaknesses.slice(0, 3).map((w, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-red-400 shrink-0">−</span>{w}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      )}

                      {recs.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Strategic Moves</p>
                          <ol className="space-y-0.5">{recs.slice(0, 3).map((r, i) => <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>{r}</li>)}</ol>
                        </div>
                      )}

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">{tag}</span>)}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => handleShareAnalysis(insight)}>
                          {copiedAnalysis ? <Check className="w-3 h-3 mr-1.5" /> : <Share2 className="w-3 h-3 mr-1.5" />}
                          Share
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => handleDownloadAnalysis(insight)}>
                          <Download className="w-3 h-3 mr-1.5" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-muted-foreground">Your strategy library starts here</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Run your first Game Theory analysis — every result is saved here as a reusable strategy card you can share, download, or iterate on.</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("chat")}>
                    Explore in Chat
                  </Button>
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold" onClick={() => setActiveTab("analyze")}>
                    Run First Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
