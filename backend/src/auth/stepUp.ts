import type { NextFunction, Request, Response } from "express";
import { readSession } from "./session.js";

const MUTATING_METHODS = new Set(["DELETE", "PATCH", "POST", "PUT"]);
const STEP_UP_TTL_MS = 10 * 60 * 1000;

export async function requireRecentStepUp(req: Request, res: Response, next: NextFunction) {
  try {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const session = await readSession(req);
    const verifiedAt = session?.stepUpVerifiedAt ?? 0;

    if (!session || Date.now() - verifiedAt > STEP_UP_TTL_MS) {
      res.status(403).json({
        code: "STEP_UP_REQUIRED",
        ok: false,
        message: "Recent password confirmation is required for this admin action.",
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
