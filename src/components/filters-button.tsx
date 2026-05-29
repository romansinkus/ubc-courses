"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CoursesFilters } from "@/components/courses-filters";
import { cn } from "@/lib/utils";
import {
  glassFiltersButtonClass,
  glassFiltersSurfaceClass,
} from "@/lib/glass-styles";

export function FiltersButton({
  subjects,
  variant = "default",
}: {
  subjects: string[];
  variant?: "default" | "glass";
}) {
  const [open, setOpen] = useState(false);
  const isGlass = variant === "glass";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant={isGlass ? "ghost" : "outline"}
            size={isGlass ? "default" : "sm"}
            className={cn(
              isGlass && cn(glassFiltersSurfaceClass, glassFiltersButtonClass),
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        }
      />
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter courses</SheetTitle>
          <SheetDescription>
            Picking a filter will take you to the matching results.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
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
