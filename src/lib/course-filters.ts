import { courses, reviews } from "@/db/schema";
import { and, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { parseTermValue } from "@/lib/terms";

const LEVELS = new Set(["100", "200", "300", "400", "500"]);

export const LEVEL_LABEL: Record<string, string> = {
  "100": "100-level",
  "200": "200-level",
  "300": "300-level",
  "400": "400-level",
  "500": "500+ (grad)",
};

export const COURSES_PAGE_SIZE = 60;

export type CourseFilters = {
  query?: string;
  selectedSubjects: string[];
  selectedLevels: string[];
  term: string;
  parsedTerm: ReturnType<typeof parseTermValue>;
  page: number;
};

export function parseCourseFilters(params: {
  q?: string;
  subjects?: string;
  level?: string;
  term?: string;
  page?: string;
}): CourseFilters {
  const query = params.q?.trim();
  const selectedSubjects = params.subjects
    ? params.subjects.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
    : [];
  const selectedLevels = params.level
    ? params.level
        .split(",")
        .map((s) => s.trim())
        .filter((s) => LEVELS.has(s))
    : [];
  const parsedTerm = parseTermValue(params.term);
  const term = parsedTerm ? params.term! : "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  return { query, selectedSubjects, selectedLevels, term, parsedTerm, page };
}

export function buildCourseBrowseQuery(
  filters: Pick<CourseFilters, "query" | "selectedSubjects" | "selectedLevels" | "term">,
  page = 1,
): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.selectedSubjects.length) params.set("subjects", filters.selectedSubjects.join(","));
  if (filters.selectedLevels.length) params.set("level", filters.selectedLevels.join(","));
  if (filters.term !== "all") params.set("term", filters.term);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function hasActiveCourseFilters(filters: CourseFilters): boolean {
  return (
    !!filters.query || filters.selectedSubjects.length > 0 || filters.selectedLevels.length > 0
  );
}

function levelWhereClause(level: string): SQL {
  if (level === "500") {
    return sql`substring(${courses.number} from '^([0-9]+)')::int >= 500`;
  }
  const min = parseInt(level, 10);
  return sql`substring(${courses.number} from '^([0-9]+)')::int between ${min} and ${min + 99}`;
}

export function buildCourseWhereClause(filters: CourseFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.query) {
    const queryNoSpace = filters.query.replace(/\s+/g, "");
    clauses.push(
      or(
        sql`replace(${courses.code}, ' ', '') ilike ${`%${queryNoSpace}%`}`,
        ilike(courses.title, `%${filters.query}%`),
      )!,
    );
  }
  if (filters.selectedSubjects.length > 0) {
    clauses.push(inArray(courses.subject, filters.selectedSubjects));
  }
  if (filters.selectedLevels.length > 0) {
    const levelClauses = filters.selectedLevels.map(levelWhereClause);
    clauses.push(levelClauses.length === 1 ? levelClauses[0] : or(...levelClauses)!);
  }
  if (filters.parsedTerm) {
    clauses.push(
      sql`exists (
        select 1 from ${reviews}
        where ${reviews.courseId} = ${courses.id}
          and ${reviews.year} = ${filters.parsedTerm.year}
          and ${reviews.term} = ${filters.parsedTerm.term}
      )`,
    );
  }

  return clauses.length ? and(...clauses) : undefined;
}
