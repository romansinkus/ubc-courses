import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LiveBackground } from "@/components/live-background";
import { db } from "@/db";
import { courses, professors, reviews } from "@/db/schema";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { requireCompleteProfile } from "@/lib/auth";
import { generateTermOptions } from "@/lib/terms";
import { ProfessorPicker } from "@/components/professor-picker";
import { RatingBarInput } from "@/components/rating-bar";
import { TermYearSelect } from "@/components/term-year-select";
import { AssessmentTypePicker } from "@/components/assessment-type-picker";
import { MediumPicker } from "@/components/medium-picker";
import { MultiFileInput } from "@/components/multi-file-input";
import { WOULD_RECOMMEND_LABEL } from "@/lib/would-recommend";
import { cn } from "@/lib/utils";
import {
  glassFieldClass,
  glassFormSectionClass,
  glassFormSectionTitleClass,
  glassSubmitButtonClass,
  glassSurfaceClass,
} from "@/lib/glass-styles";
import { submitReview } from "./actions";

type Params = Promise<{ code: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function WriteReviewPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { code } = await params;
  const { error } = await searchParams;
  const courseCode = decodeURIComponent(code).toUpperCase();

  await requireCompleteProfile(`/courses/${courseCode}/review`);

  const [course] = await db.select().from(courses).where(eq(courses.code, courseCode)).limit(1);
  if (!course) notFound();

  const profRows = await db
    .selectDistinct({ name: professors.name })
    .from(professors)
    .innerJoin(reviews, eq(reviews.professorId, professors.id))
    .where(and(eq(reviews.courseId, course.id), isNotNull(professors.name)))
    .orderBy(asc(professors.name));
  const existingProfs = profRows.map((r) => r.name);

  const currentYear = new Date().getFullYear();
  const termOptions = generateTermOptions();

  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-2xl px-4 py-10 pb-16">
        <div className={cn(glassSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
          <header className="mb-8 border-b border-white/40 pb-6 dark:border-white/15">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Write a review
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {course.code}: {course.title}
            </h1>
          </header>

          <form action={submitReview} className="space-y-6">
            <input type="hidden" name="courseCode" value={course.code} />

            <section className={glassFormSectionClass}>
              <h2 className={glassFormSectionTitleClass}>When you took it</h2>
              <div className="space-y-1.5">
                <Label htmlFor="termYear">When did you take it?</Label>
                <TermYearSelect
                  id="termYear"
                  name="termYear"
                  defaultValue={`${currentYear}-1`}
                  options={termOptions}
                  required
                  variant="glass"
                />
              </div>
            </section>

            <section className={glassFormSectionClass}>
              <h2 className={glassFormSectionTitleClass}>Professor & grade</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="professor">Professor</Label>
                  <ProfessorPicker profs={existingProfs} variant="glass" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="grade">Grade received</Label>
                  <Select name="grade" required>
                    <SelectTrigger id="grade" className={cn("w-full", glassFieldClass)}>
                      <SelectValue placeholder="Pick a grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "Credit"].map(
                        (g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className={glassFormSectionClass}>
              <h2 className={glassFormSectionTitleClass}>Ratings</h2>
              <p className="text-sm text-muted-foreground">All ratings use a 0–10 scale.</p>
              <div className="space-y-4">
                <RatingBarInput
                  id="overallRating"
                  name="overallRating"
                  label="Overall"
                  variant="glass"
                />
                <RatingBarInput
                  id="difficulty"
                  name="difficulty"
                  label="Difficulty"
                  variant="glass"
                />
                <RatingBarInput
                  id="enjoyability"
                  name="enjoyability"
                  label="Enjoyability"
                  variant="glass"
                />
                <RatingBarInput
                  id="usefulness"
                  name="usefulness"
                  label="Usefulness"
                  variant="glass"
                />
              </div>
            </section>

            <section className={glassFormSectionClass}>
              <h2 className={glassFormSectionTitleClass}>Course details</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="workloadHours">Workload (hrs/wk)</Label>
                  <Input
                    id="workloadHours"
                    name="workloadHours"
                    type="number"
                    min={0}
                    max={80}
                    placeholder="10"
                    className={glassFieldClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Medium</Label>
                  <MediumPicker variant="glass" />
                </div>

                <div className="space-y-1.5">
                  <Label>Assessment style</Label>
                  <AssessmentTypePicker variant="glass" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="groupwork">Groupwork?</Label>
                    <Select name="groupwork" required>
                      <SelectTrigger id="groupwork" className={cn("w-full", glassFieldClass)}>
                        <SelectValue placeholder="Yes or no" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wouldRecommend">Would recommend?</Label>
                    <Select name="wouldRecommend">
                      <SelectTrigger id="wouldRecommend" className={cn("w-full", glassFieldClass)}>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">{WOULD_RECOMMEND_LABEL.yes}</SelectItem>
                        <SelectItem value="no">{WOULD_RECOMMEND_LABEL.no}</SelectItem>
                        <SelectItem value="maybe">{WOULD_RECOMMEND_LABEL.maybe}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </section>

            <section className={glassFormSectionClass}>
              <h2 className={glassFormSectionTitleClass}>Your review</h2>
              <div className="space-y-1.5">
                <Label htmlFor="body">Review</Label>
                <Textarea
                  id="body"
                  name="body"
                  required
                  minLength={20}
                  maxLength={5000}
                  rows={8}
                  placeholder="What was the workload like? Was the prof good? What would you tell yourself before taking this course?"
                  className={glassFieldClass}
                />
              </div>
            </section>

            <section className={glassFormSectionClass}>
              <h2 className={glassFormSectionTitleClass}>Attachments</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Syllabus (PDF, optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Attach the course syllabus to help others. Max 5MB.
                  </p>
                  <MultiFileInput
                    name="syllabus"
                    accept="application/pdf"
                    maxFiles={1}
                    buttonLabel="Add syllabus"
                    variant="glass"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Additional files (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Notes, past exams, study guides, etc. PDF, images, text, or Word — up to 5
                    files, 5MB each.
                  </p>
                  <MultiFileInput
                    name="files"
                    accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    variant="glass"
                  />
                </div>
              </div>
            </section>

            {error ? <p className="text-sm text-red-600">{decodeURIComponent(error)}</p> : null}

            <Button type="submit" className={glassSubmitButtonClass}>
              Submit review
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
