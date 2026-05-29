import type { SupabaseClient } from "@supabase/supabase-js";
import { SYLLABUS_BUCKET } from "@/lib/syllabus";

export const FILES_BUCKET = "review-files";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_COUNT = 5;

export const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export type StoredObject = { bucket: string; path: string };

export type ReviewFileRow = {
  storagePath: string;
  url: string;
  originalName: string;
  description: string | null;
  contentType: string;
  sizeBytes: number;
};

export async function removeStorageObjects(
  supabase: SupabaseClient,
  objects: StoredObject[],
): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const { bucket, path } of objects) {
    const list = byBucket.get(bucket) ?? [];
    list.push(path);
    byBucket.set(bucket, list);
  }
  for (const [bucket, paths] of byBucket) {
    if (paths.length > 0) {
      await supabase.storage.from(bucket).remove(paths);
    }
  }
}

export async function uploadSyllabusPdf(
  supabase: SupabaseClient,
  courseId: string,
  file: File,
): Promise<{ path: string; uploaded: StoredObject } | { error: string }> {
  if (file.type !== "application/pdf") {
    return { error: "Syllabus must be a PDF." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Syllabus must be 5MB or smaller." };
  }
  const path = `${courseId}/${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(SYLLABUS_BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) {
    console.error("syllabus upload failed:", uploadError);
    return { error: "Could not upload the syllabus. Please try again." };
  }
  return { path, uploaded: { bucket: SYLLABUS_BUCKET, path } };
}

export async function uploadReviewFiles(
  supabase: SupabaseClient,
  reviewId: string,
  files: File[],
  descriptions: string[] = [],
): Promise<{ rows: ReviewFileRow[]; uploaded: StoredObject[] } | { error: string }> {
  const uploaded: StoredObject[] = [];
  const rows: ReviewFileRow[] = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ext = EXT_BY_TYPE[f.type];
    if (!ext) {
      await removeStorageObjects(supabase, uploaded);
      return { error: `"${f.name}" is an unsupported file type.` };
    }
    if (f.size > MAX_FILE_BYTES) {
      await removeStorageObjects(supabase, uploaded);
      return { error: `"${f.name}" is larger than 5MB.` };
    }
    const path = `${reviewId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(path, f, { contentType: f.type, upsert: false });
    if (uploadError) {
      console.error("review file upload failed:", uploadError);
      await removeStorageObjects(supabase, uploaded);
      return { error: "Could not upload one of your files. Please try again." };
    }
    uploaded.push({ bucket: FILES_BUCKET, path });
    const description = descriptions[i]?.trim();
    rows.push({
      storagePath: path,
      url: supabase.storage.from(FILES_BUCKET).getPublicUrl(path).data.publicUrl,
      originalName: f.name,
      description: description ? description : null,
      contentType: f.type,
      sizeBytes: f.size,
    });
  }

  return { rows, uploaded };
}

export function resolveSyllabusUrls(
  supabase: SupabaseClient,
  syllabusPath: string | null,
  externalLink: string | undefined,
): { syllabusPath: string | null; syllabusUrl: string | null } {
  if (externalLink) {
    return { syllabusPath, syllabusUrl: externalLink };
  }
  if (syllabusPath) {
    return {
      syllabusPath,
      syllabusUrl: supabase.storage.from(SYLLABUS_BUCKET).getPublicUrl(syllabusPath).data.publicUrl,
    };
  }
  return { syllabusPath: null, syllabusUrl: null };
}
