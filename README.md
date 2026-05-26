# UBC-Courses

Honest reviews of UBC courses, written by students who took them. Think "Rate My Prof" but
course-first: search by course code, see aggregate workload / difficulty / would-take-again, and
read what people thought.

## Stack

- **Next.js 15** (App Router) — frontend + server actions / route handlers (the "backend")
- **Postgres** (via Supabase) — data + Row-Level Security
- **Supabase Auth** — passwordless sign-in via magic links
- **Drizzle ORM** — typesafe queries + migrations
- **Tailwind v4 + shadcn/ui** — styling
- **Vercel** — deployment

## Local setup

### 1. Create a Supabase project

1. Go to <https://supabase.com> and create a new project (the free tier is fine).
2. Wait for it to provision, then open **Settings → API** and copy the **Project URL** and the
   **anon public** key.
3. Open **Settings → Database → Connection string** and copy the **URI** (use the
   *Transaction pooler*, port 6543 — this is what serverless Next.js needs).

### 2. Configure env vars

```bash
cp .env.example .env.local
# then edit .env.local with the values from step 1
```

### 3. Apply the schema

The schema lives in `drizzle/`. Apply both migration files in order using the Supabase SQL
editor (**Database → SQL Editor → New query**, paste the file, run):

1. `drizzle/0000_init.sql` — creates `profiles`, `courses`, `reviews`.
2. `drizzle/0001_supabase_policies.sql` — wires `profiles.id` to `auth.users`, enables RLS,
   and adds a trigger that creates a profile row whenever someone signs up.

Alternatively, with `DATABASE_URL` set, you can run `npm run db:push` to apply the Drizzle
schema directly — but you'll still need to run `0001_supabase_policies.sql` by hand because
it references the `auth` schema.

### 4. Seed the course catalog

```bash
npm run db:seed          # loads data/courses.json (~30 popular courses)
npm run scrape:courses   # optional: scrape the full UBC calendar into data/courses.json,
                         # then re-run db:seed
```

### 5. Configure Supabase auth

In your Supabase dashboard, go to **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (and your production URL after deploying)
- **Redirect URLs**: add `http://localhost:3000/auth/callback` and the production equivalent.

#### Send auth emails through Resend (recommended)

Supabase’s built-in email is limited to about **2 messages/hour**. For development and
production, connect [Resend](https://resend.com) (free tier: 3,000 emails/month, 100/day).

**Option A — One-click integration (easiest)**

1. Create a free account at [resend.com](https://resend.com).
2. Open [Resend → Integrations → Supabase](https://resend.com/settings/integrations).
3. Click **Connect to Supabase**, pick your project, and follow the prompts (Resend creates
   an API key and configures SMTP for you).

**Option B — Manual SMTP**

1. In Resend: **API Keys → Create API Key** (copy the key — shown once).
2. In Supabase: **Authentication → Emails → SMTP Settings** → enable custom SMTP:

   | Field | Value |
   | --- | --- |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your Resend API key |
   | Sender email | see below |
   | Sender name | `UBC-Courses` |

3. **Sender email**
   - **Quick local testing (no domain):** `onboarding@resend.dev` — magic links can only be
     sent to the same email address you used to sign up for Resend.
   - **Production / real users:** add and verify your domain in Resend, then use e.g.
     `noreply@yourdomain.com`.

4. In Supabase: **Authentication → Rate Limits** — after SMTP is enabled, raise **Emails
   sent** (defaults to ~30/hour with custom SMTP; adjust as needed).

5. Send a test magic link from `/login`. Check **Supabase → Authentication → Logs** and the
   Resend dashboard if it fails.

Docs: [Resend + Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp)

### 6. Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add the same env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `DATABASE_URL`) in **Project Settings → Environment Variables**.
4. Update Supabase's **Site URL** and **Redirect URLs** to include the Vercel domain.
5. Deploy.

## Project layout

```
src/
  app/
    page.tsx                       # home: search + recent reviews
    courses/page.tsx               # browse / search
    courses/[code]/page.tsx        # course detail + reviews
    courses/[code]/review/page.tsx # write a review (auth required)
    u/[username]/page.tsx          # user profile + their reviews
    login/                         # magic-link sign-in
    auth/callback/route.ts         # Supabase OTP callback
  components/
    site-header.tsx                # top nav (auth-aware)
    ui/                            # shadcn primitives
  db/
    schema.ts                      # Drizzle schema
    index.ts                       # DB client
  lib/
    auth.ts                        # getCurrentUser / getCurrentProfile
    supabase/                      # browser / server / middleware clients
  middleware.ts                    # refreshes Supabase session on every request
drizzle/                           # SQL migrations
scripts/
  seed.ts                          # load data/courses.json into the DB
  scrape-courses.ts                # one-time UBC catalog scraper
data/courses.json                  # seed data (starter set; extend with scraper)
```

## Data model

- `profiles` — one row per user, linked 1:1 to `auth.users.id`. Holds username, display name, bio.
- `courses` — one row per course (code, subject, number, title, description, credits).
- `reviews` — many per (user, course). Includes professor, term (1/2/summer), year, grade,
  overall rating (1-5), difficulty (1-5), workload hrs/week, would-take-again, free-text body.
