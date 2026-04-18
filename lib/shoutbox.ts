import { prisma } from "@/lib/prisma";

const SHOUTS_HOME_LIMIT = 50;

export type ShoutListRow = {
  id: string;
  createdAt: Date;
  username: string;
  body: string;
};

export async function listShoutsForHome(): Promise<ShoutListRow[]> {
  const rows = await prisma.shout.findMany({
    select: {
      id: true,
      createdAt: true,
      body: true,
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: SHOUTS_HOME_LIMIT,
  });

  const chronological = rows.slice().reverse();
  return chronological.map((r) => ({
    id: r.id.toString(),
    createdAt: r.createdAt,
    username: r.user.username,
    body: r.body,
  }));
}
