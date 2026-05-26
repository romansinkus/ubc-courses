import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ActiveFilterChips } from "@/components/active-filter-chips";
import { CoursesFilters } from "@/components/courses-filters";
import { CoursesFiltersSkeleton } from "@/components/courses-filters-panel";
import { CoursesResultsSkeleton } from "@/components/courses-results";
import { db } from "@/db";
import { courses, reviews } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import {
  buildCourseWhereClause,
  hasActiveCourseFilters,
  parseCourseFilters,
} from "@/lib/course-filters";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";

export function CoursesBrowseSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 pb-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[260px_1fr] lg:pb-0">
      <div className={cn("p-5 lg:min-h-0 lg:overflow-y-auto", glassSurfaceClass)}>
        <CoursesFiltersSkeleton />
      </div>
      <div className="min-w-0 space-y-4 lg:flex lg:min-h-0 lg:flex-col">
        <CoursesResultsSkeleton />
      </div>
    </div>
  );
}

export async function CoursesBrowseContent({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    subjects?: string;
    level?: string;
    term?: string;
  }>;
}) {
  const filters = parseCourseFilters(await searchParams);
  const where = buildCourseWhereClause(filters);
  const hasActive = hasActiveCourseFilters(filters);

  const [subjectRows, rows] = await Promise.all([
    db
      .selectDistinct({ subject: courses.subject })
      .from(courses)
      .orderBy(asc(courses.subject)),
    db
      .select({
        code: courses.code,
        title: courses.title,
        reviewCount: sql<number>`count(${reviews.id})::int`,
        avgRating: sql<number>`avg(${reviews.overallRating})::float`,
      })
      .from(courses)
      .leftJoin(reviews, eq(reviews.courseId, courses.id))
      .where(where)
      .groupBy(courses.id)
      .orderBy(asc(courses.code))
      .limit(200),
  ]);

  const subjects = subjectRows.map((r) => r.subject);

  return (
    <div className="grid grid-cols-1 gap-8 pb-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[260px_1fr] lg:pb-0">
      <div className={cn("p-5 lg:min-h-0 lg:overflow-y-auto", glassSurfaceClass)}>
        <Suspense fallback={<CoursesFiltersSkeleton />}>
          <CoursesFilters
            subjects={subjects}
            selectedSubjects={filters.selectedSubjects}
            level={filters.level}
            term={filters.term}
          />
        </Suspense>
      </div>

      <div className="min-w-0 space-y-4 lg:flex lg:min-h-0 lg:flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:shrink-0">
          <p className="text-sm text-muted-foreground">
            {rows.length} course{rows.length === 1 ? "" : "s"}
          </p>
          <Suspense fallback={null}>
            <ActiveFilterChips
              selectedSubjects={filters.selectedSubjects}
              level={filters.level}
              term={filters.term}
              query={filters.query}
            />
          </Suspense>
        </div>

        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-1 lg:pb-6 lg:pt-4 lg:[mask-image:linear-gradient(to_bottom,transparent_0,black_1rem)] lg:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_1rem)]">
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
              <p className="text-muted-foreground">
                {hasActive
                  ? filters.query
                    ? <>No courses match &ldquo;{filters.query}&rdquo;.</>
                    : "No courses match your filters."
                  : "No courses found."}
              </p>
              {filters.query ? (
                <Link
                  href={`/courses/new?code=${encodeURIComponent(filters.query)}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  <Plus className="h-4 w-4" />
                  Add {filters.query.toUpperCase()} to the catalog
                </Link>
              ) : (
                <Link href="/courses/new" className={buttonVariants({ size: "sm" })}>
                  <Plus className="h-4 w-4" />
                  Add a new course
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((c) => (
                <Link key={c.code} href={`/courses/${encodeURIComponent(c.code)}`}>
                  <Card className="h-full transition-all duration-150 hover:-translate-y-0.5 hover:border-ubc-blue-400/60 hover:bg-ubc-blue-100/40 hover:shadow-sm dark:hover:bg-ubc-blue-500/15">
                    <CardHeader>
                      <CardTitle className="text-base">{c.code}</CardTitle>
                      <CardDescription className="line-clamp-2">{c.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      {c.reviewCount > 0 ? (
                        <>
                          {c.reviewCount} review{c.reviewCount === 1 ? "" : "s"}
                          {c.avgRating ? ` · ★ ${c.avgRating.toFixed(1)}` : ""}
                        </>
                      ) : (
                        "No reviews yet"
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
