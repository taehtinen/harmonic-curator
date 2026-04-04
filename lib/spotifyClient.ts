export interface SpotifyArtistsResponse {
  artists: {
    items: SpotifyArtist[];
    next: string | null;
    total: number;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  followers: {
    total: number;
  };
  popularity: number;
  genres: string[];
}

export interface SpotifyTracksResponse {
  tracks: SpotifyTrack[];
}

export interface SpotifyPaging<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

/** Album stub returned by GET /v1/artists/{id}/albums */
export interface SpotifyArtistAlbum {
  id: string;
  name: string;
  release_date: string;
}

/** Track stub returned by GET /v1/albums/{id}/tracks */
export interface SpotifyAlbumTrack {
  id: string;
  name: string;
  track_number: number;
  is_playable?: boolean;
}

export interface SpotifyTracksByIdsResponse {
  tracks: (SpotifyTrack | null)[];
}

export interface SpotifyArtistsByIdsResponse {
  artists: (SpotifyArtist | null)[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  track_number: number;
  is_playable: boolean;
  /** Present on full track objects; may be absent on minimal nested payloads. */
  artists?: SpotifyTrackArtistRef[];
  album: {
    id: string;
    name: string;
    release_date: string;
  };
}

export interface SpotifyTrackArtistRef {
  id: string;
  name: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: {
    total: number;
    items: {
      added_at: string;
      track: SpotifyTrack;
    }[];
  };
}

/**
 * Paging object for the playlist’s track list on GET /v1/playlists/{id}.
 * In the API this is the field **`items`** on the playlist object (not `tracks`, which is deprecated).
 * @see https://developer.spotify.com/documentation/web-api/reference/get-playlist
 */
export interface SpotifyPlaylistContentPaging {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

/**
 * Normalized GET /v1/playlists/{id} payload (fields we use).
 * Track list paging is always exposed as **`items`**; `getPlaylist` maps legacy `tracks` into `items`.
 */
export interface SpotifyPlaylistMeta {
  id: string;
  name: string;
  description: string | null;
  /** Playlist track paging (`items` in the Web API — not `tracks`). */
  items?: SpotifyPlaylistContentPaging;
}

/** Track count from `items.total` after `getPlaylist` normalization. */
export function getPlaylistTrackTotal(meta: SpotifyPlaylistMeta): number {
  return meta.items?.total ?? 0;
}

/** Raw JSON may still include deprecated `tracks` (same shape as `items`). */
type SpotifyPlaylistGetResponse = SpotifyPlaylistMeta & {
  tracks?: SpotifyPlaylistContentPaging;
};

/**
 * One row from GET /v1/playlists/{id}/tracks (PlaylistTrackObject).
 * Spotify prefers `item` over deprecated `track`; either may be null when unavailable.
 */
export interface SpotifyPlaylistItem {
  added_at: string;
  /** Preferred (track or episode object). */
  item?: SpotifyTrack | SpotifyPlaylistEpisodeRef | null;
  /** @deprecated Spotify: use `item` instead. */
  track?: SpotifyTrack | null;
}

/** Minimal episode shape when `additional_types=episode` or mixed playlist items. */
export interface SpotifyPlaylistEpisodeRef {
  id: string;
  type: "episode";
}

function playlistItemToTrackId(row: SpotifyPlaylistItem): string | undefined {
  const node = row.item ?? row.track;
  if (!node) return undefined;
  if ("type" in node && node.type === "episode") return undefined;
  return node.id;
}

/** Full album from GET /v1/albums/{id} (fields we use). */
export interface SpotifyAlbumFull {
  id: string;
  name: string;
  release_date: string;
  artists: SpotifyTrackArtistRef[];
}

export interface SpotifySnapshotResponse {
  snapshot_id: string;
}

export class SpotifyClient {
  private accessToken: string | null = null;
  private expiresAt: number = 0;
  private spotifyClientId: string;
  private spotifyClientSecret: string;
  private spotifyMarket: string;
  private spotifyUserId: string;

  constructor(private readonly options: { code?: string, redirectUri?: string } = {}) {
    if (!process.env.SPOTIFY_CLIENT_ID) {
      throw new Error("Environment variable SPOTIFY_CLIENT_ID is not set");
    }
    this.spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
    if (!process.env.SPOTIFY_CLIENT_SECRET) {
      throw new Error("Environment variable SPOTIFY_CLIENT_SECRET is not set");
    }
    this.spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!process.env.SPOTIFY_MARKET) {
      throw new Error("Environment variable SPOTIFY_MARKET is not set");
    }
    this.spotifyMarket = process.env.SPOTIFY_MARKET;
    if (!process.env.SPOTIFY_USER_ID) {
      throw new Error("Environment variable SPOTIFY_USER_ID is not set");
    }
    this.spotifyUserId = process.env.SPOTIFY_USER_ID;
  }

  private async fetch<T>(method: string, url: string, body?: unknown): Promise<T> {
    console.log("Fetching", method, url);
    const headers = await this.getAuthorizationHeader();
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") ?? "1");
      console.warn("Rate limited by Spotify API, retrying in", retryAfter, "seconds");
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.fetch<T>(method, url, body);
    }

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`Failed to fetch ${method} ${url}: ${response.status} ${response.statusText}\n${responseBody}`);
    }

    return await response.json();
  }

  private async getAuthorizationHeader(): Promise<{ [key: string]: string }> {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const authString = Buffer.from(`${this.spotifyClientId}:${this.spotifyClientSecret}`).toString("base64");

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: this.options.code ? "authorization_code" : "client_credentials",
          code: this.options.code ?? "",
          redirect_uri: this.options.redirectUri ?? "",
        }),
      });

      if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(`Failed to refresh Spotify access token: ${response.status} ${response.statusText}\n${responseBody}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.expiresAt = Date.now() + data.expires_in * 1000;
      console.log("Successfully refreshed Spotify access token, expires at", new Date(this.expiresAt).toISOString());
    } catch (error) {
      console.error("Failed to refresh Spotify access token:", error);
      throw error;
    }
  }

  public async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/items`;
    const body = {
      uris: trackIds.map(id => `spotify:track:${id}`),
    };
    console.log(body);
    const data = await this.fetch<SpotifySnapshotResponse>('POST', url, body);
    console.log(`Added ${trackIds.length} tracks to playlist ${playlistId} with snapshot id ${data.snapshot_id}`);
  }

  public async createPlaylist(name: string, description: string): Promise<SpotifyPlaylist> {
    const url = `https://api.spotify.com/v1/users/${this.spotifyUserId}/playlists`;
    const body = {
      name: name,
      public: true,
      collaborative: false,
      description: description
    };
    const data = await this.fetch<SpotifyPlaylist>('POST', url, body);
    console.log(`Created playlist: ${name}`);
    return data;
  }

  public async getArtist(artistId: string): Promise<SpotifyArtist | null> {
    const url = `https://api.spotify.com/v1/artists/${artistId}?market=${this.spotifyMarket}`;
    try {
      const data = await this.fetch<SpotifyArtist>('GET', url);
      return data;
    } catch (error) {
      console.error(`Error fetching artist with ID ${artistId}:`, error);
      return null;
    }
  }

  /** Full artist objects, max 50 ids per request. */
  public async getArtistsByIds(artistIds: string[]): Promise<SpotifyArtist[]> {
    const chunkSize = 50;
    const out: SpotifyArtist[] = [];

    for (let i = 0; i < artistIds.length; i += chunkSize) {
      const chunk = artistIds.slice(i, i + chunkSize);
      const params = new URLSearchParams({
        ids: chunk.join(","),
      });
      const data = await this.fetch<SpotifyArtistsByIdsResponse>(
        "GET",
        `https://api.spotify.com/v1/artists?${params.toString()}`,
      );
      for (const a of data.artists) {
        if (a) out.push(a);
      }
    }

    return out;
  }

  public async getArtistsTopTracks(artistId: string): Promise<SpotifyTrack[]> {
    const url = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${this.spotifyMarket}`;
    const data = await this.fetch<SpotifyTracksResponse>('GET', url);
    return data.tracks;
  }

  /**
   * All albums (and related release groups) where the artist appears, deduped by Spotify album id.
   * Order follows the API (typically recent first).
   */
  public async getArtistAlbums(artistId: string): Promise<SpotifyArtistAlbum[]> {
    const limit = 50;
    const includeGroups = "album,single,appears_on,compilation";
    let url: string | null =
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=${includeGroups}&market=${this.spotifyMarket}&limit=${limit}`;
    const byId = new Map<string, SpotifyArtistAlbum>();

    while (url) {
      const pageUrl = url;
      const page: SpotifyPaging<SpotifyArtistAlbum> = await this.fetch(
        "GET",
        pageUrl,
      );
      for (const item of page.items) {
        if (item?.id && !byId.has(item.id)) {
          byId.set(item.id, item);
        }
      }
      url = page.next;
    }

    return [...byId.values()];
  }

  public async getAlbumTracks(albumId: string): Promise<SpotifyAlbumTrack[]> {
    const limit = 50;
    let url: string | null =
      `https://api.spotify.com/v1/albums/${albumId}/tracks?market=${this.spotifyMarket}&limit=${limit}`;
    const all: SpotifyAlbumTrack[] = [];

    while (url) {
      const pageUrl = url;
      const page: SpotifyPaging<SpotifyAlbumTrack> = await this.fetch(
        "GET",
        pageUrl,
      );
      all.push(...page.items.filter((t: SpotifyAlbumTrack) => t?.id));
      url = page.next;
    }

    return all;
  }

  /** Full track objects (popularity, album, artists), max 50 ids per request. */
  public async getTracksByIds(trackIds: string[]): Promise<SpotifyTrack[]> {
    const chunkSize = 50;
    const out: SpotifyTrack[] = [];

    for (let i = 0; i < trackIds.length; i += chunkSize) {
      const chunk = trackIds.slice(i, i + chunkSize);
      const params = new URLSearchParams({
        ids: chunk.join(","),
        market: this.spotifyMarket,
      });
      const data = await this.fetch<SpotifyTracksByIdsResponse>(
        "GET",
        `https://api.spotify.com/v1/tracks?${params.toString()}`,
      );
      for (const t of data.tracks) {
        if (t) out.push(t);
      }
    }

    return out;
  }

  public async removeAllTracksFromPlaylist(playlistId: string): Promise<number> {
    const getUrl = `https://api.spotify.com/v1/playlists/${playlistId}/items?market=${this.spotifyMarket}`;
    let totalRemoved = 0;
    while (true) {
      const getData = await this.fetch<{
        items: { track?: { uri: string } | null; item?: { uri?: string } | null }[];
        total: number;
      }>("GET", getUrl);
      const trackUris = getData.items
        .map((row) => row.item?.uri ?? row.track?.uri)
        .filter((u): u is string => Boolean(u));
      if (trackUris.length === 0) {
        break;
      }
      const removeUrl = `https://api.spotify.com/v1/playlists/${playlistId}/items`;
      const body = {
        items: trackUris.map((uri) => ({ uri })),
      };
      await this.fetch<SpotifySnapshotResponse>("DELETE", removeUrl, body);
      totalRemoved += trackUris.length;
      console.log(`Removed ${trackUris.length} tracks from playlist ${playlistId}`);
    }
    return totalRemoved;
  }

  public async searchArtists(query: string): Promise<SpotifyArtist[]> {
    const allArtists: SpotifyArtist[] = [];
    const limit = 50; // Spotify API limit
    const total = 1000; // Spotify API limit
    let offset = 0;

    while (offset < total) {
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}&offset=${offset}&market=${this.spotifyMarket}`;
      const data = await this.fetch<SpotifyArtistsResponse>("GET", url);
      allArtists.push(...data.artists.items);
      const itemsCount = data.artists.items.length;
      offset += itemsCount;
      console.log("Fetched", data.artists.items.length, "artists, total", offset);
      if (itemsCount === 0) {
        break;
      }
    }

    return allArtists;
  }

  public async updatePlaylist(playlistId: string, name: string, description: string): Promise<void> {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
    const body = {
      name: name,
      description: description,
    };
    await this.fetch<void>('PUT', url, body);
    console.log(`Updated playlist ${playlistId} with name "${name}" and description "${description}"`);
  }

  /**
   * GET /v1/playlists/{id}
   * Spotify documents playlist track paging under **`items`**; older responses may send **`tracks`** instead (deprecated).
   * This method normalizes so the returned object always uses **`items`**.
   * @see https://developer.spotify.com/documentation/web-api/reference/get-playlist
   */
  public async getPlaylist(playlistId: string): Promise<SpotifyPlaylistMeta> {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}?market=${this.spotifyMarket}`;
    const raw = await this.fetch<SpotifyPlaylistGetResponse>("GET", url);
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      items: raw.items ?? raw.tracks,
    };
  }

  public async getAlbum(albumId: string): Promise<SpotifyAlbumFull | null> {
    const url = `https://api.spotify.com/v1/albums/${albumId}?market=${this.spotifyMarket}`;
    try {
      return await this.fetch<SpotifyAlbumFull>("GET", url);
    } catch (error) {
      console.error(`Error fetching album ${albumId}:`, error);
      return null;
    }
  }

  /**
   * All playlist track items in order (paginated GET /v1/playlists/{id}/items).
   * Rows without a usable Spotify track id (episode, removed, local) are skipped.
   */
  public async getPlaylistTrackIds(playlistId: string): Promise<string[]> {
    const { ids } = await this.getPlaylistTrackIdsWithLatestAdded(playlistId);
    return ids;
  }

  /**
   * Same tracks as {@link getPlaylistTrackIds}, plus the latest `added_at` among those rows (single paginated pass).
   */
  public async getPlaylistTrackIdsWithLatestAdded(
    playlistId: string,
  ): Promise<{ ids: string[]; latestTrackAddedAt: Date | null }> {
    const limit = 50;
    let url: string | null =
      `https://api.spotify.com/v1/playlists/${playlistId}/items?market=${this.spotifyMarket}&limit=${limit}`;
    const ids: string[] = [];
    let maxAddedMs = 0;

    while (url) {
      const page: SpotifyPaging<SpotifyPlaylistItem> = await this.fetch(
        "GET",
        url,
      );
      for (const row of page.items) {
        const id = playlistItemToTrackId(row);
        if (id) {
          ids.push(id);
          if (row.added_at) {
            const t = Date.parse(row.added_at);
            if (!Number.isNaN(t) && t > maxAddedMs) maxAddedMs = t;
          }
        }
      }
      url = page.next;
    }

    return {
      ids,
      latestTrackAddedAt: maxAddedMs > 0 ? new Date(maxAddedMs) : null,
    };
  }

}

