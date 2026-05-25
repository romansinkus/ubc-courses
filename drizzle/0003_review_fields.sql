DO $$ BEGIN
  CREATE TYPE "public"."assessment_type" AS ENUM('exam', 'project', 'hybrid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "enjoyability" smallint;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "usefulness" smallint;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "assessment_type" "assessment_type";
