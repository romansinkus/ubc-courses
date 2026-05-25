-- Idempotent sync: brings reviews table in line with src/db/schema.ts

DO $$ BEGIN
  CREATE TYPE "would_recommend" AS ENUM ('yes', 'no', 'maybe');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "would_recommend" "would_recommend";

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'would_take_again'
  ) THEN
    UPDATE "reviews"
    SET "would_recommend" = CASE
      WHEN "would_take_again" = true THEN 'yes'::"would_recommend"
      WHEN "would_take_again" = false THEN 'no'::"would_recommend"
      ELSE NULL
    END
    WHERE "would_recommend" IS NULL;

    ALTER TABLE "reviews" DROP COLUMN "would_take_again";
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE "course_medium" AS ENUM ('in_person', 'hybrid', 'online');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "medium" "course_medium";

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'assessment_type'
  ) THEN
    UPDATE "reviews"
    SET "medium" = CASE "assessment_type"::text
      WHEN 'exam' THEN 'in_person'::"course_medium"
      WHEN 'project' THEN 'online'::"course_medium"
      WHEN 'hybrid' THEN 'hybrid'::"course_medium"
      WHEN 'both' THEN 'hybrid'::"course_medium"
      ELSE NULL
    END
    WHERE "medium" IS NULL;

    ALTER TABLE "reviews" DROP COLUMN "assessment_type";
  END IF;
END $$;

DROP TYPE IF EXISTS "assessment_type";

-- enjoyability / usefulness / groupwork (from earlier migrations)
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "enjoyability" smallint;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "usefulness" smallint;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "groupwork" boolean;
