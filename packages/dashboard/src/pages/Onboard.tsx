import type {
  GitHubExperienceSignals,
  GrowthGoal,
  PlayerProfileSeed,
  ProfilePipelineStep,
  UserProfile,
} from "@gitventure/shared";
import {
  GROWTH_GOALS,
  goalEvidenceStrength,
  previewSkillsFromSignals,
  roman,
} from "@gitventure/shared";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { clearIngestSeen, WORKFLOW } from "../lib/workflow";
import PageShell from "../components/ui/PageShell";
import ProgressBar from "../components/ui/ProgressBar";
import { EASE } from "../motion/tokens";

type Phase = "select" | "building" | "ready";

const phaseMotion = {
  initial: { opacity: 0, y: 16, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(6px)" },
  transition: { duration: 0.4, ease: EASE },
};

function SkillRadar({
  skills,
}: {
  skills: Array<{ name: string; level: number; origin: "github" | "goal"; evidenceCount: number }>;
}) {
  if (!skills.length) {
    return (
      <div className="flex h-52 items-center justify-center">
        <p className="max-w-[14rem] text-center font-body text-sm text-mist">
          Pick interests to project your skill floor
        </p>
      </div>
    );
  }

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 88;
  const n = skills.length;
  const points = skills.map((skill, index) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (skill.level / 8) * maxR;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, angle, skill };
  });
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-52 w-52">
        {[0.35, 0.7, 1].map((ring) => (
          <circle
            key={ring}
            cx={cx}
            cy={cy}
            r={maxR * ring}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        {points.map((point, index) => (
          <line
            key={`axis-${index}`}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(point.angle) * maxR}
            y2={cy + Math.sin(point.angle) * maxR}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        <motion.polygon
          points={polygon}
          fill="rgba(255,107,53,0.22)"
          stroke="#ff6b35"
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        {points.map((point) => (
          <circle
            key={point.skill.name}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={point.skill.origin === "github" ? "#ff6b35" : "#3dffa8"}
          />
        ))}
      </svg>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {skills.map((skill) => (
          <li key={skill.name} className="font-mono text-[10px] text-fog">
            <span className={skill.origin === "github" ? "text-trail" : "text-beacon"}>
              {skill.name}
            </span>{" "}
            {roman(skill.level)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceDot({ value }: { value: number }) {
  const on = value > 0.08;
  return (
    <span
      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${on ? "bg-trail" : "bg-white/15"}`}
      title={on ? "Supported by your GitHub" : "Stretch interest"}
      aria-hidden
    />
  );
}

export default function Onboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [experience, setExperience] = useState<GitHubExperienceSignals | null>(null);
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
          api<{ experience: GitHubExperienceSignals; pipeline: ProfilePipelineStep[] }>(
            "/users/me/github-signals",
          ),
        ]);
        if (cancelled) return;
        setProfile(me);
        setExperience(signals.experience);
        if (me.user.goals?.length) setSelected(me.user.goals);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load player");
      } finally {
        if (!cancelled) setSignalsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const evidenceInput = useMemo(
    () => ({
      languages: experience?.languages ?? [],
      repos: experience?.repos ?? [],
    }),
    [experience],
  );

  const livePreview = useMemo(
    () => previewSkillsFromSignals(selected, experience?.languages ?? []),
    [selected, experience],
  );

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
      setCharacter(result.character);
      clearIngestSeen();
      setPhase("ready");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save goals");
      setPhase("select");
    }
  };

  if (error && !profile && !signalsLoading) {
    return (
      <PageShell reveal={false}>
        <p className="py-20 text-center font-body text-sm text-red-400">{error}</p>
      </PageShell>
    );
  }

  if (signalsLoading || !profile) {
    return (
      <PageShell reveal={false}>
        <p className="py-20 text-center font-mono text-xs uppercase tracking-[0.2em] text-mist">
          Loading…
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 max-w-xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-mist">
            Origin
          </p>
          <h1 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-snow">
            {phase === "ready" ? "Character locked in" : "Where do you want to grow?"}
          </h1>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-fog">
            {phase === "ready"
              ? "Skill floors seeded from your GitHub and interests."
              : "Choose interests. Your live GitHub languages shape the skill floor."}
          </p>
        </div>
        {experience && (
          <div className="flex items-center gap-3">
            <img
              src={profile.user.avatarUrl ?? ""}
              alt=""
              className="h-11 w-11 rounded-xl border border-trail/40 object-cover"
            />
            <div>
              <p className="font-mono text-xs font-bold text-snow">@{experience.login}</p>
              <p className="font-mono text-[10px] text-mist">
                {experience.languages.slice(0, 3).map((entry) => entry.name).join(" · ") ||
                  `${experience.publicRepos} repos`}
              </p>
            </div>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {phase === "ready" && character ? (
          <motion.section
            key="ready"
            className="mt-10 overflow-hidden rounded-[28px] border border-trail/25 bg-panel/90"
            {...phaseMotion}
          >
            <div className="border-b border-white/[0.06] px-6 py-6 sm:px-8 sm:py-7">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-trail">
                {character.source === "llm" ? "Gemini sheet" : "Heuristic sheet"}
              </p>
              <p className="mt-3 max-w-2xl font-body text-[15px] leading-relaxed text-fog">
                {character.summary}
              </p>
              {character.strengths.length > 0 && (
                <p className="mt-4 font-mono text-[11px] text-mist">
                  <span className="text-beacon">Strengths</span>
                  <span className="mx-2 text-white/20">·</span>
                  {character.strengths.join(" · ")}
                </p>
              )}
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <div className="space-y-4">
                {character.skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="mb-1.5 flex justify-between font-mono text-[11px]">
                      <span className="text-snow">
                        {skill.name} {roman(skill.level)}
                      </span>
                      <span className="text-mist">L{skill.level}/8</span>
                    </div>
                    <ProgressBar
                      value={(skill.level / 8) * 100}
                      size="sm"
                      label={`${skill.name} level`}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate(WORKFLOW.home)}
                className="gv-btn-primary mt-8 px-5 py-3.5"
              >
                Find my next quest <ArrowRight size={18} />
              </button>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="select"
            className="mt-10 overflow-hidden rounded-[28px] border border-white/[0.08] bg-panel/90"
            {...phaseMotion}
          >
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border-b border-white/[0.06] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold tracking-tight text-snow">
                    Interests
                  </h2>
                  <span className="font-mono text-[11px] tabular-nums text-mist">
                    {selected.length} selected
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-2">
                  {GROWTH_GOALS.map((goal) => {
                    const on = selected.includes(goal);
                    const strength = goalEvidenceStrength(goal, evidenceInput);
                    return (
                      <button
                        key={goal}
                        type="button"
                        disabled={phase === "building"}
                        onClick={() => toggle(goal)}
                        className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-colors duration-200 ${
                          on
                            ? "border-trail/45 bg-trail/[0.1] text-snow"
                            : "border-white/[0.08] bg-transparent text-fog hover:border-white/20 hover:text-snow"
                        }`}
                      >
                        <EvidenceDot value={strength} />
                        <span className="font-body text-sm font-semibold leading-snug">{goal}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col justify-between bg-void/35 p-6 sm:p-8">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-mist">
                    Live preview
                  </p>
                  <p className="mt-1 font-body text-sm text-fog">
                    Trail = GitHub evidence · beacon = interest only
                  </p>
                  <div className="mt-6">
                    <SkillRadar skills={livePreview} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.06] px-6 py-5 sm:px-8">
              <button
                type="button"
                disabled={!selected.length || phase === "building"}
                onClick={() => void save()}
                className="gv-btn-primary px-5 py-3.5 disabled:opacity-40"
              >
                {phase === "building" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Building…
                  </>
                ) : (
                  <>
                    Lock in character <ArrowRight size={18} />
                  </>
                )}
              </button>
              <p className="font-mono text-[11px] text-mist">
                {selected.length
                  ? `${livePreview.length} skills projected`
                  : "Select at least one interest"}
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {error && <p className="mt-4 font-body text-sm text-red-400">{error}</p>}
    </PageShell>
  );
}
