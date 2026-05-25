import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

config({ path: ".env.local" });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const dir = join(process.cwd(), "drizzle");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  const sql = postgres(dbUrl, { prepare: false, max: 1, idle_timeout: 10, connect_timeout: 15 });
  try {
    // Track applied migrations.
    await sql`
      CREATE TABLE IF NOT EXISTS "__migrations" (
        "name" text PRIMARY KEY,
        "applied_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `;

    // Bootstrap: if the schema already exists (older runs of this script before
    // tracking was added), mark the original two migrations as applied so we
    // don't try to re-run them.
    const existingTables = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'profiles'
    `;
    if (existingTables.length > 0) {
      await sql`
        INSERT INTO "__migrations" ("name") VALUES
          ('0000_init.sql'),
          ('0001_supabase_policies.sql')
        ON CONFLICT DO NOTHING
      `;
    }

    const reviewColumns = await sql<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reviews'
    `;
    const reviewColSet = new Set(reviewColumns.map((r) => r.column_name));

    if (reviewColSet.has("professor_id")) {
      await sql`
        INSERT INTO "__migrations" ("name") VALUES ('0002_professors.sql')
        ON CONFLICT DO NOTHING
      `;
    }

    // Partial applies from older runs: skip brittle migrations, use 0008 to sync.
    if (reviewColSet.has("enjoyability")) {
      const legacy = [
        "0003_review_fields.sql",
        "0004_groupwork.sql",
        "0005_would_recommend.sql",
        "0006_assessment_type_both.sql",
        "0007_course_medium.sql",
      ];
      for (const name of legacy) {
        await sql`
          INSERT INTO "__migrations" ("name") VALUES (${name})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    if (reviewColSet.has("medium") && reviewColSet.has("would_recommend")) {
      await sql`
        INSERT INTO "__migrations" ("name") VALUES ('0008_sync_review_schema.sql')
        ON CONFLICT DO NOTHING
      `;
    }

    if (reviewColSet.has("assessment_type")) {
      await sql`
        INSERT INTO "__migrations" ("name") VALUES ('0009_assessment_type.sql')
        ON CONFLICT DO NOTHING
      `;
    }

    const applied = new Set(
      (await sql<{ name: string }[]>`SELECT name FROM "__migrations"`).map((r) => r.name),
    );

    let ranAny = false;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  ⊙ ${file} (already applied)`);
        continue;
      }
      console.log(`→ ${file}`);
      const text = await readFile(join(dir, file), "utf-8");
      await sql.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`INSERT INTO "__migrations" ("name") VALUES (${file})`;
      });
      console.log(`  ✓ applied`);
      ranAny = true;
    }
    console.log(ranAny ? "\nMigrations complete." : "\nNothing to do — schema is up to date.");
  } catch (e) {
    console.error("Migration failed:");
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
