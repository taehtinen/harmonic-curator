/** Collapses case and accents so catalog / DB / user input match consistently. */
export function genreDedupeKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

/**
 * Form stored on artists / playlists: lowercase Spotify-style, with Finnish `iskelmä`
 * instead of ASCII `iskelma`.
 */
export function normalizeGenreForStorage(input: string): string {
  const t = input.trim();
  if (!t) return "";
  if (genreDedupeKey(t) === "iskelma") return "iskelmä";
  return t.toLowerCase();
}

/** Title case for UI pills (stored values stay lowercase). */
export function formatGenreDisplayName(stored: string): string {
  const t = stored.trim();
  if (!t) return t;
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join("-"),
    )
    .join(" ");
}
