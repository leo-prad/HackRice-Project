import { useCallback, useState } from "react";
import {
  deleteCourseDocument,
  getCourse,
  trainCourse,
  uploadCourseDocument,
} from "../lib/api";
import type { Course, CourseDocument } from "../types";

export type SourceStep = "idle" | "uploading" | "training" | "error";

export function useCourseSources(courseId: string | null) {
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<SourceStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!courseId) {
      setDocuments([]);
      setCourse(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const { course: fresh, documents: docs } = await getCourse(courseId);
      setCourse(fresh);
      setDocuments(docs);
      return fresh;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load course");
      return null;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const uploadFile = useCallback(
    async (file: File, kind: "syllabus" | "lecture" | "note" = "syllabus") => {
      if (!courseId) return;
      setStep("uploading");
      setError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", kind);
        await uploadCourseDocument(courseId, fd);
        await refresh();
        setStep("idle");
      } catch (e) {
        setStep("error");
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    },
    [courseId, refresh],
  );

  const uploadText = useCallback(
    async (text: string, filename = "note.txt") => {
      if (!courseId || !text.trim()) return;
      setStep("uploading");
      setError(null);
      try {
        const fd = new FormData();
        fd.append("text", text.trim());
        fd.append("filename", filename);
        fd.append("kind", "note");
        await uploadCourseDocument(courseId, fd);
        await refresh();
        setStep("idle");
      } catch (e) {
        setStep("error");
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    },
    [courseId, refresh],
  );

  const removeDocument = useCallback(
    async (docId: string) => {
      if (!courseId) return;
      setError(null);
      try {
        await deleteCourseDocument(courseId, docId);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    },
    [courseId, refresh],
  );

  const train = useCallback(async () => {
    if (!courseId) return null;
    setStep("training");
    setError(null);
    try {
      const result = await trainCourse(courseId);
      const fresh = await refresh();
      setStep("idle");
      return { result, course: fresh };
    } catch (e) {
      setStep("error");
      setError(e instanceof Error ? e.message : "Training failed");
      return null;
    }
  }, [courseId, refresh]);

  const stepLabel =
    step === "uploading"
      ? "Uploading sources…"
      : step === "training"
        ? "Training your assistant…"
        : null;

  return {
    course,
    documents,
    loading,
    step,
    stepLabel,
    error,
    refresh,
    uploadFile,
    uploadText,
    removeDocument,
    train,
    busy: step === "uploading" || step === "training",
  };
}
