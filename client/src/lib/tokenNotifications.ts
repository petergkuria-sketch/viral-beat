import { toast } from "sonner";
import { Coins } from "lucide-react";

export type TokenEventType =
  | "earn_thread_creation"
  | "earn_post_reply"
  | "earn_daily_login"
  | "earn_upvote_received"
  | "spend_ai_agent"
  | "spend_marketplace"
  | "spend_premium_feature";

interface TokenNotificationOptions {
  amount: number;
  newBalance: number;
  description?: string;
}

const eventMessages: Record<TokenEventType, string> = {
  earn_thread_creation: "Created forum thread",
  earn_post_reply: "Posted reply",
  earn_daily_login: "Daily login bonus",
  earn_upvote_received: "Received upvote",
  spend_ai_agent: "Used AI Agent",
  spend_marketplace: "Purchased item",
  spend_premium_feature: "Unlocked premium feature",
};

export function showTokenNotification(
  eventType: TokenEventType,
  options: TokenNotificationOptions
) {
  const { amount, newBalance, description } = options;
  const isEarning = amount > 0;
  const absAmount = Math.abs(amount);
  const message = description || eventMessages[eventType];

  if (isEarning) {
    toast.success(`+${absAmount} VBT • ${message}`, {
      description: `Balance: ${newBalance} VBT`,
      duration: 4000,
    });
  } else {
    toast.info(`-${absAmount} VBT • ${message}`, {
      description: `Balance: ${newBalance} VBT`,
      duration: 4000,
    });
  }
}
