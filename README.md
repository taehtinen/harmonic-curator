# Harmonic Curator

Internal tool for pulling **Spotify** artist metadata into **PostgreSQL**, browsing artists in a **Next.js** UI, and refreshing each artist’s **top tracks** (with albums) for curation workflows—starting from Finnish-focused search seeds.

## Stack

- **Next.js** 16 (App Router), **React** 19, **TypeScript**
- **Tailwind CSS** 4
- **Prisma** 6 + **PostgreSQL**
- **Spotify Web API** (client-credentials; see [`lib/spotifyClient.ts`](lib/spotifyClient.ts))

## Features (current)

- Paginated **artists** table (100 per page) with sortable columns: name, Spotify ID, popularity, followers.
- **Detail sidebar** for a selected artist: genres, Spotify ID, popularity, followers, **albums**, and **tracks** (from stored top-tracks data).
- **Ignore artist** (`isIgnored`): hides an artist from the list (admin-only server action).
- **Add genre**: append a normalized genre string to an artist (admin-only server action).
- **Auth**: [`lib/auth.ts`](lib/auth.ts) is a stub that always returns a mock admin user until real authentication exists.

## Data model

Defined in [`prisma/schema.prisma`](prisma/schema.prisma):

- **Artist** — `spotifyId`, `name`, `genres[]`, `popularity`, `followers`, `isIgnored`, `topTracksRefreshedAt`
- **Album** — linked to artist; `spotifyId`, `name`, `releaseDate`
- **Track** — linked to artist and album; `spotifyId`, `name`, `popularity`, `trackNumber`

Top-track syncing is incremental: `seed-top-tracks` sets `topTracksRefreshedAt` and prefers artists that have never been refreshed or are stale (default: older than 24 hours).

## Prerequisites

- Node.js (LTS recommended) and npm
- A PostgreSQL database and connection string
- A [Spotify Developer](https://developer.spotify.com/dashboard) app with **Client ID** and **Client Secret**

## Environment variables

Create a `.env` in the project root (Prisma reads `DATABASE_URL` via [`prisma.config.ts`](prisma.config.ts)).

| Variable | Required for | Description |
|----------|----------------|-------------|
| `DATABASE_URL` | App + Prisma | PostgreSQL connection URL |
| `SPOTIFY_CLIENT_ID` | Seed scripts | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Seed scripts | Spotify app secret |
| `SPOTIFY_MARKET` | Seed scripts | ISO market code for artist/track requests (e.g. `FI`) |
| `SPOTIFY_USER_ID` | `SpotifyClient` constructor | Spotify user ID (required to construct the client; playlist helpers use it—seeds use search/artist/top-tracks only) |
| `SEED_TOP_TRACKS_BATCH` | Optional | Positive integer batch size for `seed-top-tracks` (default `10`) |

## Setup

```bash
npm install
# Set DATABASE_URL and Spotify variables in .env
npx prisma migrate deploy
# or during development:
npm run db:migrate:dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run db:migrate:dev` | Create/apply migrations in development |
| `npm run db:migrate:deploy` | Apply migrations (e.g. CI/production) |
| `npm run db:migrate:reset` | **Destructive**: reset DB and re-apply migrations |
| `npm run seed:artists` | Search fixed Finnish-related queries on Spotify and upsert **artists** |
| `npm run seed:artist -- <id-or-url>` | Upsert a single artist by Spotify ID, `spotify:artist:…`, or open.spotify.com URL |
| `npm run seed:top-tracks` | Batch-fetch top tracks for artists missing or stale refresh; upserts **albums** and **tracks** |

Typical flow: configure `.env` → migrate → `seed:artists` and/or `seed:artist` → run `seed:top-tracks` periodically or until the catalog is warm → use the web UI.

## Project layout (high level)

- [`app/page.tsx`](app/page.tsx) — Home route; renders the artists experience
- [`components/artists.tsx`](components/artists.tsx) — Server component: list, pagination, sort URLs, server actions
- [`components/artists-table.tsx`](components/artists-table.tsx), [`components/artist-sidebar*.tsx`](components/) — Table and sidebar UI
- [`lib/prisma.ts`](lib/prisma.ts) — Shared Prisma client
- [`scripts/`](scripts/) — CLI seeds using `tsx`

## Spotify client note

[`SpotifyClient`](lib/spotifyClient.ts) also includes playlist create/update/add/remove helpers for automation; the current UI does not expose playlist flows—only the seed scripts and stored artist/album/track data.

## Deploy

Compatible with any host that provides Node and PostgreSQL (e.g. Vercel + managed Postgres). Set the same environment variables and run `npm run build`, `npm run db:migrate:deploy`, and `npm run start` as appropriate for your platform.
