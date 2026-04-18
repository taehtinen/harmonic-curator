import { prisma } from "@/lib/prisma";
import { SpotifyClient, type SpotifyTrack } from "@/lib/spotifyClient";
import { normalizeSpotifyArtistId } from "@/lib/seed/seedArtistFromSpotifyId";

/** On compilations, album track listings include every song; only keep tracks that credit this artist. */
function trackCreditsArtist(
  full: SpotifyTrack,
  artistSpotifyId: string,
): boolean {
  return (full.artists ?? []).some((a) => a.id === artistSpotifyId);
}

/**
 * Fetches albums/tracks from Spotify and upserts `Artist`, `Album`, `Track`, and `TrackArtist`.
 * Uses {@link normalizeSpotifyArtistId} so CLI and Temporal accept the same input shapes.
 */
export async function seedArtistCatalogFromSpotifyId(
  raw: unknown,
): Promise<string> {
  const spotifyId = normalizeSpotifyArtistId(raw);
  const spotifyClient = new SpotifyClient();

  const artistSpotify = await spotifyClient.getArtist(spotifyId);
  if (!artistSpotify) {
    throw new Error(`Could not fetch artist from Spotify for id: ${spotifyId}`);
  }

  const row = await prisma.artist.upsert({
    where: { spotifyId: artistSpotify.id },
    update: {
      name: artistSpotify.name,
      genres: artistSpotify.genres,
      popularity: artistSpotify.popularity,
      followers: artistSpotify.followers.total,
    },
    create: {
      spotifyId: artistSpotify.id,
      name: artistSpotify.name,
      genres: artistSpotify.genres,
      popularity: artistSpotify.popularity,
      followers: artistSpotify.followers.total,
    },
  });

  console.log(`Artist: ${row.name} (db id=${row.id}, spotifyId=${row.spotifyId})`);

  const albums = await spotifyClient.getArtistAlbums(spotifyId);
  console.log(`Fetched ${albums.length} unique album(s) from Spotify`);

  const albumDbBySpotifyId = new Map<string, { id: bigint }>();

  for (const a of albums) {
    const albumRow = await prisma.album.upsert({
      where: { spotifyId: a.id },
      update: {
        name: a.name,
        releaseDate: a.release_date,
        artistId: row.id,
      },
      create: {
        spotifyId: a.id,
        artistId: row.id,
        name: a.name,
        releaseDate: a.release_date,
      },
      select: { id: true },
    });
    albumDbBySpotifyId.set(a.id, { id: albumRow.id });
  }

  const tracksByAlbumSpotifyId = new Map<string, { id: string }[]>();
  const allTrackIds = new Set<string>();

  for (const a of albums) {
    const list = await spotifyClient.getAlbumTracks(a.id);
    tracksByAlbumSpotifyId.set(
      a.id,
      list.map((t) => ({ id: t.id })),
    );
    for (const t of list) {
      allTrackIds.add(t.id);
    }
  }

  console.log(`Resolving ${allTrackIds.size} unique track id(s) (full objects)`);

  const fullTracks = await spotifyClient.getTracksByIds([...allTrackIds]);
  const fullById = new Map<string, SpotifyTrack>(fullTracks.map((t) => [t.id, t]));

  let createdTracks = 0;
  let skippedTracks = 0;

  for (const a of albums) {
    const albumDb = albumDbBySpotifyId.get(a.id);
    if (!albumDb) continue;

    const trackRefs = tracksByAlbumSpotifyId.get(a.id) ?? [];

    for (const ref of trackRefs) {
      const full = fullById.get(ref.id);
      if (!full) {
        skippedTracks++;
        continue;
      }
      if (!full.is_playable) {
        skippedTracks++;
        continue;
      }

      if (!trackCreditsArtist(full, row.spotifyId)) {
        continue;
      }

      let persisted = await prisma.track.findUnique({
        where: { spotifyId: full.id },
        select: { id: true },
      });

      if (!persisted) {
        persisted = await prisma.track.create({
          data: {
            spotifyId: full.id,
            artistId: row.id,
            albumId: albumDb.id,
            name: full.name,
            popularity: full.popularity,
            trackNumber: full.track_number,
          },
          select: { id: true },
        });
        createdTracks++;
      }

      const spotifyArtistIds = [
        ...new Set((full.artists ?? []).map((x) => x.id)),
      ];
      const linkedArtists = await prisma.artist.findMany({
        where: { spotifyId: { in: spotifyArtistIds } },
        select: { id: true },
      });
      const artistIdsToLink = new Set(linkedArtists.map((x) => x.id));
      artistIdsToLink.add(row.id);

      await prisma.trackArtist.createMany({
        data: [...artistIdsToLink].map((artistId) => ({
          trackId: persisted.id,
          artistId,
        })),
        skipDuplicates: true,
      });
    }
  }

  const summary = `Finished. Tracks created: ${createdTracks}; skipped (missing/unplayable): ${skippedTracks}`;
  console.log(summary);
  return summary;
}
