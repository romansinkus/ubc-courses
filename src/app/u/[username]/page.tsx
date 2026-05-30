import { notFound } from "next/navigation";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseReviews, type CourseReviewCard } from "@/components/course-reviews";
import { LiveBackground } from "@/components/live-background";
import { db } from "@/db";
import { courses, professors, profiles, reviewFiles, reviews } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { syllabusPdfPublicUrl } from "@/lib/syllabus";
import { cn } from "@/lib/utils";
import {
  glassAvatarClass,
  glassContentCardClass,
  glassFormSectionTitleClass,
  glassOutlineButtonClass,
  glassSurfaceClass,
} from "@/lib/glass-styles";

type Params = Promise<{ username: string }>;

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
      userId: reviews.userId,
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
      workloadHours: reviews.workloadHours,
      wouldRecommend: reviews.wouldRecommend,
      groupwork: reviews.groupwork,
      body: reviews.body,
      syllabusUrl: reviews.syllabusUrl,
      syllabusPath: reviews.syllabusPath,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(courses, eq(courses.id, reviews.courseId))
    .leftJoin(professors, eq(professors.id, reviews.professorId))
    .where(eq(reviews.userId, profile.id))
    .orderBy(desc(reviews.createdAt));

  const reviewIds = userReviews.map((r) => r.id);
  const fileRows = reviewIds.length
    ? await db
        .select({
          reviewId: reviewFiles.reviewId,
          url: reviewFiles.url,
          originalName: reviewFiles.originalName,
          description: reviewFiles.description,
        })
        .from(reviewFiles)
        .where(inArray(reviewFiles.reviewId, reviewIds))
    : [];
  const filesByReview = new Map<
    string,
    { url: string; originalName: string; description: string | null }[]
  >();
  for (const f of fileRows) {
    const list = filesByReview.get(f.reviewId) ?? [];
    list.push({ url: f.url, originalName: f.originalName, description: f.description });
    filesByReview.set(f.reviewId, list);
  }

  const dateFormat = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const reviewCards: CourseReviewCard[] = userReviews.map((r) => {
    const syllabusPdfUrl = r.syllabusPath ? syllabusPdfPublicUrl(r.syllabusPath) : null;
    const syllabusLink =
      r.syllabusUrl && r.syllabusUrl !== syllabusPdfUrl ? r.syllabusUrl : null;
    return {
      id: r.id,
      isOwn: isOwnProfile,
      courseCode: r.courseCode,
      courseTitle: r.courseTitle,
      professor: r.professor,
      term: r.term,
      year: r.year,
      grade: r.grade,
      overallRating: r.overallRating,
      difficulty: r.difficulty,
      enjoyability: r.enjoyability,
      usefulness: r.usefulness,
      medium: r.medium,
      hasFinalExam: r.hasFinalExam,
      workloadHours: r.workloadHours,
      wouldRecommend: r.wouldRecommend,
      groupwork: r.groupwork,
      body: r.body,
      username: profile.username,
      dateLabel: dateFormat.format(r.createdAt),
      syllabusPdfUrl,
      syllabusLink,
      files: filesByReview.get(r.id) ?? [],
    };
  });

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
            <CourseReviews reviews={reviewCards} showAuthor={false} />
          </div>
        )}
      </div>
    </>
  );
}
