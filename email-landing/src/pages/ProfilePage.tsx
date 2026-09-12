import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, Mail, Sparkles, User } from "lucide-react";
import { BackToMailLink } from "../components/BackToMailLink";
import { PageCanvas } from "../components/ui/PageCanvas";
import { Eyebrow } from "../components/ui/Eyebrow";
import { clearTokens, getUserProfile, saveUserProfile, type UserProfile } from "../lib/auth";
import { ROUTES } from "../lib/routes";
import { fetchOutlookProfile } from "../lib/api";
import { getSubscriptionTier } from "../lib/subscription";
import type { SubscriptionTier } from "../types";

const PLAN_LABEL: Record<SubscriptionTier, string> = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(() => getUserProfile());
  const tier: SubscriptionTier = profile?.plan ?? getSubscriptionTier();

  useEffect(() => {
    let cancelled = false;
    void fetchOutlookProfile()
      .then((fresh) => {
        if (cancelled) return;
        const next: UserProfile = {
          id: fresh.id,
          displayName: fresh.displayName,
          email: fresh.email,
          plan: fresh.plan,
        };
        saveUserProfile(next);
        setProfile(next);
      })
      .catch(() => {
        /* keep cached profile */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function signOut() {
    clearTokens();
    navigate(ROUTES.LANDING, { replace: true });
  }

  const displayName = profile?.displayName?.trim() || "Instructor";
  const email = profile?.email;
  const initial = (displayName[0] ?? email?.[0] ?? "U").toUpperCase();

  return (
    <PageCanvas variant="workbench" gradient={false} className="px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <BackToMailLink />

        <header className="mt-6 flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-incuria-accent text-2xl font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <Eyebrow className="mb-2">Your profile</Eyebrow>
            <h1 className="font-landing-display text-3xl font-semibold tracking-[-0.02em] text-incuria-ink">
              {displayName}
            </h1>
            {email ? <p className="mt-1 truncate text-base text-incuria-ink-muted">{email}</p> : null}
          </div>
        </header>

        <section className="mt-8 overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface">
          <h2 className="border-b border-incuria-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
            Account
          </h2>
          <Row icon={<User className="h-4 w-4" strokeWidth={1.75} />} label="Name" value={displayName} />
          <Row
            icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
            label="Connected mailbox"
            value={email ?? "Connected account"}
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface">
          <h2 className="border-b border-incuria-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
            Subscription
          </h2>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-incuria-accent-soft text-incuria-accent">
                <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-medium text-incuria-ink">Current plan</p>
                <p className="text-xs text-incuria-ink-muted">{PLAN_LABEL[tier]}</p>
              </div>
            </div>
            <Link
              to={ROUTES.PRICING}
              className="rounded-full bg-incuria-accent-soft px-4 py-2 text-sm font-semibold text-incuria-accent transition-colors hover:bg-incuria-accent hover:text-white"
            >
              {tier === "free" ? "Upgrade" : "Manage"}
            </Link>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface">
          <h2 className="border-b border-incuria-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
            Quick links
          </h2>
          <Link
            to={ROUTES.COURSES}
            className="flex items-center gap-3 border-b border-incuria-border px-5 py-4 text-sm font-medium text-incuria-ink transition-colors hover:bg-incuria-ink/[0.04]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-incuria-ink/[0.04] text-incuria-ink-muted">
              <BookOpen className="h-4 w-4" strokeWidth={1.75} />
            </span>
            Manage courses
          </Link>
          <Link
            to={ROUTES.PRICING}
            className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-incuria-ink transition-colors hover:bg-incuria-ink/[0.04]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-incuria-ink/[0.04] text-incuria-ink-muted">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            </span>
            Plans & pricing
          </Link>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-incuria-border bg-incuria-surface">
          <h2 className="border-b border-incuria-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-incuria-ink-muted">
            Session
          </h2>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-incuria-needs-reply transition-colors hover:bg-incuria-needs-reply-soft"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </section>
      </div>
    </PageCanvas>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-incuria-ink/[0.04] text-incuria-ink-muted">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-incuria-ink-muted">{label}</p>
        <p className="truncate text-sm font-medium text-incuria-ink">{value}</p>
      </div>
    </div>
  );
}
