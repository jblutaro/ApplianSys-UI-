import { Router } from "express";
import { readAdminSettings, writeAdminSettings } from "../data/adminSettingsStore.js";
import { logAuditEvent } from "../services/audit/auditLog.js";

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
    const previousSettings = await readAdminSettings();
    const settings = await writeAdminSettings(req.body);
    await logAuditEvent({
      action: "admin.settings.update",
      details: {
        after: settings,
        before: previousSettings,
      },
      entityType: "admin_settings",
      req,
    });
    res.json({ ok: true, settings });
  } catch (error) {
    next(error);
  }
});
