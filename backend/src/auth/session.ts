import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";

export type AuthSource = "local";

type SessionRecord = {
  authSource: AuthSource;
  expiresAt: number;
  userId: number;
};

const SESSION_COOKIE = "appliansys_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const sessions = new Map<string, SessionRecord>();

function buildCookie(value: string, maxAgeSeconds: number) {
  return [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ].join("; ");
}

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
}

function getSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === SESSION_COOKIE) {
      return rawValue.join("=") || null;
    }
  }

  return null;
}

export function readSession(req: Request): SessionRecord | null {
  pruneExpiredSessions();

  const token = getSessionToken(req);
  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }

  return session;
}

export function createSession(res: Response, userId: number): SessionRecord {
  pruneExpiredSessions();

  const token = randomBytes(24).toString("hex");
  const session: SessionRecord = {
    authSource: "local",
    expiresAt: Date.now() + SESSION_TTL_MS,
    userId,
  };

  sessions.set(token, session);
  res.setHeader("Set-Cookie", buildCookie(token, SESSION_TTL_MS / 1000));

  return session;
}

export function clearSession(req: Request, res: Response) {
  const token = getSessionToken(req);
  if (token) {
    sessions.delete(token);
  }

  res.setHeader("Set-Cookie", buildCookie("", 0));
}
