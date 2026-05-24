import { Router } from "express";
import { requireRecentStepUp } from "../auth/stepUp.js";
import { adminDashboardRouter } from "./adminDashboard.js";
import { adminOrdersRouter } from "./adminOrders.js";
import { adminProductsRouter } from "./adminProducts.js";
import { adminSettingsRouter } from "./adminSettings.js";

export const adminRouter = Router();

adminRouter.use(requireRecentStepUp);
adminRouter.use(adminProductsRouter);
adminRouter.use(adminOrdersRouter);
adminRouter.use(adminSettingsRouter);
adminRouter.use(adminDashboardRouter);
