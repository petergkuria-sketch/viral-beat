import { useState } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Bot, Send, Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { parseMarkdownWithCode } from "@/lib/markdown";

export default function DeveloperAgent() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);

  // Chat mutation
  const chatMutation = trpc.developerHub.chatWithAgent.useMutation({
    onSuccess: (data) => {
      setConversationHistory(data.conversationHistory);
      setMessage("");
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  const handleSendMessage = () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    chatMutation.mutate({
      message: message.trim(),
      conversationHistory,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center">
        <BackToDashboard />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center">
        <Card className="bg-[#0d1e36] border-[#1e3a5f] p-8 text-center max-w-md">
          <CardContent>
            <Bot className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Developer Agent</h2>
            <p className="text-gray-400 mb-6">
              Sign in to chat with the AI-powered Developer Agent
            </p>
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

  return (
    <div className="min-h-screen bg-[#050b1a] text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d1e36] to-[#1a2942] border-b border-[#1e3a5f] py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/developer-hub")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Developer Agent</h1>
                <p className="text-sm text-gray-400">AI-powered development assistant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {conversationHistory.length === 0 ? (
            <Card className="bg-[#0d1e36] border-[#1e3a5f] p-8 text-center">
              <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Welcome to Developer Agent</h3>
              <p className="text-gray-400 mb-4">
                I can help you with feature requests, code reviews, bug analysis, and architectural guidance.
              </p>
              <p className="text-sm text-gray-500">
                Start by asking a question or describing what you'd like to build!
              </p>
            </Card>
          ) : (
            conversationHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50"
                      : "bg-[#0d1e36] border-[#1e3a5f]"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {msg.role === "assistant" && <Bot className="w-5 h-5 text-primary flex-shrink-0 mt-1" />}
                      <div className="flex-1">
                        <div className="text-sm text-gray-300">{parseMarkdownWithCode(msg.content)}</div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <p className="text-sm text-gray-400">Thinking...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-3">
          <Textarea
            placeholder="Ask about features, code review, bugs, or architecture..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="bg-[#0d1e36] border-[#1e3a5f] resize-none"
            rows={3}
          />
          <Button
            onClick={handleSendMessage}
            disabled={chatMutation.isPending || !message.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
