-- Supabase Storage: public "review-files" bucket for optional review attachments
-- (notes, past exams, assignments, study guides). Server-enforced 5MB limit and
-- a docs+images mime allowlist.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-files',
  'review-files',
  true,
  5242880,
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "review_files_select_all" ON storage.objects;
CREATE POLICY "review_files_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-files');

DROP POLICY IF EXISTS "review_files_insert_authenticated" ON storage.objects;
CREATE POLICY "review_files_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-files');

DROP POLICY IF EXISTS "review_files_delete_own" ON storage.objects;
CREATE POLICY "review_files_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'review-files' AND owner = auth.uid());
