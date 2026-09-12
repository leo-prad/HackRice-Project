import type { QuestRecommendation, RiskRollOffer, UserProfile } from "@gitventure/shared";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Dices, RefreshCw, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { notifyClaimsChanged } from "../lib/claimSync";
import PageShell from "../components/ui/PageShell";
import DashHeader from "../components/ui/DashHeader";
import { Surface } from "../components/ui/Surface";

const MULTIPLIERS = [0.5, 1, 1.5, 2, 3] as const;

function RiskRoll({
  xp,
  rolled,
  rolling,
  onRoll,
}: {
  xp: number;
  rolled?: RiskRollOffer;
  rolling: boolean;
  onRoll: () => void;
}) {
  const [spinFace, setSpinFace] = useState(1);
  const [justLanded, setJustLanded] = useState(false);

  useEffect(() => {
    if (!rolling) return;
    setJustLanded(false);
    const id = window.setInterval(() => {
      setSpinFace((n) => (n % 5) + 1);
    }, 80);
    return () => window.clearInterval(id);
  }, [rolling]);

  useEffect(() => {
    if (!rolled || rolling) return;
    setJustLanded(true);
    const t = window.setTimeout(() => setJustLanded(false), 1100);
    return () => window.clearTimeout(t);
  }, [rolled, rolling]);

  const displayMult = rolling ? MULTIPLIERS[spinFace - 1] : rolled?.multiplier ?? null;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-beacon/25 bg-gradient-to-br from-beacon/[0.1] via-transparent to-trail/[0.07] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-beacon">Risk roll</p>
          <p className="mt-1 font-body text-xs leading-relaxed text-fog">
            One roll before claim: 0.5× · 1× · 1.5× · 2× · or 3× jackpot.
          </p>
        </div>

        <div className="relative shrink-0" style={{ perspective: 920 }}>
          {/* Soft aura behind the die */}
          <motion.div
            className="pointer-events-none absolute -inset-3 rounded-full bg-beacon/20 blur-md"
            animate={
              rolling
                ? { opacity: [0.35, 0.85, 0.35], scale: [0.9, 1.15, 0.9] }
                : justLanded
                  ? { opacity: [0.9, 0.25], scale: [1.2, 1] }
                  : { opacity: [0.25, 0.45, 0.25], scale: [1, 1.06, 1] }
            }
            transition={{ duration: rolling ? 0.55 : 2.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />

          <motion.div
            className="relative h-14 w-14"
            style={{ transformStyle: "preserve-3d" }}
            animate={
              rolling
                ? {
                    rotateX: [0, 420, 780],
                    rotateY: [0, -320, -640],
                    y: [0, -10, 0],
                    scale: [1, 1.08, 1],
                  }
                : justLanded
                  ? { rotateX: 0, rotateY: 0, y: 0, scale: [1, 1.18, 1] }
                  : { rotateX: [10, 16, 10], rotateY: [-14, -22, -14], y: [0, -3, 0], scale: 1 }
            }
            transition={
              rolling
                ? { duration: 0.95, ease: [0.22, 0.8, 0.25, 1], repeat: Infinity }
                : justLanded
                  ? { type: "spring", stiffness: 380, damping: 14 }
                  : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <div
              className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/25 shadow-lg"
              style={{
                transform: "translateZ(12px)",
                backfaceVisibility: "hidden",
                background: "linear-gradient(to bottom right, #1c2533, #0b0f16)",
                boxShadow: "0 14px 32px -12px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.14)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={displayMult ?? "idle"}
                  initial={{ opacity: 0, rotateX: -40, filter: "blur(5px)" }}
                  animate={{ opacity: 1, rotateX: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, rotateX: 40, filter: "blur(5px)" }}
                  transition={{ duration: 0.14 }}
                  className={`font-display text-lg font-bold tracking-tight ${
                    rolled?.jackpot && !rolling ? "text-trail" : "text-snow"
                  }`}
                >
                  {displayMult != null ? `${displayMult}×` : "?"}
                </motion.span>
              </AnimatePresence>
            </div>
            <div
              className="absolute inset-0 rounded-xl border border-white/10"
              style={{ transform: "rotateY(180deg) translateZ(12px)", background: "#121821" }}
              aria-hidden
            />
            <div
              className="absolute inset-0 rounded-xl border border-beacon/20"
              style={{ transform: "rotateX(90deg) translateZ(12px)", background: "#152018" }}
              aria-hidden
            />
          </motion.div>
        </div>
      </div>

      {rolled && !rolling ? (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 font-mono text-sm font-bold text-trail"
        >
          Locked at {rolled.multiplier}× · Potential{" "}
          {Math.floor(xp * rolled.multiplier).toLocaleString()} XP
          {rolled.jackpot ? " · Jackpot" : ""}
        </motion.p>
      ) : (
        <button
          type="button"
          disabled={rolling}
          onClick={onRoll}
          className="gv-btn-secondary mt-3 px-3.5 py-2 text-xs font-semibold text-beacon disabled:cursor-wait disabled:opacity-70"
        >
          <Dices size={14} className={rolling ? "animate-spin" : undefined} />
          {rolling ? "Rolling…" : "Roll for XP"}
        </button>
      )}
    </div>
  );
}

function QuestCard({
  item,
  index,
  rolled,
  rolling,
  onRoll,
  onClaim,
}: {
  item: QuestRecommendation;
  index: number;
  rolled?: RiskRollOffer;
  rolling: boolean;
  onRoll: () => void;
  onClaim: () => void;
}) {
  const quest = item.quest;

  return (
    <Surface index={index} className="flex flex-col p-6 sm:p-7">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-mist">
        Quest {String(index + 1).padStart(2, "0")}
      </p>
      <h2 className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight text-snow">
        {quest.title}
      </h2>
      <p className="mt-2 truncate font-mono text-[11px] text-mist">{quest.questKey}</p>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mist">XP bounty</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-trail">
            {quest.xp.toLocaleString()}
            <span className="ml-1 text-sm font-medium tracking-normal text-mist">XP</span>
          </p>
        </div>
        {rolled && (
          <p className="rounded-full border border-trail/35 bg-trail/10 px-2.5 py-1 font-mono text-[10px] font-bold text-trail">
            {rolled.multiplier}× live
          </p>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] text-fog">
        Difficulty <span className="font-bold text-snow">{quest.difficulty.toFixed(1)}</span>
        <span className="text-mist"> / 10</span>
      </p>

      <ul className="mt-6 space-y-2 font-body text-sm leading-relaxed text-fog">
        {item.reasons.map((reason) => (
          <li key={reason} className="flex gap-2">
            <span className="mt-0.5 text-trail">✓</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      {item.potentialReward && (
        <p className="mt-5 rounded-xl border border-trail/20 bg-trail/[0.06] px-3 py-2 font-mono text-[11px] text-trail">
          Potential reward: {item.potentialReward}
        </p>
      )}

      <RiskRoll xp={quest.xp} rolled={rolled} rolling={rolling} onRoll={onRoll} />

      <button type="button" onClick={onClaim} className="gv-btn-primary mt-5 w-full justify-between px-5 py-3.5">
        <span>Accept quest{rolled ? ` · ${rolled.multiplier}×` : ""}</span>
        <ArrowRight size={16} />
      </button>
    </Surface>
  );
}

export default function NextQuest() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<QuestRecommendation[]>([]);
  const [rolls, setRolls] = useState<Record<string, RiskRollOffer>>({});
  const [rollingId, setRollingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [me, recs, existingRolls] = await Promise.all([
        api<UserProfile>("/users/me"),
        api<{ recommendations: QuestRecommendation[] }>("/quests/recommend", {
          method: "POST",
          body: JSON.stringify({}),
        }),
        api<{ rolls: Array<RiskRollOffer & { issueNodeId: string }> }>("/quests/rolls"),
      ]);
      setProfile(me);
      setRecommendations(recs.recommendations);
      const hydrated: Record<string, RiskRollOffer> = {};
      for (const row of existingRolls.rolls) {
        hydrated[row.issueNodeId] = {
          offerId: row.offerId,
          multiplier: row.multiplier,
          jackpot: row.jackpot,
        };
      }
      setRolls(hydrated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not find quests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const roll = async (issueNodeId: string) => {
    if (rollingId) return;
    setRollingId(issueNodeId);
    setError("");
    const started = Date.now();
    try {
      const result = await api<RiskRollOffer>(`/quests/${issueNodeId}/risk-roll`, { method: "POST" });
      const wait = Math.max(0, 1100 - (Date.now() - started));
      await new Promise((resolve) => window.setTimeout(resolve, wait));
      setRolls((current) => ({ ...current, [issueNodeId]: result }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Roll failed");
    } finally {
      setRollingId(null);
    }
  };

  const claim = async (issueNodeId: string, issueUrl: string) => {
    await api("/claims", {
      method: "POST",
      body: JSON.stringify({ issueNodeId, offerId: rolls[issueNodeId]?.offerId }),
    });
    notifyClaimsChanged();
    window.open(issueUrl, "_blank", "noopener,noreferrer");
  };

  if (profile && !profile.user.goals?.length) return null;


  if (error && !recommendations.length) {
    return (
      <PageShell reveal={false}>
        <p className="py-20 text-center font-body text-sm text-red-400">{error}</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <DashHeader
        eyebrow="Curriculum"
        title="A path made of real issues."
        subtitle="Three live GitHub issues, matched by XP bounty and difficulty — nothing else."
        action={
          <button type="button" onClick={() => void load()} className="gv-btn-secondary px-4 py-2.5 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {error && recommendations.length > 0 && (
        <p className="mt-4 font-body text-sm text-red-400">{error}</p>
      )}

      {loading && (
        <p className="mt-16 text-center font-mono text-xs uppercase tracking-[0.2em] text-mist">
          Scouting open source…
        </p>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {recommendations.map((item, i) => (
          <QuestCard
            key={item.quest.issueNodeId}
            item={item}
            index={i}
            rolled={rolls[item.quest.issueNodeId]}
            rolling={rollingId === item.quest.issueNodeId}
            onRoll={() => void roll(item.quest.issueNodeId)}
            onClaim={() => void claim(item.quest.issueNodeId, item.quest.issueUrl)}
          />
        ))}
      </div>

      {!loading && !recommendations.length && (
        <Surface className="mt-16 px-8 py-16 text-center">
          <Swords className="mx-auto text-trail" />
          <h2 className="mt-4 font-display text-2xl font-semibold text-snow">
            No open quests in range yet
          </h2>
          <p className="mt-2 font-body text-sm text-mist">
            Open a seeded demo world with the extension, or refresh after `npm run seed`.
          </p>
          <Link to="/profile" className="gv-btn-secondary mt-6 px-4 py-2.5 text-sm">
            Back to profile
          </Link>
        </Surface>
      )}
    </PageShell>
  );
}
