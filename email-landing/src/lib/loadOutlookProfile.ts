import { fetchOutlookProfile } from "./api";
import { getUserProfile, isAuthenticated, saveUserProfile } from "./auth";

/** Load signed-in user's display name from Microsoft Graph (cached in localStorage). */
export async function ensureOutlookProfile(): Promise<void> {
  const cached = getUserProfile();
  if (!isAuthenticated() || (cached?.id && cached.displayName)) return;
  try {
    const profile = await fetchOutlookProfile();
    saveUserProfile({
      id: profile.id,
      displayName: profile.displayName,
      email: profile.email,
      plan: profile.plan,
    });
  } catch {
    // Non-fatal — drafts fall back to "Instructor"
  }
}
