export const SYLLABUS_BUCKET = "syllabi";

export function syllabusPdfPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return `${base}/storage/v1/object/public/${SYLLABUS_BUCKET}/${path}`;
}
