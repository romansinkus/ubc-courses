"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useCoursesBrowseNav } from "@/components/courses-browse-nav";
import { glassFilterCheckboxClass } from "@/lib/glass-styles";
import { parseHasReviewsParam } from "@/lib/course-filters";

export function HasReviewsFilter({ checked }: { checked?: boolean }) {
  const searchParams = useSearchParams();
  const { pushParams } = useCoursesBrowseNav();
  const [optimisticChecked, setOptimisticChecked] = useState<boolean | null>(null);

  const fromUrl = parseHasReviewsParam(searchParams.get("reviewed"));
  const resolvedChecked = checked ?? fromUrl;
  const displayedChecked = optimisticChecked ?? resolvedChecked;

  useEffect(() => {
    setOptimisticChecked(null);
  }, [resolvedChecked]);

  function toggle(nextChecked: boolean) {
    setOptimisticChecked(nextChecked);
    pushParams({ reviewed: nextChecked ? null : "0" });
  }

  return (
    <label htmlFor="filter-has-reviews" className="flex items-center gap-2">
      <Checkbox
        id="filter-has-reviews"
        checked={displayedChecked}
        onCheckedChange={(value) => toggle(value === true)}
        className={glassFilterCheckboxClass}
      />
      <span className="cursor-pointer select-none text-sm leading-none text-muted-foreground">
        Only courses with reviews
      </span>
    </label>
  );
}
