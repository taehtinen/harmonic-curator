/** Spotify order first, then DB-only genres (e.g. admin-added) not matched case-insensitively. */
export function mergeSpotifyGenresWithExisting(
  existingGenres: string[],
  spotifyGenres: string[],
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const g of spotifyGenres) {
    const key = g.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(g);
    }
  }

  for (const g of existingGenres) {
    const key = g.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(g);
    }
  }

  return merged;
}
