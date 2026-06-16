import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp, Coins, Target, Zap } from "lucide-react";
import { TierBadge } from "@/components/TierBadge";
import { useAuth } from "@/_core/hooks/useAuth";

export default function HaaLeaderboard() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "all_time">("all_time");

  // Get leaderboard data
  const { data: leaderboard, isLoading } = trpc.haa.getHaaLeaderboard.useQuery({
    timeframe,
    limit: 100,
  });

  // Get user's own stats
  const { data: myStats } = trpc.haa.getMyHaaStats.useQuery(undefined, {
    enabled: !!user,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-500 font-bold">#{rank}</span>;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50";
    if (rank === 2) return "bg-gray-500/20 border-gray-400/50";
    if (rank === 3) return "bg-amber-600/20 border-amber-500/50";
    if (rank <= 10) return "bg-purple-500/20 border-purple-500/50";
    return "bg-[#0d1e36] border-[#1e3a5f]";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#050b1a] via-[#0d1e36] to-[#050b1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050b1a] via-[#0d1e36] to-[#050b1a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
            HaA Leaderboard
          </h1>
          <p className="text-xl text-gray-300">
            Top viral content hunters. Compete for the #1 spot and earn exclusive rewards.
          </p>
        </div>

        {/* User's Own Stats */}
        {user && myStats && (
          <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Your Rank</p>
                  <div className="flex items-center gap-3">
                    {getRankIcon(myStats.rank || 999)}
                    <span className="text-3xl font-bold text-white">
                      {myStats.rank || "Unranked"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Submissions</p>
                    <p className="text-2xl font-bold text-cyan-400">{myStats.totalSubmissions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Acceptance Rate</p>
                    <p className="text-2xl font-bold text-green-400">{myStats.acceptanceRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">VBT Earned</p>
                    <p className="text-2xl font-bold text-yellow-400">{myStats.totalVbtEarned}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(v: any) => setTimeframe(v)} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-[#0d1e36]">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="mt-6">
            {/* Top 3 Podium */}
            {leaderboard && leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <Card className={`${getRankBadgeColor(2)} transform translate-y-8`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      {getRankIcon(2)}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <p className="font-bold text-white">User #{leaderboard[1].userId}</p>
                      <TierBadge tier="verified_human" size="sm" />
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">
                        <span className="text-yellow-400 font-bold">{leaderboard[1].totalVbtEarned}</span> VBT
                      </p>
                      <p className="text-gray-500">
                        {leaderboard[1].acceptedSubmissions} accepted
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 1st Place */}
                <Card className={`${getRankBadgeColor(1)} transform -translate-y-4`}>
                  <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        {getRankIcon(1)}
                        <div className="absolute -top-2 -right-2">
                          <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <p className="text-xl font-bold text-white">User #{leaderboard[0].userId}</p>
                      <TierBadge tier="verified_human" size="md" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-400">
                        <span className="text-2xl text-yellow-400 font-bold">{leaderboard[0].totalVbtEarned}</span> VBT
                      </p>
                      <p className="text-gray-500">
                        {leaderboard[0].acceptedSubmissions} accepted • {leaderboard[0].acceptanceRate}% rate
                      </p>
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        <Trophy className="w-3 h-3 mr-1" />
                        Champion
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 3rd Place */}
                <Card className={`${getRankBadgeColor(3)} transform translate-y-8`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      {getRankIcon(3)}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <p className="font-bold text-white">User #{leaderboard[2].userId}</p>
                      <TierBadge tier="verified_human" size="sm" />
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">
                        <span className="text-yellow-400 font-bold">{leaderboard[2].totalVbtEarned}</span> VBT
                      </p>
                      <p className="text-gray-500">
                        {leaderboard[2].acceptedSubmissions} accepted
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Full Leaderboard Table */}
            <Card className="bg-[#0d1e36] border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400">Rankings</CardTitle>
                <CardDescription className="text-gray-400">
                  Top 100 viral content hunters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard && leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = user && entry.userId === user.id;
                    
                    return (
                      <div
                        key={entry.userId}
                        className={`p-4 rounded-lg border transition-all ${
                          isCurrentUser
                            ? "bg-cyan-500/10 border-cyan-500/50"
                            : getRankBadgeColor(rank)
                        } hover:border-cyan-500/50`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 flex justify-center">
                              {getRankIcon(rank)}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">
                                User #{entry.userId}
                              </span>
                              {isCurrentUser && (
                                <Badge className="bg-cyan-500/20 text-cyan-400">You</Badge>
                              )}
                              <TierBadge tier="verified_human" size="sm" />
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-8 text-center">
                            <div>
                              <p className="text-xs text-gray-400">Submissions</p>
                              <p className="text-lg font-bold text-white">{entry.totalSubmissions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Accepted</p>
                              <p className="text-lg font-bold text-green-400">{entry.acceptedSubmissions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Rate</p>
                              <p className="text-lg font-bold text-purple-400">{entry.acceptanceRate}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">VBT Earned</p>
                              <p className="text-lg font-bold text-yellow-400">
                                <Coins className="w-4 h-4 inline mr-1" />
                                {entry.totalVbtEarned}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Additional Stats for Top 10 */}
                        {rank <= 10 && (
                          <div className="mt-3 pt-3 border-t border-[#1e3a5f] flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-purple-400">
                              <Award className="w-4 h-4" />
                              <span>{entry.verifiedViralCount} verified viral</span>
                            </div>
                            <div className="flex items-center gap-2 text-orange-400">
                              <TrendingUp className="w-4 h-4" />
                              <span>{entry.trendingDiscoveries} trending discoveries</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {(!leaderboard || leaderboard.length === 0) && (
                  <div className="text-center py-12 text-gray-400">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No rankings yet for this timeframe</p>
                    <p className="text-sm">Be the first to submit viral content!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Want to climb the ranks?</h3>
            <p className="text-gray-300 mb-4">
              Submit high-quality viral content and earn your spot on the leaderboard
            </p>
            <Button
              onClick={() => window.location.href = "/haa"}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Target className="w-4 h-4 mr-2" />
              Submit Viral Content
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
