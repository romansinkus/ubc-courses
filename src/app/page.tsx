import { Suspense } from "react";
import { SearchBox } from "@/components/search-box";
import { LiveBackground } from "@/components/live-background";
import { HomeStats, HomeStatsSkeleton } from "@/components/home-stats";
import { HomeFiltersButton } from "@/components/home-filters-button";

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col justify-center px-4 pt-8 pb-44">
        <section className="space-y-4 text-center">
          <Suspense fallback={<HomeStatsSkeleton />}>
            <HomeStats />
          </Suspense>
          <h1 className="text-4xl font-bold tracking-tight">
            Honest reviews and crowd-sourced resources for UBC courses.
          </h1>
          <div className="flex max-w-md mx-auto gap-2">
            <SearchBox variant="glass" />
            <Suspense fallback={null}>
              <HomeFiltersButton />
            </Suspense>
          </div>
        </section>
      </div>
    </>
  );
}
