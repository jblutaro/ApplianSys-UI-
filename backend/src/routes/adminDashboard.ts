import { Router } from "express";
import { readAdminSettings } from "../data/adminSettingsStore.js";
import { getOrders } from "../services/admin/orders.js";
import { getProducts } from "../services/admin/products.js";
import { getItemSalesReport, getRevenueSeries, getSalesReport } from "../services/admin/reports.js";
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

    const [report, itemSales] = await Promise.all([
      getSalesReport(period, settings.taxRate),
      getItemSalesReport(period),
    ]);

    res.json({
      ok: true,
      dashboard: {
        products,
        orders,
        settings,
        revenueOverTime,
        report,
        itemSales,
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
    const [report, itemSales] = await Promise.all([
      getSalesReport(period, settings.taxRate),
      getItemSalesReport(period),
    ]);

    res.json({
      ok: true,
      period,
      report,
      itemSales,
      orders,
    });
  } catch (error) {
    next(error);
  }
});
