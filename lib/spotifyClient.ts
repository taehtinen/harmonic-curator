export type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
};

export type SpotifyArtistResponse = {
  artists: {
    items: SpotifyArtist[];
  };
};

export class SpotifyClient {
  private accessToken: string | null = null;
  private expiresAt: number = 0;
  private spotifyClientId: string;
  private spotifyClientSecret: string;
  private spotifyMarket: string;

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
  }

  private async fetch<T>(method: string, url: string, body?: any): Promise<T> {
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

  public async searchArtists(query: string): Promise<SpotifyArtist[]> {
    const allArtists: SpotifyArtist[] = [];
    const limit = 50; // Spotify API limit
    const total = 1000; // Spotify API limit
    let offset = 0;

    while (offset < total) {
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}&offset=${offset}&market=${this.spotifyMarket}`;
      const data = await this.fetch<SpotifyArtistResponse>("GET", url);
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

}

