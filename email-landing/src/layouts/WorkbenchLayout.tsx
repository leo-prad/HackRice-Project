import { Outlet, useLocation } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";
import { PanelLeft } from "lucide-react";
import { MailSidebar } from "../components/mail/MailSidebar";
import { WorkbenchTransition } from "../components/motion/WorkbenchTransition";
import { AnimatedToast } from "../components/motion/AnimatedToast";
import { OnboardingGate } from "../components/OnboardingGate";
import { WorkbenchProvider, useWorkbench } from "../contexts/WorkbenchContext";
import { isMailRoute } from "../lib/routes";
import { motionPresets } from "../theme/motion";
function WorkbenchChrome() {
  const location = useLocation();
  const wb = useWorkbench();
  const mail = isMailRoute(location.pathname);
  const gridCols = wb.narrow
    ? "0px minmax(0, 1fr)"
    : `${wb.sidebarOpen ? "220px" : "0px"} minmax(0, 1fr)`;

  return (
    <div className="mail-app relative h-screen overflow-hidden bg-incuria-canvas font-landing-body text-incuria-ink">
      <motion.div
        className="grid h-full"
        animate={{ gridTemplateColumns: gridCols }}
        transition={motionPresets.panelSpring}
      >
        <motion.div
          className={`min-w-0 overflow-hidden ${mail && wb.narrow ? "hidden" : ""}`}
          initial={false}
          animate={{ opacity: wb.sidebarOpen || wb.narrow ? 1 : 0.98 }}
          transition={{ duration: 0.25 }}
        >
          <MailSidebar
            activeSpecial={wb.activeSpecial}
            folder={wb.folder}
            isFolderView={wb.isFolderView}
            needsReplyCount={wb.mailCounts.needsReply}
            batchReadyCount={wb.mailCounts.batchReady}
            inboxCount={wb.mailCounts.inbox}
            draftsCount={wb.mailCounts.drafts}
            starredOnly={wb.starredOnly}
            onToggleStarred={() => wb.setStarredOnly(!wb.starredOnly)}
            courses={wb.courses}
            coursesLoading={wb.coursesLoading}
            selectedCourseId={wb.sidebarCourseId}
            onCourseSelect={wb.setSidebarCourseId}
            selectedTag={wb.selectedTag}
            onTagSelect={wb.setSelectedTag}
            onFolderChange={wb.onFolderChange}
            onCompose={wb.compose}
            onBulkCompose={mail ? wb.bulkCompose : undefined}
            bulkDraftingProgress={mail ? wb.bulkDraftingProgress : undefined}
            onOpenAssistant={mail ? wb.openAssistant : undefined}
            assistantOpen={mail ? wb.assistantOpen : false}
            tags={wb.tags}
            onAddTag={() => {
              const name = window.prompt("New tag name");
              if (name) wb.addTag(name);
            }}
            onDeleteTag={wb.deleteTag}
            onSignOut={wb.signOut}
            onToggleSidebar={() => wb.setSidebarOpen(!wb.sidebarOpen)}
            layout={wb.sidebarLayout}
            onLayoutChange={wb.updateSidebarLayout}
            onEmailDropOnCourse={wb.onEmailDropOnCourse ?? undefined}
            onEmailDropOnTag={wb.onEmailDropOnTag ?? undefined}
            onEmailDropOnFolder={wb.onEmailDropOnFolder ?? undefined}
            auxiliaryMode={!mail}
          />
        </motion.div>

        <main className="relative min-w-0 overflow-hidden">
          <WorkbenchTransition>
            <Outlet />
          </WorkbenchTransition>
        </main>
      </motion.div>

      {mail && !wb.sidebarOpen && !wb.narrow ? (
        <button
          type="button"
          onClick={() => wb.setSidebarOpen(true)}
          title="Show sidebar"
          className="fixed left-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-md border border-incuria-border bg-incuria-surface text-incuria-ink-muted shadow-sm transition-colors hover:bg-incuria-select"
        >
          <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
      ) : null}

      <AnimatedToast message={wb.statusMessage} />
    </div>
  );
}

export default function WorkbenchLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <OnboardingGate>
        <WorkbenchProvider>
          <WorkbenchChrome />
        </WorkbenchProvider>
      </OnboardingGate>
    </MotionConfig>
  );
}
