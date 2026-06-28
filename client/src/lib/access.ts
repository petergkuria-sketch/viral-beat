// Central client-side access helpers. Admins bypass every subscription/tier gate.

type AnyUser = { role?: string | null; subscriptionTier?: string | null } | null | undefined;

export function isAdmin(user: AnyUser): boolean {
  return user?.role === "admin";
}

/** Effective subscription tier — admins are treated as top-tier ("enterprise"). */
export function effectiveTier(user: AnyUser): "guest" | "free" | "premium" | "analyst" | "enterprise" {
  if (!user) return "guest";
  if (isAdmin(user)) return "enterprise";
  return (user.subscriptionTier as any) ?? "free";
}

/** Analyst-tier features (forecasts, OSS contacts, premium reports). */
export function hasAnalystAccess(user: AnyUser): boolean {
  if (isAdmin(user)) return true;
  const t = user?.subscriptionTier;
  return t === "analyst" || t === "enterprise";
}
