"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { glassFieldClass } from "@/lib/glass-styles";
import {
  RATING_DEFAULT,
  RATING_MAX,
  RATING_MIN,
  RATING_STEP,
  RATING_VALUES,
  ratingToPercent,
} from "@/lib/ratings";

function clampRating(value: number): number {
  const snapped = Math.round(value / RATING_STEP) * RATING_STEP;
  return Math.min(RATING_MAX, Math.max(RATING_MIN, snapped));
}

function RatingScoreInput({
  id,
  label,
  value,
  onChange,
  variant = "default",
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  variant?: "default" | "glass";
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const isGlass = variant === "glass";

  function commit(raw: string) {
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) {
      const clamped = clampRating(parsed);
      onChange(clamped);
      setDraft(String(clamped));
      return;
    }
    setDraft(String(value));
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-sm font-medium tabular-nums shadow-sm transition-colors",
        isGlass ? glassFieldClass : "border-input bg-background",
        focused && "ring-2 ring-ring/50",
      )}
      title={`Click or Tab here, then type ${RATING_MIN}–${RATING_MAX}`}
    >
      <label htmlFor={id} className="sr-only">
        {label} score (type {RATING_MIN} to {RATING_MAX})
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        maxLength={3}
        aria-label={`${label} score`}
        placeholder={focused ? `${RATING_MIN}–${RATING_MAX}` : undefined}
        value={focused ? draft : String(value)}
        onFocus={() => {
          setDraft(String(value));
          setFocused(true);
        }}
        onChange={(e) => {
          // Allow digits and a single decimal point (e.g. "3.5").
          const next = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
          setDraft(next);
          const parsed = parseFloat(next);
          if (!Number.isNaN(parsed) && parsed >= RATING_MIN && parsed <= RATING_MAX) {
            onChange(clampRating(parsed));
          }
        }}
        onBlur={() => {
          commit(draft);
          setFocused(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(draft);
            e.currentTarget.blur();
          }
        }}
        className="h-7 w-9 border-0 bg-transparent px-0 text-right outline-none placeholder:text-muted-foreground/70"
      />
      <span className="text-muted-foreground select-none" aria-hidden>
        /{RATING_MAX}
      </span>
    </div>
  );
}

function useDigitEntry(onChange?: (value: number) => void) {
  // A 0–5 scale fits in a single keystroke, so a digit key maps directly to a
  // whole rating. Half-steps are reached via the arrow keys or the score input.
  function handleDigitKey(e: React.KeyboardEvent) {
    if (!onChange || !/^[0-9]$/.test(e.key)) return false;

    e.preventDefault();
    const digit = parseInt(e.key, 10);
    if (digit >= RATING_MIN && digit <= RATING_MAX) {
      onChange(digit);
    }
    return true;
  }

  return { handleDigitKey };
}

function RatingNotch({
  notch,
  value,
  interactive,
  onSelect,
}: {
  notch: number;
  value: number;
  interactive: boolean;
  onSelect?: (value: number) => void;
}) {
  const isSelected = notch === value;
  const isPassed = notch <= value;

  const notchVisual = isSelected ? (
    <span className="block size-4 rounded-full border-2 border-primary bg-background shadow-sm" />
  ) : (
    <span
      className={cn(
        "block size-2 rounded-full",
        isPassed ? "bg-primary/60" : "bg-muted-foreground/35",
      )}
    />
  );

  if (interactive && onSelect) {
    return (
      <button
        type="button"
        aria-label={`${notch} out of ${RATING_MAX}`}
        aria-pressed={isSelected}
        onClick={() => onSelect(notch)}
        className="flex size-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {notchVisual}
      </button>
    );
  }

  return (
    <span className="flex size-4 items-center justify-center" aria-hidden>
      {notchVisual}
    </span>
  );
}

function RatingTrack({
  value,
  onChange,
  id,
  label,
  interactive = true,
  showScale = true,
  displayMode = "discrete",
  className,
}: {
  value: number;
  onChange?: (value: number) => void;
  id?: string;
  label?: string;
  interactive?: boolean;
  showScale?: boolean;
  displayMode?: "discrete" | "average";
  className?: string;
}) {
  const thumbLeft = ratingToPercent(value);
  const { handleDigitKey } = useDigitEntry(onChange);
  const isAverageDisplay = displayMode === "average" && !interactive;

  return (
    <div className={cn("relative pt-1 pb-1", className)}>
      <div
        id={id}
        role={interactive ? "slider" : undefined}
        aria-valuemin={interactive ? RATING_MIN : undefined}
        aria-valuemax={interactive ? RATING_MAX : undefined}
        aria-valuenow={interactive ? value : undefined}
        aria-valuetext={interactive ? `${value} out of ${RATING_MAX}` : undefined}
        aria-label={interactive ? (label ? `${label} rating` : "Rating") : undefined}
        tabIndex={interactive ? 0 : undefined}
        className={cn(
          "relative h-8",
          interactive &&
            "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        onKeyDown={
          interactive && onChange
            ? (e) => {
                if (handleDigitKey(e)) return;

                if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                  e.preventDefault();
                  onChange(clampRating(value + RATING_STEP));
                } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                  e.preventDefault();
                  onChange(clampRating(value - RATING_STEP));
                } else if (e.key === "Home") {
                  e.preventDefault();
                  onChange(RATING_MIN);
                } else if (e.key === "End") {
                  e.preventDefault();
                  onChange(RATING_MAX);
                }
              }
            : undefined
        }
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/70"
          style={{ width: `${thumbLeft}%` }}
        />
        {RATING_VALUES.map((notch) => (
          <div
            key={notch}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${ratingToPercent(notch)}%` }}
          >
            {isAverageDisplay ? (
              <span
                className={cn(
                  "block size-2 rounded-full",
                  notch <= value ? "bg-primary/60" : "bg-muted-foreground/35",
                )}
                aria-hidden
              />
            ) : (
              <RatingNotch
                notch={notch}
                value={value}
                interactive={interactive}
                onSelect={onChange}
              />
            )}
          </div>
        ))}
        {isAverageDisplay ? (
          <div
            className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-sm"
            style={{ left: `${thumbLeft}%` }}
            aria-hidden
          />
        ) : null}
      </div>
      {showScale ? (
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{RATING_MIN}</span>
          <span>{RATING_MAX}</span>
        </div>
      ) : null}
    </div>
  );
}

export function RatingBarInput({
  name,
  id,
  label,
  defaultValue = RATING_DEFAULT,
  required,
  variant = "default",
}: {
  name: string;
  id: string;
  label: string;
  defaultValue?: number;
  required?: boolean;
  variant?: "default" | "glass";
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${id}-score`}>{label}</Label>
        <RatingScoreInput
          id={`${id}-score`}
          label={label}
          value={value}
          onChange={setValue}
          variant={variant}
        />
      </div>
      <input type="hidden" name={name} value={value} required={required} />
      <RatingTrack id={id} label={label} value={value} onChange={setValue} />
    </div>
  );
}

export function RatingBarDisplay({
  label,
  value,
  compact = false,
  average = false,
}: {
  label: string;
  value: number;
  compact?: boolean;
  average?: boolean;
}) {
  const scoreText = average ? `${value.toFixed(1)}/${RATING_MAX}` : `${value}/${RATING_MAX}`;

  return (
    <div className={cn("space-y-1", compact && "min-w-[8rem]")}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{scoreText}</span>
      </div>
      <RatingTrack
        value={value}
        interactive={false}
        showScale={false}
        displayMode={average ? "average" : "discrete"}
        className="pt-0 pb-0"
      />
    </div>
  );
}
