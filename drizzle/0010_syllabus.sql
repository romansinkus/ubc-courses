ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "syllabus_path" text;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "syllabus_url" text;
