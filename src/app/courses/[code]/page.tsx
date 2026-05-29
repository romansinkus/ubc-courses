import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LiveBackground } from "@/components/live-background";
import { db } from "@/db";
import { courses, professors, profiles, reviewFiles, reviews } from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import {
  CourseAggregateSummary,
  normalizeCourseStats,
  resolveCourseStats,
} from "@/components/course-aggregate-summary";
import { CourseReviews, type CourseReviewCard } from "@/components/course-reviews";
import { CourseDocuments, type CourseDocument } from "@/components/course-documents";
import { CourseToggleCharts, type ToggleChart } from "@/components/course-toggle-charts";
import { MEDIUM_LABEL } from "@/components/medium-picker";
import { syllabusPdfPublicUrl } from "@/lib/syllabus";
import { formatTermLabel } from "@/lib/terms";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  glassContentCardClass,
  glassFormSectionTitleClass,
  glassSurfaceClass,
} from "@/lib/glass-styles";

type Params = Promise<{ code: string }>;

export default async function CoursePage({ params }: { params: Params }) {
  const { code } = await params;
  const courseCode = decodeURIComponent(code).toUpperCase();
  const currentUser = await getCurrentUser();

  const [course] = await db.select().from(courses).where(eq(courses.code, courseCode)).limit(1);
  if (!course) {
    return (
      <>
        <LiveBackground />
        <div className="relative mx-auto max-w-xl px-4 py-16">
          <div className={cn(glassSurfaceClass, "space-y-4 rounded-2xl p-6 text-center sm:p-8")}>
            <h1 className="text-3xl font-bold tracking-tight">{courseCode}</h1>
            <p className="text-muted-foreground">
              This course isn&apos;t in our catalog. Try searching for a different code or browse
              available courses.
            </p>
            <div className="flex justify-center">
              <Link href="/courses" className={buttonVariants()}>
                Browse courses
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const [statsRow] = await db
    .select({
      count: sql<number>`count(*)::int`,
      avgRating: sql<number>`avg(${reviews.overallRating})::float`,
      avgDifficulty: sql<number>`avg(${reviews.difficulty})::float`,
      avgEnjoyability: sql<number>`avg(${reviews.enjoyability})::float`,
      avgUsefulness: sql<number>`avg(${reviews.usefulness})::float`,
      avgWorkload: sql<number>`avg(${reviews.workloadHours})::float`,
    })
    .from(reviews)
    .where(eq(reviews.courseId, course.id));

  const courseReviews = await db
    .select({
      id: reviews.id,
      userId: reviews.userId,
      professor: professors.name,
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
      syllabusUrl: reviews.syllabusUrl,
      syllabusPath: reviews.syllabusPath,
      createdAt: reviews.createdAt,
      username: profiles.username,
    })
    .from(reviews)
    .innerJoin(profiles, eq(profiles.id, reviews.userId))
    .leftJoin(professors, eq(professors.id, reviews.professorId))
    .where(eq(reviews.courseId, course.id))
    .orderBy(desc(reviews.createdAt));

  const reviewIds = courseReviews.map((r) => r.id);
  const fileRows = reviewIds.length
    ? await db
        .select({
          reviewId: reviewFiles.reviewId,
          url: reviewFiles.url,
          originalName: reviewFiles.originalName,
          description: reviewFiles.description,
        })
        .from(reviewFiles)
        .where(inArray(reviewFiles.reviewId, reviewIds))
    : [];
  const filesByReview = new Map<
    string,
    { url: string; originalName: string; description: string | null }[]
  >();
  for (const f of fileRows) {
    const list = filesByReview.get(f.reviewId) ?? [];
    list.push({ url: f.url, originalName: f.originalName, description: f.description });
    filesByReview.set(f.reviewId, list);
  }

  const stats = resolveCourseStats(
    normalizeCourseStats(
      statsRow ?? {
        count: 0,
        avgRating: null,
        avgDifficulty: null,
        avgEnjoyability: null,
        avgUsefulness: null,
        avgWorkload: null,
      },
    ),
    courseReviews,
  );

  const dateFormat = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const reviewCards: CourseReviewCard[] = courseReviews.map((r) => {
    const syllabusPdfUrl = r.syllabusPath ? syllabusPdfPublicUrl(r.syllabusPath) : null;
    const syllabusLink =
      r.syllabusUrl && r.syllabusUrl !== syllabusPdfUrl ? r.syllabusUrl : null;
    return {
      id: r.id,
      isOwn: currentUser?.id === r.userId,
      professor: r.professor,
      term: r.term,
      year: r.year,
      grade: r.grade,
      overallRating: r.overallRating,
      difficulty: r.difficulty,
      enjoyability: r.enjoyability,
      usefulness: r.usefulness,
      medium: r.medium,
      hasFinalExam: r.hasFinalExam,
      workloadHours: r.workloadHours,
      wouldRecommend: r.wouldRecommend,
      groupwork: r.groupwork,
      body: r.body,
      username: r.username,
      dateLabel: dateFormat.format(r.createdAt),
      syllabusPdfUrl,
      syllabusLink,
      files: filesByReview.get(r.id) ?? [],
    };
  });

  const syllabusLinkDocs: CourseDocument[] = reviewCards
    .filter((r) => r.syllabusLink)
    .map((r) => ({ url: r.syllabusLink!, name: "Syllabus link", by: r.username, kind: "link" }));
  const syllabusPdfDocs: CourseDocument[] = reviewCards
    .filter((r) => r.syllabusPdfUrl)
    .map((r) => ({
      url: r.syllabusPdfUrl!,
      name: formatTermLabel(`${r.year}-${r.term}`),
      by: r.username,
      kind: "syllabus",
    }));
  const otherDocs: CourseDocument[] = reviewCards.flatMap((r) =>
    r.files.map((f) => ({
      url: f.url,
      name: f.description ?? f.originalName,
      by: r.username,
      kind: "file" as const,
    })),
  );

  const ratingBins = (get: (r: (typeof courseReviews)[number]) => number | null) => {
    const counts = new Map<number, number>();
    for (const r of courseReviews) {
      const v = get(r);
      if (v == null) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([value, count]) => ({ label: `${value}/10`, count }));
  };
  const workloadBins = () => {
    const labels = ["0–4 h", "5–9 h", "10–14 h", "15–19 h", "20+ h"];
    const counts = new Map<number, number>();
    for (const r of courseReviews) {
      if (r.workloadHours == null) continue;
      const bucket = Math.min(4, Math.floor(r.workloadHours / 5));
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([bucket, count]) => ({ label: labels[bucket], count }));
  };
  const distributions = {
    overall: ratingBins((r) => r.overallRating),
    difficulty: ratingBins((r) => r.difficulty),
    enjoyability: ratingBins((r) => r.enjoyability),
    usefulness: ratingBins((r) => r.usefulness),
    workload: workloadBins(),
  };

  const countReviews = (pred: (r: (typeof courseReviews)[number]) => boolean) =>
    courseReviews.filter(pred).length;
  // Shades of the UBC blue palette, ordered for contrast between adjacent segments.
  const PIE_PALETTE = [
    "var(--ubc-blue-600)",
    "var(--ubc-blue-100)",
    "var(--ubc-blue-500)",
    "var(--ubc-blue-300)",
  ];
  const toggleChart = (
    title: string,
    entries: Array<{ label: string; value: number }>,
  ): ToggleChart => ({
    title,
    segments: entries.map((e, i) => ({ ...e, color: PIE_PALETTE[i % PIE_PALETTE.length] })),
  });
  const toggleCharts: ToggleChart[] = [
    toggleChart("Has a final exam", [
      { label: "Yes", value: countReviews((r) => r.hasFinalExam === true) },
      { label: "No", value: countReviews((r) => r.hasFinalExam === false) },
    ]),
    toggleChart("Groupwork", [
      { label: "Yes", value: countReviews((r) => r.groupwork === true) },
      { label: "Optional", value: countReviews((r) => r.groupwork === null) },
      { label: "No", value: countReviews((r) => r.groupwork === false) },
    ]),
    toggleChart("Would recommend", [
      { label: "Yes", value: countReviews((r) => r.wouldRecommend === "yes") },
      { label: "Maybe", value: countReviews((r) => r.wouldRecommend === "maybe") },
      { label: "No", value: countReviews((r) => r.wouldRecommend === "no") },
    ]),
    toggleChart("Course medium", [
      { label: MEDIUM_LABEL.in_person, value: countReviews((r) => r.medium === "in_person") },
      { label: MEDIUM_LABEL.hybrid, value: countReviews((r) => r.medium === "hybrid") },
      { label: MEDIUM_LABEL.online, value: countReviews((r) => r.medium === "online") },
    ]),
  ];

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-3xl space-y-8 px-4 py-10 pb-16">
        <div className={cn(glassSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{course.subject}</p>
              <h1 className="text-3xl font-bold tracking-tight">{course.code}</h1>
              <p className="text-lg">{course.title}</p>
              {stats.count > 0 && stats.avgRating != null ? (
                <p className="text-sm text-muted-foreground">
                  {stats.count} review{stats.count === 1 ? "" : "s"} ·{" "}
                  <span className="font-medium text-foreground">
                    {stats.avgRating.toFixed(1)}/10 overall
                  </span>
                </p>
              ) : null}
            </div>
            <Link
              href={`/courses/${encodeURIComponent(course.code)}/review`}
              className={buttonVariants()}
            >
              Write a review
            </Link>
          </div>
          {course.description ? (
            <p className="mt-3 text-sm text-muted-foreground">{course.description}</p>
          ) : null}
        </div>

        {stats.count > 0 ? (
          <section className={cn(glassContentCardClass, "space-y-6 p-6 sm:p-8")}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">Course summary</h2>
              <p className="text-sm font-medium tabular-nums text-muted-foreground">
                {stats.count} review{stats.count === 1 ? "" : "s"}
              </p>
            </div>
            <CourseAggregateSummary stats={stats} distributions={distributions} />
            <CourseToggleCharts charts={toggleCharts} />
            <CourseDocuments
              syllabusLinks={syllabusLinkDocs}
              syllabusPdfs={syllabusPdfDocs}
              otherDocs={otherDocs}
            />
          </section>
        ) : (
          <div className={cn(glassContentCardClass, "p-6 text-center text-muted-foreground")}>
            <p className="mb-3">No reviews yet — be the first.</p>
            <Link
              href={`/courses/${encodeURIComponent(course.code)}/review`}
              className={buttonVariants()}
            >
              Write a review
            </Link>
          </div>
        )}

        {reviewCards.length > 0 && (
          <section className="space-y-4">
            <h2 className={cn(glassFormSectionTitleClass, "px-1 text-base")}>Reviews</h2>
            <CourseReviews reviews={reviewCards} courseCode={course.code} />
          </section>
        )}
      </div>
    </>
  );
}
