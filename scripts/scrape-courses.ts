/**
 * Scrape UBC Vancouver's course catalog into a JSON file.
 *
 * Source: https://vancouver.calendar.ubc.ca/course-descriptions/courses-subject
 * and per-subject pages like /course-descriptions/subject/cpscv
 *
 * Usage:
 *   npm run scrape:courses                   # scrape all subjects
 *   npm run scrape:courses -- CPSC MATH      # scrape specific subject codes
 *
 * Output: data/courses.json — feed it into the DB with `npm run db:seed`.
 *
 * Note: UBC's HTML is not a public API; selectors may need adjustment if the
 * page structure changes. Keep this script idempotent and run sparingly.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import * as cheerio from "cheerio";

const CALENDAR_ORIGIN = "https://vancouver.calendar.ubc.ca";
const SUBJECT_INDEX_URL = `${CALENDAR_ORIGIN}/course-descriptions/courses-subject`;
const OUTPUT = join(process.cwd(), "data", "courses.json");
const USER_AGENT = "Mozilla/5.0 (compatible; UBC-CoursesSeed/0.1; +https://github.com/)";
const REQUEST_DELAY_MS = 300;

type SubjectEntry = {
  slug: string;
  code: string;
  name: string;
};

type ScrapedCourse = {
  code: string;
  subject: string;
  number: string;
  title: string;
  description: string | null;
  credits: string | null;
};

const COURSE_HEADER =
  /^([A-Z0-9]{1,5})(?:_V)?\s+(\d{3}[A-Z]?)\s*\(([^)]+)\)\s*(.+)$/;

async function fetchHtml(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  return res.text();
}

async function fetchAllSubjects(): Promise<SubjectEntry[]> {
  const html = await fetchHtml(SUBJECT_INDEX_URL);
  if (!html) {
    throw new Error(`Failed to fetch subject index (${SUBJECT_INDEX_URL})`);
  }

  const $ = cheerio.load(html);
  const subjects = new Map<string, SubjectEntry>();

  $(`a[href*="/course-descriptions/subject/"]`).each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const slugMatch = href.match(/\/course-descriptions\/subject\/([a-z0-9]+)/i);
    if (!slugMatch) return;

    const slug = slugMatch[1].toLowerCase();
    const label = $(el).text().trim();
    const codeMatch = label.match(/^([A-Z0-9]+)_V\b/);
    if (!codeMatch) return;

    const code = codeMatch[1];
    const name = label.replace(/^[A-Z0-9]+_V\s*-\s*/, "").trim();

    subjects.set(slug, { slug, code, name });
  });

  return [...subjects.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function parseCoursesFromHtml(html: string, subjectCode: string): ScrapedCourse[] {
  const $ = cheerio.load(html);
  const out: ScrapedCourse[] = [];

  $("article.node--type-course").each((_, el) => {
    const headerText = $(el).find("h3").first().text().replace(/\s+/g, " ").trim();
    const match = headerText.match(COURSE_HEADER);
    if (!match) return;

    const [, subj, num, credits, title] = match;
    if (subj !== subjectCode) return;

    const description = $(el).find("p.mt-0").first().text().replace(/\s+/g, " ").trim() || null;

    out.push({
      code: `${subj} ${num}`,
      subject: subj,
      number: num,
      title: title.trim(),
      description,
      credits: credits.trim(),
    });
  });

  const seen = new Set<string>();
  return out.filter((course) => {
    if (seen.has(course.code)) return false;
    seen.add(course.code);
    return true;
  });
}

async function scrapeSubject(entry: SubjectEntry): Promise<ScrapedCourse[]> {
  const url = `${CALENDAR_ORIGIN}/course-descriptions/subject/${entry.slug}`;
  const html = await fetchHtml(url);
  if (!html) {
    console.warn(`  ✗ ${entry.code}: failed to fetch ${url}`);
    return [];
  }

  return parseCoursesFromHtml(html, entry.code);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const argSubjects = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const allSubjects = await fetchAllSubjects();
  console.log(`Discovered ${allSubjects.length} subjects on the UBC calendar.`);

  let subjects = allSubjects;
  if (argSubjects.length) {
    const wanted = new Set(argSubjects.map((s) => s.toUpperCase()));
    subjects = allSubjects.filter(
      (entry) => wanted.has(entry.code) || wanted.has(entry.slug.toUpperCase()),
    );
    if (!subjects.length) {
      console.error(`No matching subjects for: ${argSubjects.join(", ")}`);
      process.exit(1);
    }
  }

  console.log(`Scraping ${subjects.length} subjects from UBC Vancouver calendar...`);
  const all: ScrapedCourse[] = [];
  for (const entry of subjects) {
    process.stdout.write(`  ${entry.code} (${entry.slug})... `);
    try {
      const courses = await scrapeSubject(entry);
      console.log(`${courses.length} courses`);
      all.push(...courses);
    } catch (err) {
      console.log(`error: ${(err as Error).message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  const seen = new Set<string>();
  const deduped = all.filter((course) => {
    if (seen.has(course.code)) return false;
    seen.add(course.code);
    return true;
  });

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(deduped, null, 2));
  console.log(`\nWrote ${deduped.length} courses to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
