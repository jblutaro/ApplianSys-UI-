import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function requestTimeout(req: Request, res: Response, next: NextFunction) {
  req.setTimeout(env.requestTimeoutMs);
  res.setTimeout(env.requestTimeoutMs, () => {
    if (!res.headersSent) {
      res.status(503).json({
        ok: false,
        message: "Request timed out.",
      });
    }
  });

  next();
}
