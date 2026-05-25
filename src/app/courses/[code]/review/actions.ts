"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { courses, professors, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/auth";
import { RATING_MAX, RATING_MIN } from "@/lib/ratings";
import { parseTermValue } from "@/lib/terms";

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
      });
    });
  } catch (err) {
    console.error("submitReview failed:", err);
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
