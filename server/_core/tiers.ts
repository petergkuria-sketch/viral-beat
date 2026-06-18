// Subscription tier definitions and gating helpers

export type Tier = "free" | "analyst" | "enterprise";

export const TIER_LIMITS: Record<Tier, {
  label: string;
  price: number;
  aiCallsPerDay: number;
  countriesUnlocked: number;    // max countries accessible (free = 10 preview, paid = all 55)
  liveRefresh: boolean;          // can bypass cache and force-regenerate a brief
  apiCallsPerMonth: number;      // REST API quota
  exportEnabled: boolean;
  webhooksEnabled: boolean;
}> = {
  free: {
    label: "Free",
    price: 0,
    aiCallsPerDay: 3,
    countriesUnlocked: 10,
    liveRefresh: false,
    apiCallsPerMonth: 100,
    exportEnabled: false,
    webhooksEnabled: false,
  },
  analyst: {
    label: "Analyst",
    price: 19,
    aiCallsPerDay: 50,
    countriesUnlocked: 55,
    liveRefresh: true,
    apiCallsPerMonth: 5000,
    exportEnabled: true,
    webhooksEnabled: false,
  },
  enterprise: {
    label: "Enterprise",
    price: 149,
    aiCallsPerDay: 999999,
    countriesUnlocked: 55,
    liveRefresh: true,
    apiCallsPerMonth: 999999,
    exportEnabled: true,
    webhooksEnabled: true,
  },
};

export function getTierLimits(tier: Tier | string) {
  return TIER_LIMITS[(tier as Tier) ?? "free"] ?? TIER_LIMITS.free;
}

export function tierAtLeast(userTier: Tier | string, required: Tier): boolean {
  const order: Tier[] = ["free", "analyst", "enterprise"];
  return order.indexOf(userTier as Tier) >= order.indexOf(required);
}
