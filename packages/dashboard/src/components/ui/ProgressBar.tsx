import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "../../motion/tokens";

type Props = {
  /** 0–100 */
  value: number;
  className?: string;
  /** Visual height of the track */
  size?: "sm" | "md" | "lg";
  /** Accessible name */
  label?: string;
  animate?: boolean;
};

const HEIGHT = {
  sm: "h-2",
  md: "h-2.5",
  lg: "h-3.5",
} as const;

/**
 * High-contrast progress track used across GitVenture.
 * Track = dark line surface; fill = solid trail — always readable on void.
 */
export default function ProgressBar({
  value,
  className = "",
  size = "md",
  label = "Progress",
  animate = true,
}: Props) {
  const reduce = useReducedMotion();
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`gv-progress ${HEIGHT[size]} ${className}`.trim()}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      {animate && !reduce ? (
        <motion.span
          className="gv-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, ease: EASE }}
        />
      ) : (
        <span className="gv-progress-fill" style={{ width: `${pct}%` }} />
      )}
    </div>
  );
}
