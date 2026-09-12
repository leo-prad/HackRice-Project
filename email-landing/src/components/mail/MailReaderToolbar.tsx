import {
  Archive,
  CheckCheck,
  Flag,
  Forward,
  Reply,
  ReplyAll,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { ShortcutHint } from "../ui/ShortcutHint";

type Props = {
  disabled: boolean;
  starred: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onJunk: () => void;
  onToggleStar: () => void;
  onMarkRead: () => void;
};

export function MailReaderToolbar({
  disabled,
  starred,
  search,
  onSearchChange,
  searchRef,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onJunk,
  onToggleStar,
  onMarkRead,
}: Props) {
  return (
    <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-incuria-border bg-incuria-surface px-4">
      <Group>
        <TBtn title="Reply (⌘R)" onClick={onReply} disabled={disabled}><Reply className="h-[17px] w-[17px]" strokeWidth={1.75} /></TBtn>
        <TBtn title="Reply all (⇧⌘R)" onClick={onReplyAll} disabled={disabled}><ReplyAll className="h-[17px] w-[17px]" strokeWidth={1.75} /></TBtn>
        <TBtn title="Forward (⇧⌘F)" onClick={onForward} disabled={disabled}><Forward className="h-[17px] w-[17px]" strokeWidth={1.75} /></TBtn>
      </Group>

      <Group>
        <TBtn title="Archive (⌃⌘A)" onClick={onArchive} disabled={disabled}><Archive className="h-[17px] w-[17px]" strokeWidth={1.75} /></TBtn>
        <TBtn title="Delete (⌘⌫)" onClick={onDelete} disabled={disabled}><Trash2 className="h-[17px] w-[17px]" strokeWidth={1.75} /></TBtn>
        <TBtn title="Junk (⇧⌘J)" onClick={onJunk} disabled={disabled}><ShieldAlert className="h-[17px] w-[17px]" strokeWidth={1.75} /></TBtn>
      </Group>

      <Group>
        <TBtn title="Mark as read (⇧⌘U)" onClick={onMarkRead} disabled={disabled}>
          <CheckCheck className="h-[17px] w-[17px]" strokeWidth={1.75} />
          <ShortcutHint keys={["⇧", "⌘", "U"]} />
        </TBtn>
        <TBtn title={starred ? "Unflag (⇧⌘L)" : "Flag (⇧⌘L)"} onClick={onToggleStar} disabled={disabled} active={starred}>
          <Flag className="h-[17px] w-[17px]" strokeWidth={1.75} fill={starred ? "currentColor" : "none"} />
          <ShortcutHint keys={["⇧", "⌘", "L"]} />
        </TBtn>
      </Group>

      <div className="relative ml-auto w-[200px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-incuria-ink-muted" />
        <input
          ref={searchRef as React.RefObject<HTMLInputElement>}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search (⌘K)"
          className="h-7 w-full rounded-full border border-incuria-border bg-incuria-canvas pl-8 pr-3 text-[13px] text-incuria-ink placeholder:text-incuria-ink-muted focus:border-incuria-accent focus:outline-none focus:ring-2 focus:ring-incuria-accent/20"
        />
      </div>
    </div>
  );
}

/** A visually-joined group of bordered toolbar buttons. */
function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center divide-x divide-incuria-border overflow-hidden rounded-md border border-incuria-border">
      {children}
    </div>
  );
}

function TBtn({
  title,
  onClick,
  disabled,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex h-7 w-7 items-center justify-center transition-all active:scale-[0.97] disabled:opacity-30 disabled:active:scale-100 ${
        active ? "bg-incuria-accent-soft text-incuria-accent" : "bg-incuria-surface text-incuria-ink-muted hover:bg-incuria-select active:bg-incuria-select"
      }`}
    >
      {children}
    </button>
  );
}
