import Link from "next/link";
import { notFound } from "next/navigation";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveBackground } from "@/components/live-background";
import { db } from "@/db";
import { courses, professors, profiles, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { finalExamLabel } from "@/components/assessment-type-picker";
import { MEDIUM_LABEL } from "@/components/medium-picker";
import { RatingBarDisplay } from "@/components/rating-bar";
import { ReviewOwnerActions } from "@/components/review-owner-actions";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { cn } from "@/lib/utils";
import {
  glassAvatarClass,
  glassBadgeClass,
  glassContentCardClass,
  glassDividerClass,
  glassFormSectionTitleClass,
  glassOutlineButtonClass,
  glassSurfaceClass,
} from "@/lib/glass-styles";

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
      hasFinalExam: reviews.hasFinalExam,
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
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-3xl space-y-8 px-4 py-10 pb-16">
        <div className={cn(glassSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
          <header className="flex items-start gap-4">
            <div className={cn(glassAvatarClass, "h-16 w-16")}>
              <User className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Profile
              </p>
              <h1 className="text-3xl font-bold tracking-tight">@{profile.username}</h1>
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
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className={glassOutlineButtonClass}
                >
                  Sign out
                </Button>
              </form>
            ) : null}
          </header>
        </div>

        {userReviews.length === 0 ? (
          <div className={cn(glassContentCardClass, "text-center text-muted-foreground")}>
            No reviews yet.
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className={cn(glassFormSectionTitleClass, "px-1")}>Reviews</h2>
            {userReviews.map((r) => (
              <article key={r.id} className={glassContentCardClass}>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <Link
                        href={`/courses/${encodeURIComponent(r.courseCode)}`}
                        className="hover:underline"
                      >
                        {r.courseCode}
                      </Link>
                      <span className="text-muted-foreground font-normal">· {r.courseTitle}</span>
                    </div>
                    {isOwnProfile ? (
                      <ReviewOwnerActions
                        reviewId={r.id}
                        courseCode={r.courseCode}
                        variant="glass"
                      />
                    ) : null}
                  </div>

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

                  <div className="flex flex-wrap gap-1.5">
                    {r.medium ? (
                      <Badge variant="secondary" className={glassBadgeClass}>
                        {MEDIUM_LABEL[r.medium]}
                      </Badge>
                    ) : null}
                    {r.hasFinalExam != null ? (
                      <Badge variant="secondary" className={glassBadgeClass}>
                        {finalExamLabel(r.hasFinalExam)}
                      </Badge>
                    ) : null}
                    {r.groupwork != null ? (
                      <Badge variant="secondary" className={glassBadgeClass}>
                        Groupwork: {r.groupwork ? "Yes" : "No"}
                      </Badge>
                    ) : null}
                    {r.grade ? (
                      <Badge variant="secondary" className={glassBadgeClass}>
                        Grade: {r.grade}
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className={glassBadgeClass}>
                      {TERM_LABEL[r.term]} {r.year}
                    </Badge>
                    {r.professor ? (
                      <Badge variant="outline" className={glassBadgeClass}>
                        Prof. {r.professor}
                      </Badge>
                    ) : null}
                  </div>

                  <div className={cn("border-t pt-3", glassDividerClass)}>
                    <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
