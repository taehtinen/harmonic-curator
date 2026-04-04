import argon2 from "argon2";

/**
 * Argon2id (OWASP-recommended variant). Uses `argon2` package defaults for
 * memory cost, time cost, and parallelism; the encoded string embeds params and salt.
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  try {
    return await argon2.verify(stored, plain);
  } catch {
    return false;
  }
}
