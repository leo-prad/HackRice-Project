import type { QuestCompletion } from "@questline/shared";
import { roman } from "@questline/shared";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Complete() {
  const [completion, setCompletion] = useState<QuestCompletion | null>(null);
  const [error, setError] = useState("");
  const [xpShown, setXpShown] = useState(0);

  useEffect(() => {
    api<{ completion: QuestCompletion | null }>("/claims/latest-completion")
      .then((result) => setCompletion(result.completion))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load completion"));
  }, []);

  useEffect(() => {
    if (!completion) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setXpShown(Math.floor(completion.xpAwarded * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [completion]);

  if (error) return <p className="p-20 text-center text-red-400">{error}</p>;
  if (!completion) {
    return (
      <div className="mx-auto max-w-lg px-5 py-32 text-center">
        <p className="font-mono text-[10px] tracking-[.2em] text-slate-600">NO COMPLETION YET</p>
        <h1 className="mt-4 text-3xl font-black">Finish a quest to unlock this screen.</h1>
        <Link to="/next" className="mt-8 inline-flex items-center gap-2 text-acid">Find a quest <ArrowRight size={16} /></Link>
      </div>
    );
  }

  const progress = Math.min(100, (completion.xpIntoLevel / Math.max(1, completion.xpForNextLevel)) * 100);

  return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center fade-up">
      <p className="font-mono text-[11px] font-bold tracking-[.28em] text-slate-500">QUEST COMPLETE</p>
      <h1 className="mt-5 text-3xl font-black">{completion.questTitle}</h1>
      <p className="mt-2 font-mono text-xs text-slate-500">{completion.questKey}</p>
      <div className="mt-8 text-7xl font-black tracking-[-.06em] text-acid text-glow">+{xpShown.toLocaleString()} XP</div>
      <div className="mx-auto mt-6 h-2 max-w-sm overflow-hidden rounded-full bg-white/[.08]">
        <i className="block h-full rounded-full bg-acid" style={{ width: `${progress}%` }} />
      </div>
      <div className="mx-auto mt-8 grid max-w-md gap-3 text-left">
        {completion.levelAfter > completion.levelBefore && (
          <Row label="LEVEL UP" value={`LEVEL ${completion.levelBefore} → ${completion.levelAfter}`} />
        )}
        {completion.skillUps.filter((skill) => skill.levelAfter > skill.levelBefore).map((skill) => (
          <Row key={skill.name} label="SKILL LEVEL UP" value={`${skill.name.toUpperCase()} ${roman(skill.levelBefore)} → ${roman(skill.levelAfter)}`} />
        ))}
        {completion.achievements.map((achievement) => (
          <Row key={achievement.code} label="ACHIEVEMENT UNLOCKED" value={achievement.name.toUpperCase()} />
        ))}
        {completion.rankBefore && completion.rankAfter && completion.rankAfter < completion.rankBefore && (
          <Row label="GLOBAL RANK" value={`#${completion.rankBefore} → #${completion.rankAfter}`} />
        )}
      </div>
      <Link to="/next" className="mt-10 inline-flex items-center gap-2 rounded-xl bg-acid px-5 py-3.5 font-extrabold text-ink">
        Find next quest <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel px-4 py-3">
      <p className="font-mono text-[9px] font-bold tracking-[.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
