import { trpc } from "@/lib/trpc";
import { Coins } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function TokenBalanceIndicator() {
  const [, setLocation] = useLocation();
  const { data: balance, isLoading } = trpc.tokens.getBalance.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted animate-pulse">
        <Coins className="h-4 w-4" />
        <span className="text-sm font-medium">...</span>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 py-1.5 h-auto rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
          onClick={() => setLocation("/tokens")}
        >
          <Coins className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-semibold">{balance.balance.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">VBT</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-semibold mb-1">VB Token Balance</p>
          <p className="text-muted-foreground">Total Earned: {balance.totalEarned.toLocaleString()}</p>
          <p className="text-muted-foreground">Total Spent: {balance.totalSpent.toLocaleString()}</p>
          <p className="text-xs mt-2 text-purple-400">Click to view dashboard</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
