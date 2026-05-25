-- Supabase Storage: public "syllabi" bucket for review syllabus PDFs.
-- Files are world-readable (syllabi aren't sensitive); only authenticated
-- users may upload, and the bucket enforces a 5MB / PDF-only limit server-side.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('syllabi', 'syllabi', true, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Anyone can read syllabus objects (bucket is public; this also covers the
-- authenticated API path).
DROP POLICY IF EXISTS "syllabi_select_all" ON storage.objects;
CREATE POLICY "syllabi_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'syllabi');

-- Only authenticated users may upload into the syllabi bucket.
DROP POLICY IF EXISTS "syllabi_insert_authenticated" ON storage.objects;
CREATE POLICY "syllabi_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'syllabi');

-- Uploaders may delete their own objects (used for cleanup when a review
-- insert fails after the file was already uploaded). Supabase sets
-- storage.objects.owner to the uploading user's id automatically.
DROP POLICY IF EXISTS "syllabi_delete_own" ON storage.objects;
CREATE POLICY "syllabi_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'syllabi' AND owner = auth.uid());
