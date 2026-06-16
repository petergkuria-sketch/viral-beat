import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Sparkles, Crown, Zap } from "lucide-react";

type Tier = "ai_assisted" | "human_created" | "verified_human" | "premium_human";

interface TierBadgeProps {
  tier: Tier;
  showMultiplier?: boolean;
  size?: "sm" | "md" | "lg";
}

const tierConfig = {
  ai_assisted: {
    label: "AI-Assisted",
    multiplier: "1x",
    icon: Sparkles,
    color: "bg-gray-500/20 text-gray-400 border-gray-500/50",
    description: "Content created with AI assistance",
  },
  human_created: {
    label: "Human",
    multiplier: "2x",
    icon: Shield,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    description: "Original human-created content",
  },
  verified_human: {
    label: "Verified",
    multiplier: "3x",
    icon: Shield,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    description: "Identity-verified human creator",
  },
  premium_human: {
    label: "Premium",
    multiplier: "5x",
    icon: Crown,
    color: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/50",
    description: "Elite human creator with high engagement",
  },
};

export function TierBadge({ tier, showMultiplier = false, size = "sm" }: TierBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`${config.color} ${sizeClasses[size]} flex items-center gap-1 cursor-help`}
          >
            <Icon className={iconSizes[size]} />
            <span>{config.label}</span>
            {showMultiplier && (
              <span className="font-bold ml-1">{config.multiplier}</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-[#0d1e36] border-cyan-500/30 text-white">
          <div className="space-y-1">
            <p className="font-semibold">{config.label} Creator</p>
            <p className="text-xs text-gray-400">{config.description}</p>
            <p className="text-xs text-cyan-400">Reward Multiplier: {config.multiplier}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
