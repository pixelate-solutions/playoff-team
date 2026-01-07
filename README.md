# 2026 NFL Playoff Fantasy Challenge

Production-ready Next.js 15 app for running a playoff fantasy pool with roster validation, admin tooling, and ESPN/CSV stat importing.

## Tech Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Neon Postgres + Drizzle ORM
- pnpm

## Getting Started

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment variables

Create a `.env` file with:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
ADMIN_PASSWORD="<shared-admin-password>"
```

### 3) Run migrations / push schema

```bash
pnpm db:push
```

### 4) Seed sample data

```bash
pnpm db:seed
```

### 5) Start the dev server

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Useful Scripts

- `pnpm db:generate` - generate SQL migrations
- `pnpm db:migrate` - apply migrations
- `pnpm db:studio` - open Drizzle Studio
- `pnpm db:seed` - seed sample teams, players, and a demo entry

## Admin Access

Visit `/admin/login` and sign in with `ADMIN_PASSWORD`. Admin pages include:

- Dashboard (editable player score overrides + fetch & recalc)
- Teams
- Players
- Games
- Leaderboard
- Settings (lock entries, current round, recalc scores)

## Scoring Logic

Scoring totals are computed from per-game stats in `player_game_stats`. You can override an individual game with `manual_override_points`, or override an entire player's playoff total via `players.playoff_override_points`.

## External Stats Integration

The admin dashboard includes a "Fetch from ESPN & Recalculate" action that calls `/api/admin/fetch-playoff-stats`. ESPN integration lives in `lib/espn.ts`, and a CSV fallback upload is available via `/api/admin/upload-stats`. You can toggle between Playoffs and Regular Season to test with historical weeks.

To import stats:
- (Optional) Set `players.external_id` to ESPN athlete IDs for more reliable matching.
- CSV uploads can match on `external_player_id` or `player_name + team_abbr`.

## Notes

- One entry per email (unique constraint).
- Entries can be locked via admin settings.
- External stats fetching is stubbed until you connect a provider.
