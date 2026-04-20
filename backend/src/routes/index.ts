import { Router } from "express";
import { testDatabaseConnection } from "../config/database.js";
import { adminRouter } from "./admin.js";

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

apiRouter.use("/admin", adminRouter);
