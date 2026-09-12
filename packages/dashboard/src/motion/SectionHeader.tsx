import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { VIEWPORT, blurRevealStagger, blurRevealChild } from "./scrollMotion";

type Props = {
  title: ReactNode;
  subtitle?: string;
  eyebrow?: string;
  align?: "center" | "left";
  className?: string;
};

export default function SectionHeader({
  title,
  subtitle,
  eyebrow,
  align = "center",
  className = "",
}: Props) {
  const reduceMotion = useReducedMotion();
  const centered = align === "center";

  const ornament = (
    <div className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`} aria-hidden>
      <span
        className={`h-px w-12 bg-gradient-to-r ${
          centered ? "from-transparent" : "from-trail/20"
        } to-trail/50`}
      />
      <span className="relative flex h-2 w-2 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-trail/20" />
        <span className="h-1 w-1 rounded-full bg-trail" />
      </span>
      <span
        className={`h-px w-12 bg-gradient-to-l ${
          centered ? "to-transparent" : "to-trail/20"
        } from-trail/50`}
      />
    </div>
  );

  if (reduceMotion) {
    return (
      <div className={`${centered ? "mx-auto max-w-[680px] text-center" : "max-w-xl"} ${className}`}>
        {eyebrow && (
          <p className="mb-4 font-body text-[11px] font-medium uppercase tracking-[0.24em] text-mist">
            {eyebrow}
          </p>
        )}
        <div className="mb-5">{ornament}</div>
        <h2 className="font-display text-[clamp(2.1rem,4.2vw,3.15rem)] font-semibold leading-[1.08] tracking-[-0.028em] text-snow">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-5 max-w-[540px] font-body text-[1.0625rem] leading-[1.75] text-fog [text-wrap:balance]">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className={`${centered ? "mx-auto max-w-[680px] text-center" : "max-w-xl"} ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={blurRevealStagger}
    >
      {eyebrow && (
        <motion.p
          className="mb-4 font-body text-[11px] font-medium uppercase tracking-[0.24em] text-mist"
          variants={blurRevealChild}
        >
          {eyebrow}
        </motion.p>
      )}

      <motion.div className="mb-5" variants={blurRevealChild}>
        {ornament}
      </motion.div>

      <motion.h2
        className="font-display text-[clamp(2.1rem,4.2vw,3.15rem)] font-semibold leading-[1.08] tracking-[-0.028em] text-snow [text-wrap:balance]"
        variants={blurRevealChild}
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          className={`mt-5 font-body text-[1.0625rem] leading-[1.75] text-fog [text-wrap:balance] ${
            centered ? "mx-auto max-w-[540px]" : "max-w-[540px]"
          }`}
          variants={blurRevealChild}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
