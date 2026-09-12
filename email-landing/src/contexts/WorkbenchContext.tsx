import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { listCourses } from "../lib/api";
import { clearTokens } from "../lib/auth";
import { isMailRoute, ROUTES } from "../lib/routes";
import { loadSidebarLayout, saveSidebarLayout, type SidebarLayout } from "../lib/sidebarLayout";
import type { Course, MailFolder, MailSpecial } from "../types";
import { GENERAL_COURSE_ID } from "../types";

const STORAGE_KEYS = { tags: "incuria-tags" } as const;

export type MailCounts = {
  needsReply: number;
  batchReady: number;
  inbox: number;
  drafts?: number;
};

type WorkbenchContextValue = {
  courses: Course[];
  coursesLoading: boolean;
  refreshCourses: () => Promise<void>;
  tags: string[];
  addTag: (name: string) => void;
  deleteTag: (tag: string) => void;
  sidebarLayout: SidebarLayout;
  updateSidebarLayout: (layout: SidebarLayout) => void;
  sidebarCourseId: string | null;
  setSidebarCourseId: (id: string | null) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  starredOnly: boolean;
  setStarredOnly: (v: boolean) => void;
  mailCounts: MailCounts;
  setMailCounts: (counts: MailCounts) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  narrow: boolean;
  activeSpecial: MailSpecial | null;
  folder: MailFolder;
  isFolderView: boolean;
  signOut: () => void;
  onFolderChange: (folder: MailFolder) => void;
  statusMessage: string | null;
  setStatusMessage: (msg: string | null) => void;
  onEmailDropOnCourse: ((emailId: string, courseId: string) => void) | null;
  setOnEmailDropOnCourse: (fn: ((emailId: string, courseId: string) => void) | null) => void;
  onEmailDropOnTag: ((emailId: string, tag: string) => void) | null;
  setOnEmailDropOnTag: (fn: ((emailId: string, tag: string) => void) | null) => void;
  onEmailDropOnFolder: ((emailId: string, folder: MailFolder) => void) | null;
  setOnEmailDropOnFolder: (fn: ((emailId: string, folder: MailFolder) => void) | null) => void;
  registerCompose: (fn: (() => void) | null) => void;
  registerBulkCompose: (fn: (() => void) | null) => void;
  registerOpenAssistant: (fn: (() => void) | null) => void;
  compose: () => void;
  bulkCompose: () => void;
  openAssistant: () => void;
  assistantOpen: boolean;
  setAssistantOpen: Dispatch<SetStateAction<boolean>>;
  bulkDraftingProgress: { total: number; completed: number } | null;
  setBulkDraftingProgress: Dispatch<SetStateAction<{ total: number; completed: number } | null>>;
};

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

const FOLDER_ROUTE: Record<MailFolder, string> = {
  inbox: ROUTES.INBOX,
  sentitems: ROUTES.SENT,
  drafts: ROUTES.DRAFTS,
  junkemail: ROUTES.JUNK,
  deleteditems: ROUTES.DELETED,
  archive: ROUTES.ARCHIVE,
};

function viewFromPath(pathname: string): { activeSpecial: MailSpecial | null; folder: MailFolder; isFolderView: boolean } {
  if (pathname.startsWith(ROUTES.HOME)) return { activeSpecial: "home", folder: "inbox", isFolderView: false };
  if (pathname.startsWith(ROUTES.NEEDS_REPLY)) return { activeSpecial: "needs-reply", folder: "inbox", isFolderView: false };
  if (pathname.startsWith(ROUTES.BATCH_READY)) return { activeSpecial: "batch-ready", folder: "inbox", isFolderView: false };
  if (pathname.startsWith(ROUTES.SENT)) return { activeSpecial: null, folder: "sentitems", isFolderView: true };
  if (pathname.startsWith(ROUTES.DRAFTS)) return { activeSpecial: null, folder: "drafts", isFolderView: true };
  if (pathname.startsWith(ROUTES.JUNK)) return { activeSpecial: null, folder: "junkemail", isFolderView: true };
  if (pathname.startsWith(ROUTES.DELETED)) return { activeSpecial: null, folder: "deleteditems", isFolderView: true };
  if (pathname.startsWith(ROUTES.ARCHIVE)) return { activeSpecial: null, folder: "archive", isFolderView: true };
  if (pathname.startsWith(ROUTES.INBOX)) return { activeSpecial: null, folder: "inbox", isFolderView: true };
  return { activeSpecial: null, folder: "inbox", isFolderView: false };
}

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const routeView = viewFromPath(pathname);

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [tags, setTags] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.tags);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  });
  const [sidebarLayout, setSidebarLayout] = useState<SidebarLayout>(() => loadSidebarLayout());
  const [sidebarCourseId, setSidebarCourseId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [starredOnly, setStarredOnly] = useState(false);
  const [mailCounts, setMailCounts] = useState<MailCounts>({ needsReply: 0, batchReady: 0, inbox: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [narrow, setNarrow] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [onEmailDropOnCourse, setOnEmailDropOnCourse] = useState<((emailId: string, courseId: string) => void) | null>(null);
  const [onEmailDropOnTag, setOnEmailDropOnTag] = useState<((emailId: string, tag: string) => void) | null>(null);
  const [onEmailDropOnFolder, setOnEmailDropOnFolder] = useState<((emailId: string, folder: MailFolder) => void) | null>(null);
  const composeRef = useRef<(() => void) | null>(null);
  const bulkComposeRef = useRef<(() => void) | null>(null);
  const assistantRef = useRef<(() => void) | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [bulkDraftingProgress, setBulkDraftingProgress] = useState<{
    total: number;
    completed: number;
  } | null>(null);

  const registerCompose = useCallback((fn: (() => void) | null) => {
    composeRef.current = fn;
  }, []);
  const registerBulkCompose = useCallback((fn: (() => void) | null) => {
    bulkComposeRef.current = fn;
  }, []);
  const registerOpenAssistant = useCallback((fn: (() => void) | null) => {
    assistantRef.current = fn;
  }, []);
  const compose = useCallback(() => composeRef.current?.(), []);
  const bulkCompose = useCallback(() => bulkComposeRef.current?.(), []);
  const openAssistant = useCallback(() => assistantRef.current?.(), []);

  const refreshCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      setCourses(await listCourses());
    } catch {
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCourses();
  }, [refreshCourses]);

  useEffect(() => {
    const onResize = () => {
      setSidebarOpen(window.innerWidth >= 900);
      setNarrow(window.innerWidth < 700);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const updateSidebarLayout = useCallback((layout: SidebarLayout) => {
    setSidebarLayout(layout);
    saveSidebarLayout(layout);
  }, []);

  const addTag = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 32);
    if (!trimmed) return;
    setTags((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteTag = useCallback((tag: string) => {
    setTags((prev) => {
      const next = prev.filter((t) => t !== tag);
      localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(next));
      return next;
    });
    setSelectedTag((cur) => (cur === tag ? null : cur));
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    navigate(ROUTES.LANDING, { replace: true });
  }, [navigate]);

  const onFolderChange = useCallback(
    (folder: MailFolder) => {
      navigate(FOLDER_ROUTE[folder]);
    },
    [navigate],
  );

  const value = useMemo<WorkbenchContextValue>(
    () => ({
      courses,
      coursesLoading,
      refreshCourses,
      tags,
      addTag,
      deleteTag,
      sidebarLayout,
      updateSidebarLayout,
      sidebarCourseId,
      setSidebarCourseId,
      selectedTag,
      setSelectedTag,
      starredOnly,
      setStarredOnly,
      mailCounts,
      setMailCounts,
      sidebarOpen,
      setSidebarOpen,
      narrow,
      activeSpecial: isMailRoute(pathname) ? routeView.activeSpecial : null,
      folder: routeView.folder,
      isFolderView: isMailRoute(pathname) ? routeView.isFolderView : false,
      signOut,
      onFolderChange,
      statusMessage,
      setStatusMessage,
      onEmailDropOnCourse,
      setOnEmailDropOnCourse,
      onEmailDropOnTag,
      setOnEmailDropOnTag,
      onEmailDropOnFolder,
      setOnEmailDropOnFolder,
      registerCompose,
      registerBulkCompose,
      registerOpenAssistant,
      compose,
      bulkCompose,
      openAssistant,
      assistantOpen,
      setAssistantOpen,
      bulkDraftingProgress,
      setBulkDraftingProgress,
    }),
    [
      courses,
      coursesLoading,
      refreshCourses,
      tags,
      addTag,
      deleteTag,
      sidebarLayout,
      updateSidebarLayout,
      sidebarCourseId,
      selectedTag,
      starredOnly,
      mailCounts,
      sidebarOpen,
      narrow,
      pathname,
      routeView,
      signOut,
      onFolderChange,
      statusMessage,
      onEmailDropOnCourse,
      onEmailDropOnTag,
      onEmailDropOnFolder,
      registerCompose,
      registerBulkCompose,
      registerOpenAssistant,
      compose,
      bulkCompose,
      openAssistant,
      assistantOpen,
      bulkDraftingProgress,
    ],
  );

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
}

export function useWorkbench(): WorkbenchContextValue {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) throw new Error("useWorkbench must be used within WorkbenchProvider");
  return ctx;
}

export { GENERAL_COURSE_ID };
