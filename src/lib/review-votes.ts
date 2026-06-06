import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviewVotes } from "@/db/schema";

export type VoteData = {
  /** reviewId -> net score (sum of votes). Missing entries mean 0. */
  scores: Map<string, number>;
  /** reviewId -> the current user's vote (-1 or 1). Missing entries mean no vote. */
  myVotes: Map<string, number>;
};

/**
 * Loads net vote scores for the given reviews, plus the current user's own vote
 * on each (when signed in). Used to render and sort review lists.
 */
export async function loadVoteData(
  reviewIds: string[],
  userId: string | null,
): Promise<VoteData> {
  const scores = new Map<string, number>();
  const myVotes = new Map<string, number>();
  if (reviewIds.length === 0) return { scores, myVotes };

  const scoreRows = await db
    .select({
      reviewId: reviewVotes.reviewId,
      score: sql<number>`coalesce(sum(${reviewVotes.value}), 0)::int`,
    })
    .from(reviewVotes)
    .where(inArray(reviewVotes.reviewId, reviewIds))
    .groupBy(reviewVotes.reviewId);
  for (const row of scoreRows) scores.set(row.reviewId, row.score);

  if (userId) {
    const mine = await db
      .select({ reviewId: reviewVotes.reviewId, value: reviewVotes.value })
      .from(reviewVotes)
      .where(and(eq(reviewVotes.userId, userId), inArray(reviewVotes.reviewId, reviewIds)));
    for (const row of mine) myVotes.set(row.reviewId, row.value);
  }

  return { scores, myVotes };
}

/**
 * Sorts reviews by net score (desc), breaking ties by recency (newest first).
 * Returns a new array; the input is not mutated.
 */
export function sortByVotes<T extends { id: string; createdAt: Date }>(
  rows: T[],
  scores: Map<string, number>,
): T[] {
  return [...rows].sort((a, b) => {
    const scoreDiff = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}
