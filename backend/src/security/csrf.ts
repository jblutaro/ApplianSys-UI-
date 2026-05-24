import type { NextFunction, Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { appendSetCookie, readCookie } from "./cookies.js";

const CSRF_COOKIE = "appliansys_csrf";
const SESSION_COOKIE = "appliansys_session";
const UNSAFE_METHODS = new Set(["DELETE", "PATCH", "POST", "PUT"]);
const EXEMPT_PATHS = new Set(["/api/auth/login", "/api/auth/register"]);

function buildCsrfCookie(token: string) {
  const cookieParts = [
    `${CSRF_COOKIE}=${token}`,
    "Path=/",
    "SameSite=Lax",
    "Max-Age=604800",
  ];

  if (env.nodeEnv === "production") {
    cookieParts.push("Secure");
  }

  return cookieParts.join("; ");
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  let csrfToken = readCookie(req.headers.cookie, CSRF_COOKIE);

  if (!csrfToken) {
    csrfToken = randomBytes(32).toString("hex");
    appendSetCookie(res, buildCsrfCookie(csrfToken));
  }

  const hasSessionCookie = Boolean(readCookie(req.headers.cookie, SESSION_COOKIE));
  const isUnsafeRequest = UNSAFE_METHODS.has(req.method.toUpperCase());
  const isExempt = EXEMPT_PATHS.has(req.path);

  if (isUnsafeRequest && hasSessionCookie && !isExempt) {
    const headerToken = req.get("X-CSRF-Token") ?? "";
    if (!headerToken || !safeEqual(headerToken, csrfToken)) {
      res.status(403).json({
        ok: false,
        message: "Invalid or missing CSRF token.",
      });
      return;
    }
  }

  next();
}
