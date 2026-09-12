type Props = {
  onPointerDown: (e: React.PointerEvent) => void;
  onDoubleClick?: () => void;
  ariaLabel?: string;
};

export function ResizeHandle({
  onPointerDown,
  onDoubleClick,
  ariaLabel = "Resize panel",
}: Props) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      title="Drag to resize · double-click to reset"
      className="group relative z-30 w-[5px] shrink-0 cursor-col-resize touch-none select-none"
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-incuria-border transition-colors group-hover:bg-incuria-accent/40 group-active:bg-incuria-accent" />
    </div>
  );
}
