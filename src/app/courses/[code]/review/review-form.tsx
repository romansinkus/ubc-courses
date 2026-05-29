"use client";

import { useActionState, useState } from "react";
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
import { Paperclip, X } from "lucide-react";
import { ProfessorPicker } from "@/components/professor-picker";
import { RatingBarInput } from "@/components/rating-bar";
import { TermYearSelect } from "@/components/term-year-select";
import { AssessmentTypePicker } from "@/components/assessment-type-picker";
import { GroupworkPicker } from "@/components/groupwork-picker";
import { MediumPicker } from "@/components/medium-picker";
import { WouldRecommendPicker } from "@/components/would-recommend-picker";
import { MultiFileInput } from "@/components/multi-file-input";
import { cn } from "@/lib/utils";
import type { TermOption } from "@/lib/terms";
import {
  GRADES,
  type ReviewFormDefaults,
} from "@/lib/review-form-schema";
import {
  glassFieldClass,
  glassFileRowClass,
  glassFormSectionClass,
  glassFormSectionTitleClass,
  glassSubmitButtonClass,
} from "@/lib/glass-styles";
import {
  submitReview,
  updateReview,
  type ReviewActionState,
} from "./actions";

const initialState: ReviewActionState = { error: null };

function ExistingAttachments({
  defaults,
  removedFileIds,
  onRemoveFile,
  onRemoveSyllabus,
  syllabusRemoved,
}: {
  defaults: ReviewFormDefaults;
  removedFileIds: string[];
  onRemoveFile: (id: string) => void;
  onRemoveSyllabus: () => void;
  syllabusRemoved: boolean;
}) {
  const visibleFiles = defaults.existingFiles.filter((f) => !removedFileIds.includes(f.id));
  const showSyllabus = defaults.hasSyllabusPdf && !syllabusRemoved;

  if (!showSyllabus && visibleFiles.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Currently attached</p>
      <ul className="space-y-1.5">
        {showSyllabus ? (
          <li className={cn("flex items-center gap-2 text-sm", glassFileRowClass)}>
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">Syllabus PDF</span>
            <button
              type="button"
              onClick={onRemoveSyllabus}
              aria-label="Remove syllabus PDF"
              className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ) : null}
        {visibleFiles.map((f) => (
          <li key={f.id} className={cn("flex items-center gap-2 text-sm", glassFileRowClass)}>
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{f.originalName}</span>
            <button
              type="button"
              onClick={() => onRemoveFile(f.id)}
              aria-label={`Remove ${f.originalName}`}
              className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewForm({
  courseCode,
  termOptions,
  defaultTermYear,
  mode = "create",
  reviewId,
  defaults,
}: {
  courseCode: string;
  termOptions: TermOption[];
  defaultTermYear: string;
  mode?: "create" | "edit";
  reviewId?: string;
  defaults?: ReviewFormDefaults;
}) {
  const action = mode === "edit" ? updateReview : submitReview;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [removedFileIds, setRemovedFileIds] = useState<string[]>([]);
  const [syllabusRemoved, setSyllabusRemoved] = useState(false);

  const isEdit = mode === "edit" && defaults;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="courseCode" value={courseCode} />
      {reviewId ? <input type="hidden" name="reviewId" value={reviewId} /> : null}
      {syllabusRemoved ? <input type="hidden" name="removeSyllabusPdf" value="1" /> : null}
      {removedFileIds.map((id) => (
        <input key={id} type="hidden" name="removeFileIds" value={id} />
      ))}

      <section className={glassFormSectionClass}>
        <h2 className={glassFormSectionTitleClass}>When you took it</h2>
        <div className="space-y-1.5">
          <Label htmlFor="termYear">When did you take it?</Label>
          <TermYearSelect
            id="termYear"
            name="termYear"
            defaultValue={defaults?.termYear ?? defaultTermYear}
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
            <ProfessorPicker
              variant="glass"
              defaultProfessor={defaults?.professor ?? null}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grade">Grade received</Label>
            <Select name="grade" required defaultValue={defaults?.grade ?? undefined}>
              <SelectTrigger id="grade" className={cn("w-full", glassFieldClass)}>
                <SelectValue placeholder="Pick a grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
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
            defaultValue={defaults?.overallRating}
            variant="glass"
          />
          <RatingBarInput
            id="difficulty"
            name="difficulty"
            label="Difficulty"
            defaultValue={defaults?.difficulty}
            variant="glass"
          />
          <RatingBarInput
            id="enjoyability"
            name="enjoyability"
            label="Enjoyability"
            defaultValue={defaults?.enjoyability}
            variant="glass"
          />
          <RatingBarInput
            id="usefulness"
            name="usefulness"
            label="Usefulness"
            defaultValue={defaults?.usefulness}
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
              defaultValue={defaults?.workloadHours ?? undefined}
              className={glassFieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Medium</Label>
            <MediumPicker variant="glass" defaultValue={defaults?.medium ?? "hybrid"} />
          </div>

          <div className="space-y-1.5">
            <Label>Is there a final exam?</Label>
            <AssessmentTypePicker variant="glass" defaultValue={defaults?.hasFinalExam ?? "no"} />
          </div>

          <div className="space-y-1.5">
            <Label>Groupwork?</Label>
            <GroupworkPicker variant="glass" defaultValue={defaults?.groupwork ?? "optional"} />
          </div>

          <div className="space-y-1.5">
            <Label>Would recommend?</Label>
            <WouldRecommendPicker
              variant="glass"
              defaultValue={defaults?.wouldRecommend ?? "maybe"}
            />
          </div>
        </div>
      </section>

      <section className={glassFormSectionClass}>
        <h2 className={glassFormSectionTitleClass}>Your review</h2>
        <div className="space-y-3">
          {!isEdit ? (
            <div id="body-prompts" className="space-y-1 text-sm text-muted-foreground">
              <p>What was the workload like?</p>
              <p>Was the prof good?</p>
              <p>What would you tell yourself before taking this course?</p>
              <p>Any other comments?</p>
            </div>
          ) : null}
          <Textarea
            id="body"
            name="body"
            maxLength={5000}
            rows={10}
            placeholder="Write your review…"
            aria-describedby={isEdit ? undefined : "body-prompts"}
            defaultValue={defaults?.body ?? ""}
            className={cn(glassFieldClass, "min-h-40 [field-sizing:fixed]")}
          />
        </div>
      </section>

      <section className={glassFormSectionClass}>
        <h2 className={glassFormSectionTitleClass}>Attachments</h2>
        <div className="space-y-4">
          {isEdit ? (
            <ExistingAttachments
              defaults={defaults}
              removedFileIds={removedFileIds}
              onRemoveFile={(id) => setRemovedFileIds((prev) => [...prev, id])}
              onRemoveSyllabus={() => setSyllabusRemoved(true)}
              syllabusRemoved={syllabusRemoved}
            />
          ) : null}

          <div className="space-y-1.5">
            <Label>Syllabus (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Upload a PDF, paste a link, or both. Max 5MB for uploads.
            </p>
            <MultiFileInput
              name="syllabus"
              accept="application/pdf"
              maxFiles={1}
              buttonLabel={isEdit ? "Replace syllabus PDF" : "Add syllabus PDF"}
              variant="glass"
            />
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="syllabusLink">Syllabus link</Label>
              <Input
                id="syllabusLink"
                name="syllabusLink"
                type="url"
                inputMode="url"
                placeholder="https://..."
                defaultValue={defaults?.syllabusLink ?? ""}
                className={glassFieldClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Additional files (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Notes, past exams, study guides, etc. PDF, images, text, or Word — up to 5 files, 5MB
              each.
            </p>
            <MultiFileInput
              name="files"
              accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              variant="glass"
              descriptionName="fileDescriptions"
              descriptionLabel="Name"
              descriptionPlaceholder="e.g. Midterm 1 study guide"
              descriptionRequired
            />
          </div>
        </div>
      </section>

      {state.error ? (
        <div className="space-y-1 text-sm text-red-600">
          <p>{state.error}</p>
          <p className="text-muted-foreground">
            If you attached files, you may need to add them again before resubmitting.
          </p>
        </div>
      ) : null}

      <Button type="submit" className={glassSubmitButtonClass} disabled={pending}>
        {pending
          ? mode === "edit"
            ? "Saving…"
            : "Submitting…"
          : mode === "edit"
            ? "Save changes"
            : "Submit review"}
      </Button>
    </form>
  );
}
