-- Reddit-style up/down votes on reviews. One row per (review, user); value is
-- +1 for an upvote or -1 for a downvote. The review's score is sum(value).
CREATE TABLE IF NOT EXISTS "review_votes" (
  "review_id" uuid NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "value" smallint NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "review_votes_pkey" PRIMARY KEY ("review_id", "user_id"),
  CONSTRAINT "review_votes_value_check" CHECK ("value" IN (-1, 1))
);

CREATE INDEX IF NOT EXISTS "review_votes_review_idx" ON "review_votes" ("review_id");

ALTER TABLE "review_votes" ENABLE ROW LEVEL SECURITY;

-- Scores are public; a user may only write their own vote.
DROP POLICY IF EXISTS "review_votes_select_all" ON "review_votes";
CREATE POLICY "review_votes_select_all" ON "review_votes"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "review_votes_insert_own" ON "review_votes";
CREATE POLICY "review_votes_insert_own" ON "review_votes"
  FOR INSERT WITH CHECK ("user_id" = auth.uid());

DROP POLICY IF EXISTS "review_votes_update_own" ON "review_votes";
CREATE POLICY "review_votes_update_own" ON "review_votes"
  FOR UPDATE USING ("user_id" = auth.uid());

DROP POLICY IF EXISTS "review_votes_delete_own" ON "review_votes";
CREATE POLICY "review_votes_delete_own" ON "review_votes"
  FOR DELETE USING ("user_id" = auth.uid());
