import * as readline from "node:readline";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

/** One line from stdin, ends with Enter. Prompt is on stderr; no readline output binding. */
function readPasswordLine(): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const rl = readline.createInterface({
      input: process.stdin,
      terminal: true,
    });
    const finish = (value: string) => {
      if (settled) return;
      settled = true;
      rl.close();
      resolve(value.replace(/\r$/, ""));
    };
    rl.once("line", (line) => {
      finish(line);
    });
    rl.once("close", () => {
      finish("");
    });
    rl.once("error", (err) => {
      if (settled) return;
      settled = true;
      rl.close();
      reject(err);
    });
  });
}

async function main() {
  const raw = process.argv[2];
  if (!raw?.trim()) {
    console.error("Usage: tsx scripts/seed-create-user.ts <username>");
    console.error(
      "Interactive terminal only: prints Password: on stderr, then reads one line (Enter).",
    );
    process.exitCode = 1;
    return;
  }

  const username = raw.trim();
  process.stderr.write("Password: ");
  const password = await readPasswordLine();
  if (!password) {
    console.error("Password is empty.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);

  const row = await prisma.user.upsert({
    where: { username },
    create: { username, passwordHash },
    update: { passwordHash },
  });

  console.log(`Upserted user: ${row.username} (db id=${row.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
