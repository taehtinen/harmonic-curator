/** Stored genre values (quick picks). Uses `iskelmä` to match DB. */
export const MAIN_FINNISH_GENRE_VALUES = [
  "iskelmä",
  "finnish hip hop",
  "finnish rock",
  "finnish pop",
  "finnish metal",
  "finnish electronic",
] as const;

/** Chip labels (optional; falls back to value). */
export const MAIN_FINNISH_GENRE_LABELS: Record<string, string> = {
  "iskelmä": "Iskelmä",
  "finnish hip hop": "Finnish Hip Hop",
  "finnish rock": "Finnish Rock",
  "finnish pop": "Finnish Pop",
  "finnish metal": "Finnish Metal",
  "finnish electronic": "Finnish Electronic",
};
