/**
 * If `raw` looks like a Spotify artist open URL or `spotify:artist:` URI,
 * returns the bare Spotify artist id. Otherwise returns trimmed `raw`.
 */
export function normalizeArtistSearchQuery(raw: string): string {
  const s = raw.trim();
  if (!s) return s;

  const uri = /^spotify:artist:(.+)$/i.exec(s);
  if (uri) return uri[1].trim();

  if (/open\.spotify\.com/i.test(s)) {
    const fromPath = /\/artist\/([^/?#]+)/i.exec(s);
    if (fromPath) return fromPath[1];
  }

  return s;
}
