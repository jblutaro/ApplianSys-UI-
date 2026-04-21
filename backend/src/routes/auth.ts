import { Router, type Response } from "express";
import {
  hashPassword,
  isLegacyPlaintextPassword,
  LEGACY_SEEDED_PASSWORD_MARKER,
  SEEDED_USER_PASSWORD,
  verifyPassword,
} from "../auth/password.js";
import { clearSession, createSession, readSession } from "../auth/session.js";
import {
  createLocalUser,
  findUserByEmail,
  findUserById,
  isActiveStatus,
  mapPublicUser,
  normalizeEmail,
  touchUserLogin,
  updateUserPassword,
} from "../auth/users.js";

export const authRouter = Router();

function sendInvalidCredentials(res: Response) {
  res.status(401).json({ ok: false, message: "Invalid email or password." });
}

authRouter.get("/me", async (req, res, next) => {
  try {
    const session = readSession(req);
    if (!session) {
      res.json({ ok: true, user: null });
      return;
    }

    const user = await findUserById(session.userId);
    if (!user || !isActiveStatus(user.status)) {
      clearSession(req, res);
      res.json({ ok: true, user: null });
      return;
    }

    res.json({
      ok: true,
      user: mapPublicUser(user, session.authSource),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ ok: false, message: "Email and password are required." });
      return;
    }

    const user = await findUserByEmail(normalizeEmail(email));
    if (!user) {
      sendInvalidCredentials(res);
      return;
    }

    if (!isActiveStatus(user.status)) {
      res.status(403).json({ ok: false, message: "This account is inactive." });
      return;
    }

    let isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      const canUpgradeLegacySeed =
        user.password === LEGACY_SEEDED_PASSWORD_MARKER &&
        password === SEEDED_USER_PASSWORD;
      const canUpgradePlaintext = isLegacyPlaintextPassword(password, user.password);

      if (canUpgradeLegacySeed || canUpgradePlaintext) {
        const upgradedHash = await hashPassword(password);
        await updateUserPassword(user.user_id, upgradedHash);
        isValidPassword = true;
      }
    }

    if (!isValidPassword) {
      sendInvalidCredentials(res);
      return;
    }

    await touchUserLogin(user.user_id);
    const refreshedUser = (await findUserById(user.user_id)) ?? user;
    const session = createSession(res, user.user_id);

    res.json({
      ok: true,
      user: mapPublicUser(refreshedUser, session.authSource),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ ok: false, message: "Email and password are required." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ ok: false, message: "Password must be at least 6 characters." });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      res.status(409).json({ ok: false, message: "An account with that email already exists." });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await createLocalUser(normalizedEmail, passwordHash);
    const session = createSession(res, user.user_id);

    res.status(201).json({
      ok: true,
      user: mapPublicUser(user, session.authSource),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (req, res) => {
  clearSession(req, res);
  res.json({ ok: true });
});
