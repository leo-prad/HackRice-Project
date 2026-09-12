import type { QuestRecommendation, UserProfile } from "@questline/shared";
import { isBossRarity } from "@questline/shared";
import { ArrowRight, RefreshCw, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { RARITY_GLOW, RARITY_STYLE, rarityLabel } from "../lib/rarity";

export default function NextQuest() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<QuestRecommendation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [me, recs] = await Promise.all([
        api<UserProfile>("/users/me"),
        api<{ recommendations: QuestRecommendation[] }>("/quests/recommend", { method: "POST", body: JSON.stringify({}) }),
      ]);
      setProfile(me);
      setRecommendations(recs.recommendations);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not find quests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (profile && !profile.user.goals?.length) return <Navigate to="/onboard" replace />;
  if (error && !recommendations.length) return <p className="p-20 text-center text-red-400">{error}</p>;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 fade-up">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold tracking-[.22em] text-acid">YOUR NEXT QUEST</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-.05em]">A curriculum made of real issues.</h1>
          <p className="mt-3 max-w-xl text-slate-400">
            Three live GitHub issues, rated for where you are and where you said you want to go.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-white/25"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading && <p className="mt-16 text-center font-mono text-xs text-slate-600">SCOUTING OPEN SOURCE…</p>}

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {recommendations.map((item) => {
          const quest = item.quest;
          const boss = isBossRarity(quest.rarity);
          return (
            <article
              key={quest.issueNodeId}
              className={`flex flex-col rounded-3xl border border-white/[.08] bg-panel p-6 ${RARITY_GLOW[quest.rarity]}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-bold tracking-[.18em] text-acid">{item.tierLabel}</span>
                <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold ${RARITY_STYLE[quest.rarity]}`}>
                  {rarityLabel(quest.rarity)}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-black leading-snug">{quest.title}</h2>
              <p className="mt-2 font-mono text-[11px] text-slate-500">
                {quest.questKey} · {quest.difficulty.toFixed(1)} / 10
              </p>
              <div className={`mt-5 text-4xl font-black tracking-tight ${boss ? "text-rose-300" : "text-white"}`}>
                {quest.xp.toLocaleString()} <span className="text-sm font-bold text-slate-500">XP</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-slate-400">
                {item.reasons.map((reason) => (
                  <li key={reason}>✓ {reason}</li>
                ))}
              </ul>
              {item.potentialReward && (
                <p className="mt-5 rounded-xl border border-acid/20 bg-acid/[.06] px-3 py-2 font-mono text-[11px] text-acid">
                  Potential reward: {item.potentialReward}
                </p>
              )}
              <a
                href={quest.issueUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-auto flex items-center justify-between rounded-xl bg-acid px-4 py-3 font-extrabold text-ink"
              >
                Start quest <ArrowRight size={16} />
              </a>
            </article>
          );
        })}
      </div>

      {!loading && !recommendations.length && (
        <div className="mt-16 rounded-3xl border border-white/10 bg-panel px-8 py-16 text-center">
          <Swords className="mx-auto text-acid" />
          <h2 className="mt-4 text-2xl font-black">No open quests in range yet</h2>
          <p className="mt-2 text-slate-500">Open a GitHub issue list with the extension, or refresh after the demo seed.</p>
          <Link to="/profile" className="mt-6 inline-block text-sm text-acid">Back to profile</Link>
        </div>
      )}
    </div>
  );
}
