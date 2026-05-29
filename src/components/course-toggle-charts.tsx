import { cn } from "@/lib/utils";
import { glassDividerClass, glassFormSectionTitleClass, glassTileClass } from "@/lib/glass-styles";

export type ChartSegment = { label: string; value: number; color: string };
export type ToggleChart = { title: string; segments: ChartSegment[] };

function BarChartCard({ chart }: { chart: ToggleChart }) {
  const present = chart.segments.filter((s) => s.value > 0);
  const total = present.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className={cn(glassTileClass, "space-y-3 p-4")}>
      <h4 className="text-sm font-semibold">{chart.title}</h4>
      <ul className="space-y-2">
        {present.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <li key={s.label} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate">{s.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {s.value} · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CourseToggleCharts({ charts }: { charts: ToggleChart[] }) {
  const visible = charts.filter((c) => c.segments.some((s) => s.value > 0));
  if (visible.length === 0) return null;

  return (
    <div className={cn("space-y-4 border-t pt-6", glassDividerClass)}>
      <h3 className={glassFormSectionTitleClass}>Class breakdown</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((c) => (
          <BarChartCard key={c.title} chart={c} />
        ))}
      </div>
    </div>
  );
}
