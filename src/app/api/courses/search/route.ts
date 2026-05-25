import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { asc, ilike, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  // Rank: exact code prefix > code contains > title contains.
  const results = await db
    .select({
      code: courses.code,
      title: courses.title,
    })
    .from(courses)
    .where(or(ilike(courses.code, `%${q}%`), ilike(courses.title, `%${q}%`)))
    .orderBy(
      sql`case
        when ${courses.code} ilike ${`${q}%`} then 0
        when ${courses.code} ilike ${`%${q}%`} then 1
        else 2
      end`,
      asc(courses.code),
    )
    .limit(8);

  return NextResponse.json({ results });
}
