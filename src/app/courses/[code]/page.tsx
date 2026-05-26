import Link from "next/link";
import { FileText, Paperclip } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { courses, professors, profiles, reviewFiles, reviews } from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { ASSESSMENT_TYPE_LABEL } from "@/components/assessment-type-picker";
import { MEDIUM_LABEL } from "@/components/medium-picker";
import {
  CourseAggregateSummary,
  normalizeCourseStats,
  resolveCourseStats,
} from "@/components/course-aggregate-summary";
import { WOULD_RECOMMEND_BADGE_LABEL } from "@/lib/would-recommend";
import { RatingBarDisplay } from "@/components/rating-bar";

type Params = Promise<{ code: string }>;

const TERM_LABEL: Record<string, string> = {
  "1": "Term 1",
  "2": "Term 2",
  summer: "Summer",
};

export default async function CoursePage({ params }: { params: Params }) {
  const { code } = await params;
  const courseCode = decodeURIComponent(code).toUpperCase();

  const [course] = await db.select().from(courses).where(eq(courses.code, courseCode)).limit(1);
  if (!course) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
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
      professor: professors.name,
      term: reviews.term,
      year: reviews.year,
      grade: reviews.grade,
      overallRating: reviews.overallRating,
      difficulty: reviews.difficulty,
      enjoyability: reviews.enjoyability,
      usefulness: reviews.usefulness,
      medium: reviews.medium,
      assessmentType: reviews.assessmentType,
      workloadHours: reviews.workloadHours,
      wouldRecommend: reviews.wouldRecommend,
      groupwork: reviews.groupwork,
      body: reviews.body,
      syllabusUrl: reviews.syllabusUrl,
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
        })
        .from(reviewFiles)
        .where(inArray(reviewFiles.reviewId, reviewIds))
    : [];
  const filesByReview = new Map<string, { url: string; originalName: string }[]>();
  for (const f of fileRows) {
    const list = filesByReview.get(f.reviewId) ?? [];
    list.push({ url: f.url, originalName: f.originalName });
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <header className="space-y-3">
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
          <p className="text-sm text-muted-foreground max-w-prose">{course.description}</p>
        ) : null}
      </header>

      {stats.count > 0 ? (
        <CourseAggregateSummary stats={stats} />
      ) : (
        <section className="rounded-xl border bg-muted/30 p-6 text-center text-muted-foreground">
          <p className="mb-3">No reviews yet — be the first.</p>
          <Link
            href={`/courses/${encodeURIComponent(course.code)}/review`}
            className={buttonVariants()}
          >
            Write a review
          </Link>
        </section>
      )}

      {courseReviews.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Reviews</h2>
          <div className="space-y-3">
            {courseReviews.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2 space-y-3">
                  <CardTitle className="text-sm font-medium flex flex-wrap gap-2 items-center">
                    {r.medium ? (
                      <Badge variant="secondary">{MEDIUM_LABEL[r.medium]}</Badge>
                    ) : null}
                    {r.assessmentType ? (
                      <Badge variant="secondary">
                        {ASSESSMENT_TYPE_LABEL[r.assessmentType]}
                      </Badge>
                    ) : null}
                    {r.groupwork != null ? (
                      <Badge variant="secondary">Groupwork: {r.groupwork ? "Yes" : "No"}</Badge>
                    ) : null}
                    {r.workloadHours ? (
                      <Badge variant="secondary">{r.workloadHours}h/wk</Badge>
                    ) : null}
                    {r.grade ? <Badge variant="secondary">Grade: {r.grade}</Badge> : null}
                    {r.wouldRecommend ? (
                      <Badge variant="secondary">
                        {WOULD_RECOMMEND_BADGE_LABEL[r.wouldRecommend]}
                      </Badge>
                    ) : null}
                    <Badge variant="outline">
                      {TERM_LABEL[r.term]} {r.year}
                    </Badge>
                    {r.professor ? <Badge variant="outline">Prof. {r.professor}</Badge> : null}
                    <span className="ml-auto text-xs text-muted-foreground font-normal">
                      by{" "}
                      <Link href={`/u/${r.username}`} className="hover:underline">
                        @{r.username}
                      </Link>
                    </span>
                  </CardTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <RatingBarDisplay label="Overall" value={r.overallRating} compact />
                    <RatingBarDisplay label="Difficulty" value={r.difficulty} compact />
                    {r.enjoyability != null ? (
                      <RatingBarDisplay label="Enjoyability" value={r.enjoyability} compact />
                    ) : null}
                    {r.usefulness != null ? (
                      <RatingBarDisplay label="Usefulness" value={r.usefulness} compact />
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="whitespace-pre-wrap">{r.body}</p>
                  {(r.syllabusUrl || filesByReview.has(r.id)) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                      {r.syllabusUrl ? (
                        <a
                          href={r.syllabusUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View syllabus
                        </a>
                      ) : null}
                      {(filesByReview.get(r.id) ?? []).map((f) => (
                        <a
                          key={f.url}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {f.originalName}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
