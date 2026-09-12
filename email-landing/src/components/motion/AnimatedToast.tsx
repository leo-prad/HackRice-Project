import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { motionPresets } from "../../theme/motion";

type Props = {
  message: string | null;
};

export function AnimatedToast({ message }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {message ? (
        <motion.p
          key={message}
          role="status"
          className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-incuria-border bg-incuria-surface px-4 py-2 text-sm text-incuria-ink shadow-incuria-pop"
          initial={reduceMotion ? { opacity: 0 } : motionPresets.toast.initial}
          animate={reduceMotion ? { opacity: 1 } : motionPresets.toast.animate}
          exit={reduceMotion ? { opacity: 0 } : motionPresets.toast.exit}
          transition={motionPresets.toast.transition}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
