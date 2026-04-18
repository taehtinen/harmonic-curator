import { randomBytes, randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

function resolveRootUrl(): string {
  const raw =
    process.env.ROOT_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();
  if (!raw) return "";
  return raw.replace(/\/$/, "");
}

function createRegistrationToken(): string {
  // Short, URL-safe-ish token suitable for copy/paste.
  // randomUUID is available in Node 16+; keep a fallback anyway.
  try {
    return randomUUID();
  } catch {
    return randomBytes(16).toString("hex");
  }
}

function registrationPath(username: string, registrationToken: string): string {
  const u = encodeURIComponent(username);
  const t = encodeURIComponent(registrationToken);
  return `/register?username=${u}&registrationToken=${t}`;
}

function registrationUrl(username: string, registrationToken: string): string {
  const path = registrationPath(username, registrationToken);
  const root = resolveRootUrl();
  return root ? `${root}${path}` : path;
}

async function main() {
  const raw = process.argv[2];
  if (!raw?.trim()) {
    console.error("Usage: tsx scripts/seed-create-user.ts <username>");
    process.exitCode = 1;
    return;
  }

  const username = raw.trim();

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, passwordHash: true, registrationToken: true },
  });

  if (existing?.passwordHash) {
    console.error(
      `User already has a password set: ${username}. Refusing to overwrite.`,
    );
    process.exitCode = 1;
    return;
  }

  if (existing?.registrationToken) {
    const url = registrationUrl(existing.username, existing.registrationToken);
    console.log(
      `Upserted user: ${existing.username} (db id=${existing.id}) registrationToken=${existing.registrationToken}`,
    );
    console.log(`Registration URL: ${url}`);
    return;
  }

  const registrationToken = createRegistrationToken();

  const row = await prisma.user.upsert({
    where: { username },
    create: { username, registrationToken },
    update: { registrationToken },
    select: { id: true, username: true, registrationToken: true },
  });

  const url = registrationUrl(row.username, row.registrationToken ?? "");
  console.log(
    `Upserted user: ${row.username} (db id=${row.id}) registrationToken=${row.registrationToken}`,
  );
  console.log(`Registration URL: ${url}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
