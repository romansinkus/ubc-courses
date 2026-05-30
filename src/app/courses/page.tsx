import { Suspense } from "react";
import { SearchBox } from "@/components/search-box";
import { LiveBackground } from "@/components/live-background";
import { CoursesSearchBox } from "@/components/courses-search-box";
import { CoursesBrowseNavProvider } from "@/components/courses-browse-nav";
import {
  CoursesBrowseContent,
  CoursesBrowseSkeleton,
} from "@/components/courses-browse-content";

type SearchParams = Promise<{
  q?: string;
  subjects?: string;
  level?: string;
  term?: string;
  reviewed?: string;
  page?: string;
}>;

export default function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-6xl px-4 lg:flex lg:flex-col">
        <div className="relative z-30 space-y-3 pb-8 pt-4 max-lg:sticky max-lg:top-14 lg:shrink-0">
          <h1 className="text-2xl font-bold">Browse courses</h1>
          <div className="max-w-xl">
            <Suspense
              fallback={<SearchBox variant="glass" placeholder="Search by code or title" />}
            >
              <CoursesSearchBox />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<CoursesBrowseSkeleton />}>
          <CoursesBrowseNavProvider>
            <CoursesBrowseContent searchParams={searchParams} />
          </CoursesBrowseNavProvider>
        </Suspense>
      </div>
    </>
  );
}
