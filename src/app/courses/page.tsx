import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SearchBox } from "@/components/search-box";
import { CoursesFilters } from "@/components/courses-filters";
import { ActiveFilterChips } from "@/components/active-filter-chips";
import { LiveBackground } from "@/components/live-background";
import { db } from "@/db";
import { courses, reviews } from "@/db/schema";
import { and, asc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { parseTermValue } from "@/lib/terms";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";

type SearchParams = Promise<{
  q?: string;
  subjects?: string;
  level?: string;
  term?: string;
}>;

const LEVELS = new Set(["100", "200", "300", "400", "500"]);

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, subjects: subjectsParam, level: levelParam, term: termParam } = await searchParams;
  const query = q?.trim();
  const selectedSubjects = subjectsParam
    ? subjectsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
    : [];
  const level = levelParam && LEVELS.has(levelParam) ? levelParam : "all";
  const parsedTerm = parseTermValue(termParam);
  const term = parsedTerm ? termParam! : "all";

  const filters: SQL[] = [];
  if (query) {
    // Match the code ignoring whitespace so "CPSC 110" and "CPSC110" both match.
    const queryNoSpace = query.replace(/\s+/g, "");
    filters.push(
      or(
        sql`replace(${courses.code}, ' ', '') ilike ${`%${queryNoSpace}%`}`,
        ilike(courses.title, `%${query}%`),
      )!,
    );
  }
  if (selectedSubjects.length > 0) {
    filters.push(inArray(courses.subject, selectedSubjects));
  }
  if (level !== "all") {
    if (level === "500") {
      filters.push(sql`substring(${courses.number} from '^([0-9]+)')::int >= 500`);
    } else {
      const min = parseInt(level, 10);
      filters.push(
        sql`substring(${courses.number} from '^([0-9]+)')::int between ${min} and ${min + 99}`,
      );
    }
  }
  if (parsedTerm) {
    filters.push(
      sql`exists (
        select 1 from ${reviews}
        where ${reviews.courseId} = ${courses.id}
          and ${reviews.year} = ${parsedTerm.year}
          and ${reviews.term} = ${parsedTerm.term}
      )`,
    );
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, subjectRows] = await Promise.all([
    db
      .select({
        code: courses.code,
        title: courses.title,
        subject: courses.subject,
        reviewCount: sql<number>`count(${reviews.id})::int`,
        avgRating: sql<number>`avg(${reviews.overallRating})::float`,
      })
      .from(courses)
      .leftJoin(reviews, eq(reviews.courseId, courses.id))
      .where(where)
      .groupBy(courses.id)
      .orderBy(asc(courses.code))
      .limit(200),
    db
      .selectDistinct({ subject: courses.subject })
      .from(courses)
      .orderBy(asc(courses.subject)),
  ]);

  const subjects = subjectRows.map((r) => r.subject);
  const hasActive = !!query || selectedSubjects.length > 0 || level !== "all";

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-6xl px-4 lg:flex lg:h-[calc(100vh-3.5rem)] lg:flex-col">
        <div className="relative z-30 space-y-3 pb-8 pt-4 max-lg:sticky max-lg:top-14 lg:shrink-0">
          <h1 className="text-2xl font-bold">Browse courses</h1>
          <div className="max-w-xl">
            <SearchBox
              variant="glass"
              defaultValue={query ?? ""}
              placeholder="Search by code or title"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 pb-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[260px_1fr] lg:pb-0">
          <div
            className={cn(
              "p-5 lg:min-h-0 lg:overflow-y-auto",
              glassSurfaceClass,
            )}
          >
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading filters…</p>}>
              <CoursesFilters
                subjects={subjects}
                selectedSubjects={selectedSubjects}
                level={level}
                term={term}
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
                  selectedSubjects={selectedSubjects}
                  level={level}
                  term={term}
                  query={query}
                />
              </Suspense>
            </div>

            {/* On lg+ the list scrolls in its own pane; the top fade masks cards
                out as they approach the (transparent) sticky search bar. */}
            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-1 lg:pb-6 lg:pt-4 lg:[mask-image:linear-gradient(to_bottom,transparent_0,black_1rem)] lg:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_1rem)]">
              {rows.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
                  <p className="text-muted-foreground">
                    {hasActive
                      ? query
                        ? <>No courses match &ldquo;{query}&rdquo;.</>
                        : "No courses match your filters."
                      : "No courses found."}
                  </p>
                  {query ? (
                    <Link
                      href={`/courses/new?code=${encodeURIComponent(query)}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      <Plus className="h-4 w-4" />
                      Add {query.toUpperCase()} to the catalog
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
      </div>
    </>
  );
}
