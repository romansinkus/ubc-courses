import Link from "next/link";
import { notFound } from "next/navigation";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { courses, professors, profiles, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ASSESSMENT_TYPE_LABEL } from "@/components/assessment-type-picker";
import { MEDIUM_LABEL } from "@/components/medium-picker";
import { RatingBarDisplay } from "@/components/rating-bar";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

type Params = Promise<{ username: string }>;

const TERM_LABEL: Record<string, string> = {
  "1": "Term 1",
  "2": "Term 2",
  summer: "Summer",
};

export default async function UserProfilePage({ params }: { params: Params }) {
  const { username } = await params;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, username.toLowerCase()))
    .limit(1);
  if (!profile) notFound();

  const currentUser = await getCurrentUser();
  const isOwnProfile = currentUser?.id === profile.id;

  const userReviews = await db
    .select({
      id: reviews.id,
      courseCode: courses.code,
      courseTitle: courses.title,
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
      groupwork: reviews.groupwork,
      body: reviews.body,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .leftJoin(professors, eq(professors.id, reviews.professorId))
    .where(eq(reviews.userId, profile.id))
    .orderBy(desc(reviews.createdAt));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <header className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">@{profile.username}</h1>
          {profile.displayName ? (
            <p className="text-muted-foreground">{profile.displayName}</p>
          ) : null}
          {profile.bio ? <p className="text-sm">{profile.bio}</p> : null}
          <p className="text-xs text-muted-foreground">
            {userReviews.length} review{userReviews.length === 1 ? "" : "s"}
          </p>
        </div>
        {isOwnProfile ? (
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        ) : null}
      </header>

      {isOwnProfile ? <Separator /> : null}

      {userReviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {userReviews.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex flex-wrap gap-2 items-center">
                  <Link
                    href={`/courses/${encodeURIComponent(r.courseCode)}`}
                    className="hover:underline"
                  >
                    {r.courseCode}
                  </Link>
                  <span className="text-muted-foreground font-normal">· {r.courseTitle}</span>
                </CardTitle>
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <RatingBarDisplay label="Overall" value={r.overallRating} compact />
                  <RatingBarDisplay label="Difficulty" value={r.difficulty} compact />
                  {r.enjoyability != null ? (
                    <RatingBarDisplay label="Enjoyability" value={r.enjoyability} compact />
                  ) : null}
                  {r.usefulness != null ? (
                    <RatingBarDisplay label="Usefulness" value={r.usefulness} compact />
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {r.medium ? (
                    <Badge variant="secondary">{MEDIUM_LABEL[r.medium]}</Badge>
                  ) : null}
                  {r.assessmentType ? (
                    <Badge variant="secondary">{ASSESSMENT_TYPE_LABEL[r.assessmentType]}</Badge>
                  ) : null}
                  {r.groupwork != null ? (
                    <Badge variant="secondary">Groupwork: {r.groupwork ? "Yes" : "No"}</Badge>
                  ) : null}
                  {r.grade ? <Badge variant="secondary">Grade: {r.grade}</Badge> : null}
                  <Badge variant="outline">
                    {TERM_LABEL[r.term]} {r.year}
                  </Badge>
                  {r.professor ? <Badge variant="outline">Prof. {r.professor}</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">{r.body}</CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
