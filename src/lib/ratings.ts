export const RATING_MIN = 0;
export const RATING_MAX = 10;
export const RATING_DEFAULT = 5;

export const RATING_VALUES = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, i) => RATING_MIN + i,
);

export function ratingToPercent(value: number): number {
  return ((value - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100;
}
