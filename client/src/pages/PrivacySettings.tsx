import { useState, useEffect } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Shield, Eye, EyeOff, Activity } from "lucide-react";
import { toast } from "sonner";

export default function PrivacySettings() {
  const { user, loading: authLoading } = useAuth();
  const { data: settings, isLoading, refetch } = trpc.auth.getPrivacySettings.useQuery(undefined, {
    enabled: !!user,
  });
  const updateSettings = trpc.auth.updatePrivacySettings.useMutation();

  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [showStats, setShowStats] = useState(true);
  const [showActivity, setShowActivity] = useState(true);

  useEffect(() => {
    if (settings) {
      setProfileVisibility(settings.profileVisibility);
      setShowStats(settings.showStats);
      setShowActivity(settings.showActivity);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        profileVisibility,
        showStats,
        showActivity,
      });
      toast.success("Privacy settings updated successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to update privacy settings");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center">
        <BackToDashboard />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center p-6">
        <Card className="bg-[#0d1e36] border-[#1e3a5f] max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">Please sign in to access privacy settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Privacy Settings</h1>
            <p className="text-gray-400">Control who can see your profile and activity</p>
          </div>
        </div>

        {/* Profile Visibility */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profileVisibility === "public" ? (
                <Eye className="w-5 h-5 text-green-500" />
              ) : (
                <EyeOff className="w-5 h-5 text-red-500" />
              )}
              Profile Visibility
            </CardTitle>
            <CardDescription>
              Choose who can view your profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={profileVisibility}
                  onValueChange={(value) => setProfileVisibility(value as "public" | "private")}
                >
                  <SelectTrigger id="visibility" className="bg-[#050b1a] border-[#1e3a5f]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                    <SelectItem value="private">Private - Only you can view</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Settings */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Activity & Stats
            </CardTitle>
            <CardDescription>
              Control what information is visible on your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-stats">Show Statistics</Label>
                <p className="text-sm text-gray-400">
                  Display your votes, favorites, and engagement stats
                </p>
              </div>
              <Switch
                id="show-stats"
                checked={showStats}
                onCheckedChange={setShowStats}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-activity">Show Activity</Label>
                <p className="text-sm text-gray-400">
                  Display your recent votes and favorite trends
                </p>
              </div>
              <Switch
                id="show-activity"
                checked={showActivity}
                onCheckedChange={setShowActivity}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
        >
          {updateSettings.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
