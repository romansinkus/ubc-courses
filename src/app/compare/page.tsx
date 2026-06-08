import type { Metadata } from "next";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, reviews } from "@/db/schema";
import { LiveBackground } from "@/components/live-background";
import { VisualComparisons, type CoursePoint } from "@/components/visual-comparisons";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";

export const metadata: Metadata = {
  title: "Compare",
  description: "Plot UBC courses against each other by difficulty, usefulness, workload, and more.",
  alternates: { canonical: "/compare" },
};

type SearchParams = Promise<{
  axes?: string;
  subject?: string;
  x?: string;
  y?: string;
}>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const rows = await db
    .select({
      code: courses.code,
      subject: courses.subject,
      title: courses.title,
      n: sql<number>`count(${reviews.id})::int`,
      overall: sql<number | null>`avg(${reviews.overallRating})::float`,
      difficulty: sql<number | null>`avg(${reviews.difficulty})::float`,
      enjoyability: sql<number | null>`avg(${reviews.enjoyability})::float`,
      usefulness: sql<number | null>`avg(${reviews.usefulness})::float`,
      workload: sql<number | null>`avg(${reviews.workloadHours})::float`,
    })
    .from(courses)
    .innerJoin(reviews, eq(reviews.courseId, courses.id))
    .groupBy(courses.id)
    .orderBy(asc(courses.code));

  const points: CoursePoint[] = rows.map((r) => ({
    code: r.code,
    subject: r.subject,
    title: r.title,
    n: r.n,
    overall: r.overall,
    difficulty: r.difficulty,
    enjoyability: r.enjoyability,
    usefulness: r.usefulness,
    workload: r.workload,
  }));

  const subjects = [...new Set(points.map((p) => p.subject))].sort();

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-4xl px-4 py-10 pb-16">
        <div className={cn(glassSurfaceClass, "space-y-6 rounded-2xl p-6 sm:p-8")}>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Compare</h1>
            <p className="text-muted-foreground">
              Plot courses against each other — pick a subject, then choose a metric for each
              axis (e.g. difficulty vs. usefulness).
            </p>
            <p className="text-sm text-muted-foreground">
              Only courses with at least one review are available for comparison.
            </p>
          </div>
          <VisualComparisons
            points={points}
            subjects={subjects}
            initialAxes={sp.axes === "1" ? 1 : sp.axes === "2" ? 2 : undefined}
            initialSubject={sp.subject}
            initialX={sp.x}
            initialY={sp.y}
          />
        </div>
      </div>
    </>
  );
}
