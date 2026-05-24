import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { createHash, randomBytes } from "node:crypto";
import { dbPool } from "../config/database.js";
import { env } from "../config/env.js";
import { appendSetCookie, readCookie } from "../security/cookies.js";

export type AuthSource = "local";

type SessionRecord = {
  authSource: AuthSource;
  expiresAt: number;
  stepUpVerifiedAt: number | null;
  userId: number;
};

const SESSION_COOKIE = "appliansys_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
let sessionSchemaReady = false;

type SessionRow = RowDataPacket & {
  auth_source: AuthSource;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  step_up_verified_at: Date | string | null;
  user_id: number;
};

function buildCookie(value: string, maxAgeSeconds: number) {
  const cookieParts = [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];

  if (env.nodeEnv === "production") {
    cookieParts.push("Secure");
  }

  return cookieParts.join("; ");
}

async function ensureSessionSchema() {
  if (sessionSchemaReady) return;

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS auth_session (
      session_id INT AUTO_INCREMENT PRIMARY KEY,
      token_hash CHAR(64) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      auth_source VARCHAR(40) NOT NULL DEFAULT 'local',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      step_up_verified_at DATETIME NULL,
      revoked_at DATETIME NULL,
      INDEX idx_auth_session_user (user_id),
      INDEX idx_auth_session_expires (expires_at),
      INDEX idx_auth_session_revoked (revoked_at)
    )
  `);

  const [columns] = await dbPool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'auth_session'
       AND COLUMN_NAME = 'step_up_verified_at'`,
  );

  if (columns.length === 0) {
    await dbPool.query(
      "ALTER TABLE auth_session ADD COLUMN step_up_verified_at DATETIME NULL AFTER expires_at",
    );
  }

  sessionSchemaReady = true;
}

function getSessionToken(req: Request): string | null {
  return readCookie(req.headers.cookie, SESSION_COOKIE);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toMysqlDateTime(timestampMs: number) {
  return new Date(timestampMs).toISOString().slice(0, 19).replace("T", " ");
}

function normalizeExpiresAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime();
}

async function pruneExpiredSessions() {
  await ensureSessionSchema();
  await dbPool.query(
    "UPDATE auth_session SET revoked_at = NOW() WHERE revoked_at IS NULL AND expires_at <= NOW()",
  );
}

export async function readSession(req: Request): Promise<SessionRecord | null> {
  await ensureSessionSchema();

  const token = getSessionToken(req);
  if (!token) return null;

  const [rows] = await dbPool.query<SessionRow[]>(
    `SELECT user_id, auth_source, expires_at, step_up_verified_at, revoked_at
     FROM auth_session
     WHERE token_hash = ?
     LIMIT 1`,
    [hashToken(token)],
  );
  const session = rows[0];
  if (!session || session.revoked_at) return null;

  const expiresAt = normalizeExpiresAt(session.expires_at);
  if (expiresAt <= Date.now()) {
    await dbPool.query("UPDATE auth_session SET revoked_at = NOW() WHERE token_hash = ?", [
      hashToken(token),
    ]);
    return null;
  }

  return {
    authSource: session.auth_source,
    expiresAt,
    stepUpVerifiedAt: session.step_up_verified_at ? normalizeExpiresAt(session.step_up_verified_at) : null,
    userId: Number(session.user_id),
  };
}

export async function createSession(res: Response, userId: number): Promise<SessionRecord> {
  await pruneExpiredSessions();

  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const session: SessionRecord = {
    authSource: "local",
    expiresAt,
    stepUpVerifiedAt: null,
    userId,
  };

  await dbPool.query(
    `INSERT INTO auth_session (token_hash, user_id, auth_source, expires_at)
     VALUES (?, ?, ?, ?)`,
    [hashToken(token), userId, session.authSource, toMysqlDateTime(expiresAt)],
  );
  appendSetCookie(res, buildCookie(token, SESSION_TTL_MS / 1000));

  return session;
}

export async function clearSession(req: Request, res: Response) {
  const token = getSessionToken(req);
  if (token) {
    await ensureSessionSchema();
    await dbPool.query("UPDATE auth_session SET revoked_at = NOW() WHERE token_hash = ?", [
      hashToken(token),
    ]);
  }

  appendSetCookie(res, buildCookie("", 0));
}

export async function revokeUserSessions(userId: number) {
  await ensureSessionSchema();
  await dbPool.query("UPDATE auth_session SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [
    userId,
  ]);
}

export async function markSessionStepUpVerified(req: Request) {
  await ensureSessionSchema();

  const token = getSessionToken(req);
  if (!token) return false;

  const [result] = await dbPool.query(
    `UPDATE auth_session
     SET step_up_verified_at = NOW()
     WHERE token_hash = ?
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [hashToken(token)],
  );

  return "affectedRows" in result && Number(result.affectedRows) > 0;
}
