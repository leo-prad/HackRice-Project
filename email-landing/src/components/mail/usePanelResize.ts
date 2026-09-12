import { useCallback, useEffect, useRef, useState } from "react";

export type PanelResizeConfig = {
  storageKey: string;
  defaultWidth: number;
  min: number;
  max: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function readStoredWidth(key: string, fallback: number, min: number, max: number) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return fallback;
    return clamp(n, min, max);
  } catch {
    return fallback;
  }
}

export function usePanelResize(config: PanelResizeConfig) {
  const { storageKey, defaultWidth, min, max } = config;
  const [width, setWidth] = useState(() => readStoredWidth(storageKey, defaultWidth, min, max));
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(width);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  const onResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = widthRef.current;
      const target = e.currentTarget as HTMLElement;

      target.setPointerCapture(e.pointerId);
      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      function onMove(ev: PointerEvent) {
        const next = clamp(startWidth + (ev.clientX - startX), min, max);
        widthRef.current = next;
        setWidth(next);
      }

      function onUp(ev: PointerEvent) {
        target.releasePointerCapture(ev.pointerId);
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setIsResizing(false);
        try {
          localStorage.setItem(storageKey, String(widthRef.current));
        } catch {
          /* ignore */
        }
      }

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [max, min, storageKey],
  );

  const resetWidth = useCallback(() => {
    setWidth(defaultWidth);
    widthRef.current = defaultWidth;
    try {
      localStorage.setItem(storageKey, String(defaultWidth));
    } catch {
      /* ignore */
    }
  }, [defaultWidth, storageKey]);

  return { width, isResizing, onResizeStart, resetWidth };
}
