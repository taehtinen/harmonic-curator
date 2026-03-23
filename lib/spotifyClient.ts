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

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  track_number: number;
  is_playable: boolean;
  album: {
    id: string;
    name: string;
    release_date: string;
  };
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
  }
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
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
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

  public async getArtistsTopTracks(artistId: string): Promise<SpotifyTrack[]> {
    const url = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${this.spotifyMarket}`;
    const data = await this.fetch<SpotifyTracksResponse>('GET', url);
    return data.tracks;
  }

  public async removeAllTracksFromPlaylist(playlistId: string): Promise<number> {
    const getUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=${this.spotifyMarket}`;
    let totalRemoved = 0;
    while (true) {
      const getData = await this.fetch<{ items: { track: { uri: string } }[]; total: number }>('GET', getUrl);
      const trackUris = getData.items.map(item => item.track.uri);
      if (trackUris.length === 0) {
        break;
      }
      const removeUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
      const body = {
        tracks: trackUris.map(uri => ({ uri })),
      };
      await this.fetch<SpotifySnapshotResponse>('DELETE', removeUrl, body);
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

}

