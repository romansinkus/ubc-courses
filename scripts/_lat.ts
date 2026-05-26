import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 3, idle_timeout: 20 });
  let t = Date.now(); await sql`select 1`; console.log("cold connect+query:", Date.now()-t, "ms");
  t = Date.now(); await sql`select 1`; console.log("warm query:", Date.now()-t, "ms");
  // simulate the home page's 5 concurrent queries
  t = Date.now();
  await Promise.all([
    sql`select count(*)::int from reviews`,
    sql`select count(*) filter (where syllabus_path is not null)::int from reviews`,
    sql`select count(*)::int from review_files`,
    sql`select count(*)::int from profiles`,
    sql`select count(distinct subject) from courses`,
  ]);
  console.log("5 concurrent (max:3 pool):", Date.now()-t, "ms");
  await sql.end();
}
main();
