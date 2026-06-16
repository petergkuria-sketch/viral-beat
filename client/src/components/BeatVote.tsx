import { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BeatVoteProps {
  topic: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  variant?: "default" | "minimal" | "pill";
}

export function BeatVote({ 
  topic, 
  className, 
  size = "md",
  showScore = true,
  variant = "default"
}: BeatVoteProps) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  // Get vote counts
  const { data: counts, isLoading: countsLoading } = trpc.votes.getCounts.useQuery(
    { topic },
    { enabled: !!topic }
  );
  
  // Get user's current vote (only if authenticated)
  const { data: userVote, isLoading: userVoteLoading } = trpc.votes.getUserVote.useQuery(
    { topic },
    { enabled: isAuthenticated && !!topic }
  );
  
  // Cast vote mutation
  const castVote = trpc.votes.cast.useMutation({
    onMutate: async ({ voteType }) => {
      // Cancel outgoing refetches
      await utils.votes.getCounts.cancel({ topic });
      await utils.votes.getUserVote.cancel({ topic });
      
      // Snapshot previous values
      const previousCounts = utils.votes.getCounts.getData({ topic });
      const previousUserVote = utils.votes.getUserVote.getData({ topic });
      
      // Optimistically update
      const currentVote = previousUserVote?.voteType;
      let newUpvotes = previousCounts?.upvotes || 0;
      let newDownvotes = previousCounts?.downvotes || 0;
      
      if (currentVote === voteType) {
        // Removing vote
        if (voteType === "up") newUpvotes--;
        else newDownvotes--;
      } else if (currentVote) {
        // Changing vote
        if (voteType === "up") {
          newUpvotes++;
          newDownvotes--;
        } else {
          newDownvotes++;
          newUpvotes--;
        }
      } else {
        // New vote
        if (voteType === "up") newUpvotes++;
        else newDownvotes++;
      }
      
      utils.votes.getCounts.setData({ topic }, {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        score: newUpvotes - newDownvotes,
      });
      
      utils.votes.getUserVote.setData({ topic }, {
        voteType: currentVote === voteType ? null : voteType,
      });
      
      return { previousCounts, previousUserVote };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCounts) {
        utils.votes.getCounts.setData({ topic }, context.previousCounts);
      }
      if (context?.previousUserVote) {
        utils.votes.getUserVote.setData({ topic }, context.previousUserVote);
      }
      toast.error("Failed to vote. Please try again.");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      utils.votes.getCounts.invalidate({ topic });
      utils.votes.getUserVote.invalidate({ topic });
    },
  });
  
  const handleVote = (voteType: "up" | "down") => {
    if (!isAuthenticated) {
      toast.info("Please sign in to vote", {
        action: {
          label: "Sign In",
          onClick: () => window.location.href = getLoginUrl(),
        },
      });
      return;
    }
    
    castVote.mutate({ topic, voteType });
  };
  
  const isLoading = countsLoading || (isAuthenticated && userVoteLoading);
  const currentVote = userVote?.voteType;
  const score = counts?.score || 0;
  const upvotes = counts?.upvotes || 0;
  const downvotes = counts?.downvotes || 0;
  
  // Size classes
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };
  
  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <button
          onClick={() => handleVote("up")}
          disabled={castVote.isPending}
          className={cn(
            "p-1 rounded transition-colors",
            currentVote === "up" 
              ? "text-green-400 bg-green-400/20" 
              : "text-gray-400 hover:text-green-400 hover:bg-green-400/10"
          )}
        >
          <ThumbsUp className={iconSizes[size]} />
        </button>
        {showScore && (
          <span className={cn(
            "font-medium min-w-[2rem] text-center",
            score > 0 ? "text-green-400" : score < 0 ? "text-red-400" : "text-gray-400"
          )}>
            {isLoading ? "..." : score}
          </span>
        )}
        <button
          onClick={() => handleVote("down")}
          disabled={castVote.isPending}
          className={cn(
            "p-1 rounded transition-colors",
            currentVote === "down" 
              ? "text-red-400 bg-red-400/20" 
              : "text-gray-400 hover:text-red-400 hover:bg-red-400/10"
          )}
        >
          <ThumbsDown className={iconSizes[size]} />
        </button>
      </div>
    );
  }
  
  if (variant === "pill") {
    return (
      <div className={cn(
        "inline-flex items-center rounded-full bg-[#0d1e36] border border-[#1e3a5f]",
        className
      )}>
        <button
          onClick={() => handleVote("up")}
          disabled={castVote.isPending}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-l-full transition-colors",
            currentVote === "up" 
              ? "bg-green-500/20 text-green-400" 
              : "text-gray-400 hover:bg-green-500/10 hover:text-green-400"
          )}
        >
          <ThumbsUp className={iconSizes[size]} />
          <span className="text-xs font-medium">{upvotes}</span>
        </button>
        <div className="w-px h-6 bg-[#1e3a5f]" />
        <button
          onClick={() => handleVote("down")}
          disabled={castVote.isPending}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-r-full transition-colors",
            currentVote === "down" 
              ? "bg-red-500/20 text-red-400" 
              : "text-gray-400 hover:bg-red-500/10 hover:text-red-400"
          )}
        >
          <ThumbsDown className={iconSizes[size]} />
          <span className="text-xs font-medium">{downvotes}</span>
        </button>
      </div>
    );
  }
  
  // Default variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleVote("up")}
        disabled={castVote.isPending}
        className={cn(
          sizeClasses[size],
          "rounded-full transition-all",
          currentVote === "up" 
            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300" 
            : "text-gray-400 hover:bg-green-500/10 hover:text-green-400"
        )}
      >
        {castVote.isPending ? (
          <Loader2 className={cn(iconSizes[size], "animate-spin")} />
        ) : (
          <ThumbsUp className={iconSizes[size]} />
        )}
      </Button>
      
      {showScore && (
        <div className="flex flex-col items-center min-w-[2.5rem]">
          <span className={cn(
            "font-bold text-lg leading-none",
            score > 0 ? "text-green-400" : score < 0 ? "text-red-400" : "text-gray-400"
          )}>
            {isLoading ? "..." : score > 0 ? `+${score}` : score}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Beat</span>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleVote("down")}
        disabled={castVote.isPending}
        className={cn(
          sizeClasses[size],
          "rounded-full transition-all",
          currentVote === "down" 
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300" 
            : "text-gray-400 hover:bg-red-500/10 hover:text-red-400"
        )}
      >
        {castVote.isPending ? (
          <Loader2 className={cn(iconSizes[size], "animate-spin")} />
        ) : (
          <ThumbsDown className={iconSizes[size]} />
        )}
      </Button>
    </div>
  );
}

export default BeatVote;
