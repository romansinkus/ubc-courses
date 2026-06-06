"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, profiles, reviews, reviewVotes } from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth";

export type VoteResult =
  | { ok: true; score: number; myVote: number }
  | { ok: false; error: "auth" | "invalid" | "failed" };

/**
 * Casts (or toggles) the current user's vote on a review. `value` is +1 for an
 * upvote or -1 for a downvote; voting the same direction again clears the vote.
 * Requires a signed-in user with a complete profile.
 */
export async function voteReview(reviewId: string, value: number): Promise<VoteResult> {
  if (value !== 1 && value !== -1) return { ok: false, error: "invalid" };

  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "auth" };

  try {
    const [existing] = await db
      .select({ value: reviewVotes.value })
      .from(reviewVotes)
      .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, profile.id)))
      .limit(1);

    let myVote: number;
    if (!existing) {
      await db.insert(reviewVotes).values({ reviewId, userId: profile.id, value });
      myVote = value;
    } else if (existing.value === value) {
      // Clicking the active direction again removes the vote.
      await db
        .delete(reviewVotes)
        .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, profile.id)));
      myVote = 0;
    } else {
      await db
        .update(reviewVotes)
        .set({ value })
        .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, profile.id)));
      myVote = value;
    }

    const [scoreRow] = await db
      .select({ score: sql<number>`coalesce(sum(${reviewVotes.value}), 0)::int` })
      .from(reviewVotes)
      .where(eq(reviewVotes.reviewId, reviewId));

    // Re-render every surface that lists this review so the new score and sort
    // order take effect.
    const [meta] = await db
      .select({ code: courses.code, username: profiles.username })
      .from(reviews)
      .innerJoin(courses, eq(courses.id, reviews.courseId))
      .innerJoin(profiles, eq(profiles.id, reviews.userId))
      .where(eq(reviews.id, reviewId))
      .limit(1);
    if (meta) {
      revalidatePath(`/courses/${encodeURIComponent(meta.code)}`);
      revalidatePath(`/u/${meta.username}`);
      revalidatePath("/");
    }

    return { ok: true, score: scoreRow?.score ?? 0, myVote };
  } catch (err) {
    console.error("voteReview failed:", err);
    return { ok: false, error: "failed" };
  }
}
