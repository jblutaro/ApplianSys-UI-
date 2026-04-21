import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export const LEGACY_SEEDED_PASSWORD_MARKER = "hashed-password";
export const SEEDED_USER_PASSWORD = "ApplianSys123!";
const HASH_PREFIX = "scrypt:";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${HASH_PREFIX}${salt}:${derivedKey.toString("hex")}`;
}

export function isPasswordHash(value: string): boolean {
  return value.startsWith(HASH_PREFIX);
}

export async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  if (!isPasswordHash(storedPassword)) {
    return false;
  }

  const [, salt, expectedHex] = storedPassword.split(":");
  if (!salt || !expectedHex) {
    return false;
  }

  const expectedKey = Buffer.from(expectedHex, "hex");
  const suppliedKey = (await scrypt(password, salt, expectedKey.length)) as Buffer;

  return (
    expectedKey.length === suppliedKey.length &&
    timingSafeEqual(expectedKey, suppliedKey)
  );
}

export function isLegacyPlaintextPassword(password: string, storedPassword: string): boolean {
  return !isPasswordHash(storedPassword) && storedPassword === password;
}
