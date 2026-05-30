"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { courses, reviewFiles, reviews } from "@/db/schema";
import { requireCompleteProfile } from "@/lib/auth";
import {
  extractReviewFormValues,
  parseReviewFormData,
  reviewFieldsFromForm,
} from "@/lib/review-form-schema";
import { getReviewStoragePaths, requireOwnReview, resolveProfessorId } from "@/lib/review-db";
import {
  FILES_BUCKET,
  MAX_FILE_COUNT,
  removeStorageObjects,
  resolveSyllabusUrls,
  uploadReviewFiles,
  uploadSyllabusPdf,
  type StoredObject,
} from "@/lib/review-storage";
import { createClient } from "@/lib/supabase/server";
import { SYLLABUS_BUCKET } from "@/lib/syllabus";

function reviewSaveErrorMessage(err: unknown): string {
  const parts: string[] = [];
  if (err instanceof Error) parts.push(err.message);
  const cause =
    err && typeof err === "object" && "cause" in err
      ? (err as { cause?: unknown }).cause
      : undefined;
  if (cause instanceof Error) parts.push(cause.message);
  const text = parts.join(" ");
  if (text.includes("column") || text.includes("does not exist")) {
    return "Database schema is out of date. Run: npm run db:migrate";
  }
  if (text.includes("row-level security")) {
    return "Could not save your review. Permission denied.";
  }
  return "Could not save your review. Please try again.";
}

export type ReviewActionState = {
  error: string | null;
  values: ReturnType<typeof extractReviewFormValues> | null;
  resetKey: number;
};

function reviewError(msg: string, formData: FormData): ReviewActionState {
  return {
    error: msg,
    values: extractReviewFormValues(formData),
    resetKey: Date.now(),
  };
}

function revalidateReviewPaths(courseCode: string, username: string) {
  revalidatePath("/");
  revalidatePath(`/courses/${encodeURIComponent(courseCode)}`);
  revalidatePath(`/courses/${encodeURIComponent(courseCode)}/review`);
  revalidatePath(`/u/${username}`);
}

async function loadCourse(courseCode: string) {
  const [course] = await db
    .select({ id: courses.id, code: courses.code })
    .from(courses)
    .where(eq(courses.code, courseCode.toUpperCase()))
    .limit(1);
  return course ?? null;
}

function getIncomingFiles(formData: FormData) {
  return formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
}

function getFileDescriptions(formData: FormData) {
  return formData.getAll("fileDescriptions").map(String);
}

function getRemoveFileIds(formData: FormData) {
  return formData
    .getAll("removeFileIds")
    .map((v) => String(v))
    .filter(Boolean);
}

export async function submitReview(
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const courseCode = String(formData.get("courseCode") ?? "");
  const profile = await requireCompleteProfile(
    courseCode ? `/courses/${encodeURIComponent(courseCode)}/review` : undefined,
  );

  const { error, data } = parseReviewFormData(formData);
  if (error || !data) return reviewError(error ?? "Invalid input", formData);

  const course = await loadCourse(data.courseCode);
  if (!course) redirect("/courses");

  const professorName = data.professor.trim();
  const reviewId = crypto.randomUUID();
  const supabase = await createClient();
  const uploaded: StoredObject[] = [];

  const syllabusResult = await processNewSyllabus(supabase, formData, course.id, uploaded);
  if ("error" in syllabusResult) {
    await removeStorageObjects(supabase, uploaded);
    return reviewError(syllabusResult.error, formData);
  }

  const { syllabusPath, syllabusUrl } = resolveSyllabusUrls(
    supabase,
    syllabusResult.syllabusPath,
    data.syllabusLink,
  );

  const incomingFiles = getIncomingFiles(formData);
  if (incomingFiles.length > MAX_FILE_COUNT) {
    await removeStorageObjects(supabase, uploaded);
    return reviewError(`You can attach at most ${MAX_FILE_COUNT} files.`, formData);
  }

  const fileDescriptions = getFileDescriptions(formData);
  if (incomingFiles.some((_, i) => !fileDescriptions[i]?.trim())) {
    await removeStorageObjects(supabase, uploaded);
    return reviewError("Please give every additional file a name.", formData);
  }

  const filesResult = await uploadReviewFiles(supabase, reviewId, incomingFiles, fileDescriptions);
  if ("error" in filesResult) {
    await removeStorageObjects(supabase, uploaded);
    return reviewError(filesResult.error, formData);
  }
  uploaded.push(...filesResult.uploaded);

  let reviewInserted = false;
  try {
    const professorId = await resolveProfessorId(professorName);
    await db.insert(reviews).values({
      id: reviewId,
      userId: profile.id,
      courseId: course.id,
      professorId,
      ...reviewFieldsFromForm(data),
      syllabusPath,
      syllabusUrl,
    });
    reviewInserted = true;

    if (filesResult.rows.length > 0) {
      await db.insert(reviewFiles).values(filesResult.rows.map((r) => ({ reviewId, ...r })));
    }
  } catch (err) {
    console.error("submitReview failed:", err);
    await removeStorageObjects(supabase, uploaded);
    if (reviewInserted) {
      await db.delete(reviews).where(eq(reviews.id, reviewId));
    }
    return reviewError(reviewSaveErrorMessage(err), formData);
  }

  revalidateReviewPaths(data.courseCode, profile.username);
  redirect(`/courses/${encodeURIComponent(data.courseCode)}`);
}

export async function updateReview(
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const reviewId = String(formData.get("reviewId") ?? "");
  const courseCode = String(formData.get("courseCode") ?? "");
  const editPath = courseCode
    ? `/courses/${encodeURIComponent(courseCode)}/review/${reviewId}/edit`
    : undefined;
  const profile = await requireCompleteProfile(editPath);

  if (!reviewId) return reviewError("Review not found.", formData);

  const ownReview = await requireOwnReview(reviewId, profile.id);

  const { error, data } = parseReviewFormData(formData);
  if (error || !data) return reviewError(error ?? "Invalid input", formData);

  if (data.courseCode.toUpperCase() !== ownReview.courseCode.toUpperCase()) {
    return reviewError("Review does not match this course.", formData);
  }

  const course = await loadCourse(data.courseCode);
  if (!course) redirect("/courses");

  const supabase = await createClient();
  const uploaded: StoredObject[] = [];
  const removeFileIds = getRemoveFileIds(formData);
  const removeSyllabusPdf = formData.get("removeSyllabusPdf") === "1";

  const existingFiles = await db
    .select({ id: reviewFiles.id, storagePath: reviewFiles.storagePath })
    .from(reviewFiles)
    .where(eq(reviewFiles.reviewId, reviewId));

  const keptFileCount = existingFiles.filter((f) => !removeFileIds.includes(f.id)).length;
  const incomingFiles = getIncomingFiles(formData);
  if (keptFileCount + incomingFiles.length > MAX_FILE_COUNT) {
    return reviewError(`You can attach at most ${MAX_FILE_COUNT} files.`, formData);
  }

  const fileDescriptions = getFileDescriptions(formData);
  if (incomingFiles.some((_, i) => !fileDescriptions[i]?.trim())) {
    return reviewError("Please give every additional file a name.", formData);
  }

  let syllabusPath = ownReview.syllabusPath;
  const storageToDelete: StoredObject[] = [];

  if (removeSyllabusPdf && syllabusPath) {
    storageToDelete.push({ bucket: SYLLABUS_BUCKET, path: syllabusPath });
    syllabusPath = null;
  }

  const syllabusResult = await processNewSyllabus(supabase, formData, course.id, uploaded);
  if ("error" in syllabusResult) {
    await removeStorageObjects(supabase, uploaded);
    return reviewError(syllabusResult.error, formData);
  }
  if (syllabusResult.syllabusPath) {
    if (ownReview.syllabusPath && ownReview.syllabusPath !== syllabusResult.syllabusPath) {
      storageToDelete.push({ bucket: SYLLABUS_BUCKET, path: ownReview.syllabusPath });
    }
    syllabusPath = syllabusResult.syllabusPath;
  }

  const { syllabusUrl } = resolveSyllabusUrls(supabase, syllabusPath, data.syllabusLink);

  const filesResult = await uploadReviewFiles(supabase, reviewId, incomingFiles, fileDescriptions);
  if ("error" in filesResult) {
    await removeStorageObjects(supabase, uploaded);
    return reviewError(filesResult.error, formData);
  }
  uploaded.push(...filesResult.uploaded);

  const filesToDelete = existingFiles.filter((f) => removeFileIds.includes(f.id));

  try {
    const professorId = await resolveProfessorId(data.professor.trim());

    await db
      .update(reviews)
      .set({
        professorId,
        ...reviewFieldsFromForm(data),
        syllabusPath,
        syllabusUrl,
      })
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, profile.id)));

    if (filesToDelete.length > 0) {
      await db.delete(reviewFiles).where(
        inArray(
          reviewFiles.id,
          filesToDelete.map((f) => f.id),
        ),
      );
      for (const f of filesToDelete) {
        storageToDelete.push({ bucket: FILES_BUCKET, path: f.storagePath });
      }
    }

    if (filesResult.rows.length > 0) {
      await db.insert(reviewFiles).values(filesResult.rows.map((r) => ({ reviewId, ...r })));
    }

    await removeStorageObjects(supabase, storageToDelete);
  } catch (err) {
    console.error("updateReview failed:", err);
    await removeStorageObjects(supabase, uploaded);
    return reviewError(reviewSaveErrorMessage(err), formData);
  }

  revalidateReviewPaths(data.courseCode, profile.username);
  redirect(`/courses/${encodeURIComponent(data.courseCode)}`);
}

export async function deleteReview(formData: FormData) {
  const reviewId = String(formData.get("reviewId") ?? "");
  const courseCode = String(formData.get("courseCode") ?? "");
  const profile = await requireCompleteProfile();

  if (!reviewId) redirect("/courses");

  const ownReview = await requireOwnReview(reviewId, profile.id);
  const redirectCode = courseCode || ownReview.courseCode;

  const supabase = await createClient();
  const storageObjects = await getReviewStoragePaths(reviewId, ownReview.syllabusPath);

  await db.delete(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.userId, profile.id)));
  await removeStorageObjects(supabase, storageObjects);

  revalidateReviewPaths(redirectCode, profile.username);
  redirect(`/courses/${encodeURIComponent(redirectCode)}`);
}

async function processNewSyllabus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
  courseId: string,
  uploaded: StoredObject[],
): Promise<{ syllabusPath: string | null } | { error: string }> {
  const syllabus = formData.get("syllabus");
  const hasSyllabusFile = syllabus instanceof File && syllabus.size > 0;
  if (!hasSyllabusFile) {
    return { syllabusPath: null };
  }

  const result = await uploadSyllabusPdf(supabase, courseId, syllabus);
  if ("error" in result) {
    return { error: result.error };
  }
  uploaded.push(result.uploaded);
  return { syllabusPath: result.path };
}
