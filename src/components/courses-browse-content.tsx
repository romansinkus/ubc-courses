import { Suspense } from "react";
import { CoursesFilters } from "@/components/courses-filters";
import { CoursesBrowseResults } from "@/components/courses-browse-results";
import { CoursesBrowseResultsColumn } from "@/components/courses-browse-results-column";
import { CoursesFiltersPanel, CoursesFiltersSkeleton } from "@/components/courses-filters-panel";
import { CoursesBrowseResultsLoading } from "@/components/courses-results";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { asc } from "drizzle-orm";
import { parseCourseFilters } from "@/lib/course-filters";

export function CoursesBrowseSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 pb-10 lg:h-[calc(100vh-16rem)] lg:min-h-0 lg:grid-cols-[260px_1fr] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-4 lg:pb-0">
      <div className="hidden lg:col-start-1 lg:row-start-1 lg:block" aria-hidden="true" />
      <CoursesFiltersPanel className="lg:col-start-1 lg:row-start-2 lg:h-full lg:min-h-0">
        <CoursesFiltersSkeleton />
      </CoursesFiltersPanel>
      <CoursesBrowseResultsLoading />
    </div>
  );
}

export async function CoursesBrowseContent({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    subjects?: string;
    level?: string;
    term?: string;
    reviewed?: string;
    page?: string;
  }>;
}) {
  const filters = parseCourseFilters(await searchParams);

  const subjectRows = await db
    .selectDistinct({ subject: courses.subject })
    .from(courses)
    .orderBy(asc(courses.subject));

  const subjects = subjectRows.map((r) => r.subject);

  return (
    <div className="grid grid-cols-1 gap-8 pb-10 lg:h-[calc(100vh-16rem)] lg:min-h-0 lg:grid-cols-[260px_1fr] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-4 lg:pb-0">
      <div className="hidden lg:col-start-1 lg:row-start-1 lg:block" aria-hidden="true" />

      <CoursesFiltersPanel className="lg:col-start-1 lg:row-start-2 lg:h-full lg:min-h-0">
        <CoursesFilters
          subjects={subjects}
          selectedSubjects={filters.selectedSubjects}
          selectedLevels={filters.selectedLevels}
          term={filters.term}
        />
      </CoursesFiltersPanel>

      <CoursesBrowseResultsColumn>
        <Suspense fallback={<CoursesBrowseResultsLoading />}>
          <CoursesBrowseResults searchParams={searchParams} />
        </Suspense>
      </CoursesBrowseResultsColumn>
    </div>
  );
}
