import type { Album, Artist, Track } from "@prisma/client";

export type ArtistSidebarTrackRow = Track & {
  album: Album;
  trackArtists: Array<{
    artist: Artist;
  }>;
};

export type ArtistSidebarFeatTrackRow = ArtistSidebarTrackRow & {
  artist: Artist;
};

export type ArtistWithSidebarData = Artist & {
  tracks: Array<ArtistSidebarTrackRow>;
  /** Tracks where this artist is credited via track_artists but is not the primary artist. */
  featTracks: Array<ArtistSidebarFeatTrackRow>;
  albums: Array<
    Album & {
      _count: {
        tracks: number;
      };
    }
  >;
};
