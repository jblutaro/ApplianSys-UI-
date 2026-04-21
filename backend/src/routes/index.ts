import { Router } from "express";
import { requireAdmin } from "../auth/middleware.js";
import { testDatabaseConnection } from "../config/database.js";
import { adminRouter } from "./admin.js";
import { authRouter } from "./auth.js";
import { chatRouter } from "./chat.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "appliansys-backend",
  });
});

apiRouter.get("/db-test", async (_req, res, next) => {
  try {
    const result = await testDatabaseConnection();
    res.json({
      ok: true,
      database: result,
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/admin", requireAdmin, adminRouter);
