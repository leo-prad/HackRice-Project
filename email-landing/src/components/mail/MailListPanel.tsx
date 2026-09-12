import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, Paperclip, Pencil, SlidersHorizontal } from "lucide-react";
import type { Email } from "../../types";
import { StaggerItem, StaggerList } from "../motion/StaggerList";
import { SmoothScrollPane } from "../motion/SmoothScrollPane";
import { motionPresets } from "../../theme/motion";
import { EMAIL_DRAG_MIME, emailDragPayload } from "./drag";
import { IconTrash } from "./icons";
import { MailInboxFilters, type InboxFilterId } from "./MailInboxFilters";
import { classifyPriority, formatListDate, PRIORITY_PILL, truncatePreview, type PriorityTag } from "./utils";

type Props = {
  title: string;
  emails: Email[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  selectedEmailIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
  onDeleteSelected: () => void;
  onCompose: () => void;
  filtersExpanded: boolean;
  onToggleFilters: () => void;
  activeFilters: Set<InboxFilterId>;
  onToggleFilter: (id: InboxFilterId) => void;
  onClearFilters: () => void;
  onPriorityClick: (priority: PriorityTag) => void;
  batchClusterSizes?: Record<string, number>;
};

export function MailListPanel({
  title,
  emails,
  selectedId,
  loading,
  error,
  onSelect,
  selectedEmailIds,
  onToggleSelection,
  onToggleAll,
  onDeleteSelected,
  onCompose,
  filtersExpanded,
  onToggleFilters,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  onPriorityClick,
  batchClusterSizes,
}: Props) {
  return (
    <section className="flex h-full min-h-0 w-full flex-col border-r border-incuria-border bg-incuria-canvas font-landing-body text-incuria-ink">
      <div className="flex h-[52px] shrink-0 items-center justify-between gap-2 px-3.5">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold leading-none text-incuria-ink">{title}</h1>
          <p className="mt-1 text-[11px] text-incuria-ink-muted">
            All Mail · {emails.length} message{emails.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <ToolIcon
            title="Filter inbox"
            onClick={onToggleFilters}
            active={filtersExpanded || activeFilters.size > 0}
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </ToolIcon>
          <MoreMenu onToggleAll={onToggleAll} selectedCount={selectedEmailIds.size} total={emails.length} />
          <ToolIcon title="New message (⌘N)" onClick={onCompose}><Pencil className="h-[18px] w-[18px]" strokeWidth={1.75} /></ToolIcon>
        </div>
      </div>

      <MailInboxFilters
        active={activeFilters}
        onToggle={onToggleFilter}
        onClear={onClearFilters}
        expanded={filtersExpanded}
      />

      {selectedEmailIds.size > 0 ? (
        <div className="flex items-center justify-between gap-3 border-y border-incuria-border bg-incuria-surface px-3.5 py-1.5">
          <button type="button" onClick={onToggleAll} className="text-[13px] font-medium text-incuria-ink">
            {selectedEmailIds.size === emails.length ? "Deselect all" : "Select all"} ({selectedEmailIds.size})
          </button>
          <button type="button" onClick={onDeleteSelected} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-incuria-needs-reply transition-colors hover:bg-incuria-needs-reply-soft">
            <IconTrash className="h-4 w-4" />
            Delete
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <p className="px-6 py-16 text-center text-[14px] text-incuria-needs-reply">{error}</p>
        ) : emails.length === 0 ? (
          <p className="px-6 py-16 text-center text-[14px] text-incuria-ink-muted">No messages</p>
        ) : (
          <div className="mail-list-viewport relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <SmoothScrollPane className="mail-list-scroll scrollbar-mail min-h-0 w-full flex-1">
              <StaggerList animationKey={title}>
                <ul>
                  {emails.map((email) => (
                    <ListRow
                      key={email.id}
                      email={email}
                      selected={email.id === selectedId}
                      bulkSelected={selectedEmailIds.has(email.id)}
                      onSelect={() => onSelect(email.id)}
                      onToggleBulk={() => onToggleSelection(email.id)}
                      onPriorityClick={onPriorityClick}
                      batchSize={batchClusterSizes?.[email.id]}
                    />
                  ))}
                </ul>
              </StaggerList>
            </SmoothScrollPane>
            {emails.length > 8 ? <div className="mail-list-scroll-fade" aria-hidden /> : null}
          </div>
        )}
      </div>
    </section>
  );
}

function MoreMenu({
  onToggleAll,
  selectedCount,
  total,
}: {
  onToggleAll: () => void;
  selectedCount: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const allSelected = selectedCount === total && total > 0;

  return (
    <div className="relative">
      <ToolIcon title="More" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </ToolIcon>
      <AnimatePresence>
        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 cursor-default"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="more-menu"
              className="absolute right-0 top-full z-40 mt-1 min-w-[160px] origin-top-right rounded-lg border border-incuria-border bg-incuria-surface p-1 shadow-incuria-pop"
              initial={motionPresets.popover.initial}
              animate={motionPresets.popover.animate}
              exit={motionPresets.popover.exit}
              transition={motionPresets.popover.transition}
            >
              <button
                type="button"
                className="block w-full rounded-md px-3 py-2 text-left text-[13px] text-incuria-ink hover:bg-incuria-select"
                onClick={() => {
                  onToggleAll();
                  setOpen(false);
                }}
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ToolIcon({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors active:scale-[0.97] ${
        active
          ? "bg-incuria-accent-soft text-incuria-accent"
          : "text-incuria-ink-muted hover:bg-incuria-ink/[0.05] hover:text-incuria-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ListRow({
  email,
  selected,
  bulkSelected,
  onSelect,
  onToggleBulk,
  onPriorityClick,
  batchSize,
}: {
  email: Email;
  selected: boolean;
  bulkSelected: boolean;
  onSelect: () => void;
  onToggleBulk: () => void;
  onPriorityClick: (priority: PriorityTag) => void;
  batchSize?: number;
}) {
  const unread = email.isRead === false;
  const priority = classifyPriority(email);
  return (
    <StaggerItem as="li" className="mail-list-row group relative">
      {selected ? (
        <span className="absolute inset-y-0 left-0 z-10 w-[3px] bg-incuria-accent" aria-hidden />
      ) : null}
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(EMAIL_DRAG_MIME, emailDragPayload(email.id));
          e.dataTransfer.effectAllowed = "move";
        }}
        onClick={onSelect}
        className={`mail-list-row-btn w-full text-left transition-colors duration-100 ${
          selected ? "bg-incuria-surface" : "hover:bg-incuria-select"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
            {bulkSelected ? (
              <input
                type="checkbox"
                checked
                readOnly
                onClick={(e) => { e.stopPropagation(); onToggleBulk(); }}
                className="h-3 w-3 cursor-pointer rounded-sm accent-incuria-accent"
                aria-label="Selected"
              />
            ) : unread && !selected ? (
              <span className="h-2 w-2 rounded-full bg-incuria-accent" aria-label="Unread" />
            ) : null}
            {!bulkSelected && !(unread && !selected) ? (
              <span
                onClick={(e) => { e.stopPropagation(); onToggleBulk(); }}
                className="hidden h-3 w-3 cursor-pointer rounded-sm border border-incuria-border group-hover:block"
                role="checkbox"
                aria-checked="false"
                aria-label="Select"
              />
            ) : null}
          </span>
          <span className={`min-w-0 flex-1 truncate text-[15px] text-incuria-ink ${unread ? "font-semibold" : "font-medium"}`}>
            {email.from}
          </span>
          {email.hasAttachments ? (
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-incuria-ink-muted" strokeWidth={1.75} />
          ) : null}
          <span className="shrink-0 text-[12px] tabular-nums text-incuria-ink-muted">
            {formatListDate(email.date)}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-[14px] text-incuria-ink ${unread ? "font-semibold" : "font-normal"}`}>
            {email.subject || "(No subject)"}
          </span>
          {priority ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPriorityClick(priority);
              }}
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-90 ${PRIORITY_PILL[priority]}`}
            >
              {priority}
            </button>
          ) : null}
          {batchSize && batchSize >= 2 ? (
            <span className="shrink-0 rounded bg-incuria-batch-soft px-1.5 py-0.5 text-[10px] font-semibold text-incuria-batch">
              Batch · {batchSize}
            </span>
          ) : null}
        </div>

        <p className="mt-0.5 truncate text-[13px] text-incuria-ink-muted">
          {truncatePreview(email.preview, 96)}
        </p>
      </button>
    </StaggerItem>
  );
}

function ListSkeleton() {
  return (
    <div className="mail-list-viewport min-h-0 flex-1">
      <ul>
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="mail-list-row">
            <div className="mail-list-row-btn">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2" />
                <div className="h-3.5 w-28 animate-pulse rounded-md bg-incuria-ink/[0.08]" />
              </div>
              <div className="mt-2 h-3.5 w-4/5 max-w-[240px] animate-pulse rounded-md bg-incuria-ink/[0.08]" />
              <div className="mt-1.5 h-3 w-full max-w-[200px] animate-pulse rounded-md bg-incuria-ink/[0.05]" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
