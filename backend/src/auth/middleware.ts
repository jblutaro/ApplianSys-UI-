import type { NextFunction, Request, Response } from "express";
import { clearSession, readSession } from "./session.js";
import { findUserById, isActiveStatus, isAdminUser } from "./users.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const session = readSession(req);
    if (!session) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const user = await findUserById(session.userId);
    if (!user || !isActiveStatus(user.status)) {
      clearSession(req, res);
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    if (!isAdminUser(user)) {
      res.status(403).json({ ok: false, message: "Admin access required." });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
