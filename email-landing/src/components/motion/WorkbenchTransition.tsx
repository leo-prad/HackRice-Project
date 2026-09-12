import { type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { isMailRoute } from "../../lib/routes";
import { motionPresets } from "../../theme/motion";

/** Crossfade + subtle y for workbench aux pages; mail routes pass through. */
export function WorkbenchTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const mail = isMailRoute(location.pathname);

  if (reduceMotion || mail) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="h-full"
        initial={motionPresets.workbenchEnter.initial}
        animate={motionPresets.workbenchEnter.animate}
        exit={motionPresets.pageEnter.exit}
        transition={motionPresets.workbenchEnter.transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
