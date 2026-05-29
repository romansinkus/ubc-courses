"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { glassOutlineButtonClass } from "@/lib/glass-styles";

export function ReviewBackButton({
  courseCode,
  confirmLeave = true,
}: {
  courseCode: string;
  confirmLeave?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const href = `/courses/${encodeURIComponent(courseCode)}`;

  if (!confirmLeave) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(glassOutlineButtonClass, "mb-4 inline-flex")}
        onClick={() => router.push(href)}
      >
        <ArrowLeft />
        Back
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(glassOutlineButtonClass, "mb-4 inline-flex")}
        onClick={() => setOpen(true)}
      >
        <ArrowLeft />
        Back
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this page?</DialogTitle>
            <DialogDescription>
              Going back will delete your progress on this review. You&apos;ll need to fill out the
              form again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                router.push(href);
              }}
            >
              Go back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
