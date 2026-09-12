import type {
  GitHubExperienceSignals,
  GrowthGoal,
  PlayerProfileSeed,
  ProfilePipelineStep,
  UserProfile,
} from "@questline/shared";
import {
  GOAL_SKILL_HINTS,
  GROWTH_GOALS,
  goalsWithGithubEvidence,
  previewSkillsFromSignals,
  roman,
} from "@questline/shared";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Github,
  GitBranch,
  Languages,
  Loader2,
  Sparkles,
  Target,
  Trees,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type Phase = "select" | "building" | "ready";

const PIPELINE_ICONS = {
  oauth: Github,
  repos: GitBranch,
  languages: Languages,
  goals: Target,
  analyze: Brain,
  seed: Trees,
} as const;

export default function Onboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [experience, setExperience] = useState<GitHubExperienceSignals | null>(null);
  const [pipeline, setPipeline] = useState<ProfilePipelineStep[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [character, setCharacter] = useState<PlayerProfileSeed | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const [error, setError] = useState("");
  const [signalsLoading, setSignalsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, signals] = await Promise.all([
          api<UserProfile>("/users/me"),
          api<{ experience: GitHubExperienceSignals; pipeline: ProfilePipelineStep[] }>("/users/me/github-signals"),
        ]);
        if (cancelled) return;
        setProfile(me);
        setExperience(signals.experience);
        setPipeline(signals.pipeline);
        if (me.user.goals?.length) setSelected(me.user.goals);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load player");
      } finally {
        if (!cancelled) setSignalsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const livePreview = useMemo(
    () => previewSkillsFromSignals(selected, experience?.languages ?? []),
    [selected, experience],
  );
  const evidencedGoals = useMemo(
    () => new Set(goalsWithGithubEvidence(selected, experience?.languages ?? [])),
    [selected, experience],
  );
  const maxLangCount = Math.max(1, ...(experience?.languages.map((entry) => entry.count) ?? [1]));

  const toggle = (goal: GrowthGoal) => {
    if (phase === "building") return;
    setSelected((current) =>
      current.includes(goal) ? current.filter((entry) => entry !== goal) : [...current, goal],
    );
    setPhase("select");
    setCharacter(null);
  };

  const save = async () => {
    if (!selected.length || phase === "building") return;
    setPhase("building");
    setError("");
    setPipeline((current) =>
      current.map((step) => {
        if (step.id === "goals") return { ...step, status: "done", detail: selected.join(", ") };
        if (step.id === "analyze") return { ...step, status: "active", detail: "Reading signals + interests…" };
        if (step.id === "seed") return { ...step, status: "pending", detail: "Waiting on analysis" };
        return step;
      }),
    );

    try {
      const result = await api<{
        goals: string[];
        character: PlayerProfileSeed | null;
        experience: GitHubExperienceSignals | null;
        pipeline: ProfilePipelineStep[];
        rebuilt: boolean;
      }>("/users/me/goals", {
        method: "PUT",
        body: JSON.stringify({ goals: selected, force: true }),
      });

      if (result.experience) setExperience(result.experience);
      if (result.pipeline?.length) setPipeline(result.pipeline);
      setCharacter(result.character);
      setPhase("ready");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save goals");
      setPhase("select");
      setPipeline((current) =>
        current.map((step) =>
          step.id === "analyze" || step.id === "seed"
            ? { ...step, status: "pending", detail: "Retry to continue" }
            : step,
        ),
      );
    }
  };

  if (error && !profile && !signalsLoading) {
    return <p className="p-20 text-center text-red-400">{error}</p>;
  }
  if (signalsLoading || !profile) {
    return <p className="p-20 text-center font-mono text-xs text-slate-600">LOADING GITHUB SIGNALS…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-[-.05em] sm:text-5xl">Build your character from GitHub.</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Pick interests and watch how Questline maps your repos and languages into a starter skill tree —
            before anything is written permanently.
          </p>
        </div>
        {experience && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-panel px-4 py-3">
            <img
              src={profile.user.avatarUrl ?? ""}
              alt=""
              className="h-10 w-10 rounded-xl border border-acid/40"
            />
            <div>
              <p className="font-mono text-xs font-bold text-white">@{experience.login}</p>
              <p className="font-mono text-[10px] text-slate-500">
                {experience.publicRepos} repos · {experience.followers} followers
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        {/* Left: interests + live reflection */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/[.08] bg-panel/90 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-bold tracking-[.18em] text-slate-500">STEP 1 · INTERESTS</p>
                <h2 className="mt-1 text-xl font-black text-white">What do you want to get better at?</h2>
              </div>
              <span className="rounded-full border border-acid/30 bg-acid/10 px-3 py-1 font-mono text-[10px] font-bold text-acid">
                {selected.length} selected
              </span>
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {GROWTH_GOALS.map((goal) => {
                const on = selected.includes(goal);
                const hasEvidence = evidencedGoals.has(goal);
                const hints = GOAL_SKILL_HINTS[goal]?.slice(0, 3).join(" · ");
                return (
                  <button
                    key={goal}
                    type="button"
                    disabled={phase === "building"}
                    onClick={() => toggle(goal)}
                    className={`rounded-2xl border px-4 py-3.5 text-left transition ${
                      on
                        ? "border-acid/50 bg-acid/10 text-white shadow-[0_0_24px_rgba(185,244,86,.08)]"
                        : "border-white/10 bg-black/20 text-slate-300 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{goal}</span>
                      {on && hasEvidence && (
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-acid">
                          GitHub match
                        </span>
                      )}
                      {on && !hasEvidence && (
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-violet-300">
                          Stretch goal
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">{hints}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/[.08] bg-panel/90 p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-acid" />
              <p className="font-mono text-[10px] font-bold tracking-[.18em] text-slate-500">
                LIVE PREVIEW · UPDATES AS YOU CLICK
              </p>
            </div>
            <h2 className="mt-2 text-lg font-black text-white">Projected skill floors</h2>
            <p className="mt-1 text-sm text-slate-500">
              Instant estimate from your language histogram + selected interests. Final sheet may refine via Gemini.
            </p>

            {!selected.length ? (
              <p className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">
                Select an interest to see skills appear here.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {livePreview.map((skill) => (
                  <div key={`${skill.origin}-${skill.name}`} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <b className="text-white">
                          {skill.name} {roman(skill.level)}
                        </b>
                        <span
                          className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                            skill.origin === "github" ? "text-acid" : "text-violet-300"
                          }`}
                        >
                          {skill.origin === "github" ? "from repos" : "from interest"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
                        <i
                          className={`block h-full rounded-full ${skill.origin === "github" ? "bg-acid/80" : "bg-violet-400/80"}`}
                          style={{ width: `${Math.min(100, (skill.level / 8) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: pipeline visualization + signals */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/[.08] bg-panel/90 p-6">
            <p className="font-mono text-[10px] font-bold tracking-[.18em] text-slate-500">EXTRACTION PIPELINE</p>
            <h2 className="mt-1 text-xl font-black text-white">How your profile is built</h2>
            <p className="mt-1 text-sm text-slate-500">
              GitHub API → language histogram → interest bias → skill sheet → seeded tree.
            </p>

            <ol className="relative mt-6 space-y-0">
              {pipeline.map((step, index) => {
                const Icon = PIPELINE_ICONS[step.id] ?? Target;
                const active = step.status === "active";
                const done = step.status === "done";
                return (
                  <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {index < pipeline.length - 1 && (
                      <span className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-white/10" />
                    )}
                    <span
                      className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                        done
                          ? "border-acid/50 bg-acid/15 text-acid"
                          : active
                            ? "border-violet-400/50 bg-violet-400/15 text-violet-200"
                            : "border-white/10 bg-black/30 text-slate-500"
                      }`}
                    >
                      {active ? <Loader2 size={14} className="animate-spin" /> : done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className={`text-sm font-bold ${done || active ? "text-white" : "text-slate-500"}`}>
                        {step.label}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">{step.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-3xl border border-white/[.08] bg-panel/90 p-6">
            <p className="font-mono text-[10px] font-bold tracking-[.18em] text-slate-500">GITHUB SIGNALS</p>
            <h2 className="mt-1 text-lg font-black text-white">Languages detected</h2>
            {experience?.languages.length ? (
              <div className="mt-4 space-y-2.5">
                {experience.languages.map((entry) => (
                  <div key={entry.name}>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-300">{entry.name}</span>
                      <span className="text-slate-500">{entry.count} repo{entry.count === 1 ? "" : "s"}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
                      <i
                        className="block h-full rounded-full bg-acid/70"
                        style={{ width: `${(entry.count / maxLangCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No language signals yet — skills will lean on your interests.</p>
            )}

            {!!experience?.repos.length && (
              <>
                <p className="mt-6 font-mono text-[10px] font-bold tracking-[.18em] text-slate-500">RECENT REPOS SCANNED</p>
                <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
                  {experience.repos.slice(0, 8).map((repo) => (
                    <li key={repo.fullName} className="flex items-start justify-between gap-3 text-sm">
                      <span className="truncate text-slate-300">{repo.fullName}</span>
                      <span className="shrink-0 font-mono text-[10px] text-slate-500">
                        {repo.language ?? "mixed"} · {repo.stars}★
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Character reveal */}
      {phase === "ready" && character && (
        <section className="mt-6 animate-push-up rounded-3xl border border-acid/30 bg-acid/[.06] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[.18em] text-acid">
                CHARACTER READY · {character.source === "llm" ? "GEMINI" : "HEURISTIC"}
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">Your interests are reflected in this sheet</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">{character.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/next")}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-acid px-5 py-3 font-extrabold text-ink"
            >
              Find my next quest <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
              <p className="font-mono text-[10px] font-bold tracking-wider text-slate-500">SEEDED SKILLS</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {character.skills.map((skill) => (
                  <span
                    key={skill.name}
                    className="rounded-lg border border-acid/25 bg-acid/10 px-3 py-1.5 font-mono text-xs font-bold text-acid"
                  >
                    {skill.name} {roman(skill.level)}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="font-mono text-[10px] font-bold tracking-wider text-slate-500">STRENGTHS</p>
                <p className="mt-2 text-sm text-slate-300">{character.strengths.join(" · ") || "—"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="font-mono text-[10px] font-bold tracking-wider text-slate-500">GROWTH FOCUS</p>
                <p className="mt-2 text-sm text-slate-300">{character.growthFocus.join(" · ") || selected.join(" · ")}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {phase !== "ready" && (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={!selected.length || phase === "building"}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-xl bg-acid px-5 py-3.5 font-extrabold text-ink disabled:opacity-40"
          >
            {phase === "building" ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Building character…
              </>
            ) : (
              <>
                Build character from GitHub <ArrowRight size={18} />
              </>
            )}
          </button>
          <p className="font-mono text-[11px] text-slate-500">
            {selected.length
              ? `${livePreview.length} projected skills · ${evidencedGoals.size}/${selected.length} interests have repo evidence`
              : "Select at least one interest"}
          </p>
        </div>
      )}
    </div>
  );
}
