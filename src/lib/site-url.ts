/**
 * Canonical, absolute site origin (no trailing slash). Used for metadata,
 * sitemap, and robots. Set NEXT_PUBLIC_SITE_URL per environment; falls back to
 * the production domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ubc-courses.app").replace(
  /\/+$/,
  "",
);
