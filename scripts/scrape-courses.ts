/**
 * Scrape UBC Vancouver's course catalog into a JSON file.
 *
 * Source: https://vancouver.calendar.ubc.ca/course-descriptions/subject/<SUBJ>v
 * (the "v" suffix indicates Vancouver campus).
 *
 * Usage:
 *   npm run scrape:courses                   # scrape default subject list
 *   npm run scrape:courses -- CPSC MATH      # scrape specific subjects
 *
 * Output: data/courses.json — feed it into the DB with `npm run db:seed`.
 *
 * Note: UBC's HTML is not a public API; selectors may need adjustment if the
 * page structure changes. Keep this script idempotent and run sparingly.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import * as cheerio from "cheerio";

const DEFAULT_SUBJECTS = [
  "CPSC", "MATH", "STAT", "PHYS", "CHEM", "BIOL", "ENGL", "PSYC",
  "ECON", "COMM", "HIST", "PHIL", "POLI", "SOCI", "BIOC", "MICB",
  "CHBE", "CIVL", "EECE", "MECH", "APSC", "FREN", "JAPN", "MUSC",
];

const OUTPUT = join(process.cwd(), "data", "courses.json");

type ScrapedCourse = {
  code: string;
  subject: string;
  number: string;
  title: string;
  description: string | null;
  credits: string | null;
};

async function scrapeSubject(subject: string): Promise<ScrapedCourse[]> {
  const url = `https://vancouver.calendar.ubc.ca/course-descriptions/subject/${subject.toLowerCase()}v`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; UBCoursesSeed/0.1; +https://github.com/)",
    },
  });
  if (!res.ok) {
    console.warn(`  ✗ ${subject}: HTTP ${res.status}`);
    return [];
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const out: ScrapedCourse[] = [];

  // Each course is rendered as a heading like "CPSC_V 110 (4) Computation, Programs, and Programming"
  // followed by a description paragraph. The exact tag varies; we look for elements whose text
  // matches the course header pattern.
  $("h3, h4, .course, .views-row").each((_, el) => {
    const headerText = $(el).find("h3, h4").addBack().first().text().trim();
    const match = headerText.match(
      /^([A-Z]{2,5})(?:_V)?\s+(\d{3}[A-Z]?)\s*(?:\(([^)]+)\))?\s*[-–—:]?\s*(.+)$/,
    );
    if (!match) return;
    const [, subj, num, credits, title] = match;
    if (subj !== subject) return;

    // Description: the next text block.
    const description =
      $(el).find("p").first().text().trim() ||
      $(el).next("p").text().trim() ||
      null;

    out.push({
      code: `${subj} ${num}`,
      subject: subj,
      number: num,
      title: title.trim(),
      description: description || null,
      credits: credits ?? null,
    });
  });

  // Deduplicate by code (some pages repeat the same course in multiple sections).
  const seen = new Set<string>();
  return out.filter((c) => {
    if (seen.has(c.code)) return false;
    seen.add(c.code);
    return true;
  });
}

async function main() {
  const argSubjects = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const subjects = argSubjects.length ? argSubjects : DEFAULT_SUBJECTS;

  console.log(`Scraping ${subjects.length} subjects from UBC Vancouver calendar...`);
  const all: ScrapedCourse[] = [];
  for (const subj of subjects) {
    process.stdout.write(`  ${subj}... `);
    try {
      const courses = await scrapeSubject(subj);
      console.log(`${courses.length} courses`);
      all.push(...courses);
    } catch (err) {
      console.log(`error: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 250)); // be polite
  }

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(all, null, 2));
  console.log(`\nWrote ${all.length} courses to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
