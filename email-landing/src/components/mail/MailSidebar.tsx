import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Archive,
  BookOpen,
  FileText,
  Flag,
  GripVertical,
  Inbox,
  LayoutDashboard,
  Layers,
  LogOut,
  MessageCircleReply,
  PanelLeft,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash,
  Trash2,
  Settings,
  User,
} from "lucide-react";
import { IncuriaMark } from "../brand/IncuriaLogo";
import type { Course, MailFolder, MailSpecial } from "../../types";
import { GENERAL_COURSE_ID } from "../../types";
import { getUserProfile } from "../../lib/auth";
import { ROUTES } from "../../lib/routes";
import { useSidebarDropTarget, type DropEdge } from "../../hooks/useSidebarDropTarget";
import {
  type SidebarLayout,
  type SidebarSectionId,
  type SmartMailboxId,
  reorderList,
} from "../../lib/sidebarLayout";
import { readEmailDragId } from "./drag";

type Props = {
  activeSpecial: MailSpecial | null;
  folder: MailFolder;
  isFolderView: boolean;
  needsReplyCount: number;
  batchReadyCount: number;
  inboxCount: number;
  draftsCount?: number;
  starredOnly: boolean;
  onToggleStarred: () => void;
  courses: Course[];
  coursesLoading: boolean;
  selectedCourseId: string | null;
  onCourseSelect: (courseId: string | null) => void;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  onFolderChange: (folder: MailFolder) => void;
  onCompose: () => void;
  onBulkCompose?: () => void;
  bulkDraftingProgress?: { total: number; completed: number } | null;
  tags: string[];
  onAddTag: () => void;
  onDeleteCourse?: (id: string) => void;
  onDeleteTag?: (tag: string) => void;
  onOpenAssistant?: () => void;
  assistantOpen?: boolean;
  onSignOut?: () => void;
  onToggleSidebar?: () => void;
  layout: SidebarLayout;
  onLayoutChange: (layout: SidebarLayout) => void;
  onEmailDropOnCourse?: (emailId: string, courseId: string) => void;
  onEmailDropOnTag?: (emailId: string, tag: string) => void;
  onEmailDropOnFolder?: (emailId: string, folder: MailFolder) => void;
  auxiliaryMode?: boolean;
};

const ACTIVE_LAYOUT_ID = "sidebar-active";

const SMART_DEFS: Record<
  SmartMailboxId,
  { label: string; to: string; icon: React.ReactNode; countKey?: "needsReply" | "batchReady" }
> = {
  home: { label: "Home", to: ROUTES.HOME, icon: <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} /> },
  "needs-reply": {
    label: "Needs reply",
    to: ROUTES.NEEDS_REPLY,
    icon: <MessageCircleReply className="h-4 w-4" strokeWidth={1.75} />,
    countKey: "needsReply",
  },
  "batch-ready": {
    label: "Batch ready",
    to: ROUTES.BATCH_READY,
    icon: <Layers className="h-4 w-4" strokeWidth={1.75} />,
    countKey: "batchReady",
  },
};

const FAVORITE_DEFS: Record<
  MailFolder | "flagged",
  { label: string; to?: string; folder?: MailFolder; icon: React.ReactNode; countKey?: "inbox" | "drafts" }
> = {
  inbox: { label: "Inbox", to: ROUTES.INBOX, folder: "inbox", icon: <Inbox className="h-4 w-4" strokeWidth={1.75} />, countKey: "inbox" },
  drafts: { label: "Drafts", to: ROUTES.DRAFTS, folder: "drafts", icon: <FileText className="h-4 w-4" strokeWidth={1.75} />, countKey: "drafts" },
  sentitems: { label: "Sent", to: ROUTES.SENT, folder: "sentitems", icon: <Send className="h-4 w-4" strokeWidth={1.75} /> },
  archive: { label: "Archive", to: ROUTES.ARCHIVE, folder: "archive", icon: <Archive className="h-4 w-4" strokeWidth={1.75} /> },
  junkemail: { label: "Junk", to: ROUTES.JUNK, folder: "junkemail", icon: <ShieldAlert className="h-4 w-4" strokeWidth={1.75} /> },
  deleteditems: { label: "Trash", to: ROUTES.DELETED, folder: "deleteditems", icon: <Trash className="h-4 w-4" strokeWidth={1.75} /> },
  flagged: { label: "Flagged", icon: <Flag className="h-4 w-4" strokeWidth={1.75} /> },
};

const SECTION_LABELS: Record<SidebarSectionId, string> = {
  smart: "Smart Mailboxes",
  favorites: "Favorites",
  courses: "Courses",
  labels: "Labels",
};

export function MailSidebar({
  activeSpecial,
  folder,
  isFolderView,
  needsReplyCount,
  batchReadyCount,
  inboxCount,
  draftsCount,
  starredOnly,
  onToggleStarred,
  courses,
  coursesLoading,
  selectedCourseId,
  onCourseSelect,
  selectedTag,
  onTagSelect,
  onFolderChange,
  onCompose,
  onBulkCompose,
  bulkDraftingProgress,
  tags,
  onAddTag,
  onDeleteCourse,
  onDeleteTag,
  onOpenAssistant,
  assistantOpen,
  onSignOut,
  onToggleSidebar,
  layout,
  onLayoutChange,
  onEmailDropOnCourse,
  onEmailDropOnTag,
  onEmailDropOnFolder,
  auxiliaryMode = false,
}: Props) {
  const drop = useSidebarDropTarget();
  const counts = useMemo(
    () => ({ needsReply: needsReplyCount, batchReady: batchReadyCount, inbox: inboxCount, drafts: draftsCount }),
    [needsReplyCount, batchReadyCount, inboxCount, draftsCount],
  );

  const [dragPayload, setDragPayload] = useState<{ kind: "smart" | "favorite" | "section"; id: string } | null>(null);

  function handleSidebarDragStart(kind: "smart" | "favorite" | "section", id: string) {
    setDragPayload({ kind, id });
    drop.onDragStart();
  }

  function finishReorderDrop(action: () => void) {
    action();
    setDragPayload(null);
    drop.clearHover();
    drop.onDragEnd();
  }

  function handleEmailDrop(e: React.DragEvent, action: (emailId: string) => void) {
    e.preventDefault();
    const emailId = readEmailDragId(e.dataTransfer);
    drop.clearHover();
    if (emailId) action(emailId);
  }

  function dropSmart(targetId: SmartMailboxId) {
    if (!dragPayload || dragPayload.kind !== "smart" || dragPayload.id === targetId) return;
    const from = layout.smartOrder.indexOf(dragPayload.id as SmartMailboxId);
    const to = layout.smartOrder.indexOf(targetId);
    if (from < 0 || to < 0) return;
    onLayoutChange({ ...layout, smartOrder: reorderList(layout.smartOrder, from, to) });
    setDragPayload(null);
    drop.clearHover();
  }

  function dropFavorite(targetId: MailFolder | "flagged") {
    if (!dragPayload || dragPayload.kind !== "favorite" || dragPayload.id === targetId) return;
    const from = layout.favoritesOrder.indexOf(dragPayload.id as MailFolder | "flagged");
    const to = layout.favoritesOrder.indexOf(targetId);
    if (from < 0 || to < 0) return;
    onLayoutChange({ ...layout, favoritesOrder: reorderList(layout.favoritesOrder, from, to) });
    setDragPayload(null);
    drop.clearHover();
  }

  function dropSection(targetId: SidebarSectionId) {
    if (!dragPayload || dragPayload.kind !== "section" || dragPayload.id === targetId) return;
    const from = layout.sectionOrder.indexOf(dragPayload.id as SidebarSectionId);
    const to = layout.sectionOrder.indexOf(targetId);
    if (from < 0 || to < 0) return;
    onLayoutChange({ ...layout, sectionOrder: reorderList(layout.sectionOrder, from, to) });
    setDragPayload(null);
    drop.clearHover();
  }

  function renderSection(sectionId: SidebarSectionId) {
    switch (sectionId) {
      case "smart":
        return (
          <DraggableSection
            key="smart"
            title={SECTION_LABELS.smart}
            sectionId="smart"
            onDragStart={() => handleSidebarDragStart("section", "smart")}
            onDrop={() => dropSection("smart")}
          >
            {layout.smartOrder.map((id) => {
              const def = SMART_DEFS[id];
              const count = def.countKey ? counts[def.countKey] : undefined;
              return (
                <DraggableNavRow
                  key={id}
                  rowId={`smart-${id}`}
                  dropHover={drop.hover}
                  onRowDragOver={drop.onRowDragOver}
                  onRowDragLeave={drop.onRowDragLeave}
                  onDragStart={() => handleSidebarDragStart("smart", id)}
                  onDrop={() => dropSmart(id)}
                >
                  <NavRow
                    to={def.to}
                    icon={def.icon}
                    label={def.label}
                    count={count}
                    active={activeSpecial === id}
                  />
                </DraggableNavRow>
              );
            })}
          </DraggableSection>
        );
      case "favorites":
        return (
          <DraggableSection
            key="favorites"
            title={SECTION_LABELS.favorites}
            sectionId="favorites"
            onDragStart={() => handleSidebarDragStart("section", "favorites")}
            onDrop={() => dropSection("favorites")}
          >
            {layout.favoritesOrder.map((id) => {
              if (id === "flagged") {
                return (
                  <DraggableNavRow
                    key="flagged"
                    rowId="favorite-flagged"
                    dropHover={drop.hover}
                    onRowDragOver={drop.onRowDragOver}
                    onRowDragLeave={drop.onRowDragLeave}
                    onDragStart={() => handleSidebarDragStart("favorite", "flagged")}
                    onDrop={() => dropFavorite("flagged")}
                  >
                    <button
                      type="button"
                      onClick={onToggleStarred}
                      className={`group relative flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors ${
                        starredOnly ? "text-incuria-ink" : "text-incuria-ink-muted hover:bg-incuria-ink/[0.05]"
                      }`}
                    >
                      {starredOnly ? <span className="absolute inset-0 -z-10 rounded-md bg-incuria-accent-soft" /> : null}
                      <GripVertical className="h-3 w-3 shrink-0 text-mac-icon opacity-0 group-hover:opacity-100" strokeWidth={2} />
                      <Flag className={`h-4 w-4 ${starredOnly ? "text-incuria-accent" : "text-incuria-ink-muted"}`} strokeWidth={1.75} fill={starredOnly ? "currentColor" : "none"} />
                      <span className="flex-1 text-left font-medium">Flagged</span>
                    </button>
                  </DraggableNavRow>
                );
              }
              const def = FAVORITE_DEFS[id];
              const count = def.countKey ? counts[def.countKey] : undefined;
              return (
                <DraggableNavRow
                  key={id}
                  rowId={`favorite-${id}`}
                  dropHover={drop.hover}
                  onRowDragOver={drop.onRowDragOver}
                  onRowDragLeave={drop.onRowDragLeave}
                  onDragStart={() => handleSidebarDragStart("favorite", id)}
                  onEmailDrop={
                    def.folder && onEmailDropOnFolder
                      ? (emailId) => onEmailDropOnFolder(emailId, def.folder!)
                      : undefined
                  }
                  onDrop={() => dropFavorite(id)}
                >
                  <NavRow
                    to={def.to!}
                    icon={def.icon}
                    label={def.label}
                    count={count}
                    active={isFolderView && folder === def.folder && !starredOnly}
                    onClick={() => def.folder && onFolderChange(def.folder)}
                  />
                </DraggableNavRow>
              );
            })}
          </DraggableSection>
        );
      case "courses":
        return (
          <DraggableSection
            key="courses"
            title={SECTION_LABELS.courses}
            sectionId="courses"
            action={<Link to={ROUTES.COURSES} className="text-[11px] font-medium text-incuria-ink-muted transition-colors hover:text-incuria-accent">Manage</Link>}
            onDragStart={() => handleSidebarDragStart("section", "courses")}
            onDrop={() => dropSection("courses")}
          >
            {coursesLoading ? (
              <p className="px-2.5 py-1 text-xs text-mac-icon">Loading…</p>
            ) : (
              <>
                <NavItem label="General" icon={<BookOpen className="h-4 w-4" strokeWidth={1.75} />} active={selectedCourseId === GENERAL_COURSE_ID} onClick={() => onCourseSelect(selectedCourseId === GENERAL_COURSE_ID ? null : GENERAL_COURSE_ID)} />
                {courses.map((course) => (
                  <NavItem
                    key={course.id}
                    label={course.name}
                    icon={<BookOpen className="h-4 w-4" strokeWidth={1.75} />}
                    active={selectedCourseId === course.id}
                    onClick={() => onCourseSelect(selectedCourseId === course.id ? null : course.id)}
                    onEmailDrop={
                      onEmailDropOnCourse ? (emailId) => onEmailDropOnCourse(emailId, course.id) : undefined
                    }
                    dropHover={drop.hover}
                    rowId={`course-${course.id}`}
                    onRowDragOver={drop.onRowDragOver}
                    onRowDragLeave={drop.onRowDragLeave}
                  />
                ))}
                {courses.length === 0 ? (
                  <p className="px-2.5 py-1 text-xs text-mac-icon">
                    <Link to={ROUTES.COURSES} className="text-incuria-accent hover:underline">Add your first course</Link>
                  </p>
                ) : null}
              </>
            )}
          </DraggableSection>
        );
      case "labels":
        return (
          <DraggableSection
            key="labels"
            title={SECTION_LABELS.labels}
            sectionId="labels"
            action={<button type="button" onClick={onAddTag} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-incuria-ink-muted transition-colors hover:text-incuria-accent"><Plus className="h-3 w-3" strokeWidth={2} />New</button>}
            onDragStart={() => handleSidebarDragStart("section", "labels")}
            onDrop={() => dropSection("labels")}
          >
            {tags.length === 0 ? (
              <p className="px-2.5 py-1 text-xs text-mac-icon">No labels yet</p>
            ) : (
              tags.map((tag) => (
                <NavItem
                  key={tag}
                  label={tag}
                  icon={<Tag className="h-4 w-4" strokeWidth={1.75} />}
                  active={selectedTag === tag}
                  onClick={() => onTagSelect(selectedTag === tag ? null : tag)}
                  onDelete={onDeleteTag ? () => onDeleteTag(tag) : undefined}
                  onEmailDrop={
                    onEmailDropOnTag ? (emailId) => onEmailDropOnTag(emailId, tag) : undefined
                  }
                  dropHover={drop.hover}
                  rowId={`tag-${tag}`}
                  onRowDragOver={drop.onRowDragOver}
                  onRowDragLeave={drop.onRowDragLeave}
                />
              ))
            )}
          </DraggableSection>
        );
      default:
        return null;
    }
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-r border-incuria-border bg-incuria-canvas font-landing-body text-incuria-ink">
      <div className="flex h-[52px] shrink-0 items-center gap-2 px-3">
        {onToggleSidebar ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Hide sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-incuria-ink-muted transition-colors hover:bg-incuria-ink/[0.05] hover:text-incuria-ink"
          >
            <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}
        <span className="flex items-center gap-2">
          <IncuriaMark size={24} />
          <span className="font-landing-body text-[15px] font-semibold tracking-tight text-incuria-ink">Incuria</span>
        </span>
      </div>

      {!auxiliaryMode ? (
      <div className="shrink-0 space-y-1.5 px-3 pb-2">
        <button
          type="button"
          onClick={onCompose}
          title="New message (⌘N)"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-incuria-border bg-incuria-surface px-4 py-2 text-[13px] font-medium text-incuria-ink shadow-sm transition-colors hover:bg-incuria-select active:scale-[0.98]"
        >
          <FileText className="h-4 w-4" strokeWidth={1.75} />
          Compose
        </button>

        {onOpenAssistant ? (
          <button
            type="button"
            onClick={onOpenAssistant}
            aria-pressed={assistantOpen}
            title="Ask Incuria (⌘I)"
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors active:scale-[0.98] ${
              assistantOpen
                ? "bg-incuria-accent text-white"
                : "border border-incuria-accent/30 bg-incuria-accent-soft text-incuria-accent hover:bg-incuria-accent hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            Ask Incuria
          </button>
        ) : null}

        {onBulkCompose && activeSpecial === "batch-ready" ? (
          <button
            type="button"
            onClick={onBulkCompose}
            disabled={!!bulkDraftingProgress}
            className="relative w-full overflow-hidden rounded-lg border border-incuria-border bg-incuria-surface px-4 py-2 text-[13px] font-medium text-incuria-ink transition-colors hover:bg-incuria-select"
          >
            {bulkDraftingProgress ? (
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-mac-blue" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Drafting… {bulkDraftingProgress.completed}/{bulkDraftingProgress.total}
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-2">
                <MessageCircleReply className="h-4 w-4" strokeWidth={1.75} />
                Draft all replies
              </span>
            )}
            {bulkDraftingProgress ? (
              <div className="absolute inset-y-0 left-0 bg-mac-blue/25 transition-all duration-300" style={{ width: `${Math.max(5, (bulkDraftingProgress.completed / bulkDraftingProgress.total) * 100)}%` }} />
            ) : null}
          </button>
        ) : null}
      </div>
      ) : null}

      <nav className="scrollbar-mail min-h-0 flex-1 space-y-5 overflow-y-auto px-2 pb-4 pt-1" aria-label="Sidebar">
        {layout.sectionOrder.map((sectionId) => renderSection(sectionId))}
      </nav>

      <AccountFooter onSignOut={onSignOut} />
    </aside>
  );
}

function DraggableSection({
  title,
  sectionId,
  action,
  children,
  onDragStart,
  onDrop,
}: {
  title: string;
  sectionId: SidebarSectionId;
  action?: React.ReactNode;
  children: React.ReactNode;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  return (
    <section
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        className="mb-1 flex cursor-grab items-center justify-between px-2.5 active:cursor-grabbing"
      >
        <h2 className="flex items-center gap-1 font-landing-body text-[11px] font-medium uppercase tracking-[0.14em] text-incuria-ink-muted">
          <GripVertical className="h-3 w-3 text-incuria-ink-muted" strokeWidth={2} />
          {title}
        </h2>
        {action}
      </div>
      <div className="space-y-0.5" data-section={sectionId}>
        {children}
      </div>
    </section>
  );
}

function DropLine({ edge }: { edge: DropEdge }) {
  return (
    <span
      className={`pointer-events-none absolute left-2 right-2 z-20 h-0.5 rounded-full bg-incuria-accent shadow-[0_0_6px_rgba(79,70,229,0.45)] ${
        edge === "before" ? "top-0" : "bottom-0"
      }`}
      aria-hidden
    />
  );
}

function DraggableNavRow({
  children,
  rowId,
  dropHover,
  onRowDragOver,
  onRowDragLeave,
  onDragStart,
  onDrop,
  onEmailDrop,
}: {
  children: React.ReactNode;
  rowId: string;
  dropHover: { id: string; edge: DropEdge } | null;
  onRowDragOver: (e: React.DragEvent, id: string) => void;
  onRowDragLeave: (e: React.DragEvent) => void;
  onDragStart: () => void;
  onDrop: () => void;
  onEmailDrop?: (emailId: string) => void;
}) {
  const showBefore = dropHover?.id === rowId && dropHover.edge === "before";
  const showAfter = dropHover?.id === rowId && dropHover.edge === "after";

  return (
    <div
      className="group relative flex items-center"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(e) => {
        onRowDragOver(e, rowId);
      }}
      onDragLeave={onRowDragLeave}
      onDrop={(e) => {
        const emailId = readEmailDragId(e.dataTransfer);
        if (emailId && onEmailDrop) {
          e.preventDefault();
          onEmailDrop(emailId);
          return;
        }
        e.preventDefault();
        onDrop();
      }}
    >
      {showBefore ? <DropLine edge="before" /> : null}
      <GripVertical className="ml-0.5 h-3 w-3 shrink-0 text-mac-icon opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2} />
      <div className="min-w-0 flex-1">{children}</div>
      {showAfter ? <DropLine edge="after" /> : null}
    </div>
  );
}

function AccountFooter({ onSignOut }: { onSignOut?: () => void }) {
  const profile = getUserProfile();
  const initial = (profile?.displayName?.[0] ?? profile?.email?.[0] ?? "U").toUpperCase();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0 border-t border-incuria-border p-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-incuria-ink/[0.05]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-incuria-accent text-xs font-bold text-white">{initial}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-incuria-ink">{profile?.displayName ?? "Instructor"}</span>
          {profile?.email ? <span className="block truncate text-[11px] text-incuria-ink-muted">{profile.email}</span> : null}
        </span>
      </button>
      {open ? (
        <div role="menu" className="absolute bottom-[calc(100%+4px)] left-2 right-2 z-50 overflow-hidden rounded-lg border border-incuria-border bg-incuria-surface shadow-incuria-pop">
          <Link to={ROUTES.SETTINGS} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-incuria-ink transition-colors hover:bg-incuria-ink/[0.04]">
            <Settings className="h-4 w-4" strokeWidth={1.75} />
            Settings
          </Link>
          <Link to={ROUTES.PROFILE} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 border-t border-incuria-border px-4 py-2.5 text-[13px] font-medium text-incuria-ink transition-colors hover:bg-incuria-ink/[0.04]">
            <User className="h-4 w-4" strokeWidth={1.75} />
            View profile
          </Link>
          {onSignOut ? (
            <button type="button" role="menuitem" onClick={() => { setOpen(false); onSignOut(); }} className="flex w-full items-center gap-3 border-t border-incuria-border px-4 py-2.5 text-left text-[13px] font-medium text-incuria-needs-reply transition-colors hover:bg-incuria-needs-reply-soft">
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Sign out
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function NavRow({ to, icon, label, count, active, onClick }: { to: string; icon: React.ReactNode; label: string; count?: number; active: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`group relative flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors ${
        active ? "text-incuria-ink" : "text-incuria-ink-muted hover:bg-incuria-ink/[0.05]"
      }`}
    >
      {active ? (
        <motion.span layoutId={ACTIVE_LAYOUT_ID} className="absolute inset-0 -z-10 rounded-md bg-incuria-accent-soft" transition={{ type: "spring", stiffness: 450, damping: 38 }} />
      ) : null}
      <span className={active ? "text-incuria-accent" : "text-incuria-ink-muted"}>{icon}</span>
      <span className="flex-1 truncate text-left font-medium">{label}</span>
      {count != null && count > 0 ? (
        <span className="rounded-full bg-incuria-accent-soft px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-incuria-accent">{count}</span>
      ) : null}
    </NavLink>
  );
}

function NavItem({
  label,
  icon,
  active,
  onClick,
  onDelete,
  onEmailDrop,
  dropHover,
  rowId,
  onRowDragOver,
  onRowDragLeave,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onEmailDrop?: (emailId: string) => void;
  dropHover?: { id: string; edge: DropEdge } | null;
  rowId?: string;
  onRowDragOver?: (e: React.DragEvent, id: string) => void;
  onRowDragLeave?: (e: React.DragEvent) => void;
}) {
  const id = rowId ?? `nav-${label}`;
  const showBefore = dropHover?.id === id && dropHover.edge === "before";
  const showAfter = dropHover?.id === id && dropHover.edge === "after";

  return (
    <div
      className={`group relative flex h-8 w-full items-center gap-2.5 rounded-md text-[13px] transition-colors ${
        active ? "bg-incuria-accent-soft text-incuria-ink" : "text-incuria-ink-muted hover:bg-incuria-ink/[0.05]"
      }`}
      onDragOver={onRowDragOver ? (e) => onRowDragOver(e, id) : undefined}
      onDragLeave={onRowDragLeave}
      onDrop={
        onEmailDrop
          ? (e) => {
              e.preventDefault();
              const emailId = readEmailDragId(e.dataTransfer);
              if (emailId) onEmailDrop(emailId);
            }
          : undefined
      }
    >
      {showBefore ? <DropLine edge="before" /> : null}
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2">
        <span className={active ? "text-incuria-accent" : "text-incuria-ink-muted"}>{icon}</span>
        <span className="min-w-0 flex-1 truncate text-left font-medium">{label}</span>
      </button>
      {onDelete ? (
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="mr-1 rounded p-1 text-incuria-ink-muted opacity-0 transition-all hover:bg-incuria-needs-reply-soft hover:text-incuria-needs-reply group-hover:opacity-100" aria-label={`Delete ${label}`}>
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      ) : null}
      {showAfter ? <DropLine edge="after" /> : null}
    </div>
  );
}
