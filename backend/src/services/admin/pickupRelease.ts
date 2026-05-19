import type { RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";
import { ensureCheckoutSchema } from "../checkout/checkout.js";

export type PickupReleaseOrder = {
  orderId: number;
  orderRef: string;
  customerName: string;
  customerContact: string;
  items: string[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  pickupStatus: string;
  createdAt: string;
  releasedAt: string | null;
  releasingOfficer: string;
};

type PickupReleaseRow = RowDataPacket & {
  contact_num: string | null;
  customer_name: string | null;
  order_date: Date | string | null;
  order_id: number;
  order_status: string | null;
  payment_method: string | null;
  payment_status: string | null;
  pickup_status: string | null;
  product_name: string | null;
  quantity: number;
  released_at: Date | string | null;
  releasing_officer: string | null;
  total_amount: number;
};

function normalizeToken(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizePickupStatus(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  if (normalized.includes("ready")) return "ready_for_pickup";
  if (normalized.includes("released") || normalized.includes("completed")) return "released";
  if (normalized.includes("cancelled")) return "cancelled";
  if (normalized.includes("pending")) return "pending";
  return "preparing";
}

function normalizePaymentMethod(value: string | null | undefined) {
  const normalized = normalizeToken(value);
  if (normalized === "pay_on_pick_up" || normalized === "pay_on_pickup") return "pay_on_pickup";
  if (normalized === "gcash") return "gcash";
  return normalized || "unknown";
}

export async function getPendingPickupReleaseOrders(): Promise<PickupReleaseOrder[]> {
  await ensureCheckoutSchema();

  const [rows] = await dbPool.query<PickupReleaseRow[]>(`
    SELECT
      o.order_id,
      o.order_date,
      o.total_amount,
      o.order_status,
      pd.payment_method,
      pd.payment_status,
      p.pickup_status,
      p.released_at,
      CONCAT(ro.fname, ' ', ro.lname) AS releasing_officer,
      u.contact_num,
      CONCAT(u.fname, ' ', u.lname) AS customer_name,
      pr.product_name,
      oi.quantity
    FROM PICKUP p
    INNER JOIN orders o ON o.order_id = p.order_id
    INNER JOIN \`USER\` u ON u.user_id = o.user_id
    LEFT JOIN PAYMENT_DETAILS pd ON pd.payment_id = o.payment_id
    INNER JOIN order_item oi ON oi.order_id = o.order_id
    INNER JOIN PRODUCT pr ON pr.product_id = oi.product_id
    LEFT JOIN \`USER\` ro ON ro.user_id = p.releasing_officer_id
    WHERE o.delivery_method = 'pickup'
    ORDER BY o.order_date ASC, o.order_id ASC, oi.product_id ASC
  `);

  const orders = new Map<number, PickupReleaseOrder>();

  for (const row of rows) {
    const orderId = Number(row.order_id);
    const existing = orders.get(orderId);
    const order =
      existing ??
      ({
        orderId,
        orderRef: `ORD-${String(orderId).padStart(4, "0")}`,
        customerName: String(row.customer_name || "Customer"),
        customerContact: String(row.contact_num || ""),
        items: [],
        totalAmount: Number(row.total_amount),
        paymentMethod: normalizePaymentMethod(row.payment_method),
        paymentStatus: String(row.payment_status || "unpaid").toLowerCase() === "paid" ? "paid" : "unpaid",
        orderStatus: normalizePickupStatus(row.order_status),
        pickupStatus: normalizePickupStatus(row.pickup_status || row.order_status),
        createdAt: row.order_date ? new Date(row.order_date).toISOString() : "",
        releasedAt: row.released_at ? new Date(row.released_at).toISOString() : null,
        releasingOfficer: String(row.releasing_officer || ""),
      } satisfies PickupReleaseOrder);

    order.items.push(`${row.product_name || "Product"} x${Number(row.quantity)}`);
    orders.set(orderId, order);
  }

  return [...orders.values()];
}

export async function releasePickupOrder(input: {
  confirmPaymentReceived: boolean;
  orderId: number;
  releasingOfficerId: number;
}) {
  await ensureCheckoutSchema();

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `
      SELECT
        o.order_id,
        o.delivery_method,
        o.payment_id,
        p.released_at,
        pd.payment_method,
        pd.payment_status
      FROM orders o
      INNER JOIN PICKUP p ON p.order_id = o.order_id
      LEFT JOIN PAYMENT_DETAILS pd ON pd.payment_id = o.payment_id
      WHERE o.order_id = ?
      FOR UPDATE
      `,
      [input.orderId],
    );
    const order = rows[0];

    if (!order || String(order.delivery_method) !== "pickup") {
      await connection.rollback();
      return { ok: false as const, message: "Only pickup orders can be released." };
    }

    if (order.released_at) {
      await connection.rollback();
      return { ok: false as const, message: "This pickup order is already released." };
    }

    const paymentStatus = String(order.payment_status || "").toLowerCase();
    const requiresPaymentConfirmation = paymentStatus !== "paid";

    if (requiresPaymentConfirmation && !input.confirmPaymentReceived) {
      await connection.rollback();
      return { ok: false as const, message: "Payment must be confirmed before release." };
    }

    await connection.query(
      `UPDATE PICKUP
       SET releasing_officer_id = ?,
           released_at = NOW(),
           pickup_status = 'released'
       WHERE order_id = ?`,
      [input.releasingOfficerId, input.orderId],
    );

    await connection.query(
      "UPDATE orders SET order_status = 'released' WHERE order_id = ?",
      [input.orderId],
    );

    if (requiresPaymentConfirmation) {
      await connection.query(
        "UPDATE PAYMENT_DETAILS SET payment_status = 'paid' WHERE payment_id = ?",
        [order.payment_id],
      );
    }

    await connection.commit();
    return { ok: true as const };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
