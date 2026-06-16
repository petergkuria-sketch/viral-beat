import { useState } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { 
  MessageSquare, ThumbsUp, ThumbsDown, Plus, TrendingUp, 
  Clock, CheckCircle, AlertCircle, Loader2, Bot 
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { showTokenNotification } from "@/lib/tokenNotifications";
import { TierBadge } from "@/components/TierBadge";

export default function DeveloperHub() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // New thread form state
  const [newThread, setNewThread] = useState({
    title: "",
    description: "",
    category: "feature_request" as "feature_request" | "bug_report" | "discussion" | "question",
    aiUsageLevel: "none" as "none" | "minor" | "moderate" | "heavy" | "full",
  });

  // Fetch threads
  const { data: threads, isLoading, refetch } = trpc.developerHub.getThreads.useQuery({
    category: category === "all" ? undefined : category,
    sortBy,
  });

  // Get token balance for notifications
  const { data: tokenBalance } = trpc.tokens.getBalance.useQuery();
  
  // Submit content mutation for tiered rewards
  const submitContentMutation = trpc.creatorTiers.submitContent.useMutation();

  // Create thread mutation
  const createThreadMutation = trpc.developerHub.createThread.useMutation({
    onSuccess: () => {
      toast.success("Thread created successfully!");
      
      // Show token notification
      if (tokenBalance) {
        showTokenNotification("earn_thread_creation", {
          amount: 50,
          newBalance: tokenBalance.balance + 50,
        });
      }
      
      setIsCreateDialogOpen(false);
      setNewThread({ title: "", description: "", category: "feature_request", aiUsageLevel: "none" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create thread: ${error.message}`);
    },
  });

  const handleCreateThread = async () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    if (newThread.title.length < 5) {
      toast.error("Title must be at least 5 characters");
      return;
    }

    if (newThread.description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    // Submit content for tiered reward tracking
    try {
      await submitContentMutation.mutateAsync({
        contentType: "forum_thread",
        aiUsageLevel: newThread.aiUsageLevel,
      });
    } catch (error) {
      console.error("Failed to submit content for tiered rewards:", error);
    }

    createThreadMutation.mutate(newThread);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "feature_request":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "bug_report":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "discussion":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "question":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "closed":
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
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

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d1e36] to-[#1a2942] border-b border-[#1e3a5f] py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Developer Hub</h1>
              <p className="text-gray-400">
                Collaborate, innovate, and shape the future of The Viral Beat
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/developer-hub/agent")}
                className="border-[#1e3a5f]"
              >
                <Bot className="w-4 h-4 mr-2" />
                Developer Agent
              </Button>
              {user ? (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                      <Plus className="w-4 h-4 mr-2" />
                      New Thread
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0d1e36] border-[#1e3a5f] text-white">
                    <DialogHeader>
                      <DialogTitle>Create New Thread</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Share your ideas, report bugs, or start a discussion
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder="Brief, descriptive title..."
                          value={newThread.title}
                          onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                          className="bg-[#050b1a] border-[#1e3a5f]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newThread.category}
                          onValueChange={(value: any) => setNewThread({ ...newThread, category: value })}
                        >
                          <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                            <SelectItem value="feature_request">Feature Request</SelectItem>
                            <SelectItem value="bug_report">Bug Report</SelectItem>
                            <SelectItem value="discussion">Discussion</SelectItem>
                            <SelectItem value="question">Question</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Provide details, context, and any relevant information..."
                          value={newThread.description}
                          onChange={(e) => setNewThread({ ...newThread, description: e.target.value })}
                          className="bg-[#050b1a] border-[#1e3a5f] min-h-[120px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aiUsage">AI Usage Level</Label>
                        <Select
                          value={newThread.aiUsageLevel}
                          onValueChange={(value: any) => setNewThread({ ...newThread, aiUsageLevel: value })}
                        >
                          <SelectTrigger className="bg-[#050b1a] border-[#1e3a5f]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
                            <SelectItem value="none">No AI (100% Human) - 2x Rewards</SelectItem>
                            <SelectItem value="minor">Minor AI Assistance - 2x Rewards</SelectItem>
                            <SelectItem value="moderate">Moderate AI Use - 2x Rewards</SelectItem>
                            <SelectItem value="heavy">Heavy AI Use - 1x Rewards</SelectItem>
                            <SelectItem value="full">Fully AI Generated - 1x Rewards</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          Be honest about AI usage. Verified human creators earn up to 5x rewards.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleCreateThread}
                        disabled={createThreadMutation.isPending}
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                      >
                        {createThreadMutation.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Create Thread
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Sign In to Contribute
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-4 items-center">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px] bg-[#0d1e36] border-[#1e3a5f]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="feature_request">Feature Requests</SelectItem>
              <SelectItem value="bug_report">Bug Reports</SelectItem>
              <SelectItem value="discussion">Discussions</SelectItem>
              <SelectItem value="question">Questions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[200px] bg-[#0d1e36] border-[#1e3a5f]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1e36] border-[#1e3a5f]">
              <SelectItem value="votes">Most Voted</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Threads List */}
      <div className="container mx-auto px-4 pb-12">
        <div className="space-y-4">
          {threads && threads.length > 0 ? (
            threads.map((thread: any) => (
              <Card
                key={thread.id}
                className="bg-[#0d1e36] border-[#1e3a5f] hover:border-[#2a4a6f] transition-colors cursor-pointer"
                onClick={() => setLocation(`/developer-hub/thread/${thread.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-2 min-w-[60px]">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">{thread.upvotes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium">{thread.downvotes || 0}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {(thread.upvotes || 0) - (thread.downvotes || 0)} net
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold">{thread.title}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(thread.status)}
                          <span className="text-sm text-gray-400 capitalize">{thread.status.replace("_", " ")}</span>
                        </div>
                      </div>
                      <p className="text-gray-400 mb-4 line-clamp-2">{thread.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <Badge className={getCategoryColor(thread.category)}>
                          {thread.category.replace("_", " ")}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span>by {thread.author?.name || "Unknown"}</span>
                          {thread.author?.tier && (
                            <TierBadge tier={thread.author.tier as any} size="sm" />
                          )}
                        </div>
                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-[#0d1e36] border-[#1e3a5f]">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">No threads found. Be the first to start a discussion!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
