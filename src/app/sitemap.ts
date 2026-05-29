import type { MetadataRoute } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, reviews } from "@/db/schema";
import { SITE_URL } from "@/lib/site-url";

// Rebuild the sitemap at most once a day; the catalog changes rarely.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/courses`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    // Only list courses that have at least one review — pages with no reviews
    // are thin content and are marked noindex, so they don't belong in the sitemap.
    const rows = await db
      .selectDistinct({ code: courses.code })
      .from(courses)
      .innerJoin(reviews, eq(reviews.courseId, courses.id))
      .orderBy(asc(courses.code));
    const courseEntries: MetadataRoute.Sitemap = rows.map((r) => ({
      url: `${SITE_URL}/courses/${encodeURIComponent(r.code)}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticEntries, ...courseEntries];
  } catch (err) {
    // Don't fail the build/route if the DB is unreachable — still serve the core pages.
    console.error("sitemap: failed to load courses", err);
    return staticEntries;
  }
}
