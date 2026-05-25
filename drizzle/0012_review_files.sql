CREATE TABLE IF NOT EXISTS "review_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "review_id" uuid NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
  "storage_path" text NOT NULL,
  "url" text NOT NULL,
  "original_name" text NOT NULL,
  "content_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "review_files_review_idx" ON "review_files" ("review_id");

ALTER TABLE "review_files" ENABLE ROW LEVEL SECURITY;

-- World-readable; writes go through the owning review's author via the app.
DROP POLICY IF EXISTS "review_files_select_all" ON "review_files";
CREATE POLICY "review_files_select_all" ON "review_files"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "review_files_insert_own" ON "review_files";
CREATE POLICY "review_files_insert_own" ON "review_files"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "reviews"
      WHERE "reviews"."id" = "review_files"."review_id"
        AND "reviews"."user_id" = auth.uid()
    )
  );
