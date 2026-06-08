-- Free-form feedback submissions. user_id is nullable so signed-out visitors
-- can submit; it's set null if the author's profile is later removed.
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "feedback" ("created_at");

ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;

-- Anyone may submit; there is no SELECT policy, so submissions stay private to
-- the service role (the app reads them out-of-band).
DROP POLICY IF EXISTS "feedback_insert_any" ON "feedback";
CREATE POLICY "feedback_insert_any" ON "feedback"
  FOR INSERT WITH CHECK (true);
