import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION = 1;

function getKey(): Buffer {
  const raw = process.env.SPOTIFY_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("SPOTIFY_TOKEN_ENCRYPTION_KEY is not set");
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "SPOTIFY_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (use 64 hex chars or base64)",
    );
  }
  return key;
}

/**
 * Encrypt a UTF-8 string for at-rest storage. Output is base64url (version byte + iv + tag + ciphertext).
 */
export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([Buffer.from([VERSION]), iv, tag, ciphertext]);
  return payload.toString("base64url");
}

/**
 * Decrypt a value produced by {@link encryptSecret}.
 */
export function decryptSecret(enc: string): string {
  const key = getKey();
  const buf = Buffer.from(enc, "base64url");
  if (buf.length < 1 + IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid ciphertext");
  }
  if (buf[0] !== VERSION) {
    throw new Error(`Unsupported ciphertext version: ${buf[0]}`);
  }
  const iv = buf.subarray(1, 1 + IV_LENGTH);
  const tag = buf.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(1 + IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
