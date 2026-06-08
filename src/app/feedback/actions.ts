"use server";

import { z } from "zod";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth";

const FeedbackSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Please enter some feedback before submitting.")
    .max(5000, "Feedback must be under 5000 characters."),
});

export type FeedbackState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function submitFeedback(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { status: "error", message: "You must sign in to submit feedback." };
  }

  const parsed = FeedbackSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await db.insert(feedback).values({ body: parsed.data.body, userId: profile.id });
    return { status: "success", message: "Thanks — your feedback has been submitted!" };
  } catch (err) {
    console.error("submitFeedback failed:", err);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}
