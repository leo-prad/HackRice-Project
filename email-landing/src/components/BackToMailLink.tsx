import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "../lib/routes";

export function BackToMailLink({ label = "Back to mail" }: { label?: string }) {
  return (
    <Link
      to={ROUTES.HOME}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-incuria-ink-muted transition-colors hover:text-incuria-ink"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
