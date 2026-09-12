import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { IncuriaMark } from "../components/brand/IncuriaLogo";
import { OnboardingProgress } from "../components/onboarding/OnboardingProgress";
import { OnboardingStepGoals } from "../components/onboarding/OnboardingStepGoals";
import {
  OnboardingStepSources,
  type PendingFile,
  type PendingText,
} from "../components/onboarding/OnboardingStepSources";
import { OnboardingStepReveal } from "../components/onboarding/OnboardingStepReveal";
import { createCourse, trainCourse, uploadCourseDocument, completeOnboardingOnServer } from "../lib/api";
import { markOnboardingCompleteInProfile } from "../lib/auth";
import { ROUTES, getTeachingRules, setTeachingRules } from "../lib/routes";
import { motionPresets } from "../theme/motion";

type WizardStep = 1 | 2 | 3;
type RevealPhase = "training" | "reveal" | "done";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<WizardStep>(1);
  const [teachingRules, setTeachingRulesState] = useState(() => getTeachingRules());
  const [courseName, setCourseName] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [pastedTexts, setPastedTexts] = useState<PendingText[]>([]);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("training");
  const [sourceLabel, setSourceLabel] = useState("Syllabus · your materials");
  const [trainError, setTrainError] = useState<string | null>(null);

  const stepMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : motionPresets.onboardingStep;

  const skipOnboarding = useCallback(async () => {
    try {
      await completeOnboardingOnServer();
      markOnboardingCompleteInProfile();
    } catch {
      markOnboardingCompleteInProfile();
    }
    navigate(ROUTES.HOME, { replace: true });
  }, [navigate]);

  function confirmSkip() {
    if (
      window.confirm(
        "Skip setup for now? You can add course materials later in Settings or Courses.",
      )
    ) {
      void skipOnboarding();
    }
  }

  function onGoalsContinue() {
    setTeachingRules(teachingRules);
    setStep(2);
  }

  async function onSourcesContinue() {
    setStep(3);
    setRevealPhase("training");
    setTrainError(null);
    setSourceLabel(
      files[0]?.file.name
        ? `${files[0].file.name} · your materials`
        : pastedTexts[0]
          ? "Pasted note · your materials"
          : "Syllabus · your materials",
    );

    try {
      const course = await createCourse(courseName.trim(), teachingRules.trim());

      for (const { file } of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", "syllabus");
        await uploadCourseDocument(course.id, fd);
      }

      for (const { text } of pastedTexts) {
        const fd = new FormData();
        fd.append("text", text);
        fd.append("filename", "pasted-note.txt");
        fd.append("kind", "note");
        await uploadCourseDocument(course.id, fd);
      }

      await trainCourse(course.id);
      setRevealPhase("reveal");
      window.setTimeout(() => setRevealPhase("done"), 1200);
    } catch (e) {
      setTrainError(e instanceof Error ? e.message : "Training failed");
      setRevealPhase("reveal");
    }
  }

  async function enterInbox() {
    try {
      await completeOnboardingOnServer();
    } catch {
      /* profile flag still updated locally */
    }
    markOnboardingCompleteInProfile();
    navigate(ROUTES.HOME, { replace: true, state: { showCoachMark: true } });
  }

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-incuria-canvas font-landing-body text-incuria-ink">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <IncuriaMark size={28} />
            <span className="text-sm font-medium text-incuria-ink-muted">Setup</span>
          </div>
          <button
            type="button"
            onClick={confirmSkip}
            className="rounded-full p-2 text-incuria-ink-muted transition-colors hover:bg-incuria-ink/[0.06] hover:text-incuria-ink"
            aria-label="Skip setup"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-8">
          <OnboardingProgress step={step} />
        </div>

        <div className="mt-10 flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="flex flex-1 flex-col"
              initial={stepMotion.initial}
              animate={stepMotion.animate}
              exit={stepMotion.exit}
              transition={stepMotion.transition}
            >
              {step === 1 ? (
                <OnboardingStepGoals
                  teachingRules={teachingRules}
                  onTeachingRulesChange={setTeachingRulesState}
                  onContinue={onGoalsContinue}
                />
              ) : step === 2 ? (
                <OnboardingStepSources
                  courseName={courseName}
                  onCourseNameChange={setCourseName}
                  files={files}
                  pastedTexts={pastedTexts}
                  onFilesChange={setFiles}
                  onPastedTextsChange={setPastedTexts}
                  onBack={() => setStep(1)}
                  onContinue={() => void onSourcesContinue()}
                />
              ) : (
                <>
                  {trainError ? (
                    <p className="mb-4 text-center text-sm text-incuria-needs-reply">{trainError}</p>
                  ) : null}
                  <OnboardingStepReveal
                    courseName={courseName}
                    sourceLabel={sourceLabel}
                    teachingRules={teachingRules}
                    phase={revealPhase}
                    onEnterInbox={() => void enterInbox()}
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
