import { cancelFrame, frame, useReducedMotion } from "framer-motion";
import { ReactLenis, type LenisRef } from "lenis/react";
import { type ReactNode, useEffect, useRef } from "react";

type Props = { children: ReactNode };

/** Lenis smooth scroll synced with Framer Motion's frame loop. */
export default function SmoothScroll({ children }: Props) {
  const lenisRef = useRef<LenisRef>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }

    frame.update(update, true);
    return () => cancelFrame(update);
  }, [reduceMotion]);

  if (reduceMotion) return <>{children}</>;

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        autoRaf: false,
        lerp: 0.085,
        duration: 1.15,
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.1,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      }}
    >
      {children}
    </ReactLenis>
  );
}
