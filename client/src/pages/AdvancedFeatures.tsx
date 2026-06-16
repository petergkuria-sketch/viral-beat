import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Toast functionality simplified
import { Coins, TrendingUp, Vote, PieChart, Lock, Unlock } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";

export function AdvancedFeatures() {
  // Simplified notification system
  const toast = (opts: any) => {
    const message = `${opts.title}${opts.description ? ': ' + opts.description : ''}`;
    alert(message);
  };
  const utils = trpc.useUtils();

  // Staking state
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeDuration, setStakeDuration] = useState<"30" | "90" | "180">("90");

  // P2P Trading state
  const [listAmount, setListAmount] = useState("");
  const [pricePerToken, setPricePerToken] = useState("");

  // Governance state
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalType, setProposalType] = useState<"feature_request" | "reward_rate_change" | "policy_update" | "other">("feature_request");

  // Queries
  const { data: myStakes } = trpc.phase2.getMyStakes.useQuery();
  const { data: activeListings } = trpc.phase2.getActiveListings.useQuery();
  const { data: activeProposals } = trpc.phase2.getActiveProposals.useQuery();
  const { data: supplyMetrics } = trpc.phase2.getSupplyMetrics.useQuery();

  // Mutations
  const stakeTokensMutation = trpc.phase2.stakeTokens.useMutation({
    onSuccess: () => {
      toast({ title: "✅ Tokens Staked!", description: "Your tokens are now earning rewards" });
      utils.phase2.getMyStakes.invalidate();
      setStakeAmount("");
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const unstakeTokensMutation = trpc.phase2.unstakeTokens.useMutation({
    onSuccess: (data) => {
      toast({
        title: data.penalty ? "⚠️ Early Unstake" : "✅ Unstaked Successfully!",
        description: data.penalty
          ? `Received ${data.rewards} VBT (50% penalty applied)`
          : `Received ${data.rewards} VBT rewards`,
      });
      utils.phase2.getMyStakes.invalidate();
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const createListingMutation = trpc.phase2.createListing.useMutation({
    onSuccess: () => {
      toast({ title: "✅ Listing Created!", description: "Your tokens are now available for sale" });
      utils.phase2.getActiveListings.invalidate();
      setListAmount("");
      setPricePerToken("");
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const createProposalMutation = trpc.phase2.createProposal.useMutation({
    onSuccess: () => {
      toast({ title: "✅ Proposal Created!", description: "Community voting has begun" });
      utils.phase2.getActiveProposals.invalidate();
      setProposalTitle("");
      setProposalDescription("");
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const voteOnProposalMutation = trpc.phase2.voteOnProposal.useMutation({
    onSuccess: (data) => {
      toast({ title: "✅ Vote Recorded!", description: `Your ${data.voteWeight} VBT voted` });
      utils.phase2.getActiveProposals.invalidate();
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleStake = () => {
    const amount = parseInt(stakeAmount);
    if (!amount || amount < 100) {
      toast({ title: "Invalid Amount", description: "Minimum stake is 100 VBT", variant: "destructive" });
      return;
    }
    stakeTokensMutation.mutate({ amount, duration: stakeDuration });
  };

  const handleUnstake = (stakeId: number) => {
    unstakeTokensMutation.mutate({ stakeId });
  };

  const handleCreateListing = () => {
    const amount = parseInt(listAmount);
    const price = parseFloat(pricePerToken);
    if (!amount || amount < 10 || !price || price < 0.01) {
      toast({ title: "Invalid Input", description: "Check amount and price", variant: "destructive" });
      return;
    }
    createListingMutation.mutate({ amount, pricePerToken: price });
  };

  const handleCreateProposal = () => {
    if (proposalTitle.length < 10 || proposalDescription.length < 50) {
      toast({ title: "Invalid Input", description: "Title and description too short", variant: "destructive" });
      return;
    }
    createProposalMutation.mutate({
      title: proposalTitle,
      description: proposalDescription,
      type: proposalType,
      options: ["Approve", "Reject"],
      votingDays: 7,
    });
  };

  const getAPY = (duration: string) => {
    if (duration === "30") return 5;
    if (duration === "90") return 10;
    return 15;
  };

  return (
    <div className="container py-8">
      <Breadcrumb />

      <div className="flex items-center gap-3 mb-6 mt-6">
        <TrendingUp className="w-8 h-8 text-cyan-400" />
        <h1 className="text-3xl font-bold">Advanced Token Features</h1>
      </div>

      <p className="text-muted-foreground mb-8">
        Stake tokens for rewards, trade on the P2P marketplace, vote on governance proposals, and track token supply metrics.
      </p>

      <Tabs defaultValue="staking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="staking">
            <Lock className="w-4 h-4 mr-2" />
            Staking
          </TabsTrigger>
          <TabsTrigger value="trading">
            <Coins className="w-4 h-4 mr-2" />
            P2P Trading
          </TabsTrigger>
          <TabsTrigger value="governance">
            <Vote className="w-4 h-4 mr-2" />
            Governance
          </TabsTrigger>
          <TabsTrigger value="supply">
            <PieChart className="w-4 h-4 mr-2" />
            Supply Metrics
          </TabsTrigger>
        </TabsList>

        {/* STAKING TAB */}
        <TabsContent value="staking" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Stake Tokens for Rewards</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Lock your VBT tokens to earn passive rewards. Longer durations = higher APY.
            </p>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">5% APY</div>
                <div className="text-sm text-muted-foreground">30 Days</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">10% APY</div>
                <div className="text-sm text-muted-foreground">90 Days</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">15% APY</div>
                <div className="text-sm text-muted-foreground">180 Days</div>
              </Card>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (min 100 VBT)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["30", "90", "180"] as const).map((duration) => (
                    <Button
                      key={duration}
                      variant={stakeDuration === duration ? "default" : "outline"}
                      onClick={() => setStakeDuration(duration)}
                    >
                      {duration} Days
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={handleStake} disabled={stakeTokensMutation.isPending} className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Stake Tokens
              </Button>
            </div>
          </Card>

          {/* Active Stakes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Active Stakes</h3>
            {!myStakes || myStakes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active stakes</p>
            ) : (
              <div className="space-y-3">
                {myStakes.map((stake) => (
                  <Card key={stake.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{stake.amount} VBT</div>
                        <div className="text-sm text-muted-foreground">
                          {stake.apy}% APY • {stake.duration} days • {stake.status}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ends: {new Date(stake.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      {stake.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnstake(stake.id)}
                          disabled={unstakeTokensMutation.isPending}
                        >
                          <Unlock className="w-4 h-4 mr-2" />
                          Unstake
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* P2P TRADING TAB */}
        <TabsContent value="trading" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create Listing</h2>
            <p className="text-sm text-muted-foreground mb-4">
              List your VBT tokens for sale. 2% platform fee applies.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (min 10 VBT)</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={listAmount}
                  onChange={(e) => setListAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Price per Token (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.50"
                  value={pricePerToken}
                  onChange={(e) => setPricePerToken(e.target.value)}
                />
              </div>

              <Button onClick={handleCreateListing} disabled={createListingMutation.isPending} className="w-full">
                Create Listing
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Marketplace Listings</h3>
            {!activeListings || activeListings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active listings</p>
            ) : (
              <div className="space-y-3">
                {activeListings.slice(0, 10).map((listing) => (
                  <Card key={listing.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{listing.amount} VBT</div>
                        <div className="text-sm text-muted-foreground">
                          ${listing.pricePerToken} per token
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Buy
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* GOVERNANCE TAB */}
        <TabsContent value="governance" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create Proposal</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Submit a proposal for community voting. 1 VBT = 1 vote.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  placeholder="Increase forum post rewards to 75 VBT"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background"
                  placeholder="Explain your proposal and why it should be approved..."
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  className="w-full p-2 rounded-md border bg-background"
                  value={proposalType}
                  onChange={(e) => setProposalType(e.target.value as any)}
                >
                  <option value="feature_request">Feature Request</option>
                  <option value="reward_rate_change">Reward Rate Change</option>
                  <option value="policy_update">Policy Update</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Button onClick={handleCreateProposal} disabled={createProposalMutation.isPending} className="w-full">
                Submit Proposal
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Proposals</h3>
            {!activeProposals || activeProposals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active proposals</p>
            ) : (
              <div className="space-y-3">
                {activeProposals.map((proposal) => (
                  <Card key={proposal.id} className="p-4">
                    <div className="font-semibold mb-2">{proposal.title}</div>
                    <div className="text-sm text-muted-foreground mb-3">{proposal.description}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          voteOnProposalMutation.mutate({ proposalId: proposal.id, option: "Approve" })
                        }
                        disabled={voteOnProposalMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          voteOnProposalMutation.mutate({ proposalId: proposal.id, option: "Reject" })
                        }
                        disabled={voteOnProposalMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* SUPPLY METRICS TAB */}
        <TabsContent value="supply" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Circulating Supply</div>
              <div className="text-3xl font-bold text-cyan-400">
                {supplyMetrics?.circulatingSupply.toLocaleString() || "0"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">VBT</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Minted</div>
              <div className="text-3xl font-bold text-green-400">
                {supplyMetrics?.totalMinted.toLocaleString() || "0"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">VBT</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Burned</div>
              <div className="text-3xl font-bold text-red-400">
                {supplyMetrics?.totalBurned.toLocaleString() || "0"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">VBT</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Locked in Stakes</div>
              <div className="text-3xl font-bold text-orange-400">
                {supplyMetrics?.lockedInStakes.toLocaleString() || "0"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">VBT</div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tokenomics Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Burn Rate</span>
                <span className="font-semibold">{supplyMetrics?.burnRate || "0"}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Deflationary Pressure</span>
                <span className="font-semibold text-green-400">
                  {supplyMetrics && supplyMetrics.totalBurned > 0 ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Supply Model</span>
                <span className="font-semibold">Mezzanine (Phase 1)</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
