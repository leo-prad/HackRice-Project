import { type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { motionPresets } from "../../theme/motion";

type Props = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

/** Height + opacity expand/collapse for settings rows, filter bars, etc. */
export function AnimatedExpand({ open, children, className = "" }: Props) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return open ? <div className={className}>{children}</div> : null;

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          className={`overflow-hidden ${className}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={motionPresets.expand.transition}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
