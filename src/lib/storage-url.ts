/** Append Supabase's `download` param so the link saves the file instead of navigating. */
export function downloadUrl(url: string, filename: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}download=${encodeURIComponent(filename)}`;
}
