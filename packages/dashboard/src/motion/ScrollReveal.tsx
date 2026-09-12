import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { VIEWPORT, blurReveal } from "./scrollMotion";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "figure";
};

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  as = "div",
}: Props) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as];

  if (reduceMotion) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{
        hidden: blurReveal.hidden,
        visible: {
          ...blurReveal.visible,
          transition: {
            ...(typeof blurReveal.visible.transition === "object"
              ? blurReveal.visible.transition
              : {}),
            delay,
          },
        },
      }}
    >
      {children}
    </Tag>
  );
}
