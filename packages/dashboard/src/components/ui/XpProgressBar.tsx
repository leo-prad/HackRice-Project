import { useReducedMotion } from "framer-motion";
import { levelProgress, levelThreshold } from "@gitventure/shared";
import ProgressBar from "./ProgressBar";

type Props = {
  totalXp: number;
  /** Optional override when values already come from the API profile payload. */
  level?: number;
  xpIntoLevel?: number;
  xpForNextLevel?: number;
  className?: string;
  size?: "md" | "lg";
};

/**
 * Level XP progress — always derived from the canonical curve in `@gitventure/shared`.
 * Prefer passing API fields when present; falls back to recomputing from totalXp.
 */
export default function XpProgressBar({
  totalXp,
  level: levelProp,
  xpIntoLevel: intoProp,
  xpForNextLevel: needProp,
  className = "",
  size = "md",
}: Props) {
  const reduceMotion = useReducedMotion();
  const computed = levelProgress(totalXp);
  const level = levelProp ?? computed.level;
  const xpIntoLevel = intoProp ?? computed.xpIntoLevel;
  const xpForNextLevel = Math.max(1, needProp ?? computed.xpForNextLevel);
  const pct = Math.min(100, Math.max(0, (xpIntoLevel / xpForNextLevel) * 100));
  const floor = levelThreshold(level);
  const nextAt = levelThreshold(level + 1);
  const remaining = Math.max(0, nextAt - totalXp);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-mist">
            Level progress
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-snow sm:text-3xl">
            Level {level}
            <span className="ml-2 font-body text-sm font-medium text-fog">
              → {level + 1}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold tabular-nums text-trail">
            {totalXp.toLocaleString()}
            <span className="ml-1 text-xs font-medium text-mist">total XP</span>
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-mist">
            {remaining.toLocaleString()} XP to next level
          </p>
        </div>
      </div>

      <ProgressBar
        className="mt-4"
        value={pct}
        size={size === "lg" ? "lg" : "md"}
        label={`Level ${level} progress: ${xpIntoLevel} of ${xpForNextLevel} XP`}
        animate={!reduceMotion}
      />

      <div className="mt-2.5 flex justify-between font-mono text-[10px] font-bold tracking-wider text-mist">
        <span>
          {xpIntoLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP this level
        </span>
        <span>
          {pct.toFixed(0)}% · thresholds {floor.toLocaleString()} → {nextAt.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
