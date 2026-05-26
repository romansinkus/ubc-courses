"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireCompleteProfile } from "@/lib/auth";

const CODE_REGEX = /^([A-Z]{2,5})\s+(\d{3}[A-Z]?)$/i;

const NewCourseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .transform((s) => s.replace(/\s+/g, " ").toUpperCase()),
  title: z.string().trim().min(2).max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  credits: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

export async function createCourse(formData: FormData) {
  await requireCompleteProfile("/courses/new");

  const parsed = NewCourseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstError =
      Object.values(flat.fieldErrors).flat()[0] ?? flat.formErrors[0] ?? "Invalid input";
    redirect(`/courses/new?error=${encodeURIComponent(firstError)}`);
  }
  const { code, title, description, credits } = parsed.data;

  const match = code.match(CODE_REGEX);
  if (!match) {
    redirect(
      `/courses/new?error=${encodeURIComponent(
        "Code must look like 'CPSC 110' — 2-5 letters, a space, then 3 digits.",
      )}`,
    );
  }
  const subject = match[1].toUpperCase();
  const number = match[2].toUpperCase();
  const normalizedCode = `${subject} ${number}`;

  const [existing] = await db
    .select({ code: courses.code })
    .from(courses)
    .where(eq(courses.code, normalizedCode))
    .limit(1);
  if (existing) {
    redirect(`/courses/${encodeURIComponent(normalizedCode)}`);
  }

  await db.insert(courses).values({
    code: normalizedCode,
    subject,
    number,
    title,
    description,
    credits,
  });

  revalidatePath("/courses");
  redirect(`/courses/${encodeURIComponent(normalizedCode)}`);
}
