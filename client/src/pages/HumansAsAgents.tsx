import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Coins, Link as LinkIcon, TrendingUp, Users, Award, Sparkles, Trophy } from "lucide-react";
import { showTokenNotification } from "@/lib/tokenNotifications";

export default function HumansAsAgents() {
  const { user, loading: authLoading } = useAuth();
  const [submissionForm, setSubmissionForm] = useState({
    contentUrl: "",
    category: "entertainment" as any,
    title: "",
    description: "",
    submitterAnalysis: "",
  });

  // Get user's HaA stats
  const { data: haaStats } = trpc.haa.getMyHaaStats.useQuery(undefined, {
    enabled: !!user,
  });

  // Get user's submissions
  const { data: mySubmissions, refetch: refetchSubmissions } = trpc.haa.getMySubmissions.useQuery(
    { limit: 10, offset: 0 },
    { enabled: !!user }
  );

  // Submit viral content mutation
  const submitMutation = trpc.haa.submitViralContent.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      showTokenNotification("earn_upvote_received", { amount: data.vbtAwarded, newBalance: data.vbtAwarded, description: "Content submission rewarded" });
      setSubmissionForm({
        contentUrl: "",
        category: "entertainment",
        title: "",
        description: "",
        submitterAnalysis: "",
      });
      refetchSubmissions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!submissionForm.contentUrl) {
      toast.error("Please enter a content URL");
      return;
    }

    submitMutation.mutate(submissionForm);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "verified_viral":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "spam":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    }
  };

  const getPlatformIcon = (platform: string) => {
    // Return platform-specific styling
    const platformColors: Record<string, string> = {
      tiktok: "bg-black text-white",
      youtube: "bg-red-600 text-white",
      twitter: "bg-blue-400 text-white",
      instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      facebook: "bg-blue-600 text-white",
      linkedin: "bg-blue-700 text-white",
      reddit: "bg-orange-600 text-white",
      other: "bg-gray-600 text-white",
    };
    return platformColors[platform] || platformColors.other;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050b1a] via-[#0d1e36] to-[#050b1a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/haa/leaderboard"}
            className="bg-[#0d1e36] border-yellow-500/30 hover:bg-yellow-500/10"
          >
            <Trophy className="w-4 h-4 mr-2" />
            View Leaderboard
          </Button>
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Humans As Agents (HaA)
          </h1>
          <p className="text-xl text-gray-300">
            Crowdsource viral intelligence. Earn premium VBT rewards for discovering trending content.
          </p>
        </div>

        {/* Stats Cards */}
        {user && haaStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#0d1e36] border-cyan-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Submissions</p>
                    <p className="text-3xl font-bold text-cyan-400">{haaStats.totalSubmissions}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1e36] border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Accepted</p>
                    <p className="text-3xl font-bold text-green-400">{haaStats.acceptedSubmissions}</p>
                  </div>
                  <Award className="w-10 h-10 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1e36] border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Acceptance Rate</p>
                    <p className="text-3xl font-bold text-purple-400">{haaStats.acceptanceRate}%</p>
                  </div>
                  <Sparkles className="w-10 h-10 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1e36] border-yellow-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">VBT Earned</p>
                    <p className="text-3xl font-bold text-yellow-400">{haaStats.totalVbtEarned}</p>
                  </div>
                  <Coins className="w-10 h-10 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission Form */}
          <Card className="bg-[#0d1e36] border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-400">Submit Viral Content</CardTitle>
              <CardDescription className="text-gray-400">
                Share trending content you've discovered. Earn 100-1000 VBT based on quality and virality.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Content URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://tiktok.com/@user/video/123..."
                  value={submissionForm.contentUrl}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, contentUrl: e.target.value })}
                  className="bg-[#050b1a] border-[#1e3a5f]"
                />
                <p className="text-xs text-gray-500">
                  Supported: TikTok, YouTube, Twitter, Instagram, Facebook, LinkedIn, Reddit
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={submissionForm.category}
                  onValueChange={(value: any) => setSubmissionForm({ ...submissionForm, category: value })}
                >
                  <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Brief title or description"
                  value={submissionForm.title}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                  className="bg-[#050b1a] border-[#1e3a5f]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="analysis">Why is this viral? (Optional - +100 VBT)</Label>
                <Textarea
                  id="analysis"
                  placeholder="Explain what makes this content viral: trends, emotions, timing, cultural relevance..."
                  value={submissionForm.submitterAnalysis}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, submitterAnalysis: e.target.value })}
                  className="bg-[#050b1a] border-[#1e3a5f] min-h-[100px]"
                />
                <p className="text-xs text-gray-500">
                  Quality analysis (50+ characters) earns 200 VBT instead of 100 VBT
                </p>
              </div>

              {/* Reward Preview */}
              <Card className="bg-[#050b1a] border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Estimated Reward</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {submissionForm.submitterAnalysis.length > 50 ? "200" : "100"} VBT
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        + Tier multipliers (2x-5x) if verified
                      </p>
                    </div>
                    <Coins className="w-12 h-12 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Content"}
              </Button>
            </CardContent>
          </Card>

          {/* Reward Structure & Guidelines */}
          <div className="space-y-6">
            <Card className="bg-[#0d1e36] border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-xl text-purple-400">Reward Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#050b1a] rounded-lg">
                  <span className="text-gray-300">Basic Submission</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400">100 VBT</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050b1a] rounded-lg">
                  <span className="text-gray-300">Quality Analysis</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400">200 VBT</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050b1a] rounded-lg">
                  <span className="text-gray-300">Verified Viral</span>
                  <Badge className="bg-purple-500/20 text-purple-400">500 VBT</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050b1a] rounded-lg">
                  <span className="text-gray-300">Trending Discovery</span>
                  <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400">1000 VBT</Badge>
                </div>
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-sm text-cyan-300">
                    <strong>Bonus:</strong> Creator tier multipliers (2x-5x) apply to all rewards!
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1e36] border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-xl text-cyan-400">Submission Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-300">
                <p>✅ Submit content that's currently trending or has viral potential</p>
                <p>✅ Provide context on why it's viral (cultural relevance, timing, emotions)</p>
                <p>✅ Check for duplicates before submitting</p>
                <p>✅ Be honest about AI usage in your analysis</p>
                <p>❌ Don't submit spam or low-quality content</p>
                <p>❌ Don't submit your own content (conflict of interest)</p>
                <p>❌ Don't copy others' submissions</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* My Submissions */}
        {user && mySubmissions && mySubmissions.length > 0 && (
          <Card className="bg-[#0d1e36] border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-cyan-400">My Submissions</CardTitle>
              <CardDescription className="text-gray-400">
                Track your viral content submissions and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mySubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 bg-[#050b1a] border border-[#1e3a5f] rounded-lg hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPlatformIcon(submission.platform)}>
                            {submission.platform}
                          </Badge>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status.replace("_", " ")}
                          </Badge>
                          <Badge className="bg-yellow-500/20 text-yellow-400">
                            +{submission.vbtAwarded} VBT
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-white mb-1">
                          {submission.title || "Untitled Submission"}
                        </h3>
                        <a
                          href={submission.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="w-3 h-3" />
                          {submission.contentUrl.substring(0, 50)}...
                        </a>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {submission.description && (
                      <p className="text-sm text-gray-400 mt-2">{submission.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
