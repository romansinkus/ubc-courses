import { NextResponse } from "next/server";
import { db } from "@/db";
import { professors } from "@/db/schema";
import { asc, ilike, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  // Rank: name prefix match > name contains.
  const results = await db
    .select({ name: professors.name })
    .from(professors)
    .where(ilike(professors.name, `%${q}%`))
    .orderBy(
      sql`case when ${professors.name} ilike ${`${q}%`} then 0 else 1 end`,
      asc(professors.name),
    )
    .limit(8);

  return NextResponse.json({ results: results.map((r) => r.name) });
}
