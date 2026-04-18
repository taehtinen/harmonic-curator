import { auth } from "@/auth";
import { normalizeArtistSearchQuery } from "@/lib/artist-search-query";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_RESULTS = 20;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = normalizeArtistSearchQuery(searchParams.get("q") ?? "");
  if (q.length < 2) {
    return NextResponse.json({ artists: [] satisfies { id: string; name: string }[] });
  }

  const artists = await prisma.artist.findMany({
    where: {
      isIgnored: false,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { spotifyId: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true },
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
    take: MAX_RESULTS,
  });

  return NextResponse.json({
    artists: artists.map((a) => ({ id: a.id.toString(), name: a.name })),
  });
}
