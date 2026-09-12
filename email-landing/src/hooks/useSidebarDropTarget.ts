import { useCallback, useEffect, useRef, useState } from "react";

export type DropEdge = "before" | "after";

export type SidebarDropHover = {
  id: string;
  edge: DropEdge;
} | null;

export function useSidebarDropTarget() {
  const [hover, setHover] = useState<SidebarDropHover>(null);
  const [dragging, setDragging] = useState(false);
  const rafRef = useRef<number | null>(null);

  const clearHover = useCallback(() => setHover(null), []);

  const onDragStart = useCallback(() => {
    setDragging(true);
  }, []);

  const onDragEnd = useCallback(() => {
    setDragging(false);
    clearHover();
  }, [clearHover]);

  useEffect(() => {
    window.addEventListener("dragend", onDragEnd);
    return () => window.removeEventListener("dragend", onDragEnd);
  }, [onDragEnd]);

  const onRowDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const edge: DropEdge = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setHover((prev) => (prev?.id === id && prev.edge === edge ? prev : { id, edge }));
    });
  }, []);

  const onRowDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    clearHover();
  }, [clearHover]);

  return {
    hover,
    dragging,
    onDragStart,
    onDragEnd,
    onRowDragOver,
    onRowDragLeave,
    clearHover,
  };
}
