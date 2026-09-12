import type { GitHubExperienceSignals, UserProfile } from "@gitventure/shared";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, GitBranch, Languages, Loader2, Sparkles, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../components/ui/ProgressBar";
import { api } from "../lib/api";
import { hasIngestSeen, markIngestSeen, WORKFLOW } from "../lib/workflow";
import { EASE } from "../motion/tokens";

type Stage = "identity" | "repos" | "languages" | "ready";

const STAGE_META: Array<{ id: Stage; label: string; icon: typeof UserRound }> = [
  { id: "identity", label: "Identity", icon: UserRound },
  { id: "repos", label: "Repositories", icon: GitBranch },
  { id: "languages", label: "Languages", icon: Languages },
  { id: "ready", label: "Ready", icon: Sparkles },
];

/** Trail-forward palette — stays on-brand, readable on void. */
const LANG_PALETTE = ["#ff6b35", "#ff824f", "#3dffa8", "#e8edf2", "#7dd3fc", "#fda4af"];

function LanguageRing({
  languages,
  visible,
}: {
  languages: Array<{ name: string; count: number }>;
  visible: boolean;
}) {
  const total = Math.max(1, languages.reduce((sum, entry) => sum + entry.count, 0));
  let offset = 0;
  const slices = languages.slice(0, 6).map((entry, index) => {
    const portion = entry.count / total;
    const start = offset;
    offset += portion;
    return { ...entry, start, portion, color: LANG_PALETTE[index % LANG_PALETTE.length] };
  });

  const gradient = slices.length
    ? `conic-gradient(${slices
        .map((slice) => `${slice.color} ${slice.start * 100}% ${(slice.start + slice.portion) * 100}%`)
        .join(", ")})`
    : "conic-gradient(#151b26 0% 100%)";

  return (
    <div className="relative mx-auto h-48 w-48 sm:h-52 sm:w-52">
      <motion.div
        className="absolute inset-0 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        style={{ background: gradient }}
        initial={{ scale: 0.72, opacity: 0, rotate: -28 }}
        animate={visible ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0.72, opacity: 0 }}
        transition={{ duration: 0.85, ease: EASE }}
      />
      <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full border border-white/[0.08] bg-void text-center">
        <p className="font-display text-3xl font-semibold tabular-nums text-snow">{languages.length}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-mist">languages</p>
      </div>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-white/[0.08] bg-panel/90 px-4 py-3 text-left">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mist">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-snow">{value.toLocaleString()}</p>
    </div>
  );
}

export default function Ingest() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [experience, setExperience] = useState<GitHubExperienceSignals | null>(null);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);
  const [reposShown, setReposShown] = useState(0);
  const [langsRevealed, setLangsRevealed] = useState(0);
  const [ready, setReady] = useState(false);

  const stage = STAGE_META[Math.min(stageIndex, STAGE_META.length - 1)].id;

  // Live fetch from GitHub signals API (same payload onboard uses).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetching(true);
      try {
        const [me, signals] = await Promise.all([
          api<UserProfile>("/users/me"),
          api<{ experience: GitHubExperienceSignals }>("/users/me/github-signals"),
        ]);
        if (cancelled) return;
        if (hasIngestSeen(me.user.githubLogin)) {
          navigate(WORKFLOW.onboard, { replace: true });
          return;
        }
        setProfile(me);
        setExperience(signals.experience);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load GitHub");
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Stage machine driven by live payload presence — not hardcoded demo numbers.
  useEffect(() => {
    if (!experience || !profile) return;

    if (reduce) {
      setStageIndex(STAGE_META.length - 1);
      setReposShown(experience.repos.length);
      setLangsRevealed(experience.languages.length);
      setReady(true);
      return;
    }

    setStageIndex(0);
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStageIndex(1), 1600));
    timers.push(window.setTimeout(() => setStageIndex(2), 1600 + Math.max(900, experience.repos.length * 110 + 400)));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [experience, profile, reduce]);

  // Stream repos in real time during the repos stage.
  useEffect(() => {
    if (!experience || stage !== "repos") return;
    setReposShown(0);
    if (!experience.repos.length) {
      const t = window.setTimeout(() => setStageIndex(2), reduce ? 0 : 600);
      return () => window.clearTimeout(t);
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setReposShown(Math.min(experience.repos.length, i));
      if (i >= experience.repos.length) {
        window.clearInterval(id);
        window.setTimeout(() => setStageIndex(2), reduce ? 0 : 500);
      }
    }, reduce ? 0 : 110);
    return () => window.clearInterval(id);
  }, [experience, stage, reduce]);

  // Reveal language bars after languages stage starts, then mark ready.
  useEffect(() => {
    if (!experience || stage !== "languages") return;
    setLangsRevealed(0);
    const count = experience.languages.length;
    if (!count) {
      const t = window.setTimeout(() => {
        setStageIndex(3);
        setReady(true);
      }, reduce ? 0 : 700);
      return () => window.clearTimeout(t);
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setLangsRevealed(Math.min(count, i));
      if (i >= count) {
        window.clearInterval(id);
        window.setTimeout(() => {
          setStageIndex(3);
          setReady(true);
        }, reduce ? 0 : 700);
      }
    }, reduce ? 0 : 160);
    return () => window.clearInterval(id);
  }, [experience, stage, reduce]);

  const continueToOnboard = () => {
    if (profile) markIngestSeen(profile.user.githubLogin);
    navigate(WORKFLOW.onboard, { replace: true });
  };

  const topLanguages = useMemo(() => experience?.languages.slice(0, 6) ?? [], [experience]);
  const maxLang = Math.max(1, ...topLanguages.map((entry) => entry.count));

  const overallProgress = useMemo(() => {
    if (fetching || !experience) return fetching ? 8 : 0;
    if (ready) return 100;
    if (stage === "identity") return 18;
    if (stage === "repos") {
      const denom = Math.max(1, experience.repos.length);
      return 18 + (reposShown / denom) * 40;
    }
    if (stage === "languages") {
      const denom = Math.max(1, experience.languages.length);
      return 58 + (langsRevealed / denom) * 32;
    }
    return 95;
  }, [fetching, experience, ready, stage, reposShown, langsRevealed]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-5">
        <div className="max-w-md text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">Signal intake</p>
          <p className="mt-4 font-body text-sm text-red-400">{error}</p>
          <button type="button" className="gv-btn-primary mt-6 px-5 py-3" onClick={() => navigate(WORKFLOW.onboard)}>
            Continue anyway
          </button>
        </div>
      </div>
    );
  }

  if (fetching || !profile || !experience) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-void px-5">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 30%, rgba(255,107,53,0.12) 0%, transparent 70%)",
          }}
        />
        <Loader2 className="relative animate-spin text-trail" size={28} />
        <p className="relative mt-5 font-mono text-xs uppercase tracking-[0.22em] text-mist">
          Pulling live GitHub signals…
        </p>
        <div className="relative mt-8 w-full max-w-xs">
          <ProgressBar value={12} size="md" label="Loading GitHub signals" animate={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-void font-body text-snow">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 18%, rgba(255,107,53,0.12) 0%, transparent 70%), radial-gradient(ellipse 36% 30% at 85% 75%, rgba(61,255,168,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-10 sm:px-8 sm:py-14">
        {/* Header + live overall progress */}
        <header className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-trail">
                Signal intake · live
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-snow sm:text-3xl">
                Curating @{experience.login}
              </h1>
            </div>
            <p className="font-mono text-sm font-bold tabular-nums text-snow">
              {Math.round(overallProgress)}
              <span className="ml-1 text-xs font-medium text-mist">%</span>
            </p>
          </div>
          <ProgressBar value={overallProgress} size="lg" label="Ingest overall progress" />

          <div className="flex flex-wrap gap-2">
            {STAGE_META.map((item, index) => {
              const Icon = item.icon;
              const active = index === stageIndex;
              const done = index < stageIndex || ready;
              return (
                <span
                  key={item.id}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ${
                    done
                      ? "border-trail/40 bg-trail/15 text-trail"
                      : active
                        ? "border-snow/25 bg-white/[0.06] text-snow"
                        : "border-white/[0.08] text-mist"
                  }`}
                >
                  <Icon size={12} />
                  {item.label}
                </span>
              );
            })}
          </div>
        </header>

        <div className="mt-10 flex flex-1 flex-col items-center justify-center py-6">
          <AnimatePresence mode="wait">
            {stage === "identity" && (
              <motion.div
                key="identity"
                className="flex w-full max-w-xl flex-col items-center text-center"
                initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <motion.img
                  src={profile.user.avatarUrl ?? ""}
                  alt=""
                  className="h-28 w-28 rounded-[28px] border border-trail/45 object-cover shadow-trail"
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                />
                <p className="mt-8 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-trail">
                  <UserRound size={14} /> Identity from GitHub
                </p>
                <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.1rem)] font-semibold tracking-tight text-snow">
                  @{experience.login}
                </h2>
                <p className="mt-3 max-w-md font-body leading-relaxed text-fog">
                  {experience.bio?.trim() ||
                    "No bio on file — we will lean on your repositories and languages instead."}
                </p>
                <div className="mt-8 grid w-full grid-cols-3 gap-3">
                  <MetricChip label="Public repos" value={experience.publicRepos} />
                  <MetricChip label="Followers" value={experience.followers} />
                  <MetricChip label="Scanned" value={experience.repos.length} />
                </div>
              </motion.div>
            )}

            {stage === "repos" && (
              <motion.div
                key="repos"
                className="w-full max-w-2xl"
                initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-trail">
                      <GitBranch size={14} /> Live repository feed
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-snow sm:text-3xl">
                      Mapping your commit cartography
                    </h2>
                  </div>
                  <p className="shrink-0 font-mono text-sm tabular-nums text-fog">
                    <span className="font-bold text-trail">{reposShown}</span>
                    <span className="text-mist"> / {experience.repos.length}</span>
                  </p>
                </div>
                <ProgressBar
                  className="mt-5"
                  value={experience.repos.length ? (reposShown / experience.repos.length) * 100 : 100}
                  size="md"
                  label="Repository ingest progress"
                />
                <div className="mt-5 max-h-[320px] space-y-2 overflow-hidden">
                  {experience.repos.slice(0, reposShown).map((repo) => (
                    <motion.div
                      key={repo.fullName}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="flex items-center justify-between gap-3 rounded-[16px] border border-white/[0.08] bg-panel/90 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-snow">{repo.fullName}</p>
                        <p className="mt-0.5 truncate font-body text-xs text-mist">
                          {repo.description || "No description"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right font-mono text-[10px]">
                        <div className="text-trail">{repo.language ?? "mixed"}</div>
                        <div className="text-mist">{repo.stars}★</div>
                      </div>
                    </motion.div>
                  ))}
                  {!experience.repos.length && (
                    <p className="rounded-[16px] border border-dashed border-white/10 px-4 py-10 text-center font-body text-sm text-mist">
                      No recent non-fork repos found — goals will lead the skill sheet.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {(stage === "languages" || stage === "ready") && (
              <motion.div
                key="languages"
                className="w-full max-w-3xl"
                initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <p className="flex items-center justify-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-trail">
                  <Languages size={14} /> Language histogram
                </p>
                <h2 className="mt-2 text-center font-display text-2xl font-semibold tracking-tight text-snow sm:text-3xl">
                  Translating code into a character sheet
                </h2>

                <div className="mt-10 grid items-center gap-10 md:grid-cols-[220px_1fr]">
                  <LanguageRing languages={topLanguages.slice(0, langsRevealed || topLanguages.length)} visible />
                  <div className="space-y-4">
                    {topLanguages.slice(0, langsRevealed).map((entry) => (
                      <div key={entry.name}>
                        <div className="mb-1.5 flex justify-between font-mono text-[11px]">
                          <span className="font-bold text-snow">{entry.name}</span>
                          <span className="tabular-nums text-mist">
                            {entry.count} repo{entry.count === 1 ? "" : "s"}
                          </span>
                        </div>
                        <ProgressBar
                          value={(entry.count / maxLang) * 100}
                          size="md"
                          label={`${entry.name} share`}
                        />
                      </div>
                    ))}
                    {!topLanguages.length && (
                      <p className="font-body text-sm text-mist">No language histogram yet.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="flex flex-col items-center gap-4 pb-2 pt-6">
          <AnimatePresence>
            {ready ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-trail">
                  <Sparkles size={14} /> Live GitHub profile curated
                </p>
                <button type="button" onClick={continueToOnboard} className="gv-btn-primary px-6 py-3.5">
                  Choose growth goals <ArrowRight size={18} />
                </button>
              </motion.div>
            ) : (
              <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
                <Loader2 size={12} className="animate-spin text-trail" />
                Syncing live signals for @{experience.login}
              </p>
            )}
          </AnimatePresence>
        </footer>
      </div>
    </div>
  );
}
