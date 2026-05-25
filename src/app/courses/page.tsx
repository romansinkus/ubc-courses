import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SearchBox } from "@/components/search-box";
import { CoursesFilters } from "@/components/courses-filters";
import { ActiveFilterChips } from "@/components/active-filter-chips";
import { db } from "@/db";
import { courses, reviews } from "@/db/schema";
import { and, asc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { parseTermValue } from "@/lib/terms";

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
    filters.push(
      or(ilike(courses.code, `%${query}%`), ilike(courses.title, `%${query}%`))!,
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
    <div className="mx-auto max-w-6xl px-4">
      <div className="sticky top-14 z-30 -mx-4 border-b bg-background/95 px-4 py-5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Browse courses</h1>
          <div className="max-w-xl">
            <SearchBox defaultValue={query ?? ""} placeholder="Search by code or title" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 pt-6 pb-10 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-44 lg:self-start lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto rounded-lg border bg-card p-5">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading filters…</p>}>
            <CoursesFilters
              subjects={subjects}
              selectedSubjects={selectedSubjects}
              level={level}
              term={term}
            />
          </Suspense>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                  <Card className="h-full transition-all duration-150 hover:-translate-y-0.5 hover:border-foreground/40 hover:shadow-sm">
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
