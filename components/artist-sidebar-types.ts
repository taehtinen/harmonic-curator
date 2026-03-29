import type { Album, Artist, Track } from "@prisma/client";

export type ArtistWithSidebarData = Artist & {
  tracks: Array<
    Track & {
      album: Album;
      trackArtists: Array<{
        artist: Artist;
      }>;
    }
  >;
  albums: Array<
    Album & {
      _count: {
        tracks: number;
      };
    }
  >;
};
