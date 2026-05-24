import { Router } from "express";
import { readSession } from "../auth/session.js";
import { findUserById, isActiveStatus, isStaffOrAdminUser } from "../auth/users.js";
import { logAuditEvent } from "../services/audit/auditLog.js";
import { getOrders, updateOrderStatus } from "../services/admin/orders.js";
import { getPendingPickupReleaseOrders, releasePickupOrder } from "../services/admin/pickupRelease.js";

export const adminOrdersRouter = Router();

async function resolveReleasingOfficerId(req: Parameters<typeof readSession>[0]) {
  const session = await readSession(req);
  if (!session) return null;
  const user = await findUserById(session.userId);
  if (!user || !isActiveStatus(user.status) || !isStaffOrAdminUser(user)) return null;
  return user.user_id;
}

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
    await logAuditEvent({
      action: "admin.order.status_update",
      details: { status },
      entityId: orderId,
      entityType: "order",
      req,
    });
    res.json({ ok: true, orders });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Invalid") || error.message.includes("can no longer be altered"))
    ) {
      res.status(400).json({ ok: false, message: error.message });
      return;
    }

    next(error);
  }
});

adminOrdersRouter.get("/pickup-releases", async (_req, res, next) => {
  try {
    const orders = await getPendingPickupReleaseOrders();
    res.json({ ok: true, orders });
  } catch (error) {
    next(error);
  }
});

adminOrdersRouter.post("/pickup-releases/:orderId/release", async (req, res, next) => {
  try {
    const sessionOfficerId = await resolveReleasingOfficerId(req);
    if (!sessionOfficerId) {
      res.status(401).json({ ok: false, message: "Staff or admin authentication required." });
      return;
    }

    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      res.status(400).json({ ok: false, message: "Valid order ID is required." });
      return;
    }

    const { confirmPaymentReceived } = req.body as { confirmPaymentReceived?: boolean };

    const result = await releasePickupOrder({
      confirmPaymentReceived: Boolean(confirmPaymentReceived),
      orderId,
      releasingOfficerId: sessionOfficerId,
    });

    if (!result.ok) {
      res.status(400).json({ ok: false, message: result.message });
      return;
    }

    const orders = await getPendingPickupReleaseOrders();
    await logAuditEvent({
      action: "admin.pickup.release",
      actorId: sessionOfficerId,
      details: { confirmPaymentReceived: Boolean(confirmPaymentReceived) },
      entityId: orderId,
      entityType: "order",
      req,
    });
    res.json({ ok: true, orders });
  } catch (error) {
    next(error);
  }
});
