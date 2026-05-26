# Course catalog population

This document describes where UBC-Courses gets its course data and how that data is loaded into the database.

## Summary

| Item | Detail |
| --- | --- |
| **Source** | [UBC Vancouver Academic Calendar](https://vancouver.calendar.ubc.ca/course-descriptions) |
| **Subject index** | [Courses by Subject](https://vancouver.calendar.ubc.ca/course-descriptions/courses-subject) |
| **Scrape script** | `scripts/scrape-courses.ts` (`npm run scrape:courses`) |
| **Seed script** | `scripts/seed.ts` (`npm run db:seed`) |
| **Intermediate file** | `data/courses.json` |
| **Database table** | `courses` (Postgres via Supabase) |
| **Current scale** | ~263 subjects, ~9,450 courses (Vancouver campus) |

Users **cannot** add courses through the app. The catalog is populated only by scraping the official calendar and seeding the database.

## Data source

The course catalog comes from UBC’s public **Vancouver Academic Calendar**, not from Workday, the course schedule, or a third-party API.

- **What we use:** static course descriptions published on `vancouver.calendar.ubc.ca` (code, title, credits, description).
- **What we do not use:** current term sections, enrollment, instructor assignments, or Okanagan-campus calendar pages.

The calendar itself states that archived descriptions live on the calendar site, while live sections and schedules are in Workday. UBC-Courses only needs the catalog metadata (enough to browse and attach reviews), so the calendar is the right source.

### Why not other sources?

| Source | Why it was not used |
| --- | --- |
| [Workday / course schedule](https://courses.students.ubc.ca/) | Section and enrollment data, not a full stable catalog export |
| [UBC Explorer API](https://ubcexplorer.io/api) | Unofficial mirror; calendar is the authoritative source |
| User-submitted courses | Removed; catalog is admin/scraper-only |

## Pipeline overview

```
UBC Vancouver Academic Calendar (HTML)
        │
        ▼  npm run scrape:courses
   data/courses.json
        │
        ▼  npm run db:seed
   Postgres `courses` table (Supabase)
        │
        ▼
   Browse / search / reviews in the app
```

## Step 1: Scrape the calendar

**Command:** `npm run scrape:courses`

**Script:** `scripts/scrape-courses.ts`

**Dependencies:** [cheerio](https://cheerio.js.org/) for HTML parsing, Node `fetch` for HTTP requests.

### 1a. Discover all subjects

The script fetches the subject index:

```
https://vancouver.calendar.ubc.ca/course-descriptions/courses-subject
```

It parses every link matching `/course-descriptions/subject/{slug}` and extracts:

- **slug** — URL segment (e.g. `cpscv`, `mathv`, `aiv`)
- **code** — subject code from the link label (e.g. `CPSC` from `CPSC_V - Computer Science`)
- **name** — human-readable subject name

As of the last full scrape, this discovered **263** Vancouver subjects.

> Subject slugs are not always `{CODE}v` lowercase. The scraper must use the slug from the index (e.g. `ASL` → `aslv`, `AI` → `aiv`).

### 1b. Scrape each subject page

For each subject, the script requests:

```
https://vancouver.calendar.ubc.ca/course-descriptions/subject/{slug}
```

Example: `https://vancouver.calendar.ubc.ca/course-descriptions/subject/cpscv`

It waits **300 ms** between requests to avoid hammering UBC’s servers.

### 1c. Parse course cards

Each course is an HTML `<article class="node node--type-course">` containing:

- An `<h3>` header like: `CPSC_V 110 (4) Computation, Programs, and Programming`
- A description in `<p class="mt-0">`

The script parses the header with this pattern:

```text
{SUBJECT}_V {NUMBER} ({CREDITS}) {TITLE}
```

and normalizes Vancouver’s `_V` suffix away so stored codes look like `CPSC 110`, not `CPSC_V 110`.

### 1d. Write JSON

Parsed courses are deduplicated by `code` and written to:

```
data/courses.json
```

**Example record:**

```json
{
  "code": "CPSC 110",
  "subject": "CPSC",
  "number": "110",
  "title": "Computation, Programs, and Programming",
  "description": "Fundamental program and computation structures...",
  "credits": "4"
}
```

### Scrape options

```bash
# All subjects (~5 minutes)
npm run scrape:courses

# Specific subject codes only
npm run scrape:courses -- CPSC MATH STAT
```

## Step 2: Load into the database

**Command:** `npm run db:seed`

**Script:** `scripts/seed.ts`

**Requires:** `DATABASE_URL` in `.env.local` (Supabase Postgres connection string, pooler URL recommended).

The seed script:

1. Reads `data/courses.json`
2. Inserts rows into the `courses` table in batches of 100
3. **Upserts** on conflict by `code` — safe to re-run after a fresh scrape

```sql
-- Logical behavior (via Drizzle onConflictDoUpdate)
INSERT INTO courses (code, subject, number, title, description, credits)
VALUES (...)
ON CONFLICT (code) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  credits = excluded.credits,
  subject = excluded.subject,
  number = excluded.number;
```

### Database schema

Defined in `src/db/schema.ts`:

| Column | Type | Source |
| --- | --- | --- |
| `id` | UUID | Generated on insert |
| `code` | text | `{subject} {number}` (unique) |
| `subject` | text | Parsed subject code |
| `number` | text | Parsed course number |
| `title` | text | Calendar course title |
| `description` | text | Calendar description (nullable) |
| `credits` | text | Credit value from header, e.g. `"4"` (nullable) |
| `created_at` | timestamptz | Set on first insert |

Reviews reference `courses.id` via foreign key; re-seeding updates catalog text but does not delete existing reviews.

## Full refresh (local or production)

```bash
# 1. Scrape latest calendar data
npm run scrape:courses

# 2. Load into the database pointed to by DATABASE_URL
npm run db:seed
```

For **production**, run the same commands with production `DATABASE_URL` (or against Supabase via CLI/CI). No app redeploy is required unless you also commit an updated `data/courses.json` to the repo.

## Limitations and maintenance

1. **HTML, not an API** — UBC can change page structure; if scraping breaks, update selectors in `scripts/scrape-courses.ts` (look for `article.node--type-course`, `h3`, `p.mt-0`).
2. **Vancouver only** — Okanagan and other campuses are not included unless their calendar pages are scraped separately.
3. **Catalog snapshot** — Descriptions reflect the calendar edition live at scrape time (currently the 2026/27 calendar site).
4. **No live schedule data** — Offerings, times, and professors are not imported.
5. **Rate limiting** — The scraper uses a fixed delay; run it sparingly, not on every deploy.

## Related files

| File | Purpose |
| --- | --- |
| `scripts/scrape-courses.ts` | Fetch and parse UBC calendar HTML |
| `scripts/seed.ts` | Upsert JSON into Postgres |
| `data/courses.json` | Scraped catalog (committed or generated locally) |
| `src/db/schema.ts` | `courses` table definition |
| `src/app/courses/` | Browse UI (read-only catalog) |
