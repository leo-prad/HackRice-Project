import type { QuestCompletion } from "@gitventure/shared";
import { roman } from "@gitventure/shared";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import PageShell from "../components/ui/PageShell";
import ProgressBar from "../components/ui/ProgressBar";
import { Surface } from "../components/ui/Surface";
import ScrollReveal from "../motion/ScrollReveal";

export default function Complete() {
  const [completion, setCompletion] = useState<QuestCompletion | null>(null);
  const [error, setError] = useState("");
  const [xpShown, setXpShown] = useState(0);

  useEffect(() => {
    api<{ completion: QuestCompletion | null }>("/claims/latest-completion")
      .then((result) => setCompletion(result.completion))
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Could not load completion"),
      );
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

  if (error) {
    return (
      <PageShell reveal={false}>
        <p className="py-20 text-center font-body text-sm text-red-400">{error}</p>
      </PageShell>
    );
  }

  if (!completion) {
    return (
      <PageShell>
        <ScrollReveal className="mx-auto max-w-lg py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">No completion yet</p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-snow">
            Finish a quest to unlock this screen.
          </h1>
          <Link
            to="/next"
            className="mt-8 inline-flex items-center gap-2 font-body text-sm font-medium text-trail transition-colors hover:text-trail-hot"
          >
            Find a quest <ArrowRight size={16} />
          </Link>
        </ScrollReveal>
      </PageShell>
    );
  }

  const progress = Math.min(100, (completion.xpIntoLevel / Math.max(1, completion.xpForNextLevel)) * 100);

  return (
    <PageShell>
      <ScrollReveal className="mx-auto max-w-xl text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-mist">
          Quest complete
        </p>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-snow">
          {completion.questTitle}
        </h1>
        <p className="mt-2 font-mono text-xs text-mist">{completion.questKey}</p>
        <div className="mt-8 font-display text-7xl font-semibold tracking-[-0.06em] text-trail text-glow">
          +{xpShown.toLocaleString()} XP
        </div>
        <ProgressBar
          className="mx-auto mt-6 max-w-sm"
          value={progress}
          size="md"
          label="Level progress after quest"
        />
        <div className="mx-auto mt-8 grid max-w-md gap-3 text-left">
          {completion.levelAfter > completion.levelBefore && (
            <Row label="Level up" value={`Level ${completion.levelBefore} → ${completion.levelAfter}`} />
          )}
          {completion.skillUps
            .filter((skill) => skill.levelAfter > skill.levelBefore)
            .map((skill) => (
              <Row
                key={skill.name}
                label="Skill level up"
                value={`${skill.name} ${roman(skill.levelBefore)} → ${roman(skill.levelAfter)}`}
              />
            ))}
          {completion.achievements.map((achievement) => (
            <Row key={achievement.code} label="Achievement unlocked" value={achievement.name} />
          ))}
          {completion.rankBefore &&
            completion.rankAfter &&
            completion.rankAfter < completion.rankBefore && (
              <Row
                label="Global rank"
                value={`#${completion.rankBefore} → #${completion.rankAfter}`}
              />
            )}
        </div>
        <Link to="/next" className="gv-btn-primary mt-10 px-6 py-3.5">
          Find next quest <ArrowRight size={18} />
        </Link>
      </ScrollReveal>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Surface className="px-4 py-3.5">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-mist">{label}</p>
      <p className="mt-1 font-display font-semibold text-snow">{value}</p>
    </Surface>
  );
}
