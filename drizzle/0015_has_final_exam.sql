ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "has_final_exam" boolean;

UPDATE "reviews"
SET "has_final_exam" = CASE
  WHEN "assessment_type"::text IN ('exam', 'both') THEN true
  WHEN "assessment_type"::text = 'project' THEN false
  ELSE NULL
END
WHERE "has_final_exam" IS NULL
  AND "assessment_type" IS NOT NULL;

ALTER TABLE "reviews" DROP COLUMN IF EXISTS "assessment_type";

DROP TYPE IF EXISTS "assessment_type";
