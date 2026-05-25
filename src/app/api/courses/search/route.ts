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

  // Match the code ignoring whitespace so "CPSC 110" and "CPSC110" both match.
  const qNoSpace = q.replace(/\s+/g, "");
  const codeNoSpace = sql`replace(${courses.code}, ' ', '')`;

  // Rank: exact code prefix > code contains > title contains.
  const results = await db
    .select({
      code: courses.code,
      title: courses.title,
    })
    .from(courses)
    .where(or(sql`${codeNoSpace} ilike ${`%${qNoSpace}%`}`, ilike(courses.title, `%${q}%`)))
    .orderBy(
      sql`case
        when ${codeNoSpace} ilike ${`${qNoSpace}%`} then 0
        when ${codeNoSpace} ilike ${`%${qNoSpace}%`} then 1
        else 2
      end`,
      asc(courses.code),
    )
    .limit(8);

  return NextResponse.json({ results });
}
