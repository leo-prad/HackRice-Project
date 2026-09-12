import { useLocation } from "react-router-dom";
import { ROUTES } from "../lib/routes";
import MailPage from "./MailPage";
import type { MailView } from "../types";

function viewFromPath(pathname: string): MailView {
  if (pathname.startsWith(ROUTES.HOME)) return { kind: "special", special: "home" };
  if (pathname.startsWith(ROUTES.NEEDS_REPLY)) return { kind: "special", special: "needs-reply" };
  if (pathname.startsWith(ROUTES.BATCH_READY)) return { kind: "special", special: "batch-ready" };
  if (pathname.startsWith(ROUTES.SENT)) return { kind: "folder", folder: "sentitems" };
  if (pathname.startsWith(ROUTES.DRAFTS)) return { kind: "folder", folder: "drafts" };
  if (pathname.startsWith(ROUTES.JUNK)) return { kind: "folder", folder: "junkemail" };
  if (pathname.startsWith(ROUTES.DELETED)) return { kind: "folder", folder: "deleteditems" };
  if (pathname.startsWith(ROUTES.ARCHIVE)) return { kind: "folder", folder: "archive" };
  return { kind: "folder", folder: "inbox" };
}

function viewKey(view: MailView): string {
  return view.kind === "special" ? view.special : view.folder;
}

export default function InboxPage() {
  const { pathname } = useLocation();
  const view = viewFromPath(pathname);
  return <MailPage key={viewKey(view)} view={view} />;
}
