-- Move ratings from a 0–10 integer scale to a 0–5 half-step scale.
-- Widening smallint -> real lets us store half-steps (e.g. 3.5), and dividing
-- existing values by 2 rescales stored reviews so 0–10 data reads as 0–5.
-- Guarded on the current column type so a re-run can't halve the data twice.
DO $$
BEGIN
  IF (
    SELECT data_type FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name = 'overall_rating'
  ) = 'smallint' THEN
    ALTER TABLE "reviews" ALTER COLUMN "overall_rating" SET DATA TYPE real USING ("overall_rating"::real / 2);
    ALTER TABLE "reviews" ALTER COLUMN "difficulty" SET DATA TYPE real USING ("difficulty"::real / 2);
    ALTER TABLE "reviews" ALTER COLUMN "enjoyability" SET DATA TYPE real USING ("enjoyability"::real / 2);
    ALTER TABLE "reviews" ALTER COLUMN "usefulness" SET DATA TYPE real USING ("usefulness"::real / 2);
  END IF;
END $$;
