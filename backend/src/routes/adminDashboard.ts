import { Router } from "express";
import { readAdminSettings } from "../data/adminSettingsStore.js";
import { getOrders } from "../services/admin/orders.js";
import { getProducts } from "../services/admin/products.js";
import { getRevenueSeries, getSalesReport } from "../services/admin/reports.js";
import type { ReportPeriod } from "../services/admin/types.js";

export const adminDashboardRouter = Router();

adminDashboardRouter.get("/dashboard", async (req, res, next) => {
  try {
    const period = (req.query.period as ReportPeriod | undefined) ?? "monthly";
    const [products, orders, settings, revenueOverTime] = await Promise.all([
      getProducts(),
      getOrders(),
      readAdminSettings(),
      getRevenueSeries(),
    ]);

    const report = await getSalesReport(period, settings.taxRate);

    res.json({
      ok: true,
      dashboard: {
        products,
        orders,
        settings,
        revenueOverTime,
        report,
      },
    });
  } catch (error) {
    next(error);
  }
});

adminDashboardRouter.get("/reports/sales", async (req, res, next) => {
  try {
    const period = (req.query.period as ReportPeriod | undefined) ?? "monthly";
    const [orders, settings] = await Promise.all([getOrders(), readAdminSettings()]);
    const report = await getSalesReport(period, settings.taxRate);

    res.json({
      ok: true,
      period,
      report,
      orders,
    });
  } catch (error) {
    next(error);
  }
});
