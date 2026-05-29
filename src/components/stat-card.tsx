"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { glassTileClass } from "@/lib/glass-styles";

export type DistributionBin = { label: string; count: number };

export function StatCard({
  label,
  value,
  unit,
  distribution,
}: {
  label: string;
  value: string;
  unit: string;
  distribution: DistributionBin[];
}) {
  const max = distribution.reduce((m, d) => Math.max(m, d.count), 0);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            tabIndex={0}
            className={cn(
              glassTileClass,
              "flex cursor-default flex-col gap-1 p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          />
        }
      >
        <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-xl font-semibold leading-none tabular-nums">
          {value}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="w-60">
        <p className="mb-2 text-xs font-semibold">{label} distribution</p>
        {distribution.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {distribution.map((d) => (
              <li key={d.label} className="flex items-center gap-2 text-xs">
                <span className="w-12 shrink-0 truncate tabular-nums text-muted-foreground">
                  {d.label}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${max ? (d.count / max) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-4 shrink-0 text-right tabular-nums">{d.count}</span>
              </li>
            ))}
          </ul>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
