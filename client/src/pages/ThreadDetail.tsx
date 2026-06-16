import { useState } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { 
  ThumbsUp, ThumbsDown, Send, Loader2, ArrowLeft, 
  CheckCircle, Clock, AlertCircle 
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { parseMarkdownWithCode } from "@/lib/markdown";

export default function ThreadDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const threadId = parseInt(params.threadId || "0");
  
  const [newPost, setNewPost] = useState("");

  // Fetch thread
  const { data: thread, isLoading: threadLoading, refetch: refetchThread } = trpc.developerHub.getThreadById.useQuery(
    { threadId },
    { enabled: threadId > 0 }
  );

  // Fetch posts
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = trpc.developerHub.getPostsByThread.useQuery(
    { threadId },
    { enabled: threadId > 0 }
  );

  // Fetch user vote
  const { data: userVote, refetch: refetchVote } = trpc.developerHub.getUserThreadVote.useQuery(
    { threadId },
    { enabled: !!user && threadId > 0 }
  );

  // Vote mutation
  const voteMutation = trpc.developerHub.voteThread.useMutation({
    onSuccess: () => {
      refetchThread();
      refetchVote();
      toast.success("Vote recorded!");
    },
    onError: (error) => {
      toast.error(`Failed to vote: ${error.message}`);
    },
  });

  // Create post mutation
  const createPostMutation = trpc.developerHub.createPost.useMutation({
    onSuccess: () => {
      setNewPost("");
      refetchPosts();
      toast.success("Reply posted!");
    },
    onError: (error) => {
      toast.error(`Failed to post reply: ${error.message}`);
    },
  });

  const handleVote = (voteType: "up" | "down") => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    voteMutation.mutate({ threadId, voteType });
  };

  const handlePostReply = () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!newPost.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    createPostMutation.mutate({
      threadId,
      content: newPost.trim(),
    });
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
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "closed":
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  if (authLoading || threadLoading || postsLoading) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center">
        <BackToDashboard />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center">
        <Card className="bg-[#0d1e36] border-[#1e3a5f] p-8 text-center">
          <p className="text-gray-400">Thread not found</p>
          <Button
            onClick={() => setLocation("/developer-hub")}
            className="mt-4"
            variant="outline"
          >
            Back to Forum
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d1e36] to-[#1a2942] border-b border-[#1e3a5f] py-6">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/developer-hub")}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </div>
      </div>

      {/* Thread Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-[#0d1e36] border-[#1e3a5f] mb-6">
          <CardContent className="p-8">
            <div className="flex gap-6">
              {/* Vote Section */}
              <div className="flex flex-col items-center gap-3 min-w-[80px]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleVote("up")}
                  disabled={voteMutation.isPending}
                  className={userVote?.voteType === "up" ? "text-green-400" : ""}
                >
                  <ThumbsUp className="w-6 h-6" />
                </Button>
                <div className="text-2xl font-bold">
                  {(thread.upvotes || 0) - (thread.downvotes || 0)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleVote("down")}
                  disabled={voteMutation.isPending}
                  className={userVote?.voteType === "down" ? "text-red-400" : ""}
                >
                  <ThumbsDown className="w-6 h-6" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold">{thread.title}</h1>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(thread.status)}
                    <span className="text-sm text-gray-400 capitalize">
                      {thread.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="text-gray-300 mb-6">{parseMarkdownWithCode(thread.description)}</div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <Badge className={getCategoryColor(thread.category)}>
                    {thread.category.replace("_", " ")}
                  </Badge>
                  <span>by {thread.author?.name || "Unknown"}</span>
                  <span>{new Date(thread.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="text-2xl font-bold">Replies ({posts?.length || 0})</h2>
          {posts && posts.length > 0 ? (
            posts.map((post: any) => (
              <Card key={post.id} className="bg-[#0d1e36] border-[#1e3a5f]">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-semibold">{post.author?.name || "Unknown"}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-300">{parseMarkdownWithCode(post.content)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-[#0d1e36] border-[#1e3a5f]">
              <CardContent className="p-8 text-center text-gray-400">
                No replies yet. Be the first to reply!
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reply Form */}
        {user ? (
          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Post a Reply</h3>
              <div className="flex gap-3">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="bg-[#050b1a] border-[#1e3a5f] resize-none"
                  rows={4}
                />
                <Button
                  onClick={handlePostReply}
                  disabled={createPostMutation.isPending || !newPost.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 self-end"
                >
                  {createPostMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400 mb-4">Sign in to reply to this thread</p>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
