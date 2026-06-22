import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MessageSquare, ThumbsUp, ThumbsDown, Plus, Clock, CheckCircle,
  AlertCircle, Loader2, Bot, Send,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { showTokenNotification } from "@/lib/tokenNotifications";
import { TierBadge } from "@/components/TierBadge";
import { Streamdown } from "streamdown";

export default function DeveloperHub() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // ── forum state ──
  const [newThread, setNewThread] = useState({
    title: "",
    description: "",
    category: "feature_request" as "feature_request" | "bug_report" | "discussion" | "question",
    aiUsageLevel: "none" as "none" | "minor" | "moderate" | "heavy" | "full",
  });

  // ── agent chat state ──
  const [agentMessage, setAgentMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);

  const { data: threads, isLoading, refetch } = trpc.developerHub.getThreads.useQuery({
    category: category === "all" ? undefined : category,
    sortBy,
  });

  const { data: tokenBalance } = trpc.tokens.getBalance.useQuery();
  const submitContentMutation = trpc.creatorTiers.submitContent.useMutation();

  const createThreadMutation = trpc.developerHub.createThread.useMutation({
    onSuccess: () => {
      toast.success("Thread created!");
      if (tokenBalance) {
        showTokenNotification("earn_thread_creation", { amount: 50, newBalance: tokenBalance.balance + 50 });
      }
      setIsCreateDialogOpen(false);
      setNewThread({ title: "", description: "", category: "feature_request", aiUsageLevel: "none" });
      refetch();
    },
    onError: (e) => toast.error(`Failed to create thread: ${e.message}`),
  });

  const chatMutation = trpc.developerHub.chatWithAgent.useMutation({
    onSuccess: (data) => {
      setConversationHistory(data.conversationHistory);
      setAgentMessage("");
    },
    onError: (e) => toast.error(`Agent error: ${e.message}`),
  });

  const handleCreateThread = async () => {
    if (!user) { window.location.href = getLoginUrl(); return; }
    if (newThread.title.length < 5) { toast.error("Title must be at least 5 characters"); return; }
    if (newThread.description.length < 10) { toast.error("Description must be at least 10 characters"); return; }
    try { await submitContentMutation.mutateAsync({ contentType: "forum_thread", aiUsageLevel: newThread.aiUsageLevel }); } catch {}
    createThreadMutation.mutate(newThread);
  };

  const handleSendAgent = () => {
    if (!user) { window.location.href = getLoginUrl(); return; }
    if (!agentMessage.trim()) return;
    chatMutation.mutate({ message: agentMessage.trim(), conversationHistory });
  };

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      feature_request: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      bug_report:      "bg-red-500/20 text-red-400 border-red-500/50",
      discussion:      "bg-purple-500/20 text-purple-400 border-purple-500/50",
      question:        "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    };
    return map[cat] ?? "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  const getStatusIcon = (status: string) => {
    if (status === "open")        return <AlertCircle className="w-3.5 h-3.5 text-blue-400" />;
    if (status === "in_progress") return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
    if (status === "completed")   return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
    return <AlertCircle className="w-3.5 h-3.5 text-gray-400" />;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 border-b border-border/50 bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <div>
            <span className="font-bold text-base">Developer Hub</span>
            <span className="text-xs text-muted-foreground ml-3">Forum · AI Agent</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              <SelectItem value="feature_request" className="text-xs">Feature Requests</SelectItem>
              <SelectItem value="bug_report" className="text-xs">Bug Reports</SelectItem>
              <SelectItem value="discussion" className="text-xs">Discussions</SelectItem>
              <SelectItem value="question" className="text-xs">Questions</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="votes" className="text-xs">Most Voted</SelectItem>
              <SelectItem value="recent" className="text-xs">Most Recent</SelectItem>
            </SelectContent>
          </Select>
          {user ? (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />New Thread
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Thread</DialogTitle>
                  <DialogDescription>Share ideas, report bugs, or start a discussion</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Title</Label>
                    <Input placeholder="Brief, descriptive title…" value={newThread.title} onChange={e => setNewThread({ ...newThread, title: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category</Label>
                    <Select value={newThread.category} onValueChange={(v: any) => setNewThread({ ...newThread, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="bug_report">Bug Report</SelectItem>
                        <SelectItem value="discussion">Discussion</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea placeholder="Provide details and context…" value={newThread.description} onChange={e => setNewThread({ ...newThread, description: e.target.value })} className="min-h-[100px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">AI Usage Level</Label>
                    <Select value={newThread.aiUsageLevel} onValueChange={(v: any) => setNewThread({ ...newThread, aiUsageLevel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No AI (100% Human) — 2× Rewards</SelectItem>
                        <SelectItem value="minor">Minor AI Assistance — 2× Rewards</SelectItem>
                        <SelectItem value="moderate">Moderate AI Use — 2× Rewards</SelectItem>
                        <SelectItem value="heavy">Heavy AI Use — 1× Rewards</SelectItem>
                        <SelectItem value="full">Fully AI Generated — 1× Rewards</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Verified human creators earn up to 5× rewards.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateThread} disabled={createThreadMutation.isPending} className="bg-gradient-to-r from-purple-500 to-pink-500">
                    {createThreadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Thread
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button size="sm" className="h-8 text-xs bg-gradient-to-r from-purple-500 to-pink-500" onClick={() => window.location.href = getLoginUrl()}>
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 overflow-hidden grid lg:grid-cols-5">

        {/* ── LEFT — Forum threads ── */}
        <div className="lg:col-span-3 border-r border-border/50 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : threads && threads.length > 0 ? (
            <div className="p-4 space-y-3">
              {threads.map((thread: any) => (
                <Card
                  key={thread.id}
                  className="border-border/60 hover:border-border/90 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/developer-hub/thread/${thread.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 min-w-[44px]">
                        <div className="flex items-center gap-1 text-xs">
                          <ThumbsUp className="w-3 h-3 text-green-400" />
                          <span>{thread.upvotes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <ThumbsDown className="w-3 h-3 text-red-400" />
                          <span>{thread.downvotes || 0}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{(thread.upvotes || 0) - (thread.downvotes || 0)} net</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-sm font-semibold leading-snug">{thread.title}</h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {getStatusIcon(thread.status)}
                            <span className="text-xs text-muted-foreground capitalize">{thread.status.replace("_", " ")}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{thread.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge className={`text-[10px] ${getCategoryColor(thread.category)}`}>{thread.category.replace("_", " ")}</Badge>
                          <span className="flex items-center gap-1">
                            by {thread.author?.name || "Anonymous"}
                            {thread.author?.tier && <TierBadge tier={thread.author.tier as any} size="sm" />}
                          </span>
                          <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="font-semibold text-muted-foreground text-sm">No threads yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to start a discussion — click "New Thread" above.</p>
            </div>
          )}
        </div>

        {/* ── RIGHT — Developer Agent ── */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-border/40 flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Developer Agent</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {conversationHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-2">
                <Bot className="w-10 h-10 text-purple-400/40 mb-3" />
                <p className="font-semibold text-muted-foreground text-sm">Developer Agent</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">Ask about features, code architecture, bugs, or roadmap priorities.</p>
              </div>
            ) : (
              conversationHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] rounded-xl px-3 py-2 ${msg.role === "user" ? "bg-purple-600 text-white" : "bg-card border border-border/60"}`}>
                    {msg.role === "assistant" ? (
                      <Streamdown className="text-xs">{msg.content}</Streamdown>
                    ) : (
                      <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                    )}
                    <p className="text-[10px] opacity-50 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/60 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  <span className="text-xs text-muted-foreground">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 pb-4 pt-2 border-t border-border/40">
            <div className="flex gap-2">
              <Input
                placeholder={user ? "Ask about features, code, or roadmap…" : "Sign in to chat with the Developer Agent"}
                value={agentMessage}
                onChange={e => setAgentMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendAgent()}
                disabled={chatMutation.isPending || !user}
                className="text-xs flex-1"
              />
              <Button
                onClick={handleSendAgent}
                disabled={chatMutation.isPending || !agentMessage.trim() || !user}
                size="icon"
                className="shrink-0 bg-gradient-to-r from-purple-500 to-pink-500"
              >
                {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
