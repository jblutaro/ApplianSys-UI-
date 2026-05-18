import { Router } from "express";
import { readSession } from "../auth/session.js";
import { findUserById, isActiveStatus, isStaffOrAdminUser } from "../auth/users.js";
import { getCustomerOrders } from "../services/orders/orders.js";

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
