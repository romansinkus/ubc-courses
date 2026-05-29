import { StatCard, type DistributionBin } from "@/components/stat-card";
import { TooltipProvider } from "@/components/ui/tooltip";

export type CourseAggregateStats = {
  count: number;
  avgRating: number | null;
  avgDifficulty: number | null;
  avgEnjoyability: number | null;
  avgUsefulness: number | null;
  avgWorkload: number | null;
};

export type CourseDistributions = {
  overall: DistributionBin[];
  difficulty: DistributionBin[];
  enjoyability: DistributionBin[];
  usefulness: DistributionBin[];
  workload: DistributionBin[];
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

export function CourseAggregateSummary({
  stats,
  distributions,
}: {
  stats: CourseAggregateStats;
  distributions: CourseDistributions;
}) {
  if (stats.count <= 0) return null;

  return (
    <TooltipProvider delay={150}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.avgRating != null ? (
          <StatCard
            label="Overall"
            value={stats.avgRating.toFixed(1)}
            unit="/10"
            distribution={distributions.overall}
          />
        ) : null}
        {stats.avgDifficulty != null ? (
          <StatCard
            label="Difficulty"
            value={stats.avgDifficulty.toFixed(1)}
            unit="/10"
            distribution={distributions.difficulty}
          />
        ) : null}
        {stats.avgEnjoyability != null ? (
          <StatCard
            label="Enjoyability"
            value={stats.avgEnjoyability.toFixed(1)}
            unit="/10"
            distribution={distributions.enjoyability}
          />
        ) : null}
        {stats.avgUsefulness != null ? (
          <StatCard
            label="Usefulness"
            value={stats.avgUsefulness.toFixed(1)}
            unit="/10"
            distribution={distributions.usefulness}
          />
        ) : null}
        {stats.avgWorkload != null ? (
          <StatCard
            label="Workload"
            value={stats.avgWorkload.toFixed(1)}
            unit="h/wk"
            distribution={distributions.workload}
          />
        ) : null}
      </div>
    </TooltipProvider>
  );
}
