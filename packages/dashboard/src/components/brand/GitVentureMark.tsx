/** GitVenture brand mark — a branching trail node. */
export function GitVentureMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="9" fill="#FF6B35" />
      <path
        d="M10 8v10.5a3.5 3.5 0 0 0 3.5 3.5H22"
        stroke="#0A0C10"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="10" cy="8" r="2.4" fill="#0A0C10" />
      <circle cx="22" cy="22" r="2.4" fill="#0A0C10" />
      <path d="M10 14.5h7.5a3 3 0 0 0 3-3V9" stroke="#0A0C10" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20.5" cy="9" r="2.2" fill="#0A0C10" />
    </svg>
  );
}

export function GitVentureWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <GitVentureMark size={28} />
      <span className="font-display text-[1.05rem] font-semibold tracking-[-0.03em] text-snow">
        GitVenture
      </span>
    </span>
  );
}
