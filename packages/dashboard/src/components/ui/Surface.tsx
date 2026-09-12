import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { cardReveal } from "../../motion/scrollMotion";

/** Shared surface used across dashboard cards — matches landing panel language. */
export const surfaceClass =
  "rounded-[22px] border border-white/[0.08] bg-panel/90 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.55)]";

export const surfaceHoverClass =
  "transition-[border-color,background-color,transform,box-shadow] duration-300 hover:border-white/[0.14] hover:bg-panel";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  /** When set, plays landing-style cardReveal on scroll. */
  index?: number;
  hover?: boolean;
};

export function Surface({ children, className = "", index, hover = false }: SurfaceProps) {
  const classes = `${surfaceClass} ${hover ? surfaceHoverClass : ""} ${className}`.trim();

  if (typeof index === "number") {
    return (
      <motion.div
        className={classes}
        variants={cardReveal}
        custom={index}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={classes}>{children}</div>;
}
