"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  glassFieldClass,
  glassSegmentedControlClass,
  glassSegmentedOptionClass,
  glassTileClass,
} from "@/lib/glass-styles";

export type CoursePoint = {
  code: string;
  subject: string;
  title: string;
  n: number;
  overall: number | null;
  difficulty: number | null;
  enjoyability: number | null;
  usefulness: number | null;
  workload: number | null;
};

type MetricKey = "overall" | "difficulty" | "enjoyability" | "usefulness" | "workload";

const METRICS: { key: MetricKey; label: string; max: number | null }[] = [
  { key: "overall", label: "Overall rating", max: 5 },
  { key: "difficulty", label: "Difficulty", max: 5 },
  { key: "enjoyability", label: "Enjoyability", max: 5 },
  { key: "usefulness", label: "Usefulness", max: 5 },
  { key: "workload", label: "Workload (h/wk)", max: null },
];

const metricByKey = (key: MetricKey) => METRICS.find((m) => m.key === key)!;
const isMetricKey = (v: string | undefined): v is MetricKey => METRICS.some((m) => m.key === v);

// SVG plot geometry (viewBox units; the SVG itself scales to its container).
const W = 640;
const H = 430;
const M = { top: 20, right: 24, bottom: 52, left: 56 };
const plotW = W - M.left - M.right;
const plotH = H - M.top - M.bottom;
const CHIP_H = 18;
const STACK = 22; // vertical spacing between tied course chips
const chipWidth = (code: string) => code.length * 6.6 + 16;

function axisConfig(metricMax: number | null, values: number[]) {
  if (metricMax != null) {
    return { max: metricMax, ticks: Array.from({ length: metricMax + 1 }, (_, i) => i) };
  }
  const dataMax = values.length ? Math.max(...values) : 0;
  const max = Math.max(5, Math.ceil(dataMax / 5) * 5);
  return { max, ticks: Array.from({ length: 6 }, (_, i) => (i * max) / 5) };
}

const fmtTick = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(0));

export function VisualComparisons({
  points,
  subjects,
  initialAxes,
  initialSubject,
  initialX,
  initialY,
}: {
  points: CoursePoint[];
  subjects: string[];
  initialAxes?: number;
  initialSubject?: string;
  initialX?: string;
  initialY?: string;
}) {
  const router = useRouter();
  const [axes, setAxes] = useState<1 | 2>(initialAxes === 1 ? 1 : 2);
  const [subject, setSubject] = useState(
    initialSubject && (initialSubject === "all" || subjects.includes(initialSubject))
      ? initialSubject
      : "all",
  );
  const [xKey, setXKey] = useState<MetricKey>(isMetricKey(initialX) ? initialX : "difficulty");
  const [yKey, setYKey] = useState<MetricKey>(isMetricKey(initialY) ? initialY : "usefulness");
  const [hovered, setHovered] = useState<number | null>(null);

  // Carry the current selections into the course URL so the course page can
  // offer a "Back to compare" link that restores them.
  const openCourse = (code: string) => {
    const qs = new URLSearchParams({
      from: "compare",
      axes: String(axes),
      subject,
      x: xKey,
      y: yKey,
    });
    router.push(`/courses/${encodeURIComponent(code)}?${qs.toString()}`);
  };

  const xMetric = metricByKey(xKey);
  const yMetric = metricByKey(yKey);

  const filtered = useMemo(
    () =>
      points.filter(
        (p) =>
          (subject === "all" || p.subject === subject) &&
          p[xKey] != null &&
          (axes === 1 || p[yKey] != null),
      ),
    [points, subject, xKey, yKey, axes],
  );

  const xAxis = useMemo(
    () => axisConfig(xMetric.max, filtered.map((p) => p[xKey] as number)),
    [filtered, xKey, xMetric.max],
  );
  const yAxis = useMemo(
    () => axisConfig(yMetric.max, filtered.map((p) => p[yKey] as number)),
    [filtered, yKey, yMetric.max],
  );

  const xScale = (v: number) => M.left + (xAxis.max === 0 ? 0 : (v / xAxis.max) * plotW);
  const yScale = (v: number) =>
    M.top + plotH - (yAxis.max === 0 ? 0 : (v / yAxis.max) * plotH);

  // The single-axis baseline runs through the vertical middle of the plot.
  const baselineY = M.top + plotH / 2;

  // Position every chip, then stack courses that land on the same spot so they
  // don't overlap — the smaller course code sits highest.
  const placed = useMemo(() => {
    const base = filtered.map((p, i) => ({
      i,
      code: p.code,
      cx: xScale(p[xKey] as number),
      cy: axes === 2 ? yScale(p[yKey] as number) : baselineY,
      key:
        axes === 2
          ? `${(p[xKey] as number).toFixed(2)}|${(p[yKey] as number).toFixed(2)}`
          : (p[xKey] as number).toFixed(2),
    }));

    const groups = new Map<string, typeof base>();
    for (const b of base) {
      const g = groups.get(b.key);
      if (g) g.push(b);
      else groups.set(b.key, [b]);
    }

    const offset: Record<number, number> = {};
    for (const g of groups.values()) {
      g.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      g.forEach((b, k) => {
        offset[b.i] = (k - (g.length - 1) / 2) * STACK;
      });
    }

    return base.map((b) => ({ ...b, cy: b.cy + offset[b.i] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, axes, xKey, yKey, xAxis.max, yAxis.max]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Axes</Label>
          <div className={cn("inline-flex rounded-lg border p-1", glassSegmentedControlClass)}>
            {[
              { value: 1, label: "1 axis" },
              { value: 2, label: "2 axes" },
            ].map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="vc-axes"
                  value={opt.value}
                  checked={axes === opt.value}
                  onChange={() => setAxes(opt.value as 1 | 2)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-center text-sm font-medium text-muted-foreground transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-checked:text-foreground",
                    glassSegmentedOptionClass,
                  )}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="min-w-[10rem] flex-1 space-y-1.5">
          <Label htmlFor="vc-subject">Subject</Label>
          <Select value={subject} onValueChange={(v) => v && setSubject(v)}>
            <SelectTrigger id="vc-subject" className={cn(glassFieldClass, "w-full")}>
              <SelectValue placeholder="All subjects">
                {subject === "all" ? "All subjects" : subject}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[10rem] flex-1 space-y-1.5">
          <Label htmlFor="vc-x">{axes === 2 ? "X axis" : "Metric"}</Label>
          <Select value={xKey} onValueChange={(v) => v && setXKey(v as MetricKey)}>
            <SelectTrigger id="vc-x" className={cn(glassFieldClass, "w-full")}>
              <SelectValue>{xMetric.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {METRICS.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {axes === 2 && (
          <div className="min-w-[10rem] flex-1 space-y-1.5">
            <Label htmlFor="vc-y">Y axis</Label>
            <Select value={yKey} onValueChange={(v) => v && setYKey(v as MetricKey)}>
              <SelectTrigger id="vc-y" className={cn(glassFieldClass, "w-full")}>
                <SelectValue>{yMetric.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className={cn(glassTileClass, "p-4")}>
        {filtered.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            {points.length === 0
              ? "No course data yet — once courses have reviews, they'll show up here."
              : "No courses in this selection have the chosen metric. Try a different metric or subject."}
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={
              axes === 2
                ? `Plot of ${xMetric.label} versus ${yMetric.label}`
                : `Plot of courses by ${xMetric.label}`
            }
          >
            {/* gridlines + ticks */}
            {axes === 2 &&
              yAxis.ticks.map((t) => {
                const y = yScale(t);
                return (
                  <g key={`y-${t}`}>
                    <line
                      x1={M.left}
                      y1={y}
                      x2={W - M.right}
                      y2={y}
                      className="stroke-current text-foreground/10"
                    />
                    <text
                      x={M.left - 8}
                      y={y}
                      dominantBaseline="middle"
                      textAnchor="end"
                      className="fill-current text-muted-foreground"
                      style={{ fontSize: "10px" }}
                    >
                      {fmtTick(t)}
                    </text>
                  </g>
                );
              })}

            {xAxis.ticks.map((t) => {
              const x = xScale(t);
              return (
                <g key={`x-${t}`}>
                  <line
                    x1={x}
                    y1={M.top}
                    x2={x}
                    y2={H - M.bottom}
                    className="stroke-current text-foreground/10"
                  />
                  <text
                    x={x}
                    y={H - M.bottom + 16}
                    textAnchor="middle"
                    className="fill-current text-muted-foreground"
                    style={{ fontSize: "10px" }}
                  >
                    {fmtTick(t)}
                  </text>
                </g>
              );
            })}

            {/* axis lines */}
            {axes === 2 && (
              <line
                x1={M.left}
                y1={M.top}
                x2={M.left}
                y2={H - M.bottom}
                className="stroke-current text-foreground/30"
              />
            )}
            <line
              x1={M.left}
              y1={axes === 2 ? H - M.bottom : baselineY}
              x2={W - M.right}
              y2={axes === 2 ? H - M.bottom : baselineY}
              className="stroke-current text-foreground/30"
            />

            {/* axis titles */}
            <text
              x={M.left + plotW / 2}
              y={H - 8}
              textAnchor="middle"
              className="fill-current text-foreground"
              style={{ fontSize: "12px", fontWeight: 600 }}
            >
              {xMetric.label}
            </text>
            {axes === 2 && (
              <text
                transform={`translate(14 ${M.top + plotH / 2}) rotate(-90)`}
                textAnchor="middle"
                className="fill-current text-foreground"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {yMetric.label}
              </text>
            )}

            {/* course chips */}
            {placed.map((b) => {
              const p = filtered[b.i];
              const isHover = hovered === b.i;
              const w = chipWidth(b.code);
              const tip =
                axes === 2
                  ? `${b.code} — ${xMetric.label}: ${(p[xKey] as number).toFixed(1)}, ${yMetric.label}: ${(p[yKey] as number).toFixed(1)}`
                  : `${b.code} — ${xMetric.label}: ${(p[xKey] as number).toFixed(1)}`;
              return (
                <g
                  key={b.code}
                  role="button"
                  aria-label={tip}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(b.i)}
                  onMouseLeave={() => setHovered((h) => (h === b.i ? null : h))}
                  onClick={() => openCourse(b.code)}
                >
                  <rect
                    x={b.cx - w / 2}
                    y={b.cy - CHIP_H / 2}
                    width={w}
                    height={CHIP_H}
                    rx={6}
                    fill="var(--background)"
                    fillOpacity={isHover ? 0.97 : 0.82}
                    stroke={isHover ? "var(--ubc-blue-500)" : "var(--ubc-blue-300)"}
                    strokeOpacity={isHover ? 1 : 0.7}
                    strokeWidth={isHover ? 1.5 : 1}
                  />
                  <text
                    x={b.cx}
                    y={b.cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--primary)"
                    style={{ fontSize: "11px", fontWeight: isHover ? 700 : 600 }}
                  >
                    {b.code}
                  </text>
                </g>
              );
            })}

            {/* hover tooltip preview */}
            {hovered != null &&
              filtered[hovered] &&
              (() => {
                const b = placed.find((x) => x.i === hovered);
                if (!b) return null;
                const p = filtered[hovered];
                const title = p.title.length > 30 ? `${p.title.slice(0, 29)}…` : p.title;
                const lines: { text: string; bold?: boolean }[] = [
                  { text: p.code, bold: true },
                  { text: title },
                  { text: `${xMetric.label}: ${(p[xKey] as number).toFixed(1)}` },
                  ...(axes === 2
                    ? [{ text: `${yMetric.label}: ${(p[yKey] as number).toFixed(1)}` }]
                    : []),
                  { text: `${p.n} review${p.n === 1 ? "" : "s"}` },
                ];
                const boxW = 208;
                const lineH = 15;
                const boxH = 14 + lines.length * lineH;
                const tx = Math.min(Math.max(b.cx - boxW / 2, 4), W - boxW - 4);
                const above = b.cy - CHIP_H / 2 - boxH - 10;
                const ty = above < M.top ? b.cy + CHIP_H / 2 + 10 : above;
                return (
                  <g pointerEvents="none">
                    <rect
                      x={tx}
                      y={ty}
                      width={boxW}
                      height={boxH}
                      rx={8}
                      fill="var(--background)"
                      className="stroke-current text-foreground/20"
                    />
                    {lines.map((ln, idx) => (
                      <text
                        key={idx}
                        x={tx + 12}
                        y={ty + 18 + idx * lineH}
                        className={cn(
                          "fill-current",
                          ln.bold ? "text-foreground" : "text-muted-foreground",
                        )}
                        style={{ fontSize: ln.bold ? "11px" : "10px", fontWeight: ln.bold ? 700 : 400 }}
                      >
                        {ln.text}
                      </text>
                    ))}
                  </g>
                );
              })()}
          </svg>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} course{filtered.length === 1 ? "" : "s"} shown · each chip is a course
        average · click a chip to open it
      </p>
    </div>
  );
}
