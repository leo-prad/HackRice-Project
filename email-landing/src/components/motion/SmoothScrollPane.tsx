import { cancelFrame, frame, useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import { type ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Lenis smooth scroll for fixed-height workbench panes (list, detail, aux pages).
 * Mirrors landing scroll physics without wrapping the whole SPA.
 */
export function SmoothScrollPane({ children, className = "" }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content || reduceMotion) return;

    const lenis = new Lenis({
      wrapper,
      content,
      lerp: 0.085,
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.1,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    });

    function update(data: { timestamp: number }) {
      lenis.raf(data.timestamp);
    }

    frame.update(update, true);
    return () => {
      cancelFrame(update);
      lenis.destroy();
    };
  }, [reduceMotion]);

  return (
    <div ref={wrapperRef} className={`overflow-hidden ${className}`} data-lenis-prevent>
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
