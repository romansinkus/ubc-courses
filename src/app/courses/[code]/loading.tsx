import { LiveBackground } from "@/components/live-background";
import { cn } from "@/lib/utils";
import {
  glassContentCardClass,
  glassSurfaceClass,
  glassTileClass,
} from "@/lib/glass-styles";

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-ubc-blue-300/25", className)}
      aria-hidden="true"
    />
  );
}

function StatTileSkeleton() {
  return (
    <div className={cn(glassTileClass, "flex flex-col gap-2 px-3 py-3")}>
      <Bar className="h-3 w-16" />
      <Bar className="h-5 w-12" />
    </div>
  );
}

function ReviewCardSkeleton() {
  return (
    <div className={glassContentCardClass}>
      <div className="flex gap-3">
        {/* vote column */}
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <Bar className="size-5" />
          <Bar className="h-4 w-4" />
          <Bar className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {/* badge row */}
          <div className="flex flex-wrap gap-2">
            <Bar className="h-5 w-20" />
            <Bar className="h-5 w-24" />
            <Bar className="h-5 w-16" />
          </div>
          {/* rating tiles */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
          </div>
          {/* review body box */}
          <div className={cn(glassTileClass, "space-y-2 px-3 py-2")}>
            <Bar className="h-3 w-14" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-11/12" />
            <Bar className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseLoading() {
  return (
    <>
      <LiveBackground />
      <div className="relative mx-auto max-w-3xl space-y-8 px-4 py-10 pb-16">
        {/* Course header */}
        <div className={cn(glassSurfaceClass, "rounded-2xl p-6 sm:p-8")}>
          <div className="space-y-2">
            <Bar className="h-4 w-16" />
            <Bar className="h-8 w-40" />
            <Bar className="h-5 w-64" />
            <Bar className="h-4 w-32" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatTileSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ReviewCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
