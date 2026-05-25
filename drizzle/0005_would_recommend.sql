CREATE TYPE "would_recommend" AS ENUM ('yes', 'no', 'maybe');

ALTER TABLE "reviews" ADD COLUMN "would_recommend" "would_recommend";

UPDATE "reviews"
SET "would_recommend" = CASE
  WHEN "would_take_again" = true THEN 'yes'::"would_recommend"
  WHEN "would_take_again" = false THEN 'no'::"would_recommend"
  ELSE NULL
END;

ALTER TABLE "reviews" DROP COLUMN "would_take_again";
