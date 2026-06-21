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
import { Loader2, Send, Sparkles, TrendingUp, Target, Lightbulb, CheckCircle2, ArrowRight } from "lucide-react";
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

  // Chat state
  const [chatMessage, setChatMessage] = useState("");

  // Content analyzer state
  const [contentTitle, setContentTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentType, setContentType] = useState<"video" | "image" | "text" | "audio" | "research">("video");
  const [analysisPlatform, setAnalysisPlatform] = useState<"youtube" | "tiktok" | "instagram" | "twitter" | "journal">("youtube");

  // Queries
  const { data: profile, isLoading: profileLoading } = trpc.aiAssistant.getProfile.useQuery();
  const { data: conversations } = trpc.aiAssistant.getConversations.useQuery({ sessionId });
  const { data: insights } = trpc.aiAssistant.getAnalyses.useQuery({ limit: 10 });
  const { data: activeGoals } = trpc.aiAssistant.getGoals.useQuery();
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
    },
  });

  const analyzeContent = trpc.aiAssistant.analyzeContent.useMutation({
    onSuccess: () => {
      toast.success("Game Theory analysis complete! Check the Insights tab for your strategic move.");
      setContentTitle("");
      setContentUrl("");
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

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    sendMessage.mutate({ message: chatMessage, sessionId: sessionId || undefined });
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
              <Sparkles className="w-6 h-6 text-purple-600" />
              <CardTitle className="text-2xl">Welcome to ViralMind</CardTitle>
            </div>
            <CardDescription>Your AI-powered personal assistant for viral content creation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {onboardingStep === "welcome" && (
              <div className="space-y-4">
                <p className="text-lg">
                  ViralMind learns your unique style and helps you create content that resonates with your audience.
                </p>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Personalized Recommendations</p>
                      <p className="text-sm text-muted-foreground">Get trend alerts tailored to your niche</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Content Analysis</p>
                      <p className="text-sm text-muted-foreground">Score your content for virality potential</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">24/7 AI Assistant</p>
                      <p className="text-sm text-muted-foreground">Chat anytime for optimization tips</p>
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
            <Sparkles className="w-8 h-8 text-purple-600" />
            ViralMind Assistant
          </h1>
          <p className="text-muted-foreground">Your AI-powered content creation companion</p>
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

      <Tabs defaultValue="chat" className="w-full">
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
              <CardDescription>Strategic content advice grounded in Game Theory and Africa political intelligence</CardDescription>
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
                    <p className="font-semibold">Start your Game Theory session</p>
                    <p className="text-sm mt-1 max-w-sm mx-auto">Ask about dominant content strategies, PESTEL signal angles, Nash positions in the Africa intelligence space, or how to build your contributor network.</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="e.g. What's the dominant strategy for Ghana legal content this week?"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={sendMessage.isPending}
                />
                <Button onClick={handleSendMessage} disabled={sendMessage.isPending || !chatMessage.trim()}>
                  {sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
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
              <CardDescription>Strategic value scoring — Nash position, dominant strategy, mission alignment, and PESTEL signal optimisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="contentTitle">Content Title *</Label>
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Active Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeGoals && activeGoals.length > 0 ? (
                  <div className="space-y-3">
                    {activeGoals.map((goal) => (
                      <div key={goal.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium">{goal.title}</p>
                          <Badge variant={goal.status === "completed" ? "default" : "secondary"}>
                            {goal.status}
                          </Badge>
                        </div>
                        {goal.description && <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress: {goal.currentValue}/{goal.targetValue}
                          </span>
                          <span className="font-medium">
                            {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No active goals yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Recent Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights && insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight: any) => (
                      <div key={insight.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm">{insight.insightType}</p>
                          <Badge variant="outline" className="text-xs">
                            {new Date(insight.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.content}</p>
                        {insight.actionable && (
                          <p className="text-xs text-primary mt-2">💡 Actionable</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No insights yet. Start analyzing content!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
