import type { QuestRecommendation, RiskRollOffer, UserProfile } from "@questline/shared";
import { ArrowRight, Dices, RefreshCw, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../lib/api";

export default function NextQuest() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<QuestRecommendation[]>([]);
  const [rolls, setRolls] = useState<Record<string, RiskRollOffer>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [me, recs, existingRolls] = await Promise.all([
        api<UserProfile>("/users/me"),
        api<{ recommendations: QuestRecommendation[] }>("/quests/recommend", { method: "POST", body: JSON.stringify({}) }),
        api<{ rolls: Array<RiskRollOffer & { issueNodeId: string }> }>("/quests/rolls"),
      ]);
      setProfile(me);
      setRecommendations(recs.recommendations);
      const hydrated: Record<string, RiskRollOffer> = {};
      for (const row of existingRolls.rolls) {
        hydrated[row.issueNodeId] = { offerId: row.offerId, multiplier: row.multiplier, jackpot: row.jackpot };
      }
      setRolls(hydrated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not find quests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const roll = async (issueNodeId: string) => {
    try {
      const result = await api<RiskRollOffer>(`/quests/${issueNodeId}/risk-roll`, { method: "POST" });
      setRolls((current) => ({ ...current, [issueNodeId]: result }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Roll failed");
    }
  };
  const claim = async (issueNodeId: string, issueUrl: string) => {
    await api("/claims", { method: "POST", body: JSON.stringify({ issueNodeId, offerId: rolls[issueNodeId]?.offerId }) });
    window.open(issueUrl, "_blank", "noopener,noreferrer");
  };

  if (profile && !profile.user.goals?.length) return <Navigate to="/onboard" replace />;
  if (error && !recommendations.length) return <p className="p-20 text-center text-red-400">{error}</p>;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 fade-up">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-5xl font-black tracking-[-.05em]">A curriculum made of real issues.</h1>
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
          const rolled = rolls[quest.issueNodeId];
          return (
            <article
              key={quest.issueNodeId}
              className="flex flex-col rounded-3xl border border-white/[.08] bg-panel p-6"
            >
              <h2 className="text-xl font-black leading-snug">{quest.title}</h2>
              <p className="mt-2 font-mono text-[11px] text-slate-500">{quest.questKey}</p>
              <div className="mt-5 text-4xl font-black tracking-tight text-white">
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
              <div className="mt-4 rounded-xl border border-violet/30 bg-violet/[.07] p-3">
                <p className="font-mono text-[10px] font-bold tracking-[.14em] text-violet-200">🎲 RISK ROLL</p>
                <p className="mt-1 text-xs text-slate-400">Roll before claiming: 0.5×, 1×, 1.5×, 2×, or 3× JACKPOT.</p>
                {rolled ? (
                  <p className="mt-2 font-mono text-sm font-bold text-acid">
                    Locked at {rolled.multiplier}× · Potential {Math.floor(quest.xp * rolled.multiplier).toLocaleString()} XP
                  </p>
                ) : (
                  <button
                    onClick={() => void roll(quest.issueNodeId)}
                    className="mt-3 rounded-lg border border-violet/50 px-3 py-2 text-xs font-bold text-violet-100 hover:bg-violet/20"
                  >
                    <Dices size={14} className="mr-1 inline" />Roll for XP
                  </button>
                )}
              </div>
              <button
                onClick={() => void claim(quest.issueNodeId, quest.issueUrl)}
                className="mt-5 flex items-center justify-between rounded-xl bg-acid px-4 py-3 font-extrabold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_22px_rgba(255,196,72,0.55)]"
              >
                Accept Quest {rolled && `· ${rolled.multiplier}×`} <ArrowRight size={16} />
              </button>
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
