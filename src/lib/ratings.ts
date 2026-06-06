export const RATING_MIN = 0;
export const RATING_MAX = 5;
export const RATING_STEP = 0.5;
export const RATING_DEFAULT = 2.5;

export const RATING_VALUES = Array.from(
  { length: Math.round((RATING_MAX - RATING_MIN) / RATING_STEP) + 1 },
  (_, i) => RATING_MIN + i * RATING_STEP,
);

export function ratingToPercent(value: number): number {
  return ((value - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100;
}
