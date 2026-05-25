import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchBox } from "@/components/search-box";
import { FiltersButton } from "@/components/filters-button";
import { LiveBackground } from "@/components/live-background";
import { db } from "@/db";
import { courses, reviews, profiles } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export default async function HomePage() {
  const [recent, subjectRows] = await Promise.all([
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
  ]);
  const subjects = subjectRows.map((r) => r.subject);

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-5xl px-4 py-12 space-y-12">
        <section className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Honest reviews of UBC courses.</h1>
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
