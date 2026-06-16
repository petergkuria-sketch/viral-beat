import { useState } from "react";
import { Loader2, Copy, CheckCircle2, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function ScriptWriter() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "youtube" | "instagram" | "twitter">("tiktok");
  const [contentType, setContentType] = useState<"educational" | "entertainment" | "promotional" | "storytelling">("educational");
  const [duration, setDuration] = useState<"15-30s" | "30-60s" | "1-3min" | "3-5min" | "5-10min">("30-60s");
  const [tone, setTone] = useState<"casual" | "professional" | "humorous" | "inspirational">("casual");
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateScript = trpc.aiAgents.generateScript.useMutation({
    onSuccess: (data: any) => {
      setGeneratedScript(data.script);
      toast.success("Script generated successfully!");
    },
    onError: (error: any) => {
      toast.error("Failed to generate script: " + error.message);
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    generateScript.mutate({
      topic: topic.trim(),
      platform,
      contentType,
      duration,
      tone,
    });
  };

  const handleCopy = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      toast.success("Script copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const platformColors = {
    tiktok: "bg-[#00f2ea] text-black",
    youtube: "bg-[#FF0000] text-white",
    instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    twitter: "bg-[#1DA1F2] text-white",
  };

  return (
    <div className="min-h-screen bg-[#050b1a] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Script Writer Agent</h1>
            <p className="text-gray-400">Generate viral video scripts optimized for each platform</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Script Configuration
              </CardTitle>
              <CardDescription>Customize your script parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topic Input */}
              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Trend</Label>
                <Input
                  id="topic"
                  placeholder="e.g., AI in Art, Sustainable Fashion, Indie Gaming"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-[#050b1a] border-[#1e3a5f] text-white"
                />
              </div>

              {/* Platform Selection */}
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
                  <SelectTrigger id="platform" className="bg-[#050b1a] border-[#1e3a5f] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1e36] border-[#1e3a5f] text-white">
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                  <SelectTrigger id="contentType" className="bg-[#050b1a] border-[#1e3a5f] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1e36] border-[#1e3a5f] text-white">
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="storytelling">Storytelling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={(value: any) => setDuration(value)}>
                  <SelectTrigger id="duration" className="bg-[#050b1a] border-[#1e3a5f] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1e36] border-[#1e3a5f] text-white">
                    <SelectItem value="15-30s">15-30 seconds</SelectItem>
                    <SelectItem value="30-60s">30-60 seconds</SelectItem>
                    <SelectItem value="1-3min">1-3 minutes</SelectItem>
                    <SelectItem value="3-5min">3-5 minutes</SelectItem>
                    <SelectItem value="5-10min">5-10 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                  <SelectTrigger id="tone" className="bg-[#050b1a] border-[#1e3a5f] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1e36] border-[#1e3a5f] text-white">
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generateScript.isPending || !topic.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {generateScript.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Script Output */}
          <Card className="bg-[#0d1e36] border-[#1e3a5f]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Script</CardTitle>
                  <CardDescription>Your AI-powered viral script</CardDescription>
                </div>
                {generatedScript && (
                  <div className="flex items-center gap-2">
                    <Badge className={platformColors[platform]}>
                      {platform.toUpperCase()}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="border-[#1e3a5f] hover:bg-[#1e3a5f]"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1 text-green-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generateScript.isPending ? (
                <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
                  <p className="text-gray-400">Crafting your viral script...</p>
                </div>
              ) : generatedScript ? (
                <div className="bg-[#050b1a] rounded-lg p-6 max-h-[500px] overflow-y-auto">
                  <Streamdown className="prose prose-invert max-w-none">
                    {generatedScript}
                  </Streamdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] space-y-4 text-center">
                  <FileText className="w-16 h-16 text-gray-600" />
                  <div>
                    <p className="text-gray-400 font-medium">No script generated yet</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Configure your parameters and click "Generate Script"
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <Card className="bg-[#0d1e36] border-[#1e3a5f]">
          <CardHeader>
            <CardTitle className="text-lg">💡 Pro Tips for Viral Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-cyan-400 mb-1">TikTok</h4>
                <p className="text-gray-400">Hook in 3 seconds. Use trending sounds. Fast cuts.</p>
              </div>
              <div>
                <h4 className="font-semibold text-red-400 mb-1">YouTube</h4>
                <p className="text-gray-400">Strong intro. Pattern interrupts. Clear CTA.</p>
              </div>
              <div>
                <h4 className="font-semibold text-pink-400 mb-1">Instagram</h4>
                <p className="text-gray-400">Visual hooks. Text overlays. Trending audio.</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Twitter</h4>
                <p className="text-gray-400">Punchy threads. Line breaks. Retweet-worthy.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
