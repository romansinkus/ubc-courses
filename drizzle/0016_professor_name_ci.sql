-- Make professor names case-insensitively unique.
--
-- First merge any professors that differ only by case into a single canonical
-- row (the earliest-created one), repointing reviews at the survivor, so the new
-- unique index below can be created without conflicts.

WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY lower(name)
      ORDER BY created_at ASC, id ASC
    ) AS canonical_id
  FROM professors
)
UPDATE reviews r
SET professor_id = ranked.canonical_id
FROM ranked
WHERE r.professor_id = ranked.id
  AND ranked.id <> ranked.canonical_id;

WITH ranked AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY lower(name)
      ORDER BY created_at ASC, id ASC
    ) AS canonical_id
  FROM professors
)
DELETE FROM professors p
USING ranked
WHERE p.id = ranked.id
  AND ranked.id <> ranked.canonical_id;

-- Replace the case-sensitive unique index with a case-insensitive one.
DROP INDEX IF EXISTS "professors_name_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "professors_name_lower_idx" ON "professors" (lower("name"));
