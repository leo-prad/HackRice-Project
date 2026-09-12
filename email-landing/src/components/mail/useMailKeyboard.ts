import { useEffect, useRef } from "react";
import type { Email, MailFolder } from "../../types";

type Options = {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCompose: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onFlag: () => void;
  onArchive: () => void;
  onJunk: () => void;
  onMarkRead: () => void;
  onSummarize: () => void;
  onFolderChange: (f: MailFolder) => void;
  onToggleAssistant: () => void;
  onToggleSearch: () => void;
  onDelete: () => void;
  onShowShortcuts: () => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  enabled?: boolean;
};

/** macOS Mail-faithful keyboard shortcuts. */
export function useMailKeyboard({
  emails,
  selectedId,
  onSelect,
  onCompose,
  onReply,
  onReplyAll,
  onForward,
  onFlag,
  onArchive,
  onJunk,
  onMarkRead,
  onSummarize,
  onFolderChange,
  onToggleAssistant,
  onToggleSearch,
  onDelete,
  onShowShortcuts,
  searchRef,
  enabled = true,
}: Options) {
  const emailsRef = useRef(emails);
  const selectedRef = useRef(selectedId);

  useEffect(() => {
    emailsRef.current = emails;
    selectedRef.current = selectedId;
  }, [emails, selectedId]);

  // Numbered mailbox jumps (⌘1…⌘6), mirroring macOS Mail favorites.
  const folderByDigit: Record<string, MailFolder> = {
    "1": "inbox",
    "2": "sentitems",
    "3": "drafts",
    "4": "archive",
    "5": "junkemail",
    "6": "deleteditems",
  };

  useEffect(() => {
    if (!enabled) return;

    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
    }

    function moveSelection(delta: number) {
      const list = emailsRef.current;
      if (list.length === 0) return;
      const idx = list.findIndex((e) => e.id === selectedRef.current);
      const next = idx < 0 ? 0 : Math.max(0, Math.min(list.length - 1, idx + delta));
      onSelect(list[next].id);
    }

    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const code = e.code;
      const typing = isTypingTarget(e.target);

      // Block browser reload (⌘R / Ctrl+R) whenever the mail workbench handles shortcuts.
      if (mod && !e.shiftKey && !e.altKey && (key === "r" || code === "KeyR")) {
        e.preventDefault();
        e.stopPropagation();
        if (typing) return;
        onReply();
        return;
      }

      if (typing) {
        if (mod && (key === "k" || key === "i")) {
          e.preventDefault();
          if (key === "k") onToggleSearch();
          else onToggleAssistant();
          return;
        }
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }

      // ── Combos with a modifier ───────────────────────────────
      if (mod) {
        // ⌃⌘A — archive
        if (e.ctrlKey && e.metaKey && key === "a") {
          e.preventDefault();
          if (selectedRef.current) onArchive();
          return;
        }
        // ⌘K — toggle search focus
        if (key === "k") {
          e.preventDefault();
          onToggleSearch();
          return;
        }
        // ⌘I — toggle AI assistant
        if (key === "i") {
          e.preventDefault();
          onToggleAssistant();
          return;
        }
        // ⌘⌥F — search mailbox (legacy alias)
        if (e.altKey && key === "f") {
          e.preventDefault();
          onToggleSearch();
          return;
        }
        // ⇧⌘J — junk
        if (e.shiftKey && key === "j") {
          e.preventDefault();
          if (selectedRef.current) onJunk();
          return;
        }
        // ⇧⌘S — summarize
        if (e.shiftKey && key === "s") {
          e.preventDefault();
          if (selectedRef.current) onSummarize();
          return;
        }
        // ⇧⌘U — mark as read
        if (e.shiftKey && key === "u") {
          e.preventDefault();
          if (selectedRef.current) onMarkRead();
          return;
        }
        // ⌘⇧A — toggle assistant (legacy alias)
        if (e.shiftKey && key === "a") {
          e.preventDefault();
          onToggleAssistant();
          return;
        }
        // ⇧⌘R — reply all
        if (e.shiftKey && key === "r") {
          e.preventDefault();
          if (selectedRef.current) onReplyAll();
          return;
        }
        // ⇧⌘F — forward
        if (e.shiftKey && key === "f") {
          e.preventDefault();
          if (selectedRef.current) onForward();
          return;
        }
        // ⇧⌘L — flag
        if (e.shiftKey && key === "l") {
          e.preventDefault();
          if (selectedRef.current) onFlag();
          return;
        }
        // ⌘N — new message
        if (key === "n") {
          e.preventDefault();
          onCompose();
          return;
        }
        // ⌘R — reply (handled above to beat browser reload; keep for clarity)
        if (key === "r") {
          return;
        }
        // ⌘⌫ / ⌘Delete — delete
        if (key === "backspace" || key === "delete") {
          e.preventDefault();
          if (selectedRef.current) onDelete();
          return;
        }
        // ⌘1…⌘6 — jump to mailbox
        if (folderByDigit[e.key]) {
          e.preventDefault();
          onFolderChange(folderByDigit[e.key]);
          return;
        }
        return;
      }

      // ── Single-key shortcuts ─────────────────────────────────
      // ? — shortcut cheat-sheet
      if (e.key === "?") {
        e.preventDefault();
        onShowShortcuts();
        return;
      }

      // Delete / Backspace (no modifier) — macOS Mail deletes the selection
      if ((e.key === "Delete" || e.key === "Backspace") && selectedRef.current) {
        e.preventDefault();
        onDelete();
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1);
        return;
      }

      // "/" toggles search focus
      if (e.key === "/") {
        e.preventDefault();
        onToggleSearch();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [
    folderByDigit,
    onArchive,
    onCompose,
    onDelete,
    onFlag,
    onFolderChange,
    onForward,
    onJunk,
    onMarkRead,
    onToggleAssistant,
    onToggleSearch,
    onReply,
    onReplyAll,
    onSelect,
    onShowShortcuts,
    onSummarize,
    searchRef,
    enabled,
  ]);
}
