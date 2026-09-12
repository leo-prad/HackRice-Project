import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Line-by-line reveal for cinematic draft previews. */
export function useLineReveal(lines: string[], active: boolean, resetKey: string): number {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(reduceMotion ? lines.length : 0);

  useEffect(() => {
    if (!active || lines.length === 0) {
      setVisible(0);
      return;
    }
    if (reduceMotion) {
      setVisible(lines.length);
      return;
    }
    setVisible(0);
    const timers = lines.map((_, i) =>
      window.setTimeout(() => setVisible(i + 1), 200 + i * 280),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [active, lines, resetKey, reduceMotion]);

  return visible;
}
