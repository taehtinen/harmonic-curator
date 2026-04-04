import { UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function parseArgs(argv: string[]) {
  const admin = argv.includes("--admin");
  const positionals = argv.filter((a) => a !== "--admin");
  const unknown = positionals.filter((a) => a.startsWith("-"));
  if (unknown.length > 0) {
    console.error(`Unknown option: ${unknown[0]}`);
    return null;
  }
  return { admin, username: positionals[0]?.trim() ?? "" };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    process.exitCode = 1;
    return;
  }

  const { admin, username } = parsed;

  if (!admin) {
    console.error("Usage: tsx scripts/seed-update-user.ts <username> --admin");
    process.exitCode = 1;
    return;
  }

  if (!username) {
    console.error("Usage: tsx scripts/seed-update-user.ts <username> --admin");
    process.exitCode = 1;
    return;
  }

  const result = await prisma.user.updateMany({
    where: { username },
    data: { status: UserStatus.ADMIN },
  });

  if (result.count === 0) {
    console.error(`User not found: ${username}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Updated user ${username}: status=${UserStatus.ADMIN}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
