import type { MailFolder } from "../types";

export type SmartMailboxId = "home" | "needs-reply" | "batch-ready";

export type SidebarSectionId = "smart" | "favorites" | "courses" | "labels";

export type SidebarLayout = {
  sectionOrder: SidebarSectionId[];
  smartOrder: SmartMailboxId[];
  favoritesOrder: (MailFolder | "flagged")[];
};

const STORAGE_KEY = "incuria-sidebar-layout";

const DEFAULT_LAYOUT: SidebarLayout = {
  sectionOrder: ["smart", "favorites", "courses", "labels"],
  smartOrder: ["home", "needs-reply", "batch-ready"],
  favoritesOrder: ["inbox", "drafts", "sentitems", "archive", "junkemail", "deleteditems", "flagged"],
};

export function defaultSidebarLayout(): SidebarLayout {
  return {
    sectionOrder: [...DEFAULT_LAYOUT.sectionOrder],
    smartOrder: [...DEFAULT_LAYOUT.smartOrder],
    favoritesOrder: [...DEFAULT_LAYOUT.favoritesOrder],
  };
}

export function loadSidebarLayout(): SidebarLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSidebarLayout();
    const parsed = JSON.parse(raw) as Partial<SidebarLayout>;
    const base = defaultSidebarLayout();
    return {
      sectionOrder: sanitizeOrder(parsed.sectionOrder, base.sectionOrder),
      smartOrder: sanitizeOrder(parsed.smartOrder, base.smartOrder),
      favoritesOrder: sanitizeOrder(parsed.favoritesOrder, base.favoritesOrder),
    };
  } catch {
    return defaultSidebarLayout();
  }
}

export function saveSidebarLayout(layout: SidebarLayout): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

function sanitizeOrder<T extends string>(value: T[] | undefined, fallback: T[]): T[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const seen = new Set<T>();
  const next: T[] = [];
  for (const id of value) {
    if (fallback.includes(id) && !seen.has(id)) {
      seen.add(id);
      next.push(id);
    }
  }
  for (const id of fallback) {
    if (!seen.has(id)) next.push(id);
  }
  return next;
}

export function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
