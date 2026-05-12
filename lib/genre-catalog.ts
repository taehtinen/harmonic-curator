import { existsSync, readFileSync } from "fs";
import path from "path";

import { MAIN_FINNISH_GENRE_VALUES } from "@/lib/main-finnish-genres";
import { genreDedupeKey } from "@/lib/genre-normalize";

const MAX_RESULTS = 20;

type CatalogCache = {
  all: string[];
  finnishKeys: Set<string>;
};

let cache: CatalogCache | null = null;

function resolveGenreFile(name: "all-genres.txt" | "finnish-genres.txt"): string {
  const root = process.cwd();
  const candidates = [path.join(root, name), path.join(root, "lib", "data", name)];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    `Missing ${name} (try project root or lib/data/). Needed for genre search.`,
  );
}

function loadCatalog(): CatalogCache {
  if (cache) return cache;

  const allPath = resolveGenreFile("all-genres.txt");
  const finPath = resolveGenreFile("finnish-genres.txt");

  const all = readFileSync(allPath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const finnishLines = readFileSync(finPath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const finnishKeys = new Set(finnishLines.map((l) => genreDedupeKey(l)));
  cache = {
    all: [...new Set(all)],
    finnishKeys,
  };
  return cache;
}

const MAIN_DEDUPE_KEYS = new Set(
  MAIN_FINNISH_GENRE_VALUES.map((v) => genreDedupeKey(v)),
);

function scoreMatch(genre: string, qFold: string): number {
  const g = genre.trim();
  const gFold = genreDedupeKey(g);
  let score = 0;

  if (MAIN_DEDUPE_KEYS.has(gFold)) score += 1_000;
  if (cache?.finnishKeys.has(gFold)) score += 200;

  if (gFold.startsWith(qFold)) score += 100;
  else if (gFold.split(/[\s/-]/).some((w) => w.startsWith(qFold))) score += 60;

  score -= g.length / 1_000;
  return score;
}

/**
 * Search the static genre catalog with Finnish-prioritized ranking.
 * `query` should be trimmed; callers enforce minimum length.
 */
export function searchGenreCatalog(query: string): string[] {
  const q = query.trim();
  if (q.length < 2) return [];

  loadCatalog();
  const qFold = genreDedupeKey(q);

  const scored: { g: string; score: number }[] = [];
  for (const g of cache!.all) {
    const gFold = genreDedupeKey(g);
    if (!gFold.includes(qFold)) continue;
    scored.push({ g, score: scoreMatch(g, qFold) });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return genreDedupeKey(a.g).localeCompare(genreDedupeKey(b.g));
  });

  const seen = new Set<string>();
  const out: string[] = [];
  for (const { g } of scored) {
    const k = genreDedupeKey(g);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(g);
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}
