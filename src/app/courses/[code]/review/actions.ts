"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { courses, professors, reviewFiles, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RATING_MAX, RATING_MIN } from "@/lib/ratings";
import { parseTermValue } from "@/lib/terms";

const SYLLABUS_BUCKET = "syllabi";
const FILES_BUCKET = "review-files";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB per file
const MAX_FILE_COUNT = 5;

// Allowed attachment types → file extension used for the stored object.
const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const ReviewSchema = z.object({
  courseCode: z.string().min(1),
  professor: z.string().trim().min(1, "Pick or add a professor").max(120),
  termYear: z
    .string()
    .min(1)
    .refine((v) => parseTermValue(v) !== null, "Pick a valid term"),
  grade: z.enum(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "Credit"]),
  overallRating: z.coerce.number().int().min(RATING_MIN).max(RATING_MAX),
  difficulty: z.coerce.number().int().min(RATING_MIN).max(RATING_MAX),
  enjoyability: z.coerce.number().int().min(RATING_MIN).max(RATING_MAX),
  usefulness: z.coerce.number().int().min(RATING_MIN).max(RATING_MAX),
  medium: z.enum(["in_person", "hybrid", "online"]),
  assessmentType: z.enum(["exam", "project", "both"]),
  workloadHours: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).max(80).optional(),
  ),
  wouldRecommend: z.enum(["yes", "no", "maybe"]).optional(),
  groupwork: z.enum(["yes", "no"]),
  body: z.string().trim().min(20).max(5000),
});

export async function submitReview(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const parsed = ReviewSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstError =
      Object.values(flat.fieldErrors).flat()[0] ?? flat.formErrors[0] ?? "Invalid input";
    const code = String(formData.get("courseCode") ?? "");
    redirect(
      `/courses/${encodeURIComponent(code)}/review?error=${encodeURIComponent(firstError)}`,
    );
  }

  const data = parsed.data;
  const termYear = parseTermValue(data.termYear)!;

  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.code, data.courseCode.toUpperCase()))
    .limit(1);
  if (!course) redirect("/courses");

  const professorName = data.professor.trim();
  const reviewId = crypto.randomUUID();

  const reviewError = (msg: string) =>
    redirect(
      `/courses/${encodeURIComponent(data.courseCode)}/review?error=${encodeURIComponent(msg)}`,
    );

  const supabase = await createClient();
  // Track every uploaded object so we can roll back Storage if the DB write fails.
  const uploaded: { bucket: string; path: string }[] = [];

  // Optional syllabus PDF.
  let syllabusPath: string | null = null;
  let syllabusUrl: string | null = null;
  const syllabus = formData.get("syllabus");
  if (syllabus instanceof File && syllabus.size > 0) {
    if (syllabus.type !== "application/pdf") {
      reviewError("Syllabus must be a PDF.");
    }
    if (syllabus.size > MAX_FILE_BYTES) {
      reviewError("Syllabus must be 5MB or smaller.");
    }
    const path = `${course.id}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(SYLLABUS_BUCKET)
      .upload(path, syllabus, { contentType: "application/pdf", upsert: false });
    if (uploadError) {
      console.error("syllabus upload failed:", uploadError);
      reviewError("Could not upload the syllabus. Please try again.");
    }
    uploaded.push({ bucket: SYLLABUS_BUCKET, path });
    syllabusPath = path;
    syllabusUrl = supabase.storage.from(SYLLABUS_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  // Optional additional files (notes, past exams, etc.).
  const cleanup = async () => {
    for (const { bucket, path } of uploaded) {
      await supabase.storage.from(bucket).remove([path]);
    }
  };
  const incomingFiles = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (incomingFiles.length > MAX_FILE_COUNT) {
    reviewError(`You can attach at most ${MAX_FILE_COUNT} files.`);
  }
  const fileRows: { storagePath: string; url: string; originalName: string; contentType: string; sizeBytes: number }[] = [];
  for (const f of incomingFiles) {
    const ext = EXT_BY_TYPE[f.type];
    if (!ext) {
      await cleanup();
      reviewError(`"${f.name}" is an unsupported file type.`);
    }
    if (f.size > MAX_FILE_BYTES) {
      await cleanup();
      reviewError(`"${f.name}" is larger than 5MB.`);
    }
    const path = `${reviewId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(path, f, { contentType: f.type, upsert: false });
    if (uploadError) {
      console.error("review file upload failed:", uploadError);
      await cleanup();
      reviewError("Could not upload one of your files. Please try again.");
    }
    uploaded.push({ bucket: FILES_BUCKET, path });
    fileRows.push({
      storagePath: path,
      url: supabase.storage.from(FILES_BUCKET).getPublicUrl(path).data.publicUrl,
      originalName: f.name,
      contentType: f.type,
      sizeBytes: f.size,
    });
  }

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: professors.id })
        .from(professors)
        .where(eq(professors.name, professorName))
        .limit(1);

      let professorId = existing?.id ?? null;
      if (!professorId) {
        const [created] = await tx
          .insert(professors)
          .values({ name: professorName })
          .returning({ id: professors.id });
        professorId = created.id;
      }

      await tx.insert(reviews).values({
        id: reviewId,
        userId: profile.id,
        courseId: course.id,
        professorId,
        term: termYear.term,
        year: termYear.year,
        grade: data.grade,
        overallRating: data.overallRating,
        difficulty: data.difficulty,
        enjoyability: data.enjoyability,
        usefulness: data.usefulness,
        medium: data.medium,
        assessmentType: data.assessmentType,
        workloadHours: data.workloadHours ?? null,
        wouldRecommend: data.wouldRecommend ?? null,
        groupwork: data.groupwork === "yes",
        body: data.body,
        syllabusPath,
        syllabusUrl,
      });

      if (fileRows.length > 0) {
        await tx.insert(reviewFiles).values(fileRows.map((r) => ({ reviewId, ...r })));
      }
    });
  } catch (err) {
    console.error("submitReview failed:", err);
    // Don't leave uploaded objects orphaned if the review insert failed.
    await cleanup();
    const message =
      err instanceof Error && err.message.includes("column")
        ? "Database schema is out of date. Run: npm run db:migrate"
        : "Could not save your review. Please try again.";
    redirect(
      `/courses/${encodeURIComponent(data.courseCode)}/review?error=${encodeURIComponent(message)}`,
    );
  }

  revalidatePath(`/courses/${encodeURIComponent(data.courseCode)}`);
  revalidatePath(`/u/${profile.username}`);
  redirect(`/courses/${encodeURIComponent(data.courseCode)}`);
}
