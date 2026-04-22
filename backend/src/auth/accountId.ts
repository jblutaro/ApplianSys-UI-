import { randomBytes } from "node:crypto";

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ACCOUNT_ID_PREFIX: Record<string, string> = {
  admin: "ADM",
  customer: "CUS",
  staff: "STF",
};

function encodeBase32(value: bigint, length: number) {
  const chars = new Array<string>(length);
  let current = value;

  for (let index = length - 1; index >= 0; index -= 1) {
    chars[index] = CROCKFORD_BASE32[Number(current & 31n)];
    current >>= 5n;
  }

  return chars.join("");
}

function randomBigInt(byteLength: number) {
  const bytes = randomBytes(byteLength);
  let value = 0n;

  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }

  return value;
}

function normalizeTimestamp(input?: Date | string | number | null) {
  if (input instanceof Date) {
    return input.getTime();
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }

  if (typeof input === "string" && input.trim()) {
    const parsed = Date.parse(input);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Date.now();
}

export function generateUlid(input?: Date | string | number | null) {
  const timestamp = normalizeTimestamp(input);
  const timePart = encodeBase32(BigInt(timestamp), 10);
  const randomPart = encodeBase32(randomBigInt(10), 16);
  return `${timePart}${randomPart}`;
}

export function generateAccountId(
  userType: string | null | undefined,
  createdAt?: Date | string | number | null,
) {
  const normalizedType = (userType ?? "customer").trim().toLowerCase();
  const prefix = ACCOUNT_ID_PREFIX[normalizedType] ?? "USR";
  return `${prefix}-${generateUlid(createdAt)}`;
}
