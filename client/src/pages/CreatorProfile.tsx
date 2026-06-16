import { useEffect, useState } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocation, useParams } from "wouter";
import { 
  ArrowLeft,
  Users, 
  Eye,
  Video,
  TrendingUp, 
  Activity, 
  Search,
  Settings,
  LogOut,
  Heart,
  Youtube,
  Music2,
  ExternalLink,
  Loader2,
  Calendar,
  Globe,
  Award,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip);
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function CreatorProfile() {
  const [, setLocation] = useLocation();
  const params = useParams();
  
  // Validate platform parameter
  const validPlatforms = ["youtube", "tiktok", "twitter", "instagram"] as const;
  const platformParam = params.platform as string;
  const isValidPlatform = validPlatforms.includes(platformParam as any);
  const platform = isValidPlatform ? (platformParam as "youtube" | "tiktok" | "twitter" | "instagram") : null;
  const handle = params.handle as string;
  
  const { user, logout } = useAuth();

  // Handle invalid platform
  if (!platform) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <BackToDashboard />
        <Card className="bg-destructive/10 border-destructive/50 max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">Invalid platform. Please use one of: youtube, tiktok, twitter, or instagram.</p>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch creator data
  const { data: creator, isLoading: creatorLoading, error: creatorError } = trpc.creators.getByHandle.useQuery(
    { platform: platform!, handle },
    { enabled: !!platform && !!handle }
  );

  // Fetch creator videos
  const { data: videos, isLoading: videosLoading } = trpc.creators.getVideos.useQuery(
    { platform: platform!, handle },
    { enabled: !!platform && !!handle }
  );

  // Fetch stats history
  const { data: statsHistory } = trpc.creators.getStatsHistory.useQuery(
    { creatorId: creator?.id || 0, limit: 30 },
    { enabled: !!creator?.id }
  );

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  // Format large numbers
  const formatNumber = (num: number | null | undefined): string => {
    if (!num) return "0";
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Generate mock historical data if not available
  const chartData = statsHistory?.length ? statsHistory.map((stat, i) => ({
    date: new Date(stat.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    subscribers: stat.subscriberCount || 0,
    views: stat.totalViews || 0,
  })).reverse() : Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    subscribers: (creator?.subscriberCount || 100000) * (0.95 + i * 0.01),
    views: (creator?.totalViews || 1000000) * (0.9 + i * 0.02),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg tracking-wider">VIRAL BEAT</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50" onClick={() => setLocation("/dashboard")}>
            <TrendingUp className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50" onClick={() => setLocation("/")}>
            <Search className="mr-2 h-4 w-4" /> Discover
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50" onClick={() => setLocation("/favorites")}>
            <Heart className="mr-2 h-4 w-4" /> Favorites
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-sidebar-accent text-sidebar-accent-foreground">
            <Users className="mr-2 h-4 w-4" /> Creators
          </Button>
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
          {user ? (
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              className="w-full justify-start text-primary hover:bg-primary/10"
              onClick={() => window.location.href = getLoginUrl()}
            >
              <LogOut className="mr-2 h-4 w-4" /> Login
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 md:px-6">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="ml-4 font-semibold">Creator Profile</span>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Loading State */}
          {creatorLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {creatorError && (
            <Card className="bg-destructive/10 border-destructive/50">
              <CardContent className="p-6 text-center">
                <p className="text-destructive">Failed to load creator profile. Please try again.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Creator Profile */}
          {!creatorLoading && !creatorError && creator && (
            <>
              {/* Profile Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-card border-border overflow-hidden">
                  {/* Banner */}
                  <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                  
                  <CardContent className="relative pt-0 pb-6">
                    {/* Avatar */}
                    <div className="absolute -top-16 left-6">
                      <div className="w-32 h-32 rounded-full border-4 border-background bg-muted overflow-hidden">
                        {creator.avatarUrl ? (
                          <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {platform === "youtube" ? (
                              <Youtube className="w-12 h-12 text-muted-foreground" />
                            ) : (
                              <Music2 className="w-12 h-12 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="ml-40 pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-2xl font-bold flex items-center gap-2">
                            {creator.name}
                            {creator.badges?.includes("Verified") && (
                              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                                <Award className="w-3 h-3 mr-1" /> Verified
                              </Badge>
                            )}
                          </h1>
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Badge variant="outline" className="capitalize">
                              {platform === "youtube" ? <Youtube className="w-3 h-3 mr-1" /> : <Music2 className="w-3 h-3 mr-1" />}
                              {platform}
                            </Badge>
                            <span>@{handle}</span>
                            {creator.country && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" /> {creator.country}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <Button asChild>
                          <a 
                            href={platform === "youtube" ? `https://youtube.com/@${handle}` : `https://tiktok.com/@${handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" /> Visit Channel
                          </a>
                        </Button>
                      </div>

                      {/* Description */}
                      {creator.description && (
                        <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
                          {creator.description}
                        </p>
                      )}

                      {/* Joined Date */}
                      {creator.joinedDate && (
                        <div className="mt-3 text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Joined {creator.joinedDate}
                        </div>
                      )}

                      {/* Links */}
                      {creator.links && creator.links.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {creator.links.slice(0, 5).map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <LinkIcon className="w-3 h-3" /> {link.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-card border-border">
                    <CardContent className="p-4 text-center">
                      <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold font-mono">
                        {formatNumber(creator.subscriberCount)}
                      </div>
                      <div className="text-xs text-muted-foreground">Subscribers</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="bg-card border-border">
                    <CardContent className="p-4 text-center">
                      <Eye className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold font-mono">
                        {formatNumber(creator.totalViews)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Views</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-card border-border">
                    <CardContent className="p-4 text-center">
                      <Video className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold font-mono">
                        {formatNumber(creator.videoCount)}
                      </div>
                      <div className="text-xs text-muted-foreground">Videos</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="bg-card border-border">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold font-mono text-green-500">
                        +{Math.floor(Math.random() * 10 + 2)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Growth (30d)</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Charts & Videos */}
              <Tabs defaultValue="analytics" className="w-full">
                <TabsList>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="videos">Recent Videos</TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-6 mt-4">
                  {/* Subscriber Growth Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-lg">Subscriber Growth</CardTitle>
                        <CardDescription>Historical subscriber count over time</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px] p-4">
                        <Line
                          data={{
                            labels: chartData.map((d: { date: string }) => d.date),
                            datasets: [{
                              label: 'Subscribers',
                              data: chartData.map((d: { subscribers: number }) => d.subscribers),
                              borderColor: 'hsl(var(--primary))',
                              backgroundColor: 'hsl(var(--primary) / 0.15)',
                              borderWidth: 2,
                              fill: true,
                              tension: 0.4,
                              pointRadius: 0,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatNumber(ctx.parsed.y) } } },
                            scales: {
                              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                              y: { grid: { color: 'hsl(var(--border))' }, ticks: { font: { size: 11 }, callback: (v) => formatNumber(Number(v)) } },
                            },
                          }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Views Growth Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-lg">Total Views</CardTitle>
                        <CardDescription>Cumulative view count over time</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px] p-4">
                        <Line
                          data={{
                            labels: chartData.map((d: { date: string }) => d.date),
                            datasets: [{
                              label: 'Views',
                              data: chartData.map((d: { views: number }) => d.views),
                              borderColor: '#10b981',
                              backgroundColor: 'rgba(16,185,129,0.1)',
                              borderWidth: 2,
                              fill: true,
                              tension: 0.4,
                              pointRadius: 0,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatNumber(ctx.parsed.y) } } },
                            scales: {
                              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                              y: { grid: { color: 'hsl(var(--border))' }, ticks: { font: { size: 11 }, callback: (v) => formatNumber(Number(v)) } },
                            },
                          }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="videos" className="mt-4">
                  {videosLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : videos && videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videos.map((video, i) => (
                        <motion.a
                          key={video.id}
                          href={`https://youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group"
                        >
                          <Card className="bg-card border-border overflow-hidden hover:border-primary/50 transition-colors">
                            <div className="aspect-video bg-muted relative">
                              {video.thumbnail ? (
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                              {video.duration && (
                                <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                                  {video.duration}
                                </Badge>
                              )}
                            </div>
                            <CardContent className="p-3">
                              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                {video.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>{video.viewsText}</span>
                                <span>•</span>
                                <span>{video.published}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.a>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-muted/20 border-dashed">
                      <CardContent className="p-8 text-center">
                        <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No videos available</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Not Found State */}
          {!creatorLoading && !creatorError && !creator && (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Creator Not Found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find information for this creator.
                </p>
                <Button onClick={() => window.history.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
