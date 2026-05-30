"use client";

import { Suspense, type ReactNode } from "react";
import { useCoursesBrowseNav } from "@/components/courses-browse-nav";
import { CoursesBrowseResultsLoading } from "@/components/courses-results";
import { HasReviewsFilter } from "@/components/has-reviews-filter";

export function CoursesBrowseResultsColumn({ children }: { children: ReactNode }) {
  const { isPending } = useCoursesBrowseNav();

  if (isPending) {
    return (
      <CoursesBrowseResultsLoading
        filter={
          <Suspense fallback={null}>
            <HasReviewsFilter />
          </Suspense>
        }
      />
    );
  }

  return children;
}
