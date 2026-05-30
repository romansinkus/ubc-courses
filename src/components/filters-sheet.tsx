"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CoursesFilters } from "@/components/courses-filters";
import { cn } from "@/lib/utils";
import {
  glassFiltersButtonClass,
  glassFiltersSurfaceClass,
  glassSurfaceClass,
} from "@/lib/glass-styles";

export function FiltersSheet({ subjects }: { subjects: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            className={cn(glassFiltersSurfaceClass, glassFiltersButtonClass)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        }
      />
      <SheetContent
        side="right"
        className={cn(
          "w-full gap-0 overflow-hidden border-l border-white/55 p-0 sm:max-w-[260px]",
          glassSurfaceClass,
          "rounded-none rounded-l-xl",
        )}
      >
        <div className="flex h-full min-h-0 flex-col p-5">
          <CoursesFilters
            subjects={subjects}
            selectedSubjects={[]}
            selectedLevels={[]}
            term="all"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function FiltersSheetTriggerSkeleton() {
  return (
    <div
      className={cn(
        "h-10 w-[6.5rem] shrink-0 animate-pulse rounded-xl bg-ubc-blue-300/25",
        glassFiltersSurfaceClass,
      )}
      aria-hidden="true"
    />
  );
}
