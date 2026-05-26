import { FiltersButton } from "@/components/filters-button";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function HomeFiltersButton() {
  const subjectRows = await db
    .selectDistinct({ subject: courses.subject })
    .from(courses)
    .orderBy(asc(courses.subject));

  return <FiltersButton subjects={subjectRows.map((r) => r.subject)} variant="glass" />;
}
