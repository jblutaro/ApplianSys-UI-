import { Router } from "express";
import {
  clearSession,
  createSession,
  markSessionStepUpVerified,
  readSession,
  revokeUserSessions,
} from "../auth/session.js";
import { mapPublicUser } from "../auth/users.js";
import {
  authenticateLocalUser,
  changeAccountPassword,
  getAccountProfile,
  getAuthenticatedUser,
  registerLocalUser,
  saveAccountProfile,
  verifyCurrentPassword,
} from "../services/auth/localAuth.js";
import { isAuthServiceError } from "../services/auth/errors.js";

export const authRouter = Router();

authRouter.get("/me", async (req, res, next) => {
  try {
    const session = await readSession(req);
    if (!session) {
      res.json({ ok: true, user: null });
      return;
    }

    const user = await getAuthenticatedUser(session.userId);
    if (!user) {
      await clearSession(req, res);
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

    const user = await authenticateLocalUser(email, password);
    const session = await createSession(res, user.user_id);

    res.json({
      ok: true,
      user: mapPublicUser(user, session.authSource),
    });
  } catch (error) {
    if (isAuthServiceError(error)) {
      res.status(error.statusCode).json({ ok: false, message: error.message });
      return;
    }

    next(error);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const { contactNumber, email, firstName, lastName, middleName, password } = req.body as {
      contactNumber?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      middleName?: string;
      password?: string;
    };

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ ok: false, message: "First name, last name, email, and password are required." });
      return;
    }

    if (password.length < 10) {
      res.status(400).json({
        ok: false,
        message: "Password must be at least 10 characters.",
      });
      return;
    }

    const user = await registerLocalUser(email, password, {
      contactNumber: contactNumber ?? "",
      firstName,
      lastName,
      middleName: middleName ?? "",
    });
    const session = await createSession(res, user.user_id);

    res.status(201).json({
      ok: true,
      user: mapPublicUser(user, session.authSource),
    });
  } catch (error) {
    if (isAuthServiceError(error)) {
      res.status(error.statusCode).json({ ok: false, message: error.message });
      return;
    }

    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    await clearSession(req, res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/sessions/revoke-all", async (req, res, next) => {
  try {
    const session = await readSession(req);
    if (!session) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    await revokeUserSessions(session.userId);
    await clearSession(req, res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/step-up/confirm", async (req, res, next) => {
  try {
    const session = await readSession(req);
    if (!session) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const { currentPassword } = req.body as { currentPassword?: string };
    await verifyCurrentPassword(session.userId, currentPassword ?? "");

    const updated = await markSessionStepUpVerified(req);
    if (!updated) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    if (isAuthServiceError(error)) {
      res.status(error.statusCode).json({ ok: false, message: error.message });
      return;
    }

    next(error);
  }
});

authRouter.get("/account", async (req, res, next) => {
  try {
    const session = await readSession(req);
    if (!session) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const account = await getAccountProfile(session.userId);
    res.json({ ok: true, account });
  } catch (error) {
    if (isAuthServiceError(error)) {
      res.status(error.statusCode).json({ ok: false, message: error.message });
      return;
    }

    next(error);
  }
});

authRouter.put("/account", async (req, res, next) => {
  try {
    const session = await readSession(req);
    if (!session) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const { contactNumber, firstName, lastName, middleName } = req.body as {
      contactNumber?: string;
      firstName?: string;
      lastName?: string;
      middleName?: string;
    };

    const account = await saveAccountProfile(session.userId, {
      contactNumber: contactNumber ?? "",
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      middleName: middleName ?? "",
    });

    res.json({ ok: true, account });
  } catch (error) {
    if (isAuthServiceError(error)) {
      res.status(error.statusCode).json({ ok: false, message: error.message });
      return;
    }

    next(error);
  }
});

authRouter.put("/password", async (req, res, next) => {
  try {
    const session = await readSession(req);
    if (!session) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    await changeAccountPassword(session.userId, currentPassword ?? "", newPassword ?? "");
    res.json({ ok: true });
  } catch (error) {
    if (isAuthServiceError(error)) {
      res.status(error.statusCode).json({ ok: false, message: error.message });
      return;
    }

    next(error);
  }
});
