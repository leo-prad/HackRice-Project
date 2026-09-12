import { useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { type RefObject } from "react";
import { EASE, VIEWPORT } from "./tokens";

export { EASE, VIEWPORT };

export const blurReveal = {
  hidden: { opacity: 0, y: 36, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.95, ease: EASE },
  },
};

export const blurRevealStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
};

export const blurRevealChild = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: EASE },
  },
};

export const cardReveal = {
  hidden: { opacity: 0, y: 44, scale: 0.97, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, delay: i * 0.09, ease: EASE },
  }),
};

export function useParallaxY(
  ref: RefObject<HTMLElement | null>,
  output: [number, number] = [48, -48],
): MotionValue<number> {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  return useTransform(scrollYProgress, [0, 1], [output[0], reduceMotion ? 0 : output[1]]);
}
