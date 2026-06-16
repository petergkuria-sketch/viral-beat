import { useState } from "react";
import { useLocation } from "wouter";
import {
  Check,
  ChevronRight,
  Youtube,
  Instagram,
  Twitter,
  TrendingUp,
  Sparkles,
  Target,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const platforms = [
    { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-500" },
    { id: "tiktok", name: "TikTok", icon: Target, color: "text-pink-500" },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-purple-500" },
    { id: "twitter", name: "Twitter/X", icon: Twitter, color: "text-blue-500" }
  ];

  const interests = [
    { id: "tech", name: "Technology", icon: Zap },
    { id: "fashion", name: "Fashion & Beauty", icon: Sparkles },
    { id: "gaming", name: "Gaming", icon: Target },
    { id: "fitness", name: "Fitness & Health", icon: TrendingUp },
    { id: "food", name: "Food & Cooking", icon: Target },
    { id: "travel", name: "Travel", icon: Target },
    { id: "music", name: "Music", icon: Target },
    { id: "comedy", name: "Comedy & Entertainment", icon: Sparkles }
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    if (currentStep === 2 && selectedInterests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setLocation("/dashboard");
  };

  const handleComplete = () => {
    // Save preferences (you can add a tRPC mutation here)
    toast.success("Onboarding complete! Welcome to The Viral Beat 🎉");
    setLocation("/dashboard");
  };

  const steps = [
    { number: 1, title: "Connect Platforms", description: "Select your social media platforms" },
    { number: 2, title: "Set Preferences", description: "Choose your content interests" },
    { number: 3, title: "Get Prediction", description: "Receive your first trend forecast" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                      currentStep > step.number
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-4 transition-colors ${
                      currentStep > step.number ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">
                  {currentStep === 1 && "Connect Your Platforms"}
                  {currentStep === 2 && "Choose Your Interests"}
                  {currentStep === 3 && "Your First Prediction"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 &&
                    "Select the social media platforms where you create content"}
                  {currentStep === 2 &&
                    "Help us personalize your trend predictions"}
                  {currentStep === 3 &&
                    "Here's a trending topic perfect for you"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Platforms */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {platforms.map((platform, index) => (
                      <motion.div
                        key={platform.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all duration-300 ${
                            selectedPlatforms.includes(platform.id)
                              ? "border-2 border-primary shadow-lg shadow-primary/20 bg-primary/5"
                              : "border-2 border-transparent hover:border-primary/30 hover:shadow-md"
                          }`}
                          onClick={() => togglePlatform(platform.id)}
                        >
                          <CardContent className="p-6 flex items-center gap-4">
                            <motion.div
                              className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${platform.color}`}
                              animate={{
                                rotate: selectedPlatforms.includes(platform.id) ? [0, -10, 10, 0] : 0
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <platform.icon className="w-6 h-6" />
                            </motion.div>
                            <div className="flex-1">
                              <h3 className="font-bold">{platform.name}</h3>
                            </div>
                            <motion.div
                              initial={false}
                              animate={{
                                scale: selectedPlatforms.includes(platform.id) ? [1, 1.2, 1] : 1
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <Checkbox
                                checked={selectedPlatforms.includes(platform.id)}
                                onCheckedChange={() => togglePlatform(platform.id)}
                              />
                            </motion.div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Step 2: Interests */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {interests.map((interest, index) => (
                      <motion.div
                        key={interest.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all duration-300 ${
                            selectedInterests.includes(interest.id)
                              ? "border-2 border-primary shadow-lg shadow-primary/20 bg-primary/5"
                              : "border-2 border-transparent hover:border-primary/30 hover:shadow-md"
                          }`}
                          onClick={() => toggleInterest(interest.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <motion.div
                              className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2"
                              animate={{
                                rotate: selectedInterests.includes(interest.id) ? 360 : 0
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <interest.icon className="w-6 h-6 text-primary" />
                            </motion.div>
                            <h3 className="font-semibold text-sm">
                              {interest.name}
                            </h3>
                            <motion.div
                              initial={false}
                              animate={{
                                scale: selectedInterests.includes(interest.id) ? [1, 1.2, 1] : 1
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <Checkbox
                                checked={selectedInterests.includes(interest.id)}
                                onCheckedChange={() => toggleInterest(interest.id)}
                                className="mt-2 mx-auto"
                              />
                            </motion.div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Step 3: First Prediction */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <Card className="border-2 border-primary">
                      <CardContent className="p-8">
                        <Badge className="mb-4">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending in {selectedInterests[0] || "Technology"}
                        </Badge>
                        <h2 className="text-2xl font-bold mb-4">
                          AI-Generated Art Tools Going Viral
                        </h2>
                        <div className="flex items-center gap-6 mb-6">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Virality Score
                            </p>
                            <p className="text-3xl font-bold text-primary">
                              92%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Peak Expected
                            </p>
                            <p className="text-lg font-bold">In 3-5 days</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Potential Reach
                            </p>
                            <p className="text-lg font-bold">2.5M+ views</p>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          New AI art generation tools are gaining massive
                          traction. Early creators covering this topic are
                          seeing 300% higher engagement. Perfect timing to
                          create content!
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">AI Tools</Badge>
                          <Badge variant="secondary">Digital Art</Badge>
                          <Badge variant="secondary">Creative Tech</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="bg-muted/50 rounded-lg p-6">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        What's Next?
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>
                            Create content on this trend to maximize reach
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>
                            Share your insights and earn 50-200 VBT tokens
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>
                            Track performance in your dashboard
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons - Fixed at bottom */}
                <div className="flex items-center justify-between pt-6 border-t mt-8">
                  <Button variant="ghost" onClick={handleSkip} size="lg">
                    Skip for now
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={handleNext}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg shadow-lg"
                  >
                    {currentStep === 3 ? "Go to Dashboard" : "Continue"}
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
                
                {/* Selection Counter */}
                {currentStep === 1 && (
                  <div className="text-center mt-4 text-sm text-muted-foreground">
                    {selectedPlatforms.length > 0 ? (
                      <span className="text-primary font-medium">
                        {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
                      </span>
                    ) : (
                      <span>Select at least one platform to continue</span>
                    )}
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="text-center mt-4 text-sm text-muted-foreground">
                    {selectedInterests.length > 0 ? (
                      <span className="text-primary font-medium">
                        {selectedInterests.length} interest{selectedInterests.length > 1 ? 's' : ''} selected
                      </span>
                    ) : (
                      <span>Select at least one interest to continue</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
