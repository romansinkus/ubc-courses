import { notFound } from "next/navigation";
import { LiveBackground } from "@/components/live-background";
import { db } from "@/db";
import { courses, professors, reviewFiles, reviews } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireCompleteProfile } from "@/lib/auth";
import { groupworkFromDb } from "@/lib/groupwork";
import type { ReviewFormDefaults } from "@/lib/review-form-schema";
import { syllabusPdfPublicUrl } from "@/lib/syllabus";
import { formatTermValue, generateTermOptions } from "@/lib/terms";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";
import { ReviewBackButton } from "@/app/courses/[code]/review/review-back-button";
import { ReviewForm } from "@/app/courses/[code]/review/review-form";

type Params = Promise<{ code: string; reviewId: string }>;

export default async function EditReviewPage({ params }: { params: Params }) {
  const { code, reviewId } = await params;
  const courseCode = decodeURIComponent(code).toUpperCase();

  const profile = await requireCompleteProfile(
    `/courses/${courseCode}/review/${reviewId}/edit`,
  );

  const [course] = await db.select().from(courses).where(eq(courses.code, courseCode)).limit(1);
  if (!course) notFound();

  const [review] = await db
    .select({
      id: reviews.id,
      userId: reviews.userId,
      term: reviews.term,
      year: reviews.year,
      grade: reviews.grade,
      overallRating: reviews.overallRating,
      difficulty: reviews.difficulty,
      enjoyability: reviews.enjoyability,
      usefulness: reviews.usefulness,
      medium: reviews.medium,
      hasFinalExam: reviews.hasFinalExam,
      workloadHours: reviews.workloadHours,
      wouldRecommend: reviews.wouldRecommend,
      groupwork: reviews.groupwork,
      body: reviews.body,
      syllabusPath: reviews.syllabusPath,
      syllabusUrl: reviews.syllabusUrl,
      professor: professors.name,
    })
    .from(reviews)
    .leftJoin(professors, eq(professors.id, reviews.professorId))
    .where(and(eq(reviews.id, reviewId), eq(reviews.courseId, course.id)))
    .limit(1);

  if (!review || review.userId !== profile.id) notFound();

  const files = await db
    .select({
      id: reviewFiles.id,
      originalName: reviewFiles.originalName,
    })
    .from(reviewFiles)
    .where(eq(reviewFiles.reviewId, reviewId));

  const pdfUrl = review.syllabusPath ? syllabusPdfPublicUrl(review.syllabusPath) : null;
  const syllabusLink =
    review.syllabusUrl && review.syllabusUrl !== pdfUrl ? review.syllabusUrl : "";

  const defaults: ReviewFormDefaults = {
    termYear: formatTermValue(review.year, review.term),
    professor: review.professor,
    grade: review.grade as ReviewFormDefaults["grade"],
    overallRating: review.overallRating,
    difficulty: review.difficulty,
    enjoyability: review.enjoyability ?? 5,
    usefulness: review.usefulness ?? 5,
    medium: review.medium ?? "hybrid",
    hasFinalExam: review.hasFinalExam ? "yes" : "no",
    groupwork: groupworkFromDb(review.groupwork),
    wouldRecommend: review.wouldRecommend ?? "maybe",
    workloadHours: review.workloadHours,
    body: review.body,
    syllabusLink,
    hasSyllabusPdf: !!review.syllabusPath,
    existingFiles: files,
  };

  const termOptions = generateTermOptions();

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-2xl px-4 py-10 pb-16">
        <ReviewBackButton courseCode={course.code} confirmLeave={false} />

        <div className={cn(glassSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
          <header className="mb-8 border-b border-white/40 pb-6 dark:border-white/15">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Edit review
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {course.code}: {course.title}
            </h1>
          </header>

          <ReviewForm
            mode="edit"
            reviewId={review.id}
            courseCode={course.code}
            termOptions={termOptions}
            defaultTermYear={defaults.termYear}
            defaults={defaults}
          />
        </div>
      </div>
    </>
  );
}
