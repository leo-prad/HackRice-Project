import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ConnectOutlookButton } from "../components/ConnectOutlookButton";
import { IncuriaLogo } from "../components/brand/IncuriaLogo";
import { BrandCard } from "../components/ui/BrandCard";
import { PageCanvas } from "../components/ui/PageCanvas";
import { exchangeMicrosoftCodeOnce, friendlyOAuthError } from "../lib/api";
import { clearTokens, saveTokenResponse, saveUserProfile } from "../lib/auth";
import { resolvePostAuthDestination } from "../lib/postAuthRoute";
import { consumePostAuthRedirect, ROUTES } from "../lib/routes";
import { setSubscriptionTier } from "../lib/subscription";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Completing sign-in…");

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const description = searchParams.get("error_description");
    if (oauthError) {
      clearTokens();
      setError(friendlyOAuthError(description ?? oauthError));
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code in callback URL.");
      return;
    }

    let active = true;
    clearTokens();
    setStatus("Exchanging sign-in code…");

    exchangeMicrosoftCodeOnce(code)
      .then(async (tokenResponse) => {
        if (!active) return;
        saveTokenResponse(tokenResponse);
        setStatus("Saving your account…");
        const synced = tokenResponse.user;
        if (synced?.id) {
          saveUserProfile({
            id: synced.id,
            displayName: synced.displayName,
            email: synced.email,
            plan: synced.plan,
            isNewUser: synced.isNewUser,
            onboardingCompleted: synced.onboardingCompleted,
          });
          if (synced.plan) setSubscriptionTier(synced.plan);
        }
        setStatus("Loading your workspace…");
        navigate(
          resolvePostAuthDestination(
            {
              isNewUser: synced?.isNewUser,
              onboardingCompleted: synced?.onboardingCompleted,
            },
            consumePostAuthRedirect(),
          ),
          { replace: true },
        );
      })
      .catch((err) => {
        if (!active) return;
        clearTokens();
        const raw = err instanceof Error ? err.message : "Authentication failed";
        setError(friendlyOAuthError(raw));
      });

    return () => {
      active = false;
    };
  }, [searchParams, navigate]);

  return (
    <PageCanvas scroll={false} className="flex min-h-screen flex-col items-center justify-center px-4">
      <BrandCard className="w-full max-w-md p-8 text-center shadow-land-glow">
        <div className="flex justify-center">
          <IncuriaLogo markSize={32} showWordmark={false} />
        </div>
        <h1 className="mt-4 font-landing-display text-2xl font-semibold tracking-[-0.02em] text-land-ink">
          Sign in
        </h1>
        {error ? (
          <>
            <p className="mt-4 font-landing-body text-sm leading-[1.75] text-land-ink-muted">{error}</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <ConnectOutlookButton className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-land-ink px-6 font-landing-body text-sm font-medium text-white transition-colors hover:bg-land-accent" />
              <button
                type="button"
                onClick={() => {
                  clearTokens();
                  navigate(ROUTES.LANDING, { replace: true });
                }}
                className="font-landing-body text-sm text-land-ink-muted hover:text-land-ink"
              >
                Clear session & go home
              </button>
              <Link to={ROUTES.LANDING} className="font-landing-body text-sm text-land-accent hover:text-land-accent-hover">
                ← Back home
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-land-accent/25 border-t-land-accent"
              aria-hidden
            />
            <p className="font-landing-body text-sm text-land-ink-muted">{status}</p>
          </div>
        )}
      </BrandCard>
    </PageCanvas>
  );
}
