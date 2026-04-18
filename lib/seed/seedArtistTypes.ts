/** Profile upsert from Spotify (Temporal activity + CLI). */
export type SeedArtistProfileResult = {
  artistDbId: string;
  spotifyId: string;
  name: string;
};

/** Album/track import summary (Temporal activity + CLI). */
export type SeedArtistCatalogResult = {
  albumsCount: number;
  tracksCreated: number;
  skippedTracks: number;
};

/** Full `seedArtist` Temporal workflow result (JSON-serializable). */
export type SeedArtistWorkflowResult = {
  spotifyId: string;
  profile: SeedArtistProfileResult;
  catalog: SeedArtistCatalogResult;
};
