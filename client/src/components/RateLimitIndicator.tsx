import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

export function RateLimitIndicator() {
  const { user } = useAuth();
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");

  // Extract rate limit info from response headers
  useEffect(() => {
    const interceptor = (response: Response) => {
      const limit = response.headers.get("RateLimit-Limit");
      const remaining = response.headers.get("RateLimit-Remaining");
      const reset = response.headers.get("RateLimit-Reset");

      if (limit && remaining && reset) {
        setRateLimitInfo({
          limit: parseInt(limit),
          remaining: parseInt(remaining),
          reset: parseInt(reset) * 1000, // Convert to milliseconds
        });
      }
    };

    // Monkey-patch fetch to intercept responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      interceptor(response.clone());
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Update time until reset
  useEffect(() => {
    if (!rateLimitInfo) return;

    const updateTime = () => {
      const now = Date.now();
      const diff = rateLimitInfo.reset - now;

      if (diff <= 0) {
        setTimeUntilReset("Resetting...");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        setTimeUntilReset(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilReset(`${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [rateLimitInfo]);

  if (!rateLimitInfo) return null;

  const percentage = (rateLimitInfo.remaining / rateLimitInfo.limit) * 100;
  const isLow = percentage < 20;
  const isWarning = percentage < 50;

  const userType = user ? "Authenticated" : "Guest";
  const limitDescription = user
    ? "500 requests per 15 minutes"
    : "100 requests per 15 minutes";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1e36] border border-[#1e3a5f] cursor-pointer hover:border-[#2e4a6f] transition-colors">
          {isLow && <AlertCircle className="w-4 h-4 text-red-500" />}
          {isWarning && !isLow && <Clock className="w-4 h-4 text-yellow-500" />}
          <div className="flex flex-col gap-1 min-w-[120px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">API Quota</span>
              <span
                className={`font-medium ${
                  isLow
                    ? "text-red-500"
                    : isWarning
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                {rateLimitInfo.remaining}/{rateLimitInfo.limit}
              </span>
            </div>
            <Progress
              value={percentage}
              className={`h-1 ${isLow ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-[#0d1e36] border-[#1e3a5f] max-w-xs">
        <div className="space-y-2">
          <div className="font-semibold">Rate Limit Info</div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">User Type:</span>
              <span>{userType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Limit:</span>
              <span>{limitDescription}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Remaining:</span>
              <span>{rateLimitInfo.remaining} requests</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Resets in:</span>
              <span>{timeUntilReset}</span>
            </div>
          </div>
          {isLow && (
            <div className="text-xs text-red-400 pt-2 border-t border-[#1e3a5f]">
              ⚠️ You're running low on API quota. Consider signing in for higher limits.
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
