# LMS MVP

A minimal but complete Learning Management System running in Docker. Next.js 15 (App Router) + Postgres 16 + Drizzle + JWT auth + Tailwind. No auth libraries, no UI kits.

## Quick start

Prereqs: **Docker** + **Docker Compose v2**. That's it.

```bash
cp .env.example .env
docker compose up --build
```

Open <http://localhost:3000>. The app runs migrations on first boot, then seeds a demo course (because `SEED=true` in `.env.example`).

### Seeded credentials

| Role        | Email                    | Password        |
| ----------- | ------------------------ | --------------- |
| Instructor  | `instructor@lms.local`   | `instructor123` |
| Student     | `student@lms.local`      | `student123`    |

Seeding is idempotent: it skips if any users already exist. To reseed, drop the volume:

```bash
docker compose down -v
docker compose up --build
```

## Features

- **Auth**: register, login, logout, `/api/me`. JWT (HS256) in an httpOnly cookie. Bcrypt-hashed passwords.
- **Catalog** (`/`): grid of published courses with cover, title, instructor, lesson count.
- **Course page** (`/courses/[slug]`): description, lesson list, enroll button.
- **Learner view** (`/learn/[slug]/[lessonId]`): markdown content, YouTube embed, progress bar, mark-as-complete.
- **Instructor dashboard** (`/dashboard`): list, create, edit, and delete your own courses; full CRUD for lessons.
- **Validation**: Zod on every request body.
- **Roles**: `student`, `instructor`, `admin`. Instructor routes are role-gated server-side.
- **Dark mode**: via `prefers-color-scheme`, no toggle needed.

## How it works

- The Next.js app uses `output: 'standalone'` so the production image is small and runs `node server.js`.
- `instrumentation.ts` runs on app boot:
  1. Applies any pending SQL migrations from `db/migrations/*.sql` (tracked in a `_migrations` table).
  2. If `SEED=true`, calls `db/seed.ts`, which is a no-op if users already exist.
- A single Postgres connection pool is reused via `lib/db.ts`.

## Project layout

```
app/                  # Next.js routes (App Router)
  api/                # Route handlers (auth, courses, lessons, enrollments, progress)
  courses/[slug]/     # Public course page
  learn/[slug]/[id]/  # Learner view
  dashboard/          # Instructor CRUD
  login/, register/   # Auth pages
components/           # Tiny reusable UI (Button, Input, Card, …) — no design libraries
components/ui/        # Lowest-level primitives
lib/                  # db, auth, validation, markdown, utils, api helpers
db/                   # schema.ts, migrations/, migrate.ts, seed.ts
Dockerfile            # multi-stage: deps → builder → runner (non-root)
docker-compose.yml    # app + db, healthcheck, named volume
```

## Common tasks

### Run only the database (host development)

```bash
docker compose up -d db
DATABASE_URL=postgres://postgres:postgres@localhost:5432/lms \
JWT_SECRET=dev-secret-key-change-me \
pnpm install && pnpm dev
```

### Add a new course

1. Sign in as an instructor (or register a new one).
2. Go to **Dashboard** → **+ New course**.
3. Fill in title, slug (auto-generated), description (markdown), and cover image URL.
4. Save, then click into the course and add lessons (markdown + optional YouTube URL).
5. Toggle **Published** when you're ready for students to enroll.

### Schema changes

Drizzle schema lives in `db/schema.ts`. To generate a new migration:

```bash
DATABASE_URL=... pnpm db:generate
```

Then commit the new SQL file under `db/migrations/`. The app will apply it on the next boot.

## Environment variables

| Var                    | Required | Notes                                             |
| ---------------------- | -------- | ------------------------------------------------- |
| `DATABASE_URL`         | yes      | Postgres connection string                        |
| `JWT_SECRET`           | yes      | Min 16 chars; long random string in production    |
| `NEXTAUTH_URL`         | no       | Public origin if you add absolute links           |
| `SEED`                 | no       | `true` to seed demo data on first boot            |
| `SKIP_DB_BOOTSTRAP`    | no       | `true` to skip migrations + seed on boot          |
| `POSTGRES_USER/PASSWORD/DB` | no  | Used by the `db` service in compose               |

## Notes & extension points

- Markdown is rendered with `marked` and sanitized via `isomorphic-dompurify`.
- Only YouTube `watch`, `youtu.be`, and `/embed/` URLs are accepted for video embeds (`lib/utils.ts → youtubeEmbed`).
- Add an admin UI by checking `user.role === 'admin'` in any server component.
- For a real deployment: rotate `JWT_SECRET`, set `NODE_ENV=production`, terminate TLS in front (Caddy/Traefik), and back the volume with managed Postgres.
