/**
 * Newsletter Settings Page
 * Manage newsletter subscription and preferences
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2, Bell, Settings } from "lucide-react";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";

const NICHE_OPTIONS = [
  "Tech & Innovation",
  "Entertainment & Pop Culture",
  "Business & Finance",
  "Lifestyle & Wellness",
  "Gaming & Esports",
  "Education & Learning",
  "Food & Cooking",
  "Travel & Adventure",
  "Fashion & Beauty",
  "Sports & Fitness",
];

const PLATFORM_OPTIONS = [
  "TikTok",
  "YouTube",
  "Instagram",
  "Twitter/X",
  "LinkedIn",
  "Facebook",
];

export default function NewsletterSettings() {
  // Using sonner toast for notifications
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Get current subscription
  const { data: subscription, isLoading: loadingSubscription, refetch } = trpc.newsletter.getSubscription.useQuery();

  // Subscribe mutation
  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Unsubscribe mutation
  const unsubscribeMutation = trpc.newsletter.unsubscribe.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update preferences mutation
  const updateMutation = trpc.newsletter.updatePreferences.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Initialize form with subscription data
  useState(() => {
    if (subscription) {
      setFrequency(subscription.frequency);
      setSelectedNiches(subscription.nichePreferences || []);
      setSelectedPlatforms(subscription.platformPreferences || []);
    }
  });

  const handleSubscribe = () => {
    subscribeMutation.mutate({
      frequency,
      nichePreferences: selectedNiches,
      platformPreferences: selectedPlatforms,
    });
  };

  const handleUpdatePreferences = () => {
    updateMutation.mutate({
      frequency,
      nichePreferences: selectedNiches,
      platformPreferences: selectedPlatforms,
    });
  };

  const handleUnsubscribe = () => {
    if (confirm("Are you sure you want to unsubscribe from the newsletter?")) {
      unsubscribeMutation.mutate();
    }
  };

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  if (loadingSubscription) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const isSubscribed = subscription?.isActive;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Newsletter Settings</h1>
        <p className="text-muted-foreground">
          Get personalized weekly insights on viral trends, top creators, and content opportunities.
        </p>
      </div>

      {/* Subscription Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isSubscribed ? "bg-green-100" : "bg-gray-100"}`}>
                {isSubscribed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Mail className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div>
                <CardTitle>
                  {isSubscribed ? "You're Subscribed!" : "Subscribe to Newsletter"}
                </CardTitle>
                <CardDescription>
                  {isSubscribed
                    ? `Receiving ${subscription.frequency} updates`
                    : "Stay ahead with AI-powered trend insights"}
                </CardDescription>
              </div>
            </div>
            {isSubscribed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnsubscribe}
                disabled={unsubscribeMutation.isPending}
              >
                {unsubscribeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Unsubscribe"
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Frequency Selection */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Delivery Frequency</CardTitle>
          </div>
          <CardDescription>How often would you like to receive the newsletter?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={frequency} onValueChange={(value: any) => setFrequency(value)}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly" className="cursor-pointer">
                <div>
                  <div className="font-medium">Weekly</div>
                  <div className="text-sm text-muted-foreground">Every Monday morning</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="biweekly" id="biweekly" />
              <Label htmlFor="biweekly" className="cursor-pointer">
                <div>
                  <div className="font-medium">Bi-weekly</div>
                  <div className="text-sm text-muted-foreground">Every other Monday</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly" className="cursor-pointer">
                <div>
                  <div className="font-medium">Monthly</div>
                  <div className="text-sm text-muted-foreground">First Monday of each month</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Niche Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <CardTitle>Content Preferences</CardTitle>
          </div>
          <CardDescription>Select your areas of interest for personalized insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-3 block">Niches</Label>
              <div className="grid grid-cols-2 gap-3">
                {NICHE_OPTIONS.map((niche) => (
                  <div key={niche} className="flex items-center space-x-2">
                    <Checkbox
                      id={niche}
                      checked={selectedNiches.includes(niche)}
                      onCheckedChange={() => toggleNiche(niche)}
                    />
                    <Label htmlFor={niche} className="cursor-pointer text-sm">
                      {niche}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">Platforms</Label>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORM_OPTIONS.map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform}
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={() => togglePlatform(platform)}
                    />
                    <Label htmlFor={platform} className="cursor-pointer text-sm">
                      {platform}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isSubscribed ? (
          <Button
            onClick={handleUpdatePreferences}
            disabled={updateMutation.isPending}
            size="lg"
            className="flex-1"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Preferences"
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            disabled={subscribeMutation.isPending}
            size="lg"
            className="flex-1"
          >
            {subscribeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Subscribe to Newsletter
              </>
            )}
          </Button>
        )}
      </div>

      {/* Newsletter Preview Info */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">What You'll Receive</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Past Week Highlights:</strong> Top trending topics, viral content, and engagement stats
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Top Creators Spotlight:</strong> Featured creators, their best posts, and growth metrics
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Week Ahead Projections:</strong> Predicted trends, content opportunities, and timing recommendations
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Personalized Tips:</strong> Actionable advice tailored to your niche and platform
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <PushNotificationSettings />
    </div>
  );
}
