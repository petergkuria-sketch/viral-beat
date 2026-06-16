import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, TrendingUp, TrendingDown, Gift, Zap, Award } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useState } from "react";

export default function TokenDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [transactionFilter, setTransactionFilter] = useState<"all" | "earned" | "spent">("all");

  const { data: balance, isLoading: balanceLoading } = trpc.tokens.getBalance.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = trpc.tokens.getTransactionHistory.useQuery(
    {
      limit: 20,
      offset: 0,
      type: transactionFilter,
    },
    {
      enabled: !!user,
    }
  );

  const { data: earningRules, isLoading: rulesLoading } = trpc.tokens.getEarningRules.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading || balanceLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your token dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your VB Token dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = getLoginUrl())} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    if (type.startsWith("earn_")) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (type.startsWith("spend_")) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Coins className="h-4 w-4" />;
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">VB Token Dashboard</h1>
        <p className="text-muted-foreground">
          Earn tokens by contributing to The Viral Beat community and use them to unlock premium features
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Coins className="h-5 w-5" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">{balance?.balance.toLocaleString() || 0}</div>
            <p className="text-purple-100">VB Tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{balance?.totalEarned.toLocaleString() || 0}</div>
            <p className="text-muted-foreground">All-time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{balance?.totalSpent.toLocaleString() || 0}</div>
            <p className="text-muted-foreground">Premium features unlocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="earn">Ways to Earn</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>View all your token earnings and spending</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={transactionFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={transactionFilter === "earned" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionFilter("earned")}
                  >
                    Earned
                  </Button>
                  <Button
                    variant={transactionFilter === "spent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionFilter("spent")}
                  >
                    Spent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading transactions...</p>
                </div>
              ) : transactionsData && transactionsData.transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactionsData.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${getTransactionColor(transaction.amount)}`}>
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount.toLocaleString()} VBT
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start earning tokens by contributing to the community!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ways to Earn Tab */}
        <TabsContent value="earn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Ways to Earn VB Tokens
              </CardTitle>
              <CardDescription>Contribute to The Viral Beat and earn rewards</CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading earning opportunities...</p>
                </div>
              ) : earningRules && earningRules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {earningRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{rule.description}</h3>
                          <span className="text-lg font-bold text-primary">+{rule.tokenAmount} VBT</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.actionType.replace(/_/g, " ").replace("earn ", "")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No earning rules configured yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Start Earning Today</CardTitle>
              <CardDescription>Jump into these activities to earn your first tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4"
                  onClick={() => setLocation("/developer-hub")}
                >
                  <div className="font-semibold mb-1">Join Developer Hub</div>
                  <div className="text-sm text-muted-foreground text-left">
                    Create threads, reply to discussions, and help shape the platform
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4"
                  onClick={() => setLocation("/ai-agents")}
                >
                  <div className="font-semibold mb-1">Use AI Agents</div>
                  <div className="text-sm text-muted-foreground text-left">
                    Create content and analyze trends with our AI-powered tools
                  </div>
                </Button>
                <Button variant="outline" className="h-auto flex-col items-start p-4" onClick={() => setLocation("/")}>
                  <div className="font-semibold mb-1">Explore Trends</div>
                  <div className="text-sm text-muted-foreground text-left">
                    Vote on viral beats and discover trending content
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
