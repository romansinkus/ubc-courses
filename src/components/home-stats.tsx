import { db } from "@/db";
import { sql } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { glassSurfaceClass } from "@/lib/glass-styles";

const STAT_LABELS = ["Reviews", "Contributors", "Files"] as const;

export function HomeStatsSkeleton() {
  return (
    <div
      className="mx-auto grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-4"
      aria-busy="true"
      aria-label="Loading site stats"
    >
      {STAT_LABELS.map((label, i) => (
        <div
          key={label}
          style={{ animationDelay: `${i * 0.15}s` }}
          className={cn(glassSurfaceClass, "animate-stat-skeleton rounded-2xl px-3 py-6 sm:px-4")}
        >
          <div
            className="mx-auto h-9 w-14 rounded-lg bg-ubc-blue-300/35 animate-pulse sm:h-10 sm:w-16"
            aria-hidden="true"
          />
          <div className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

async function getHomeStats() {
  const [statsRow] = await db
    .select({
      reviews: sql<number>`(select count(*)::int from reviews)`,
      syllabi: sql<number>`(select count(*) filter (where syllabus_path is not null)::int from reviews)`,
      files: sql<number>`(select count(*)::int from review_files)`,
      contributors: sql<number>`(select count(*)::int from profiles)`,
    })
    .from(sql`(select 1) as _`);

  return [
    { value: statsRow.reviews, label: "Reviews" as const },
    { value: statsRow.contributors, label: "Contributors" as const },
    { value: statsRow.syllabi + statsRow.files, label: "Files" as const },
  ];
}

export async function HomeStats() {
  const stats = await getHomeStats();

  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{ animationDelay: `${i * 0.45}s` }}
          className={cn(
            glassSurfaceClass,
            "animate-stat-jump rounded-2xl px-3 py-6 will-change-transform sm:px-4",
          )}
        >
          <div className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
            {s.value.toLocaleString()}
          </div>
          <div className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
