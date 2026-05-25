import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/db";
import { courses, professors, reviews } from "@/db/schema";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/auth";
import { generateTermOptions } from "@/lib/terms";
import { ProfessorPicker } from "@/components/professor-picker";
import { RatingBarInput } from "@/components/rating-bar";
import { TermYearSelect } from "@/components/term-year-select";
import { AssessmentTypePicker } from "@/components/assessment-type-picker";
import { MediumPicker } from "@/components/medium-picker";
import { WOULD_RECOMMEND_LABEL } from "@/lib/would-recommend";
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

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(`/courses/${courseCode}/review`)}`);
  }

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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Review {course.code}: {course.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitReview} className="space-y-5">
            <input type="hidden" name="courseCode" value={course.code} />

            <div className="space-y-1.5">
              <Label htmlFor="termYear">When did you take it?</Label>
              <TermYearSelect
                id="termYear"
                name="termYear"
                defaultValue={`${currentYear}-1`}
                options={termOptions}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="professor">Professor</Label>
                <ProfessorPicker profs={existingProfs} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade">Grade received</Label>
                <Select name="grade" required>
                  <SelectTrigger id="grade" className="w-full">
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

            <div className="space-y-4">
              <p className="text-sm font-medium">Ratings (0–10)</p>
              <RatingBarInput id="overallRating" name="overallRating" label="Overall" />
              <RatingBarInput id="difficulty" name="difficulty" label="Difficulty" />
              <RatingBarInput id="enjoyability" name="enjoyability" label="Enjoyability" />
              <RatingBarInput id="usefulness" name="usefulness" label="Usefulness" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="workloadHours">Workload (hrs/wk)</Label>
              <Input
                id="workloadHours"
                name="workloadHours"
                type="number"
                min={0}
                max={80}
                placeholder="10"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Medium</Label>
              <MediumPicker />
            </div>

            <div className="space-y-1.5">
              <Label>Assessment style</Label>
              <AssessmentTypePicker />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="groupwork">Groupwork?</Label>
                <Select name="groupwork" required>
                  <SelectTrigger id="groupwork" className="w-full">
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
                  <SelectTrigger id="wouldRecommend" className="w-full">
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
              />
            </div>

            {error ? <p className="text-sm text-red-600">{decodeURIComponent(error)}</p> : null}

            <Button type="submit" className="w-full">
              Submit review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
