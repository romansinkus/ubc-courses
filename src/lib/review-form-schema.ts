import { z } from "zod";
import { GROUPWORK_VALUES, groupworkToDb, type Groupwork } from "@/lib/groupwork";
import { RATING_DEFAULT, RATING_MAX, RATING_MIN } from "@/lib/ratings";
import { parseTermValue } from "@/lib/terms";
import { WOULD_RECOMMEND_VALUES, type WouldRecommend } from "@/lib/would-recommend";

export const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "Credit"] as const;

export type Grade = (typeof GRADES)[number];

export const ReviewFormSchema = z.object({
  courseCode: z.string().min(1),
  professor: z.string().trim().min(1, "Pick or add a professor").max(120),
  termYear: z
    .string()
    .min(1)
    .refine((v) => parseTermValue(v) !== null, "Pick a valid term"),
  grade: z.enum(GRADES),
  overallRating: z.coerce.number().int().min(RATING_MIN).max(RATING_MAX),
  difficulty: z.coerce.number().int().min(RATING_MIN).max(RATING_MAX),
  enjoyability: z.coerce.number().int().min(RATING_MIN).max(RATING_MAX),
  usefulness: z.coerce.number().int().min(RATING_MIN).max(RATING_MAX),
  medium: z.enum(["in_person", "hybrid", "online"]),
  hasFinalExam: z.enum(["yes", "no"]),
  workloadHours: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).max(80).optional(),
  ),
  wouldRecommend: z.enum(["yes", "no", "maybe"]),
  groupwork: z.enum(GROUPWORK_VALUES),
  body: z.string().trim().max(5000),
  syllabusLink: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .url("Enter a valid syllabus URL")
      .max(2048)
      .refine(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
        "Syllabus link must start with http:// or https://",
      )
      .optional(),
  ),
});

export type ParsedReviewForm = z.infer<typeof ReviewFormSchema>;

export type ReviewFormDefaults = {
  termYear: string;
  professor: string | null;
  grade: Grade | null;
  overallRating: number;
  difficulty: number;
  enjoyability: number;
  usefulness: number;
  medium: ParsedReviewForm["medium"];
  hasFinalExam: ParsedReviewForm["hasFinalExam"];
  groupwork: Groupwork;
  wouldRecommend: ParsedReviewForm["wouldRecommend"];
  workloadHours: number | null;
  body: string;
  syllabusLink: string;
  hasSyllabusPdf: boolean;
  existingFiles: { id: string; originalName: string }[];
};

export type ReviewFormValues = {
  termYear: string;
  professor: string;
  grade: string;
  overallRating: string;
  difficulty: string;
  enjoyability: string;
  usefulness: string;
  medium: string;
  hasFinalExam: string;
  groupwork: string;
  wouldRecommend: string;
  workloadHours: string;
  body: string;
  syllabusLink: string;
  fileDescriptions: string[];
};

export type ResolvedReviewFormFields = {
  termYear: string;
  professor: string | null;
  grade: Grade | undefined;
  overallRating: number;
  difficulty: number;
  enjoyability: number;
  usefulness: number;
  medium: ParsedReviewForm["medium"];
  hasFinalExam: ParsedReviewForm["hasFinalExam"];
  groupwork: Groupwork;
  wouldRecommend: WouldRecommend;
  workloadHours: string;
  body: string;
  syllabusLink: string;
};

const MEDIUM_VALUES = ["in_person", "hybrid", "online"] as const;
const YES_NO_VALUES = ["yes", "no"] as const;

function pickEnum<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (raw && (allowed as readonly string[]).includes(raw)) return raw as T;
  return fallback;
}

function pickRating(raw: string | undefined, fallback: number): number {
  const parsed = parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(RATING_MAX, Math.max(RATING_MIN, parsed));
}

function pickGrade(raw: string | undefined, fallback: Grade | null | undefined): Grade | undefined {
  if (raw && GRADES.includes(raw as Grade)) return raw as Grade;
  return fallback ?? undefined;
}

export function extractReviewFormValues(formData: FormData): ReviewFormValues {
  return {
    termYear: String(formData.get("termYear") ?? ""),
    professor: String(formData.get("professor") ?? ""),
    grade: String(formData.get("grade") ?? ""),
    overallRating: String(formData.get("overallRating") ?? ""),
    difficulty: String(formData.get("difficulty") ?? ""),
    enjoyability: String(formData.get("enjoyability") ?? ""),
    usefulness: String(formData.get("usefulness") ?? ""),
    medium: String(formData.get("medium") ?? ""),
    hasFinalExam: String(formData.get("hasFinalExam") ?? ""),
    groupwork: String(formData.get("groupwork") ?? ""),
    wouldRecommend: String(formData.get("wouldRecommend") ?? ""),
    workloadHours: String(formData.get("workloadHours") ?? ""),
    body: String(formData.get("body") ?? ""),
    syllabusLink: String(formData.get("syllabusLink") ?? ""),
    fileDescriptions: formData.getAll("fileDescriptions").map(String),
  };
}

export function resolveReviewFormFields(
  persisted: ReviewFormValues | null | undefined,
  defaults: ReviewFormDefaults | undefined,
  defaultTermYear: string,
): ResolvedReviewFormFields {
  const ratingDefault = defaults?.overallRating ?? RATING_DEFAULT;

  if (persisted) {
    return {
      termYear: persisted.termYear || defaultTermYear,
      professor: persisted.professor ? persisted.professor : null,
      grade: pickGrade(persisted.grade, defaults?.grade),
      overallRating: pickRating(persisted.overallRating, ratingDefault),
      difficulty: pickRating(persisted.difficulty, defaults?.difficulty ?? ratingDefault),
      enjoyability: pickRating(persisted.enjoyability, defaults?.enjoyability ?? ratingDefault),
      usefulness: pickRating(persisted.usefulness, defaults?.usefulness ?? ratingDefault),
      medium: pickEnum(persisted.medium, MEDIUM_VALUES, defaults?.medium ?? "hybrid"),
      hasFinalExam: pickEnum(persisted.hasFinalExam, YES_NO_VALUES, defaults?.hasFinalExam ?? "no"),
      groupwork: pickEnum(persisted.groupwork, GROUPWORK_VALUES, defaults?.groupwork ?? "optional"),
      wouldRecommend: pickEnum(
        persisted.wouldRecommend,
        WOULD_RECOMMEND_VALUES,
        defaults?.wouldRecommend ?? "maybe",
      ),
      workloadHours: persisted.workloadHours,
      body: persisted.body,
      syllabusLink: persisted.syllabusLink,
    };
  }

  return {
    termYear: defaults?.termYear || defaultTermYear,
    professor: defaults?.professor ?? null,
    grade: defaults?.grade ?? undefined,
    overallRating: defaults?.overallRating ?? ratingDefault,
    difficulty: defaults?.difficulty ?? ratingDefault,
    enjoyability: defaults?.enjoyability ?? ratingDefault,
    usefulness: defaults?.usefulness ?? ratingDefault,
    medium: defaults?.medium ?? "hybrid",
    hasFinalExam: defaults?.hasFinalExam ?? "no",
    groupwork: defaults?.groupwork ?? "optional",
    wouldRecommend: defaults?.wouldRecommend ?? "maybe",
    workloadHours:
      defaults?.workloadHours != null ? String(defaults.workloadHours) : "",
    body: defaults?.body ?? "",
    syllabusLink: defaults?.syllabusLink ?? "",
  };
}

export function parseReviewFormData(formData: FormData) {
  const parsed = ReviewFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstError =
      Object.values(flat.fieldErrors).flat()[0] ?? flat.formErrors[0] ?? "Invalid input";
    return { error: firstError as string, data: null as ParsedReviewForm | null };
  }
  return { error: null as string | null, data: parsed.data };
}

export function reviewFieldsFromForm(data: ParsedReviewForm) {
  const termYear = parseTermValue(data.termYear)!;
  return {
    term: termYear.term,
    year: termYear.year,
    grade: data.grade,
    overallRating: data.overallRating,
    difficulty: data.difficulty,
    enjoyability: data.enjoyability,
    usefulness: data.usefulness,
    medium: data.medium,
    hasFinalExam: data.hasFinalExam === "yes",
    workloadHours: data.workloadHours ?? null,
    wouldRecommend: data.wouldRecommend,
    groupwork: groupworkToDb(data.groupwork),
    body: data.body,
  };
}

export function firstFormError(formData: FormData): string | null {
  return parseReviewFormData(formData).error;
}
