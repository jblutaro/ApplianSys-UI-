import type { NextFunction, Request, Response } from "express";
import { clearSession, readSession } from "./session.js";
import { findUserById, isActiveStatus, isStaffOrAdminUser } from "./users.js";

export async function requireAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await readSession(req);
    if (!session) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const user = await findUserById(session.userId);
    if (!user || !isActiveStatus(user.status)) {
      await clearSession(req, res);
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await readSession(req);
    if (!session) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const user = await findUserById(session.userId);
    if (!user || !isActiveStatus(user.status)) {
      await clearSession(req, res);
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    if (!isStaffOrAdminUser(user)) {
      res.status(403).json({ ok: false, message: "Admin or staff access required." });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
