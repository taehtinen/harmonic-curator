import type { Playlist, PlaylistTrack, Track } from "@prisma/client";

export type PlaylistSidebarTrackRow = PlaylistTrack & {
  track: Track & {
    artist: { id: bigint; name: string };
    album: { releaseDate: string };
    trackArtists: Array<{ artist: { id: bigint; name: string } }>;
  };
};

export type PlaylistWithSidebarTracks = Playlist & {
  playlistTracks: PlaylistSidebarTrackRow[];
};
