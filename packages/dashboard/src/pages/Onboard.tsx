import type { GrowthGoal, PlayerProfileSeed, UserProfile } from "@questline/shared";
import { GROWTH_GOALS } from "@questline/shared";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Onboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const autoSeedStarted = useRef(false);

  useEffect(() => {
    api<UserProfile>("/users/me")
      .then((loaded) => {
        setProfile(loaded);
        if (loaded.user.goals?.length) setSelected(loaded.user.goals);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load player"));
  }, []);

  useEffect(() => {
    if (!profile?.user.goals?.length || profile.user.profileSeededAt || autoSeedStarted.current) return;
    autoSeedStarted.current = true;
    setSaving(true);
    setStatus("Importing your GitHub experience…");
    api<{ goals: string[]; character: PlayerProfileSeed | null }>("/users/me/goals", {
      method: "PUT",
      body: JSON.stringify({ goals: profile.user.goals }),
    })
      .then(() => navigate("/next"))
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Could not build character");
        setSaving(false);
        setStatus("");
        autoSeedStarted.current = false;
      });
  }, [profile, navigate]);

  if (error && !profile) return <p className="p-20 text-center text-red-400">{error}</p>;
  if (!profile) return <p className="p-20 text-center font-mono text-xs text-slate-600">LOADING PLAYER DATA…</p>;
  if (profile.user.goals?.length && profile.user.profileSeededAt) return <Navigate to="/next" replace />;

  const toggle = (goal: GrowthGoal) => {
    setSelected((current) =>
      current.includes(goal) ? current.filter((entry) => entry !== goal) : [...current, goal],
    );
  };

  const save = async () => {
    if (!selected.length) return;
    setSaving(true);
    setError("");
    setStatus("Importing your GitHub experience…");
    try {
      const result = await api<{ goals: string[]; character: PlayerProfileSeed | null }>("/users/me/goals", {
        method: "PUT",
        body: JSON.stringify({ goals: selected }),
      });
      setStatus(
        result.character
          ? `Character ready · ${result.character.skills.length} skills seeded`
          : "Goals saved",
      );
      navigate("/next");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save goals");
      setSaving(false);
      setStatus("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-20 fade-up">
      <p className="font-mono text-[10px] font-bold tracking-[.22em] text-acid">PLAYER SETUP</p>
      <h1 className="mt-4 text-5xl font-black tracking-[-.05em]">What do you want to get better at?</h1>
      <p className="mt-4 max-w-xl text-slate-400">
        Pick a growth path. GitQuest will import your GitHub experience and build a starter skill tree around those goals.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {GROWTH_GOALS.map((goal) => {
          const on = selected.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              disabled={saving}
              onClick={() => toggle(goal)}
              className={`rounded-2xl border px-5 py-4 text-left font-bold transition ${
                on ? "border-acid/50 bg-acid/10 text-white" : "border-white/10 bg-panel text-slate-300 hover:border-white/25"
              }`}
            >
              {goal}
            </button>
          );
        })}
      </div>
      {status && <p className="mt-6 font-mono text-xs text-acid">{status}</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <button
        type="button"
        disabled={!selected.length || saving}
        onClick={save}
        className="mt-10 inline-flex items-center gap-2 rounded-xl bg-acid px-5 py-3.5 font-extrabold text-ink disabled:opacity-40"
      >
        {saving ? "Building your character…" : "Build character & find quests"} <ArrowRight size={18} />
      </button>
    </div>
  );
}
