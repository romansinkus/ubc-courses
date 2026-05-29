import { z } from "zod";
import { GROUPWORK_VALUES, groupworkToDb, type Groupwork } from "@/lib/groupwork";
import { RATING_MAX, RATING_MIN } from "@/lib/ratings";
import { parseTermValue } from "@/lib/terms";

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
