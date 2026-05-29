export const MIN_YEAR = 1950;

export type TermOption = { value: string; label: string };

/**
 * Generate filter options for every UBC term back to MIN_YEAR.
 *
 * Each calendar year Y contributes (newest-first within the year):
 *   - Term 1 of academic year Y-(Y+1)   (Fall Y)         → "{Y}-{Y+1} Term 1"
 *   - Summer Y                           (Summer Y)       → "{Y} Summer"
 *   - Term 2 of academic year (Y-1)-Y    (Spring Y)       → "{Y-1}-{Y} Term 2"
 *
 * Value format is "{storedYear}-{term}", e.g. "2025-1", "2026-2", "2025-summer".
 * `storedYear` matches the integer `reviews.year` column for that term.
 */
export function generateTermOptions(): TermOption[] {
  const currentYear = new Date().getFullYear();
  const options: TermOption[] = [];
  for (let y = currentYear; y >= MIN_YEAR; y--) {
    options.push({ value: `${y}-1`, label: `${y}-${y + 1} Term 1` });
    options.push({ value: `${y}-summer`, label: `${y} Summer` });
    if (y - 1 >= MIN_YEAR) {
      options.push({ value: `${y}-2`, label: `${y - 1}-${y} Term 2` });
    }
  }
  return options;
}

const TERM_VALUE_RE = /^(\d{4})-(1|2|summer)$/;

export type ParsedTerm = { year: number; term: "1" | "2" | "summer" };

export function parseTermValue(value: string | undefined | null): ParsedTerm | null {
  if (!value) return null;
  const m = value.match(TERM_VALUE_RE);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  if (year < MIN_YEAR || year > new Date().getFullYear() + 1) return null;
  return { year, term: m[2] as ParsedTerm["term"] };
}

export function formatTermValue(year: number, term: ParsedTerm["term"]): string {
  return `${year}-${term}`;
}

export function formatTermLabel(value: string): string {
  const parsed = parseTermValue(value);
  if (!parsed) return value;
  if (parsed.term === "1") return `${parsed.year}-${parsed.year + 1} Term 1`;
  if (parsed.term === "2") return `${parsed.year - 1}-${parsed.year} Term 2`;
  return `${parsed.year} Summer`;
}
