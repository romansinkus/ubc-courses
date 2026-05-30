import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";

export function CoursesFiltersPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-col p-5", glassSurfaceClass, className)}>
      {children}
    </div>
  );
}

export function CoursesFiltersSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6" aria-busy="true" aria-label="Loading filters">
      <div className="shrink-0 animate-stat-skeleton">
        <div className="h-4 w-16 rounded bg-ubc-blue-300/35 animate-pulse" aria-hidden="true" />
      </div>

      <div className="flex min-h-0 flex-1 animate-stat-skeleton flex-col gap-3">
        <div className="h-4 w-16 rounded bg-ubc-blue-300/35 animate-pulse" aria-hidden="true" />
        <div className="h-9 w-full shrink-0 rounded-lg bg-ubc-blue-300/25 animate-pulse" aria-hidden="true" />
        <div className="min-h-0 flex-1 space-y-2 pt-1">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 shrink-0 rounded bg-ubc-blue-300/30 animate-pulse" aria-hidden="true" />
              <div
                className="h-3.5 rounded bg-ubc-blue-300/25 animate-pulse"
                style={{ width: `${52 + (i % 3) * 14}px` }}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 space-y-3 animate-stat-skeleton" style={{ animationDelay: "0.1s" }}>
        <div className="h-4 w-14 rounded bg-ubc-blue-300/35 animate-pulse" aria-hidden="true" />
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 shrink-0 rounded-full bg-ubc-blue-300/30 animate-pulse" aria-hidden="true" />
              <div
                className="h-3.5 rounded bg-ubc-blue-300/25 animate-pulse"
                style={{ width: `${64 + (i % 2) * 18}px` }}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 animate-stat-skeleton" style={{ animationDelay: "0.2s" }}>
        <div className="h-4 w-12 rounded bg-ubc-blue-300/35 animate-pulse" aria-hidden="true" />
        <div className="h-9 w-full rounded-lg bg-ubc-blue-300/25 animate-pulse" aria-hidden="true" />
      </div>
    </div>
  );
}
