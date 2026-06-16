import { useState } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "wouter";
import { 
  ArrowLeft, Copy, Check, Download, Share2, Twitter, Linkedin, Facebook,
  Palette, Maximize2, Eye, BarChart3, Globe, Code, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { EmbeddableWidget, WidgetConfig, defaultWidgetConfig } from "@/components/EmbeddableWidget";

export default function WidgetBuilder() {
  const [config, setConfig] = useState<WidgetConfig>(defaultWidgetConfig);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("customize");

  const updateConfig = (key: keyof WidgetConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const generateEmbedCode = () => {
    const params = new URLSearchParams({
      topic: config.topic,
      theme: config.theme,
      size: config.size,
      showScore: config.showScore.toString(),
      showTrend: config.showTrend.toString(),
      showEngagement: config.showEngagement.toString(),
      showPlatforms: config.showPlatforms.toString(),
      primaryColor: config.primaryColor,
      accentColor: config.accentColor,
      borderRadius: config.borderRadius.toString(),
      showBranding: config.showBranding.toString(),
    });

    const baseUrl = window.location.origin;
    return `<iframe 
  src="${baseUrl}/embed/widget?${params.toString()}"
  width="${config.size === 'small' ? '300' : config.size === 'medium' ? '380' : '500'}"
  height="${config.size === 'small' ? '280' : config.size === 'medium' ? '360' : '480'}"
  frameborder="0"
  style="border-radius: ${config.borderRadius}px; overflow: hidden;"
></iframe>`;
  };

  const generateJsCode = () => {
    const baseUrl = window.location.origin;
    return `<script src="${baseUrl}/widget.js"></script>
<div 
  id="viral-beat-widget" 
  data-topic="${config.topic}"
  data-theme="${config.theme}"
  data-size="${config.size}"
  data-primary-color="${config.primaryColor}"
  data-accent-color="${config.accentColor}"
></div>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = `Check out the virality score for "${config.topic}" on The Viral Beat! 🚀`;
    const url = `${window.location.origin}/dashboard?topic=${encodeURIComponent(config.topic)}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = `${window.location.origin}/dashboard?topic=${encodeURIComponent(config.topic)}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
  };

  const shareToFacebook = () => {
    const url = `${window.location.origin}/dashboard?topic=${encodeURIComponent(config.topic)}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
        <BackToDashboard />
      {/* Header */}
      <header className="border-b border-[#1e3a5f] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Widget Builder</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={shareToTwitter} className="border-[#1e3a5f]">
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={shareToLinkedIn} className="border-[#1e3a5f]">
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={shareToFacebook} className="border-[#1e3a5f]">
              <Facebook className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customization Panel */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-[#0d1e36] border border-[#1e3a5f]">
                <TabsTrigger key="customize" value="customize" className="data-[state=active]:bg-cyan-500">
                  <Palette className="w-4 h-4 mr-2" />
                  Customize
                </TabsTrigger>
                <TabsTrigger key="embed" value="embed" className="data-[state=active]:bg-cyan-500">
                  <Code className="w-4 h-4 mr-2" />
                  Embed Code
                </TabsTrigger>
                <TabsTrigger key="share" value="share" className="data-[state=active]:bg-cyan-500">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </TabsTrigger>
              </TabsList>

              <TabsContent key="customize-content" value="customize" className="space-y-4 mt-4">
                {/* Topic */}
                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Topic</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={config.topic}
                      onChange={(e) => updateConfig("topic", e.target.value)}
                      placeholder="Enter trending topic"
                      className="bg-[#0a1628] border-[#1e3a5f]"
                    />
                  </CardContent>
                </Card>

                {/* Theme */}
                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Theme</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {(["dark", "light", "neon", "minimal"] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => updateConfig("theme", theme)}
                          className={`p-3 rounded-lg border-2 text-sm capitalize transition-all ${
                            config.theme === theme
                              ? "border-cyan-500 bg-cyan-500/20"
                              : "border-[#1e3a5f] hover:border-[#2e4a6f]"
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Size */}
                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {(["small", "medium", "large"] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => updateConfig("size", size)}
                          className={`p-3 rounded-lg border-2 text-sm capitalize transition-all ${
                            config.size === size
                              ? "border-cyan-500 bg-cyan-500/20"
                              : "border-[#1e3a5f] hover:border-[#2e4a6f]"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Colors */}
                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label className="w-24 text-gray-400">Primary</Label>
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => updateConfig("primaryColor", e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => updateConfig("primaryColor", e.target.value)}
                        className="flex-1 bg-[#0a1628] border-[#1e3a5f]"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="w-24 text-gray-400">Accent</Label>
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => updateConfig("accentColor", e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                      <Input
                        value={config.accentColor}
                        onChange={(e) => updateConfig("accentColor", e.target.value)}
                        className="flex-1 bg-[#0a1628] border-[#1e3a5f]"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Border Radius */}
                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                      Border Radius: {config.borderRadius}px
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Slider
                      value={[config.borderRadius]}
                      onValueChange={([value]) => updateConfig("borderRadius", value)}
                      min={0}
                      max={32}
                      step={2}
                      className="w-full"
                    />
                  </CardContent>
                </Card>

                {/* Display Options */}
                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Display Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "showScore", label: "Virality Score", icon: BarChart3 },
                      { key: "showTrend", label: "Trend Change", icon: Eye },
                      { key: "showEngagement", label: "Engagement Stats", icon: Eye },
                      { key: "showPlatforms", label: "Platform Distribution", icon: Globe },
                      { key: "showBranding", label: "Show Branding", icon: Image },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <Label className="text-gray-300">{label}</Label>
                        </div>
                        <Switch
                          checked={config[key as keyof WidgetConfig] as boolean}
                          onCheckedChange={(checked) => updateConfig(key as keyof WidgetConfig, checked)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent key="embed-content" value="embed" className="space-y-4 mt-4">
                {/* iFrame Code */}
                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      iFrame Embed Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-[#0a1628] p-4 rounded-lg text-xs text-gray-300 overflow-x-auto">
                        {generateEmbedCode()}
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2 bg-cyan-500 hover:bg-cyan-600"
                        onClick={() => copyToClipboard(generateEmbedCode())}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* JavaScript Code */}
                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      JavaScript Embed Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-[#0a1628] p-4 rounded-lg text-xs text-gray-300 overflow-x-auto">
                        {generateJsCode()}
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2 bg-cyan-500 hover:bg-cyan-600"
                        onClick={() => copyToClipboard(generateJsCode())}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent key="share-content" value="share" className="space-y-4 mt-4">
                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Share on Social Media</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                      onClick={shareToTwitter}
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      Share on Twitter / X
                    </Button>
                    <Button
                      className="w-full bg-[#0A66C2] hover:bg-[#094d92] text-white"
                      onClick={shareToLinkedIn}
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      Share on LinkedIn
                    </Button>
                    <Button
                      className="w-full bg-[#1877F2] hover:bg-[#1466d2] text-white"
                      onClick={shareToFacebook}
                    >
                      <Facebook className="w-4 h-4 mr-2" />
                      Share on Facebook
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-[#0d1e36] border-[#1e3a5f]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Direct Link</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/dashboard?topic=${encodeURIComponent(config.topic)}`}
                        readOnly
                        className="bg-[#0a1628] border-[#1e3a5f]"
                      />
                      <Button
                        className="bg-cyan-500 hover:bg-cyan-600"
                        onClick={() => copyToClipboard(`${window.location.origin}/dashboard?topic=${encodeURIComponent(config.topic)}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-300">Live Preview</h2>
            <div className="bg-[#0d1e36] border border-[#1e3a5f] rounded-xl p-8 flex items-center justify-center min-h-[500px]">
              <EmbeddableWidget config={config} isPreview />
            </div>
            <p className="text-sm text-gray-500 text-center">
              This is how your widget will appear when embedded on other websites.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
