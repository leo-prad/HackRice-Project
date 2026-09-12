import type { SubscriptionTier } from "../types";

const KEY = "subscription_tier";

export function getSubscriptionTier(): SubscriptionTier {
  const t = localStorage.getItem(KEY);
  if (t === "pro" || t === "premium") return t;
  return "free";
}

export function setSubscriptionTier(tier: SubscriptionTier) {
  localStorage.setItem(KEY, tier);
}

export function tierHeaders(): HeadersInit {
  return { "X-Subscription-Tier": getSubscriptionTier() };
}

export function isProOrPremium(): boolean {
  const t = getSubscriptionTier();
  return t === "pro" || t === "premium";
}
