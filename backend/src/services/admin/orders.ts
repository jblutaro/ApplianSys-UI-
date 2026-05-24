import type { RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";
import { decryptField } from "../../security/fieldEncryption.js";
import type { AdminOrder } from "./types.js";

const DELIVERY_STATUSES = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);
const PICKUP_STATUSES = new Set(["pending", "preparing", "ready_for_pickup", "released", "cancelled"]);

type AdminOrderRow = RowDataPacket & {
  contact_num: string | null;
  customer_name: string | null;
  delivery_method: string | null;
  email: string | null;
  order_date: Date | string | null;
  order_id: number;
  order_status: string | null;
  payment_method: string | null;
  payment_status: string | null;
  product_name: string | null;
  quantity: number | null;
  released_at: Date | string | null;
  releasing_officer: string | null;
  total_amount: number;
};

function normalizeToken(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizePaymentStatus(value: string | null | undefined): "paid" | "unpaid" {
  return normalizeToken(value) === "paid" ? "paid" : "unpaid";
}

function normalizePaymentMethod(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  if (normalized === "cash_on_delivery") return "cash_on_delivery";
  if (normalized === "pay_on_pick_up" || normalized === "pay_on_pickup") return "pay_on_pickup";
  if (normalized === "gcash") return "gcash";
  return normalized || "unknown";
}

function normalizeDeliveryStatus(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  if (normalized === "paid") return "pending";
  if (DELIVERY_STATUSES.has(normalized)) return normalized;
  return "pending";
}

function normalizePickupStatus(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  if (normalized.includes("ready")) return "ready_for_pickup";
  if (normalized.includes("released") || normalized.includes("completed")) return "released";
  if (normalized.includes("cancelled")) return "cancelled";
  if (normalized.includes("pending")) return "pending";
  return "preparing";
}

function normalizeOrderStatus(value: string | null | undefined, fulfillmentMethod: "delivery" | "pickup") {
  return fulfillmentMethod === "pickup"
    ? normalizePickupStatus(value)
    : normalizeDeliveryStatus(value);
}

function toIsoDateTime(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getOrders(): Promise<AdminOrder[]> {
  const [rows] = await dbPool.query<AdminOrderRow[]>(`
    SELECT
      o.order_id,
      o.order_date,
      o.total_amount,
      o.order_status,
      o.delivery_method,
      u.email,
      u.contact_num,
      CONCAT(u.fname, ' ', u.lname) AS customer_name,
      pd.payment_method,
      pd.payment_status,
      pr.product_name,
      oi.quantity,
      p.released_at,
      CONCAT(ro.fname, ' ', ro.lname) AS releasing_officer
    FROM orders o
    INNER JOIN \`USER\` u ON u.user_id = o.user_id
    LEFT JOIN PAYMENT_DETAILS pd ON pd.payment_id = o.payment_id
    LEFT JOIN order_item oi ON oi.order_id = o.order_id
    LEFT JOIN PRODUCT pr ON pr.product_id = oi.product_id
    LEFT JOIN PICKUP p ON p.order_id = o.order_id
    LEFT JOIN \`USER\` ro ON ro.user_id = p.releasing_officer_id
    ORDER BY o.order_date DESC, o.order_id DESC, oi.product_id ASC
  `);

  const orders = new Map<number, AdminOrder>();

  for (const row of rows) {
    const orderId = Number(row.order_id);
    const existing = orders.get(orderId);
    const fulfillmentMethod = String(row.delivery_method || "delivery").toLowerCase() === "pickup"
      ? "pickup"
      : "delivery";
    const orderStatus = normalizeOrderStatus(row.order_status, fulfillmentMethod);
    const createdAt = toIsoDateTime(row.order_date);

    const order =
      existing ??
      ({
        id: `ORD-${String(orderId).padStart(4, "0")}`,
        dbId: orderId,
        customer: String(row.customer_name || "Customer"),
        customerContact: decryptField(row.contact_num),
        deliveryMethod: fulfillmentMethod,
        fulfillmentMethod,
        email: String(row.email || ""),
        date: createdAt ? createdAt.slice(0, 10) : "",
        createdAt: createdAt ?? "",
        items: [],
        paymentMethod: normalizePaymentMethod(row.payment_method),
        paymentStatus: normalizePaymentStatus(row.payment_status),
        releasingOfficer: String(row.releasing_officer || ""),
        releasedAt: toIsoDateTime(row.released_at),
        total: Number(row.total_amount),
        status: orderStatus,
        orderStatus,
      } satisfies AdminOrder);

    if (row.product_name) {
      order.items.push(`${row.product_name} x${Number(row.quantity || 0)}`);
    }

    orders.set(orderId, order);
  }

  return [...orders.values()];
}

export async function updateOrderStatus(orderId: number, status: string) {
  const normalizedStatus = normalizeToken(status);
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT order_id, delivery_method, payment_id
     FROM orders
     WHERE order_id = ?
     LIMIT 1`,
    [orderId],
  );
  const order = rows[0];
  if (!order) {
    throw new Error("Order not found.");
  }

  const fulfillmentMethod = String(order.delivery_method || "delivery").toLowerCase() === "pickup"
    ? "pickup"
    : "delivery";
  const currentStatus = normalizeOrderStatus(String(order.order_status || ""), fulfillmentMethod);

  if (currentStatus === "cancelled" || currentStatus === "delivered" || currentStatus === "released") {
    throw new Error("This order can no longer be altered.");
  }

  if (fulfillmentMethod === "pickup") {
    if (!PICKUP_STATUSES.has(normalizedStatus)) {
      throw new Error("Invalid pickup order status.");
    }

    await dbPool.query("UPDATE orders SET order_status = ? WHERE order_id = ?", [normalizedStatus, orderId]);
    await dbPool.query("UPDATE PICKUP SET pickup_status = ? WHERE order_id = ?", [normalizedStatus, orderId]);
    return getOrders();
  }

  if (!DELIVERY_STATUSES.has(normalizedStatus)) {
    throw new Error("Invalid delivery order status.");
  }

  await dbPool.query("UPDATE orders SET order_status = ? WHERE order_id = ?", [normalizedStatus, orderId]);
  await dbPool.query("UPDATE DELIVERY SET delivery_status = ? WHERE order_id = ?", [normalizedStatus, orderId]);
  if (normalizedStatus === "delivered") {
    await dbPool.query(
      `UPDATE PAYMENT_DETAILS
       SET payment_status = 'paid'
       WHERE payment_id = ?
         AND LOWER(COALESCE(payment_method, '')) = 'cash_on_delivery'`,
      [order.payment_id],
    );
  }

  return getOrders();
}
