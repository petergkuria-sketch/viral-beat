import { useAuth } from "@/_core/hooks/useAuth";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, User, Bell, Key, ChevronRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Settings() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
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
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-gray-400">Please sign in to access settings.</p>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const settingsSections = [
    {
      icon: Shield,
      title: "Privacy Settings",
      description: "Control who can see your profile and activity",
      path: "/privacy-settings",
      color: "text-purple-500",
    },
    {
      icon: User,
      title: "Account Settings",
      description: "Manage your account information and preferences",
      path: "/account-settings",
      color: "text-blue-500",
      comingSoon: true,
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure notification preferences and alerts",
      path: "/notification-settings",
      color: "text-green-500",
      comingSoon: true,
    },
    {
      icon: Key,
      title: "Security",
      description: "Manage security settings and authentication",
      path: "/security-settings",
      color: "text-red-500",
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050b1a] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account preferences and privacy</p>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => (
            <Card
              key={section.path}
              className="bg-[#0d1e36] border-[#1e3a5f] hover:border-[#2e4a6f] transition-colors cursor-pointer"
              onClick={() => {
                if (!section.comingSoon) {
                  setLocation(section.path);
                }
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-[#050b1a] ${section.color}`}>
                      <section.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      {section.comingSoon && (
                        <span className="text-xs text-yellow-500 font-medium">Coming Soon</span>
                      )}
                    </div>
                  </div>
                  {!section.comingSoon && (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400">
                  {section.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Info */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Name</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Role</span>
              <span className="font-medium capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Member Since</span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
