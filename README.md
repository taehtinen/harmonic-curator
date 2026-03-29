# Harmonic Curator

Internal tool for pulling **Spotify** metadata into **PostgreSQL**, browsing **artists** and **playlists** in a **Next.js** UI, and supporting curation workflows: **top tracks** (with albums), full **artist catalogs** via album sync, **playlist import** from Spotify, and **criteria-based playlist generation** from the local track catalog (Finnish-focused search seeds to start).

## Stack

- **Next.js** 16 (App Router), **React** 19, **TypeScript**
- **Tailwind CSS** 4
- **Prisma** 6 + **PostgreSQL**
- **Spotify Web API** (client-credentials; see [`lib/spotifyClient.ts`](lib/spotifyClient.ts))

## Features (current)

- **Navigation**: **Artists** (`/`) and **Playlists** (`/playlists`).
- **Artists**: Paginated table (100 per page) with sortable columns: name, Spotify ID, popularity, followers.
- **Artist sidebar**: Genres, Spotify ID, popularity, followers, **albums**, and **tracks** (from stored top-tracks / catalog data), including **featured artists** where stored (`track_artist`).
- **Ignore artist** (`isIgnored`): Hides an artist from the list (admin-only server action).
- **Add genre**: Append a normalized genre string to an artist (admin-only server action).
- **Playlists**: Paginated, searchable list with sortable name, Spotify ID, max followers, and size.
- **Playlist sidebar**: Link to Spotify, criteria (genres, max followers, target size), timestamps (**last track edit**, **last Spotify publish**), and ordered **tracks**. **Generate playlist** (admin-only): Rebuilds local `playlist_track` rows from the DB using the playlist’s genres and follower cap—one track per non-ignored artist, preferring newer albums and higher popularity. This updates **local state only**; it does not push the new order to Spotify (use your own automation or future tooling for that).
- **Auth**: [`lib/auth.ts`](lib/auth.ts) is a stub that always returns a mock admin user until real authentication exists.

## Data model

Defined in [`prisma/schema.prisma`](prisma/schema.prisma):

- **Artist** — `spotifyId`, `name`, `genres[]`, `popularity`, `followers`, `isIgnored`, `topTracksRefreshedAt`
- **Album** — Linked to artist; `spotifyId`, `name`, `releaseDate`
- **Track** — Linked to artist and album; `spotifyId`, `name`, `popularity`, `trackNumber`
- **TrackArtist** — Many-to-many credits between tracks and artists (e.g. features)
- **Playlist** — `spotifyId`, `name`, `description`, `genres[]`, `maxFollowers`, `size`, `lastTrackEditAt`, `lastSpotifyPublishAt`
- **PlaylistTrack** — Ordered membership: `playlistId`, `trackId`, `position`

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
| `SPOTIFY_CLIENT_ID` | Seeds + `SpotifyClient` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Seeds + `SpotifyClient` | Spotify app secret |
| `SPOTIFY_MARKET` | Seeds + `SpotifyClient` | ISO market code for artist/track requests (e.g. `FI`) |
| `SPOTIFY_USER_ID` | `SpotifyClient` | Spotify user ID (required to construct the client; playlist create/add helpers target this user) |
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
| `npm run seed:artist-catalog -- <id-or-url>` | Upsert one artist and sync **albums and tracks** from Spotify (full catalog pass for that artist) |
| `npm run seed:top-tracks` | Batch-fetch top tracks for artists missing or stale refresh; upserts **albums** and **tracks** |
| `npm run seed:playlist-tracks -- <id-or-url>` | Create or update a **playlist** row, import track order from Spotify, ensure artists/tracks in DB, and rewrite local `playlist_track` rows |

Typical flow: configure `.env` → migrate → `seed:artists` and/or `seed:artist` → `seed:top-tracks` (and optionally `seed:artist-catalog` for deep catalogs) → `seed:playlist-tracks` for each Spotify playlist you want in the app → set playlist **genres** / **maxFollowers** / **size** in the database as needed → use **Generate playlist** in the UI for local reordering from criteria → use the web UI.

## Project layout (high level)

- [`app/page.tsx`](app/page.tsx) — Home route; artists experience
- [`app/playlists/page.tsx`](app/playlists/page.tsx) — Playlists experience
- [`components/artists.tsx`](components/artists.tsx) — Server component: artist list, pagination, sort URLs, server actions
- [`components/playlists.tsx`](components/playlists.tsx) — Server component: playlist list and generate-from-criteria action
- [`components/artists-table.tsx`](components/artists-table.tsx), [`components/artist-sidebar*.tsx`](components/) — Artist table and sidebar
- [`components/playlists-table.tsx`](components/playlists-table.tsx), [`components/playlist-sidebar*.tsx`](components/) — Playlist table and sidebar
- [`components/main-nav.tsx`](components/main-nav.tsx) — Artists / Playlists tabs
- [`lib/prisma.ts`](lib/prisma.ts) — Shared Prisma client
- [`lib/playlist-generate-from-criteria.ts`](lib/playlist-generate-from-criteria.ts) — Criteria → track ID selection for playlist generation
- [`lib/playlist-timestamps.ts`](lib/playlist-timestamps.ts) — Helpers for playlist edit / import timestamps
- [`scripts/`](scripts/) — CLI seeds using `tsx`

## Spotify client note

[`SpotifyClient`](lib/spotifyClient.ts) includes playlist **create**, **add tracks**, **remove all tracks**, **update metadata**, and **read** helpers for automation. The UI exposes playlist browsing and **local** criteria-based generation; syncing **from** Spotify into the DB is done with `seed:playlist-tracks`. Pushing generated local order **to** Spotify is not wired in the UI—use the client methods or a separate script if you need that.

## Deploy

Compatible with any host that provides Node and PostgreSQL (e.g. Vercel + managed Postgres). Set the same environment variables and run `npm run build`, `npm run db:migrate:deploy`, and `npm run start` as appropriate for your platform.
