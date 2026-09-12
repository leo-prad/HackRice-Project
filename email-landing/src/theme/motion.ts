import type { Transition, Variants } from "framer-motion";
import { EASE, motionDuration } from "./brand";

/** Premium blur-rise — signature landing feel, reused in workbench. */
export const blurReveal = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: EASE },
  },
} satisfies Variants;

export const blurRevealStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
};

export const blurRevealChild: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE },
  },
};

export const motionPresets = {
  pageEnter: {
    initial: { opacity: 0, y: 12, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -8, filter: "blur(6px)" },
    transition: { duration: motionDuration.slow, ease: EASE },
  } satisfies { initial: object; animate: object; exit: object; transition: Transition },

  paneSlide: {
    initial: { opacity: 0, x: 20, filter: "blur(6px)" },
    animate: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: -14, filter: "blur(4px)" },
    transition: { duration: motionDuration.slow, ease: EASE },
  } satisfies { initial: object; animate: object; exit: object; transition: Transition },

  onboardingStep: {
    initial: { opacity: 0, x: 32, filter: "blur(10px)" },
    animate: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: -28, filter: "blur(8px)" },
    transition: { duration: 0.55, ease: EASE },
  } satisfies { initial: object; animate: object; exit: object; transition: Transition },

  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.22, ease: EASE },
  },

  modal: {
    initial: { opacity: 0, scale: 0.94, y: 16, filter: "blur(12px)" },
    animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.96, y: 10, filter: "blur(8px)" },
    transition: { duration: 0.45, ease: EASE },
  },

  popover: {
    initial: { opacity: 0, scale: 0.92, y: -6, filter: "blur(6px)" },
    animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.95, y: -4, filter: "blur(4px)" },
    transition: { duration: 0.28, ease: EASE },
  },

  drawer: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
    transition: { type: "spring" as const, stiffness: 380, damping: 36 },
  },

  toast: {
    initial: { opacity: 0, y: 16, scale: 0.96, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" },
    transition: { duration: 0.35, ease: EASE },
  },

  expand: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.32, ease: EASE },
  },

  panelSpring: {
    type: "spring" as const,
    stiffness: 420,
    damping: 34,
  },

  listStagger: (index: number) => ({
    initial: { opacity: 0, y: 10, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.38, delay: index * 0.035, ease: EASE },
  }),

  workbenchEnter: {
    initial: { opacity: 0, y: 14, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: motionDuration.slow, ease: EASE },
  },

  /** Micro-interaction for buttons */
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};
