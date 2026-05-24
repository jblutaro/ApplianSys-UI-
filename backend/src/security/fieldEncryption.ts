import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";

const ENCRYPTED_PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";

function getKey() {
  if (!env.fieldEncryptionKey.trim()) return null;
  return createHash("sha256").update(env.fieldEncryptionKey).digest();
}

export function encryptField(value: string | null | undefined) {
  const plaintext = value?.trim() ?? "";
  if (!plaintext) return null;

  const key = getKey();
  if (!key || plaintext.startsWith(ENCRYPTED_PREFIX)) return plaintext;

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTED_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptField(value: string | null | undefined) {
  const storedValue = value ?? "";
  if (!storedValue.startsWith(ENCRYPTED_PREFIX)) return storedValue;

  const key = getKey();
  if (!key) return "[encrypted]";

  const [, payload] = storedValue.split(ENCRYPTED_PREFIX);
  const [ivBase64, authTagBase64, ciphertextBase64] = payload.split(".");

  if (!ivBase64 || !authTagBase64 || !ciphertextBase64) {
    return "[encrypted]";
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivBase64, "base64url"));
    decipher.setAuthTag(Buffer.from(authTagBase64, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextBase64, "base64url")),
      decipher.final(),
    ]);

    return plaintext.toString("utf8");
  } catch {
    return "[encrypted]";
  }
}
