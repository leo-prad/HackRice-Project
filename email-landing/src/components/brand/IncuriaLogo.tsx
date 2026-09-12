import { useId } from "react";
import { BRAND } from "../../brand/constants";

type Props = {
  className?: string;
  /** Size of the envelope mark in pixels. */
  markSize?: number;
  showWordmark?: boolean;
  /** "light" = ink wordmark for light backgrounds, "dark" = paper wordmark for dark footers. */
  tone?: "light" | "dark";
};

/**
 * Incuria mark — an open envelope with a draft page rising out of it and a
 * spark above the fold: "your reply is already drafted."
 */
export function IncuriaMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  const gradId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5B54F0" />
          <stop offset="1" stopColor="#3730A3" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="9" fill={`url(#${gradId})`} />

      {/* Draft page rising out of the envelope */}
      <rect x="11.5" y="7.5" width="9" height="9.5" rx="1.6" fill="#FFFFFF" fillOpacity="0.92" />
      <rect x="13.5" y="10" width="5" height="1.1" rx="0.55" fill="#4F46E5" fillOpacity="0.55" />
      <rect x="13.5" y="12.4" width="3.6" height="1.1" rx="0.55" fill="#4F46E5" fillOpacity="0.35" />

      {/* Envelope body — open, page tucked behind the front panel */}
      <path
        d="M7.5 14.6 16 19.8l8.5-5.2v7.1a2.3 2.3 0 0 1-2.3 2.3H9.8a2.3 2.3 0 0 1-2.3-2.3z"
        fill="#FFFFFF"
      />
      <path
        d="M7.5 14.6 16 19.8l8.5-5.2"
        stroke="#C9C5F4"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Spark above the flap */}
      <path
        d="M25.2 5.4l.62 1.48 1.48.62-1.48.62-.62 1.48-.62-1.48-1.48-.62 1.48-.62z"
        fill="#FFFFFF"
        fillOpacity="0.95"
      />
    </svg>
  );
}

export function IncuriaLogo({
  className = "",
  markSize = 28,
  showWordmark = true,
  tone = "light",
}: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <IncuriaMark size={markSize} />
      {showWordmark ? (
        <span
          className={`font-landing-display text-2xl font-semibold tracking-tight ${
            tone === "dark" ? "text-white" : "text-land-ink"
          }`}
        >
          {BRAND.name}
        </span>
      ) : null}
    </span>
  );
}
