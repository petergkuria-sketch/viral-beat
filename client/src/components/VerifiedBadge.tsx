import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  /**
   * Size variant of the badge
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Display mode
   * - "icon-only": Just the checkmark icon
   * - "with-text": Icon + "Verified" text
   * - "inline": Inline icon without badge wrapper
   */
  variant?: "icon-only" | "with-text" | "inline";
  
  /**
   * Custom tooltip text (default: "Verified Creator")
   */
  tooltipText?: string;
  
  /**
   * Custom className for additional styling
   */
  className?: string;
}

export function VerifiedBadge({
  size = "md",
  variant = "icon-only",
  tooltipText = "Verified Creator - Identity confirmed via social media",
  className = "",
}: VerifiedBadgeProps) {
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Inline variant (no badge wrapper)
  if (variant === "inline") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCircle2
              className={`${iconSizes[size]} text-blue-600 dark:text-blue-400 inline-block ${className}`}
              aria-label="Verified"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge variants
  const badgeContent = (
    <Badge
      variant="outline"
      className={`bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 ${textSizes[size]} ${className}`}
    >
      <CheckCircle2 className={`${iconSizes[size]} ${variant === "with-text" ? "mr-1" : ""}`} />
      {variant === "with-text" && "Verified"}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook to check if a user is verified
 * Returns verification status based on social media verification
 */
export function useIsVerified(userId?: number): boolean {
  // This would typically fetch from the backend
  // For now, return false as placeholder
  // TODO: Implement actual verification check via tRPC
  return false;
}
