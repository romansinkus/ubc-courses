import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { courses, profiles, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function HomeRecentReviews() {
  const recent = await db
    .select({
      reviewId: reviews.id,
      rating: reviews.overallRating,
      body: reviews.body,
      courseCode: courses.code,
      username: profiles.username,
    })
    .from(reviews)
    .innerJoin(courses, eq(reviews.courseId, courses.id))
    .innerJoin(profiles, eq(reviews.userId, profiles.id))
    .orderBy(desc(reviews.createdAt))
    .limit(5);

  if (recent.length === 0) return null;

  return (
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
  );
}
