DO $$ BEGIN
  CREATE TYPE "assessment_type" AS ENUM ('exam', 'project', 'both');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "assessment_type" "assessment_type";
