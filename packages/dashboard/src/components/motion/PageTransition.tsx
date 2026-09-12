import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { EASE } from "../../motion/tokens";

type Props = { children: ReactNode };

/** Soft blur-rise between dashboard routes — keeps the journey feeling continuous. */
export default function PageTransition({ children }: Props) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
