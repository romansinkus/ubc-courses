-- Create professors table.
CREATE TABLE "professors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "professors_name_idx" ON "professors" USING btree ("name");

-- RLS: everyone can read; writes happen via service role / server actions.
ALTER TABLE "professors" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "professors_select_all" ON "professors" FOR SELECT USING (true);

-- Backfill: one row per distinct existing professor name on reviews.
INSERT INTO "professors" ("name")
SELECT DISTINCT trim(professor)
FROM "reviews"
WHERE professor IS NOT NULL
  AND trim(professor) <> ''
ON CONFLICT ("name") DO NOTHING;

-- Add reviews.professor_id, link to existing rows, then drop the text column.
ALTER TABLE "reviews"
  ADD COLUMN "professor_id" uuid
  REFERENCES "professors"("id") ON DELETE SET NULL;

UPDATE "reviews" r
SET "professor_id" = p.id
FROM "professors" p
WHERE trim(r."professor") = p."name";

ALTER TABLE "reviews" DROP COLUMN "professor";
