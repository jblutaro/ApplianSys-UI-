import { Router } from "express";
import { readSession } from "../auth/session.js";
import { findUserById, isActiveStatus, isStaffOrAdminUser } from "../auth/users.js";
import { cancelCustomerOrder, getCustomerOrders } from "../services/orders/orders.js";

export const ordersRouter = Router();

async function resolveCustomerUserId(req: Parameters<typeof readSession>[0]) {
  const session = readSession(req);
  if (!session) return null;

  const user = await findUserById(session.userId);
  if (!user || !isActiveStatus(user.status)) return null;
  if (isStaffOrAdminUser(user)) return null;

  return user.user_id;
}

ordersRouter.get("/", async (req, res, next) => {
  try {
    const userId = await resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const orders = await getCustomerOrders(userId);
    res.json({ ok: true, orders });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/:orderId/cancel", async (req, res, next) => {
  try {
    const userId = await resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      res.status(400).json({ ok: false, message: "Valid order ID is required." });
      return;
    }

    const result = await cancelCustomerOrder(userId, orderId);
    if (!result.ok) {
      res.status(400).json({ ok: false, message: result.message });
      return;
    }

    const orders = await getCustomerOrders(userId);
    res.json({ ok: true, orders });
  } catch (error) {
    next(error);
  }
});
