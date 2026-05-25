CREATE TYPE "course_medium" AS ENUM ('in_person', 'hybrid', 'online');

ALTER TABLE "reviews" ADD COLUMN "medium" "course_medium";

ALTER TABLE "reviews" DROP COLUMN "assessment_type";

DROP TYPE "assessment_type";
