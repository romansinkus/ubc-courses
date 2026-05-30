import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiveFilterChips } from "@/components/active-filter-chips";
import { CoursesBrowseResultsColumn } from "@/components/courses-browse-results-column";
import { CoursesBrowseResultsLoading } from "@/components/courses-results";
import { HasReviewsFilter } from "@/components/has-reviews-filter";
import { db } from "@/db";
import { courses, reviews } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  buildCourseBrowseQuery,
  buildCourseWhereClause,
  COURSES_PAGE_SIZE,
  hasActiveCourseFilters,
  parseCourseFilters,
} from "@/lib/course-filters";

export async function CoursesBrowseResults({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    subjects?: string;
    level?: string;
    term?: string;
    reviewed?: string;
    page?: string;
  }>;
}) {
  const filters = parseCourseFilters(await searchParams);
  const where = buildCourseWhereClause(filters);
  const hasActive = hasActiveCourseFilters(filters);

  const countRow = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(courses)
    .where(where);

  const total = countRow[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / COURSES_PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page), totalPages);
  const offset = (page - 1) * COURSES_PAGE_SIZE;

  const rows = await db
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
    .orderBy(courses.code)
    .limit(COURSES_PAGE_SIZE)
    .offset(offset);

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = offset + rows.length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 lg:col-start-2 lg:row-start-1 lg:shrink-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} course{total === 1 ? "" : "s"}
            {totalPages > 1
              ? ` · showing ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()}`
              : null}
          </p>
          <Suspense fallback={null}>
            <HasReviewsFilter checked={filters.hasReviews} />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <ActiveFilterChips
            selectedSubjects={filters.selectedSubjects}
            selectedLevels={filters.selectedLevels}
            term={filters.term}
            query={filters.query}
          />
        </Suspense>
      </div>

      <div className="min-w-0 lg:col-start-2 lg:row-start-2 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-1 lg:pb-6 lg:pt-4 lg:[mask-image:linear-gradient(to_bottom,transparent_0,black_1rem)] lg:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_1rem)]">
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                {hasActive
                  ? filters.query
                    ? <>No courses match &ldquo;{filters.query}&rdquo;.</>
                    : "No courses match your filters."
                  : "No courses found."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((c) => (
                <Link key={c.code} href={`/courses/${encodeURIComponent(c.code)}`}>
                  <Card className="flex h-full flex-col transition-all duration-150 hover:-translate-y-0.5 hover:border-ubc-blue-400/60 hover:bg-ubc-blue-100/40 hover:shadow-sm dark:hover:bg-ubc-blue-500/15">
                    <CardHeader className="flex-1">
                      <CardTitle className="text-base">{c.code}</CardTitle>
                      <CardDescription className="line-clamp-2">{c.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto pt-0 text-xs text-muted-foreground">
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
          {totalPages > 1 ? (
            <nav
              className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm"
              aria-label="Course pagination"
            >
              {page > 1 ? (
                <Link
                  href={`/courses${buildCourseBrowseQuery(filters, page - 1)}`}
                  className="rounded-md border px-3 py-1.5 hover:bg-accent"
                >
                  Previous
                </Link>
              ) : null}
              <span className="text-muted-foreground">
                Page {page} of {totalPages.toLocaleString()}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/courses${buildCourseBrowseQuery(filters, page + 1)}`}
                  className="rounded-md border px-3 py-1.5 hover:bg-accent"
                >
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </>
  );
}
