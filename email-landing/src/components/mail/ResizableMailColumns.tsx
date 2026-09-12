import type { ReactNode } from "react";
import { ResizeHandle } from "./ResizeHandle";
import { usePanelResize } from "./usePanelResize";

const SIDEBAR_CONFIG = {
  storageKey: "mail-sidebar-width",
  defaultWidth: 200,
  min: 160,
  max: 380,
};

const LIST_CONFIG = {
  storageKey: "mail-list-width",
  defaultWidth: 320,
  min: 240,
  max: 620,
};

type Props = {
  sidebar: ReactNode;
  list: ReactNode;
  detail: ReactNode;
};

export function ResizableMailColumns({ sidebar, list, detail }: Props) {
  const sidebarResize = usePanelResize(SIDEBAR_CONFIG);
  const listResize = usePanelResize(LIST_CONFIG);

  const resizing = sidebarResize.isResizing || listResize.isResizing;

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 ${resizing ? "select-none" : ""}`}
      data-resizing={resizing ? "true" : undefined}
    >
      <div
        className="h-full min-h-0 shrink-0 overflow-hidden"
        style={{ width: sidebarResize.width }}
      >
        {sidebar}
      </div>

      <ResizeHandle
        ariaLabel="Resize sidebar"
        onPointerDown={sidebarResize.onResizeStart}
        onDoubleClick={sidebarResize.resetWidth}
      />

      <div
        className="h-full min-h-0 shrink-0 overflow-hidden"
        style={{ width: listResize.width }}
      >
        {list}
      </div>

      <ResizeHandle
        ariaLabel="Resize message list"
        onPointerDown={listResize.onResizeStart}
        onDoubleClick={listResize.resetWidth}
      />

      <div className="flex h-full min-h-0 min-w-[280px] flex-1 flex-col overflow-hidden">
        {detail}
      </div>
    </div>
  );
}
