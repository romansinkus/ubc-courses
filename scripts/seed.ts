/**
 * Load data/courses.json into the courses table.
 *
 * Uses DATABASE_URL from .env.local. Re-running is safe: rows are upserted
 * by `code` (the unique key).
 *
 * Usage:
 *   npm run db:seed
 */
import { config } from "dotenv";
import { readFile } from "node:fs/promises";

config({ path: ".env.local" });
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { courses } from "../src/db/schema";

type ScrapedCourse = {
  code: string;
  subject: string;
  number: string;
  title: string;
  description: string | null;
  credits: string | null;
};

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set. Add it to .env.local.");
    process.exit(1);
  }

  const file = join(process.cwd(), "data", "courses.json");
  const raw = await readFile(file, "utf-8");
  const data: ScrapedCourse[] = JSON.parse(raw);
  console.log(`Loading ${data.length} courses from ${file}`);

  const client = postgres(dbUrl, { prepare: false });
  const db = drizzle(client);

  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH);
    await db
      .insert(courses)
      .values(batch)
      .onConflictDoUpdate({
        target: courses.code,
        set: {
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          credits: sql`excluded.credits`,
          subject: sql`excluded.subject`,
          number: sql`excluded.number`,
        },
      });
    inserted += batch.length;
    process.stdout.write(`\r  ${inserted}/${data.length}`);
  }
  console.log("\nDone.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
