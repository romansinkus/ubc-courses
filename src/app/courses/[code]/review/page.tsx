import { notFound } from "next/navigation";
import { LiveBackground } from "@/components/live-background";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCompleteProfile } from "@/lib/auth";
import { generateTermOptions } from "@/lib/terms";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";
import { ReviewBackButton } from "./review-back-button";
import { ReviewForm } from "./review-form";

type Params = Promise<{ code: string }>;

export default async function WriteReviewPage({ params }: { params: Params }) {
  const { code } = await params;
  const courseCode = decodeURIComponent(code).toUpperCase();

  await requireCompleteProfile(`/courses/${courseCode}/review`);

  const [course] = await db.select().from(courses).where(eq(courses.code, courseCode)).limit(1);
  if (!course) notFound();

  const currentYear = new Date().getFullYear();
  const termOptions = generateTermOptions();

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-2xl px-4 py-10 pb-16">
        <ReviewBackButton courseCode={course.code} />

        <div className={cn(glassSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
          <header className="mb-8 border-b border-white/40 pb-6 dark:border-white/15">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Write a review
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {course.code}: {course.title}
            </h1>
          </header>

          <ReviewForm
            courseCode={course.code}
            termOptions={termOptions}
            defaultTermYear={`${currentYear}-1`}
          />
        </div>
      </div>
    </>
  );
}
