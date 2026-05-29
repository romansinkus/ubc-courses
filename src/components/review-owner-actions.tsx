"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteReview } from "@/app/courses/[code]/review/actions";
import { cn } from "@/lib/utils";
import { glassOutlineButtonClass } from "@/lib/glass-styles";

export function ReviewOwnerActions({
  reviewId,
  courseCode,
  variant = "default",
}: {
  reviewId: string;
  courseCode: string;
  variant?: "default" | "glass";
}) {
  const isGlass = variant === "glass";
  const editHref = `/courses/${encodeURIComponent(courseCode)}/review/${reviewId}/edit`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={editHref}
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all duration-150 outline-none select-none hover:-translate-y-px focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px [&_svg]:size-3.5",
          isGlass
            ? glassOutlineButtonClass
            : "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        )}
      >
        <Pencil />
        Edit
      </Link>
      <DeleteReviewButton reviewId={reviewId} courseCode={courseCode} variant={variant} />
    </div>
  );
}

function DeleteReviewButton({
  reviewId,
  courseCode,
  variant,
}: {
  reviewId: string;
  courseCode: string;
  variant: "default" | "glass";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isGlass = variant === "glass";

  function confirmDelete() {
    const formData = new FormData();
    formData.set("reviewId", reviewId);
    formData.set("courseCode", courseCode);
    startTransition(async () => {
      await deleteReview(formData);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          isGlass && glassOutlineButtonClass,
          "text-destructive hover:text-destructive",
        )}
        onClick={() => setOpen(true)}
      >
        <Trash2 />
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this review?</DialogTitle>
            <DialogDescription>
              This permanently removes your review and any attached files. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              {pending ? "Deleting…" : "Delete review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
