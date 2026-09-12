import { type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { motionPresets } from "../../theme/motion";

type Props = {
  paneKey: string;
  children: ReactNode;
};

/** List ↔ detail crossfade keyed on selected message or folder. */
export function MailPaneTransition({ paneKey, children }: Props) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={paneKey}
        className="h-full min-h-0"
        initial={motionPresets.paneSlide.initial}
        animate={motionPresets.paneSlide.animate}
        exit={motionPresets.paneSlide.exit}
        transition={motionPresets.paneSlide.transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
