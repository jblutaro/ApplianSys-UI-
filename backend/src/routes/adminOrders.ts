import { Router } from "express";
import { getOrders, updateOrderStatus } from "../services/admin/orders.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.get("/orders", async (_req, res, next) => {
  try {
    const orders = await getOrders();
    res.json({ ok: true, orders });
  } catch (error) {
    next(error);
  }
});

adminOrdersRouter.patch("/orders/:orderId/status", async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const { status } = req.body as { status?: string };

    if (!status) {
      res.status(400).json({ ok: false, message: "Order status is required." });
      return;
    }

    const orders = await updateOrderStatus(orderId, status);
    res.json({ ok: true, orders });
  } catch (error) {
    next(error);
  }
});
