import type { Response } from "express";

export function appendSetCookie(res: Response, cookie: string) {
  const current = res.getHeader("Set-Cookie");

  if (!current) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }

  if (Array.isArray(current)) {
    res.setHeader("Set-Cookie", [...current, cookie]);
    return;
  }

  res.setHeader("Set-Cookie", [String(current), cookie]);
}

export function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      return rawValue.join("=") || null;
    }
  }

  return null;
}
