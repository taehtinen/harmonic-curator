import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const MAX_RESULTS = 20;

/** Escape `%`, `_`, and `\` so user input is matched literally in ILIKE. */
function escapeIlikeLiteral(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ genres: [] satisfies string[] });
  }

  const pattern = `%${escapeIlikeLiteral(q)}%`;

  const rows = await prisma.$queryRaw<{ genre: string }[]>(Prisma.sql`
    SELECT DISTINCT g AS genre
    FROM artist, unnest(genres) AS g
    WHERE NOT "isIgnored" AND g ILIKE ${pattern} ESCAPE '\\'
    ORDER BY genre ASC
    LIMIT ${MAX_RESULTS}
  `);

  return NextResponse.json({
    genres: rows.map((r) => r.genre),
  });
}
