import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { blurRevealChild, blurRevealStagger } from "../../theme/motion";

type StaggerListProps = {
  /** Changing this key replays the stagger animation (e.g. active folder/view). */
  animationKey?: string | number;
  className?: string;
  children: ReactNode;
};

/** Wraps a list and reveals children with landing-style blur-rise stagger. */
export function StaggerList({ animationKey, className, children }: StaggerListProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      key={animationKey}
      className={className}
      initial="hidden"
      animate="visible"
      variants={blurRevealStagger}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  className,
  children,
  as = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "li";
}) {
  const reduceMotion = useReducedMotion();
  const Tag = as === "li" ? "li" : "div";

  if (reduceMotion) return <Tag className={className}>{children}</Tag>;

  const MotionTag = motion[as];
  return (
    <MotionTag className={className} variants={blurRevealChild}>
      {children}
    </MotionTag>
  );
}
