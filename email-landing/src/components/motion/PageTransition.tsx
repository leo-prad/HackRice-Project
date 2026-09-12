import { type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { motionPresets } from "../../theme/motion";

/**
 * Crossfades route content keyed on pathname for fluid screen-to-screen transitions.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="h-full"
        initial={motionPresets.pageEnter.initial}
        animate={motionPresets.pageEnter.animate}
        exit={motionPresets.pageEnter.exit}
        transition={motionPresets.pageEnter.transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
