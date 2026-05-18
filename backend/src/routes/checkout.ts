import { Router } from "express";
import { readSession } from "../auth/session.js";
import { findUserById, isActiveStatus, isStaffOrAdminUser } from "../auth/users.js";
import { readAdminSettings } from "../data/adminSettingsStore.js";
import { OLD_ALBAY_SHOP_LOCATION, placeOrder } from "../services/checkout/checkout.js";
import type { CheckoutInput } from "../services/checkout/checkout.js";

export const checkoutRouter = Router();

const ALBAY_DELIVERY_BOUNDS = {
  north: 13.55,
  south: 12.95,
  east: 124.25,
  west: 123.25,
};

function isWithinAlbayDeliveryArea(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) return false;

  return (
    latitude >= ALBAY_DELIVERY_BOUNDS.south &&
    latitude <= ALBAY_DELIVERY_BOUNDS.north &&
    longitude >= ALBAY_DELIVERY_BOUNDS.west &&
    longitude <= ALBAY_DELIVERY_BOUNDS.east
  );
}

async function resolveCustomerUserId(
  req: Parameters<typeof readSession>[0],
): Promise<number | null> {
  const session = readSession(req);
  if (!session) return null;
  const user = await findUserById(session.userId);
  if (!user || !isActiveStatus(user.status)) return null;
  if (isStaffOrAdminUser(user)) return null;
  return user.user_id;
}

/**
 * POST /api/checkout
 * Body: {
 *   fulfillment: { method: "delivery", street, barangay, city, province, latitude?, longitude? }
 *              | { method: "pickup" }
 *   paymentMethod: string   (e.g. "Cash on Delivery")
 * }
 */
checkoutRouter.post("/", async (req, res, next) => {
  try {
    const userId = await resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const body = req.body as Partial<CheckoutInput>;

    // Validate fulfillment
    const fulfillment = body.fulfillment;
    if (!fulfillment || !["delivery", "pickup"].includes(fulfillment.method)) {
      res.status(400).json({ ok: false, message: "fulfillment.method must be 'delivery' or 'pickup'." });
      return;
    }

    if (fulfillment.method === "delivery") {
      const { street, barangay, city, province, latitude, longitude } = fulfillment;
      if (!street?.trim() || !barangay?.trim() || !city?.trim() || !province?.trim()) {
        res.status(400).json({ ok: false, message: "Street, barangay, city, and province are required for delivery." });
        return;
      }

      if (!isWithinAlbayDeliveryArea(latitude, longitude)) {
        res.status(400).json({ ok: false, message: "ApplianSys can only deliver within Albay." });
        return;
      }
    }

    const paymentMethod = (body.paymentMethod ?? "Cash on Delivery").trim();
    if (!paymentMethod) {
      res.status(400).json({ ok: false, message: "paymentMethod is required." });
      return;
    }

    const result = await placeOrder(userId, {
      fulfillment,
      paymentMethod,
    });

    if (!result.ok) {
      const statusCode = result.reason === "empty_cart" ? 400 : 409;
      res.status(statusCode).json({ ok: false, message: result.message });
      return;
    }

    res.status(201).json({ ok: true, order: result.order });
  } catch (error) {
    next(error);
  }
});

checkoutRouter.get("/settings", async (_req, res, next) => {
  try {
    const settings = await readAdminSettings();
    res.json({
      ok: true,
      checkout: {
        deliveryRatePerKm: settings.deliveryRatePerKm,
        shopLocation: OLD_ALBAY_SHOP_LOCATION,
      },
    });
  } catch (error) {
    next(error);
  }
});
