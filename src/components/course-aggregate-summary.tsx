import { RatingBarDisplay } from "@/components/rating-bar";

export type CourseAggregateStats = {
  count: number;
  avgRating: number | null;
  avgDifficulty: number | null;
  avgEnjoyability: number | null;
  avgUsefulness: number | null;
  avgWorkload: number | null;
};

function asNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeCourseStats(raw: {
  count: unknown;
  avgRating: unknown;
  avgDifficulty: unknown;
  avgEnjoyability: unknown;
  avgUsefulness: unknown;
  avgWorkload: unknown;
}): CourseAggregateStats {
  return {
    count: asNumber(raw.count) ?? 0,
    avgRating: asNumber(raw.avgRating),
    avgDifficulty: asNumber(raw.avgDifficulty),
    avgEnjoyability: asNumber(raw.avgEnjoyability),
    avgUsefulness: asNumber(raw.avgUsefulness),
    avgWorkload: asNumber(raw.avgWorkload),
  };
}

function average(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

export function statsFromReviews(
  rows: Array<{
    overallRating: number;
    difficulty: number;
    enjoyability: number | null;
    usefulness: number | null;
    workloadHours: number | null;
  }>,
): CourseAggregateStats {
  return {
    count: rows.length,
    avgRating: average(rows.map((r) => r.overallRating)),
    avgDifficulty: average(rows.map((r) => r.difficulty)),
    avgEnjoyability: average(rows.map((r) => r.enjoyability)),
    avgUsefulness: average(rows.map((r) => r.usefulness)),
    avgWorkload: average(rows.map((r) => r.workloadHours)),
  };
}

export function resolveCourseStats(
  fromDb: CourseAggregateStats,
  reviews: Array<{
    overallRating: number;
    difficulty: number;
    enjoyability: number | null;
    usefulness: number | null;
    workloadHours: number | null;
  }>,
): CourseAggregateStats {
  if (fromDb.count > 0) return fromDb;
  if (reviews.length === 0) return fromDb;
  return statsFromReviews(reviews);
}

export function CourseAggregateSummary({ stats }: { stats: CourseAggregateStats }) {
  if (stats.count <= 0) return null;

  return (
    <section
      aria-labelledby="course-summary-heading"
      className="rounded-xl border bg-muted/30 p-5 space-y-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="course-summary-heading" className="text-lg font-semibold">
          Course summary
        </h2>
        <p className="text-sm font-medium tabular-nums">
          {stats.count} review{stats.count === 1 ? "" : "s"}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.avgRating != null ? (
          <RatingBarDisplay label="Overall" value={stats.avgRating} average />
        ) : null}
        {stats.avgDifficulty != null ? (
          <RatingBarDisplay label="Difficulty" value={stats.avgDifficulty} average />
        ) : null}
        {stats.avgEnjoyability != null ? (
          <RatingBarDisplay label="Enjoyability" value={stats.avgEnjoyability} average />
        ) : null}
        {stats.avgUsefulness != null ? (
          <RatingBarDisplay label="Usefulness" value={stats.avgUsefulness} average />
        ) : null}
      </div>
      {stats.avgWorkload != null ? (
        <div className="flex items-baseline justify-between gap-2 border-t pt-4 text-sm">
          <span className="text-muted-foreground">Avg workload</span>
          <span className="font-medium tabular-nums">{stats.avgWorkload.toFixed(1)} h/wk</span>
        </div>
      ) : null}
    </section>
  );
}
