export function CoursesResultsSkeleton() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 lg:shrink-0">
        <div className="h-4 w-24 rounded bg-ubc-blue-300/30 animate-pulse" aria-hidden="true" />
      </div>

      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-1 lg:pb-6 lg:pt-4 lg:[mask-image:linear-gradient(to_bottom,transparent_0,black_1rem)] lg:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_1rem)]">
        <div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Loading courses"
        >
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              style={{ animationDelay: `${(i % 3) * 0.1}s` }}
              className="animate-stat-skeleton space-y-3 rounded-xl border bg-card px-6 py-5 shadow-sm"
            >
              <div className="h-5 w-20 rounded bg-ubc-blue-300/35 animate-pulse" aria-hidden="true" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-ubc-blue-300/25 animate-pulse" aria-hidden="true" />
                <div className="h-4 w-4/5 rounded bg-ubc-blue-300/20 animate-pulse" aria-hidden="true" />
              </div>
              <div className="h-3 w-28 rounded bg-ubc-blue-300/20 animate-pulse" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
