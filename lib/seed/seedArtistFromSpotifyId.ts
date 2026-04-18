import { prisma } from "@/lib/prisma";
import { SpotifyClient } from "@/lib/spotifyClient";
import type { SeedArtistProfileResult } from "@/lib/seed/seedArtistTypes";
import { mergeSpotifyGenresWithExisting } from "@/scripts/mergeSpotifyGenresForSeed";

const INPUT_HINT =
  'Use a JSON array with one string, e.g. ["4Z8W4fKeB5YxbusRsdQVPb"], or one object, e.g. {"spotifyArtistId":"4Z8W4fKeB5YxbusRsdQVPb"}. Spotify IDs must be quoted in JSON.';

/** Accepts plain string, one-element array, or single-field object (common Temporal UI shapes). */
function coerceSpotifyArtistInputString(raw: unknown): string {
  if (raw == null) {
    throw new Error(`Missing Spotify artist id. ${INPUT_HINT}`);
  }

  if (typeof raw === "string") {
    return raw.trim();
  }

  if (typeof raw === "number") {
    throw new Error(
      `Spotify artist id must be a JSON string (quoted), not a number. ${INPUT_HINT}`,
    );
  }

  if (Array.isArray(raw)) {
    if (raw.length !== 1) {
      throw new Error(
        `Expected exactly one workflow argument, got array length ${raw.length}. ${INPUT_HINT}`,
      );
    }
    return coerceSpotifyArtistInputString(raw[0]);
  }

  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["spotifyArtistId", "spotifyArtistID", "artistId", "id"] as const) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) {
        return v.trim();
      }
    }
    const stringValues = Object.values(o).filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    );
    if (stringValues.length === 1) {
      return stringValues[0].trim();
    }
  }

  throw new Error(
    `Could not read Spotify artist id from workflow input (got ${typeof raw}). ${INPUT_HINT}`,
  );
}

export function normalizeSpotifyArtistId(raw: unknown): string {
  const s = coerceSpotifyArtistInputString(raw);
  const uri = /^spotify:artist:(.+)$/.exec(s);
  if (uri) return uri[1];
  const openUrl = /open\.spotify\.com\/artist\/([^/?#]+)/.exec(s);
  if (openUrl) return openUrl[1];
  return s;
}

/** Fetches from Spotify and upserts `Artist`. Caller owns Prisma lifecycle (e.g. disconnect in CLI). */
export async function seedArtistFromSpotifyId(
  raw: unknown,
): Promise<SeedArtistProfileResult> {
  const spotifyId = normalizeSpotifyArtistId(raw);
  const spotifyClient = new SpotifyClient();
  const artist = await spotifyClient.getArtist(spotifyId);

  if (!artist) {
    throw new Error(`Could not fetch artist from Spotify for id: ${spotifyId}`);
  }

  const existing = await prisma.artist.findUnique({
    where: { spotifyId: artist.id },
    select: { genres: true },
  });

  const row = await prisma.artist.upsert({
    where: { spotifyId: artist.id },
    update: {
      name: artist.name,
      genres: existing
        ? mergeSpotifyGenresWithExisting(existing.genres, artist.genres)
        : artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total,
    },
    create: {
      spotifyId: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total,
    },
  });

  return {
    artistDbId: row.id.toString(),
    spotifyId: row.spotifyId,
    name: row.name,
  };
}
