"use client";

import { useSearchParams } from "next/navigation";
import { SearchBox } from "@/components/search-box";

export function CoursesSearchBox() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  return (
    <SearchBox
      key={query}
      variant="glass"
      defaultValue={query}
      placeholder="Search by code or title"
    />
  );
}
