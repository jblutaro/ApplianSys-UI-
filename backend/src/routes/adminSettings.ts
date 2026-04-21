import { Router } from "express";
import { readAdminSettings, writeAdminSettings } from "../data/adminSettingsStore.js";

export const adminSettingsRouter = Router();

adminSettingsRouter.get("/settings", async (_req, res, next) => {
  try {
    const settings = await readAdminSettings();
    res.json({ ok: true, settings });
  } catch (error) {
    next(error);
  }
});

adminSettingsRouter.put("/settings", async (req, res, next) => {
  try {
    const settings = await writeAdminSettings(req.body);
    res.json({ ok: true, settings });
  } catch (error) {
    next(error);
  }
});
