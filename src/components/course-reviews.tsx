"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FileText, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewOwnerActions } from "@/components/review-owner-actions";
import { finalExamLabel } from "@/components/assessment-type-picker";
import { MEDIUM_LABEL } from "@/components/medium-picker";
import { WOULD_RECOMMEND_BADGE_LABEL } from "@/lib/would-recommend";
import { downloadUrl } from "@/lib/storage-url";
import { formatTermLabel } from "@/lib/terms";
import { cn } from "@/lib/utils";
import {
  glassBadgeClass,
  glassContentCardClass,
  glassFileRowClass,
  glassTileClass,
} from "@/lib/glass-styles";

const TERM_LABEL: Record<string, string> = {
  "1": "Term 1",
  "2": "Term 2",
  summer: "Summer",
};

export type CourseReviewCard = {
  id: string;
  isOwn: boolean;
  courseCode?: string;
  courseTitle?: string;
  professor: string | null;
  term: string;
  year: number;
  grade: string | null;
  overallRating: number;
  difficulty: number;
  enjoyability: number | null;
  usefulness: number | null;
  medium: keyof typeof MEDIUM_LABEL | null;
  hasFinalExam: boolean | null;
  workloadHours: number | null;
  wouldRecommend: keyof typeof WOULD_RECOMMEND_BADGE_LABEL | null;
  groupwork: boolean | null;
  body: string;
  username: string;
  dateLabel: string;
  syllabusPdfUrl: string | null;
  syllabusLink: string | null;
  files: { url: string; originalName: string; description: string | null }[];
};

function RatingStat({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn(glassTileClass, "flex flex-col gap-0.5 px-3 py-2")}>
      <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-lg font-semibold leading-none tabular-nums">
        {value}
        <span className="text-xs font-normal text-muted-foreground">/10</span>
      </span>
    </div>
  );
}

function resolveCourseCode(r: CourseReviewCard, fallback?: string) {
  return r.courseCode ?? fallback ?? "";
}

function ReviewBadges({ r }: { r: CourseReviewCard }) {
  return (
    <>
      {r.courseCode ? (
        <Badge variant="outline" className={glassBadgeClass}>
          <Link
            href={`/courses/${encodeURIComponent(r.courseCode)}`}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {r.courseCode}
          </Link>
        </Badge>
      ) : null}
      {r.courseTitle ? (
        <span className="text-xs font-normal text-muted-foreground">{r.courseTitle}</span>
      ) : null}
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
      {r.workloadHours ? (
        <Badge variant="secondary" className={glassBadgeClass}>
          {r.workloadHours}h/wk
        </Badge>
      ) : null}
      {r.grade ? (
        <Badge variant="secondary" className={glassBadgeClass}>
          Grade: {r.grade}
        </Badge>
      ) : null}
      {r.wouldRecommend ? (
        <Badge variant="secondary" className={glassBadgeClass}>
          {WOULD_RECOMMEND_BADGE_LABEL[r.wouldRecommend]}
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
    </>
  );
}

function AttachmentLinks({ r }: { r: CourseReviewCard }) {
  const hasAny = r.syllabusPdfUrl || r.syllabusLink || r.files.length > 0;
  if (!hasAny) {
    return <p className="text-sm text-muted-foreground">No attachments.</p>;
  }

  const linkClass = cn(
    glassFileRowClass,
    "font-medium transition-colors hover:border-ubc-blue-400/70 hover:bg-background",
  );

  return (
    <div className="flex flex-col gap-2">
      {r.syllabusPdfUrl ? (
        <a href={downloadUrl(r.syllabusPdfUrl, "syllabus.pdf")} download className={linkClass}>
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">
            Syllabus · {formatTermLabel(`${r.year}-${r.term}`)}
          </span>
          <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      ) : null}
      {r.syllabusLink ? (
        <a
          href={r.syllabusLink}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">Syllabus link</span>
          <span className="shrink-0 text-xs text-muted-foreground">Open ↗</span>
        </a>
      ) : null}
      {r.files.map((f) => (
        <a
          key={f.url}
          href={downloadUrl(f.url, f.originalName)}
          download={f.originalName}
          className={cn(linkClass, "items-start")}
        >
          <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block truncate">{f.description ?? f.originalName}</span>
            {f.description ? (
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {f.originalName}
              </span>
            ) : null}
          </span>
          <Download className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}

export function CourseReviews({
  reviews,
  courseCode,
  showAuthor = true,
}: {
  reviews: CourseReviewCard[];
  courseCode?: string;
  showAuthor?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = reviews.find((r) => r.id === selectedId) ?? null;

  return (
    <>
      <div className="space-y-3">
        {reviews.map((r) => {
          const reviewCourseCode = resolveCourseCode(r, courseCode);
          const attachmentCount =
            (r.syllabusPdfUrl ? 1 : 0) + (r.syllabusLink ? 1 : 0) + r.files.length;
          return (
            <article
              key={r.id}
              role="button"
              tabIndex={0}
              aria-label={
                showAuthor
                  ? `Read review by @${r.username}`
                  : `Read review for ${reviewCourseCode || "course"}`
              }
              onClick={() => setSelectedId(r.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(r.id);
                }
              }}
              className={cn(
                glassContentCardClass,
                "cursor-pointer space-y-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-ubc-blue-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <ReviewBadges r={r} />
                </div>
                {r.isOwn ? (
                  <div
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <ReviewOwnerActions
                      reviewId={r.id}
                      courseCode={reviewCourseCode}
                      variant="glass"
                    />
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <RatingStat label="Overall" value={r.overallRating} />
                <RatingStat label="Difficulty" value={r.difficulty} />
                {r.enjoyability != null ? (
                  <RatingStat label="Enjoyability" value={r.enjoyability} />
                ) : null}
                {r.usefulness != null ? (
                  <RatingStat label="Usefulness" value={r.usefulness} />
                ) : null}
              </div>
              <div className="space-y-2 text-sm">
                <p className="line-clamp-3 whitespace-pre-wrap text-muted-foreground">{r.body}</p>
                <div className="flex items-center gap-3 text-xs font-medium text-primary">
                  <span>Read full review →</span>
                  {attachmentCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5" />
                      {attachmentCount} attachment{attachmentCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  {showAuthor ? (
                    <span className="ml-auto font-normal text-muted-foreground">
                      by{" "}
                      <Link
                        href={`/u/${r.username}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{r.username}
                      </Link>
                    </span>
                  ) : (
                    <span className="ml-auto font-normal text-muted-foreground">{r.dateLabel}</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        {selected ? (
          <DialogContent
            className={cn(glassContentCardClass, "max-w-2xl max-h-[85vh] overflow-y-auto p-6")}
          >
            <DialogHeader>
              <DialogTitle>
                {showAuthor ? (
                  <>
                    Review by{" "}
                    <Link href={`/u/${selected.username}`} className="hover:underline">
                      @{selected.username}
                    </Link>
                  </>
                ) : selected.courseCode ? (
                  <>
                    <Link
                      href={`/courses/${encodeURIComponent(selected.courseCode)}`}
                      className="hover:underline"
                    >
                      {selected.courseCode}
                    </Link>
                    {selected.courseTitle ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {selected.courseTitle}
                      </span>
                    ) : null}
                  </>
                ) : (
                  "Review"
                )}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">{selected.dateLabel}</p>
            </DialogHeader>

            <div className="mt-4 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <ReviewBadges r={selected} />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <RatingStat label="Overall" value={selected.overallRating} />
                <RatingStat label="Difficulty" value={selected.difficulty} />
                {selected.enjoyability != null ? (
                  <RatingStat label="Enjoyability" value={selected.enjoyability} />
                ) : null}
                {selected.usefulness != null ? (
                  <RatingStat label="Usefulness" value={selected.usefulness} />
                ) : null}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Review</h3>
                <p className="whitespace-pre-wrap text-sm">{selected.body}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Attachments</h3>
                <AttachmentLinks r={selected} />
              </div>

              {selected.isOwn ? (
                <ReviewOwnerActions
                  reviewId={selected.id}
                  courseCode={resolveCourseCode(selected, courseCode)}
                />
              ) : null}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
