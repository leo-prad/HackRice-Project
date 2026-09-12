import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { startMicrosoftLogin } from "../lib/microsoft";
import { isValidPostAuthPath } from "../lib/postAuthRoute";
import { setPostAuthRedirect } from "../lib/routes";

type Props = {
  className?: string;
  children?: ReactNode;
};

export function ConnectOutlookButton({ className = "", children = "Get started" }: Props) {
  const location = useLocation();

  return (
    <button
      type="button"
      onClick={() => {
        try {
          const from = (location.state as { from?: string } | null)?.from;
          if (from && isValidPostAuthPath(from)) {
            setPostAuthRedirect(from);
          }
          startMicrosoftLogin();
        } catch (err) {
          alert(err instanceof Error ? err.message : "Could not start sign-in");
        }
      }}
      className={
        className ||
        "inline-flex items-center justify-center rounded-full bg-land-ink px-5 py-2.5 font-landing-body text-sm font-semibold text-white shadow-land-card transition-colors hover:bg-land-accent active:scale-[0.98]"
      }
    >
      {children}
    </button>
  );
}
