import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchBox } from "@/components/search-box";
import { FiltersButton } from "@/components/filters-button";
import { LiveBackground } from "@/components/live-background";
import { db } from "@/db";
import { courses, reviews, reviewFiles, profiles } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";

export default async function HomePage() {
  const [recent, subjectRows, [reviewStats], [fileStats], [userStats]] = await Promise.all([
    db
      .select({
        reviewId: reviews.id,
        rating: reviews.overallRating,
        body: reviews.body,
        createdAt: reviews.createdAt,
        courseCode: courses.code,
        courseTitle: courses.title,
        username: profiles.username,
      })
      .from(reviews)
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .innerJoin(profiles, eq(reviews.userId, profiles.id))
      .orderBy(desc(reviews.createdAt))
      .limit(5),
    db
      .selectDistinct({ subject: courses.subject })
      .from(courses)
      .orderBy(asc(courses.subject)),
    db
      .select({
        reviews: sql<number>`count(*)::int`,
        syllabi: sql<number>`(count(*) filter (where ${reviews.syllabusPath} is not null))::int`,
      })
      .from(reviews),
    db.select({ count: sql<number>`count(*)::int` }).from(reviewFiles),
    db.select({ count: sql<number>`count(*)::int` }).from(profiles),
  ]);
  const subjects = subjectRows.map((r) => r.subject);

  const stats = [
    { value: reviewStats.reviews, label: "Reviews" },
    { value: userStats.count, label: "Contributors" },
    { value: reviewStats.syllabi + fileStats.count, label: "Files" },
  ];

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col justify-center px-4 pt-8 pb-44 space-y-12">
        <section className="space-y-4 text-center">
          <div className="mx-auto grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{ animationDelay: `${i * 0.45}s` }}
                className={cn(
                  glassSurfaceClass,
                  "animate-stat-jump rounded-2xl px-3 py-6 will-change-transform sm:px-4",
                )}
              >
                <div className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                  {s.value.toLocaleString()}
                </div>
                <div className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Honest reviews and crowd-sourced resources for UBC courses.
          </h1>
          <div className="flex max-w-md mx-auto gap-2">
            <SearchBox variant="glass" />
            <FiltersButton subjects={subjects} variant="glass" />
          </div>
        </section>

        {recent.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Recent reviews</h2>
            <div className="space-y-3">
              {recent.map((r) => (
                <Card key={r.reviewId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Link
                        href={`/courses/${encodeURIComponent(r.courseCode)}`}
                        className="hover:underline"
                      >
                        {r.courseCode}
                      </Link>
                      <span className="text-muted-foreground font-normal">· ★ {r.rating}/10</span>
                      <span className="ml-auto text-xs text-muted-foreground font-normal">
                        by{" "}
                        <Link href={`/u/${r.username}`} className="hover:underline">
                          @{r.username}
                        </Link>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm line-clamp-3">{r.body}</CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
