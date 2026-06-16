import { useState } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Award,
  TrendingUp,
  FileText,
  Users,
  Loader2
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const tierInfo = {
  ai_assisted: {
    name: "AI-Assisted",
    multiplier: "1x",
    color: "bg-gray-500",
    description: "Content created with heavy AI assistance",
    reward: "20 VBT base",
  },
  human_created: {
    name: "Human-Created",
    multiplier: "2x",
    color: "bg-blue-500",
    description: "Original human content with minor AI tools",
    reward: "40 VBT per post",
  },
  verified_human: {
    name: "Verified Human Creator",
    multiplier: "3x",
    color: "bg-purple-500",
    description: "Identity-verified human creator",
    reward: "60 VBT per post",
  },
  premium_human: {
    name: "Premium Human",
    multiplier: "5x",
    color: "bg-gradient-to-r from-yellow-500 to-orange-500",
    description: "Elite human creator with high engagement",
    reward: "100 VBT per post",
  },
};

const verificationStatusInfo = {
  unverified: {
    icon: XCircle,
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    label: "Unverified",
  },
  pending: {
    icon: Clock,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    label: "Pending Review",
  },
  verified: {
    icon: CheckCircle2,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    label: "Verified",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    label: "Rejected",
  },
};

export default function CreatorVerification() {
  const { user, loading: authLoading } = useAuth();
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [bio, setBio] = useState("");

  const { data: profile, isLoading, refetch } = trpc.creatorTiers.getCreatorProfile.useQuery(
    { userId: user?.id },
    { enabled: !!user }
  );

  const requestVerificationMutation = trpc.creatorTiers.requestVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification request submitted! We'll review it soon.");
      refetch();
      setPortfolioUrl("");
      setBio("");
    },
    onError: (error) => {
      toast.error(`Failed to submit verification: ${error.message}`);
    },
  });

  const handleRequestVerification = () => {
    if (!bio || bio.length < 50) {
      toast.error("Bio must be at least 50 characters");
      return;
    }

    requestVerificationMutation.mutate({
      portfolioUrl: portfolioUrl || undefined,
      bio,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Card className="bg-[#0d1e36] border-cyan-500/30 max-w-md">
          <CardHeader>
            <CardTitle className="text-cyan-400">Authentication Required</CardTitle>
            <CardDescription>Please log in to request verification</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const currentTier = tierInfo[profile.tier];
  const verificationStatus = verificationStatusInfo[profile.verificationStatus];
  const StatusIcon = verificationStatus.icon;

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <BackToDashboard />
      <div className="container py-8">
        <Breadcrumb />

        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Creator Verification
              </h1>
              <p className="text-gray-400 mt-2">
                Unlock higher rewards by verifying your human-created content
              </p>
            </div>
          </div>

          {/* Current Status Card */}
          <Card className="bg-[#0d1e36] border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-cyan-400" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge className={`${currentTier.color} text-white px-4 py-2 text-lg`}>
                      {currentTier.name}
                    </Badge>
                    {(profile.tier === "verified_human" || profile.tier === "premium_human") && (
                      <VerifiedBadge size="lg" variant="with-text" />
                    )}
                    <span className="text-2xl font-bold text-cyan-400">
                      {currentTier.multiplier}
                    </span>
                  </div>
                  <p className="text-gray-400">{currentTier.description}</p>
                  <p className="text-sm text-cyan-400 font-semibold">
                    {currentTier.reward}
                  </p>
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${verificationStatus.bgColor}`}>
                  <StatusIcon className={`w-5 h-5 ${verificationStatus.color}`} />
                  <span className={verificationStatus.color}>
                    {verificationStatus.label}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#0d1e36] border-cyan-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Total Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-cyan-400">
                  {profile.totalContentSubmitted}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1e36] border-green-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Human Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-400">
                  {profile.humanContentCount}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1e36] border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Vouches Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-400">
                  {profile.vouchCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {profile.vouchCount >= 3 ? "Auto-verified!" : `${3 - profile.vouchCount} more needed`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Verification Request Form */}
          {profile.verificationStatus === "unverified" && (
            <Card className="bg-[#0d1e36] border-cyan-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-cyan-400" />
                  Request Verification
                </CardTitle>
                <CardDescription>
                  Get verified to unlock higher reward multipliers and premium features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="portfolioUrl">Portfolio URL (Optional)</Label>
                  <Input
                    id="portfolioUrl"
                    type="url"
                    placeholder="https://yourportfolio.com"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="bg-[#0a1628] border-cyan-500/30 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link to your portfolio, social media, or previous work
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio">Creator Bio (Min. 50 characters)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself, your content creation experience, and why you should be verified..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-[#0a1628] border-cyan-500/30 text-white min-h-[120px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {bio.length}/500 characters
                  </p>
                </div>

                <Button
                  onClick={handleRequestVerification}
                  disabled={requestVerificationMutation.isPending || bio.length < 50}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  {requestVerificationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Verification Request"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {profile.verificationStatus === "pending" && (
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-yellow-400">
                  <Clock className="w-6 h-6" />
                  Verification Pending
                </CardTitle>
                <CardDescription>
                  Your verification request is being reviewed. We'll notify you once it's processed.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {profile.verificationStatus === "verified" && (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-green-400">
                  <CheckCircle2 className="w-6 h-6" />
                  Verified Creator
                </CardTitle>
                <CardDescription>
                  Congratulations! You're a verified human creator. Enjoy your {currentTier.multiplier} reward multiplier!
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Tier Progression Guide */}
          <Card className="bg-[#0d1e36] border-cyan-500/30">
            <CardHeader>
              <CardTitle>Tier Progression</CardTitle>
              <CardDescription>
                How to unlock higher reward multipliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(tierInfo).map(([key, tier]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border ${
                      profile.tier === key
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-gray-700 bg-gray-800/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <Badge className={`${tier.color} text-white`}>
                            {tier.name}
                          </Badge>
                          <span className="font-bold text-lg">{tier.multiplier}</span>
                        </div>
                        <p className="text-sm text-gray-400">{tier.description}</p>
                        <p className="text-xs text-cyan-400">{tier.reward}</p>
                      </div>
                      {profile.tier === key && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
