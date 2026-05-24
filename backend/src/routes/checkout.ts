import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { readSession } from "../auth/session.js";
import { findUserById, isActiveStatus, isStaffOrAdminUser } from "../auth/users.js";
import { readAdminSettings } from "../data/adminSettingsStore.js";
import { dbPool } from "../config/database.js";
import { OLD_ALBAY_SHOP_LOCATION, placeOrder } from "../services/checkout/checkout.js";
import type { CheckoutInput } from "../services/checkout/checkout.js";
import { recordPaymentConfirmation } from "../services/payments/paymentConfirmations.js";
import { parseBoundedString, parsePositiveInteger } from "../security/validation.js";

export const checkoutRouter = Router();

type EmailOrderRow = RowDataPacket & {
  email: string;
  fname: string | null;
  lname: string | null;
  order_date: Date | string | null;
  order_id: number;
  payment_method: string | null;
  product_name: string;
  quantity: number;
  price: number;
  total_amount: number;
};

const ALBAY_DELIVERY_BOUNDS = {
  north: 13.55,
  south: 12.95,
  east: 124.25,
  west: 123.25,
};

const DELIVERY_PAYMENT_METHODS = new Set(["gcash", "cash_on_delivery"]);
const PICKUP_PAYMENT_METHODS = new Set(["gcash", "pay_on_pickup"]);

function isWithinAlbayDeliveryArea(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) return false;

  return (
    latitude >= ALBAY_DELIVERY_BOUNDS.south &&
    latitude <= ALBAY_DELIVERY_BOUNDS.north &&
    longitude >= ALBAY_DELIVERY_BOUNDS.west &&
    longitude <= ALBAY_DELIVERY_BOUNDS.east
  );
}

function normalizePaymentMethod(method: string) {
  const normalized = method.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized === "pay_on_pick_up") {
    return "pay_on_pickup";
  }

  return normalized;
}

async function resolveCustomerUserId(
  req: Parameters<typeof readSession>[0],
): Promise<number | null> {
  const session = await readSession(req);
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
      const fields = [
        parseBoundedString(street, "street", { maxLength: 120, required: true }),
        parseBoundedString(barangay, "barangay", { maxLength: 80, required: true }),
        parseBoundedString(city, "city", { maxLength: 80, required: true }),
        parseBoundedString(province, "province", { maxLength: 80, required: true }),
      ];
      const invalidField = fields.find((field) => !field.ok);

      if (invalidField && !invalidField.ok) {
        res.status(400).json({ ok: false, message: invalidField.message });
        return;
      }

      if (!isWithinAlbayDeliveryArea(latitude, longitude)) {
        res.status(400).json({ ok: false, message: "ApplianSys can only deliver within Albay." });
        return;
      }
    }

    const paymentMethod = body.paymentMethod?.trim() ?? "";
    if (!paymentMethod) {
      res.status(400).json({ ok: false, message: "paymentMethod is required." });
      return;
    }
    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

    if (fulfillment.method === "delivery" && !DELIVERY_PAYMENT_METHODS.has(normalizedPaymentMethod)) {
      res.status(400).json({ ok: false, message: "Delivery supports only GCash or Cash on Delivery." });
      return;
    }

    if (fulfillment.method === "pickup" && !PICKUP_PAYMENT_METHODS.has(normalizedPaymentMethod)) {
      res.status(400).json({ ok: false, message: "Pickup supports only GCash or Pay on Pick Up." });
      return;
    }

    const productIds = Array.isArray(body.productIds)
      ? body.productIds
          .map((productId) => parsePositiveInteger(productId, "productId"))
          .filter((productId): productId is { ok: true; value: number } => productId.ok)
          .map((productId) => productId.value)
      : undefined;

    if (Array.isArray(body.productIds) && productIds?.length !== body.productIds.length) {
      res.status(400).json({ ok: false, message: "All selected product IDs must be positive integers." });
      return;
    }

    const result = await placeOrder(userId, {
      fulfillment,
      paymentMethod: normalizedPaymentMethod,
      productIds,
    });

    if (!result.ok) {
      const statusCode = result.reason === "stock_error" ? 409 : 400;
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

checkoutRouter.post("/mock-gcash/email", async (req, res, next) => {
  try {
    const userId = await resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const { orderId, paidAt, receiptNumber } = req.body as {
      orderId?: unknown;
      paidAt?: unknown;
      receiptNumber?: unknown;
    };
    const parsedOrderId = parsePositiveInteger(orderId, "orderId");
    const parsedReceiptNumber = parseBoundedString(receiptNumber, "receiptNumber", {
      maxLength: 120,
      required: true,
    });

    if (!parsedOrderId.ok || !parsedReceiptNumber.ok) {
      res.status(400).json({
        ok: false,
        message: !parsedOrderId.ok ? parsedOrderId.message : parsedReceiptNumber.message,
      });
      return;
    }

    const [rows] = await dbPool.query<EmailOrderRow[]>(
      `
      SELECT
        o.order_id,
        o.order_date,
        o.total_amount,
        pd.payment_method,
        u.email,
        u.fname,
        u.lname,
        p.product_name,
        oi.quantity,
        oi.price
      FROM orders o
      INNER JOIN \`USER\` u ON u.user_id = o.user_id
      LEFT JOIN PAYMENT_DETAILS pd ON pd.payment_id = o.payment_id
      INNER JOIN order_item oi ON oi.order_id = o.order_id
      INNER JOIN PRODUCT p ON p.product_id = oi.product_id
      WHERE o.order_id = ? AND o.user_id = ?
      ORDER BY oi.product_id ASC
      `,
      [parsedOrderId.value, userId],
    );

    if (rows.length === 0) {
      res.status(404).json({ ok: false, message: "Order not found." });
      return;
    }

    const first = rows[0];
    const customerName = [first.fname, first.lname].filter(Boolean).join(" ") || first.email;
    const paymentDate = typeof paidAt === "string" ? new Date(paidAt) : new Date();
    if (Number.isNaN(paymentDate.getTime())) {
      res.status(400).json({ ok: false, message: "paidAt must be a valid date." });
      return;
    }

    const confirmation = await recordPaymentConfirmation({
      amountPaid: Number(first.total_amount),
      orderId: parsedOrderId.value,
      paidAt: paymentDate,
      paymentMethod: "gcash",
      payload: {
        orderId: parsedOrderId.value,
        paidAt: paymentDate.toISOString(),
        receiptNumber: parsedReceiptNumber.value,
      },
      receiptNumber: parsedReceiptNumber.value,
      source: "mock_gcash",
      userId,
    });

    if (!confirmation.ok) {
      res.status(409).json({ ok: false, message: "This receipt number has already been recorded." });
      return;
    }

    const orderRef = `ORD-${String(first.order_id).padStart(4, "0")}`;
    const currency = new Intl.NumberFormat("en-PH", { currency: "PHP", style: "currency" });
    const items = rows.map((row) => ({
      lineTotal: Number(row.price) * Number(row.quantity),
      name: String(row.product_name),
      price: Number(row.price),
      quantity: Number(row.quantity),
    }));

    const emailText = [
      "Mock purchase confirmation email",
      `To: ${first.email}`,
      `Customer: ${customerName}`,
      `Order Reference: ${orderRef}`,
      `Receipt Number: ${parsedReceiptNumber.value}`,
      `Payment Method: Mock GCash`,
      `Amount Paid: ${currency.format(Number(first.total_amount))}`,
      `Date and Time Paid: ${paymentDate.toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" })}`,
      "",
      "Purchased Items:",
      ...items.map((item) => `- ${item.name} x${item.quantity} @ ${currency.format(item.price)} = ${currency.format(item.lineTotal)}`),
      "",
      `Order Total: ${currency.format(Number(first.total_amount))}`,
      "Thank you for shopping with ApplianSys.",
    ].join("\n");

    console.info(emailText);

    res.json({
      ok: true,
      delivered: false,
      mode: "console-fallback",
      message: "Mock confirmation email logged and payment confirmation recorded.",
    });
  } catch (error) {
    next(error);
  }
});
