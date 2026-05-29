import { notFound } from "next/navigation";
import { db } from "@/db";
import { courses, professors, reviewFiles, reviews } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

// Professor names are unique case-insensitively (see professors_name_lower_idx),
// so match and de-dupe on lower(name) rather than the raw string.
export async function resolveProfessorId(professorName: string): Promise<string | null> {
  const byLowerName = sql`lower(${professors.name}) = lower(${professorName})`;

  const [existingProf] = await db
    .select({ id: professors.id })
    .from(professors)
    .where(byLowerName)
    .limit(1);

  if (existingProf) return existingProf.id;

  await db.insert(professors).values({ name: professorName }).onConflictDoNothing();

  const [prof] = await db
    .select({ id: professors.id })
    .from(professors)
    .where(byLowerName)
    .limit(1);

  return prof?.id ?? null;
}

export async function requireOwnReview(reviewId: string, userId: string) {
  const [review] = await db
    .select({
      id: reviews.id,
      userId: reviews.userId,
      courseId: reviews.courseId,
      syllabusPath: reviews.syllabusPath,
      courseCode: courses.code,
    })
    .from(reviews)
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
    .limit(1);

  if (!review) notFound();
  return review;
}

export async function getReviewStoragePaths(reviewId: string, syllabusPath: string | null) {
  const fileRows = await db
    .select({ storagePath: reviewFiles.storagePath })
    .from(reviewFiles)
    .where(eq(reviewFiles.reviewId, reviewId));

  const objects: { bucket: string; path: string }[] = fileRows.map((f) => ({
    bucket: "review-files",
    path: f.storagePath,
  }));

  if (syllabusPath) {
    objects.push({ bucket: "syllabi", path: syllabusPath });
  }

  return objects;
}
