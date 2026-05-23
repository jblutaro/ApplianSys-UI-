import type { RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";

export type CustomerOrder = {
  id: string;
  dbId: number;
  completedAt: string | null;
  date: string;
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: string;
  paymentStatus: string;
  releasedAt: string | null;
  releasingOfficer: string;
  status: string;
  total: number;
  items: {
    productId: number;
    name: string;
    imageUrl: string;
    quantity: number;
    price: number;
  }[];
};

export async function getCustomerOrders(userId: number): Promise<CustomerOrder[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `
    SELECT
      o.order_id,
      o.order_date,
      o.total_amount,
      o.order_status,
      o.delivery_method,
      pd.payment_method,
      pd.payment_status,
      pck.released_at,
      CONCAT(ro.fname, ' ', ro.lname) AS releasing_officer,
      oi.product_id,
      oi.quantity,
      oi.price,
      p.product_name,
      COALESCE(p.image_url, p.product_image, '') AS image_url
    FROM orders o
    LEFT JOIN PAYMENT_DETAILS pd ON pd.payment_id = o.payment_id
    LEFT JOIN PICKUP pck ON pck.order_id = o.order_id
    LEFT JOIN \`USER\` ro ON ro.user_id = pck.releasing_officer_id
    INNER JOIN order_item oi ON oi.order_id = o.order_id
    INNER JOIN PRODUCT p ON p.product_id = oi.product_id
    WHERE o.user_id = ?
    ORDER BY o.order_date DESC, o.order_id DESC, oi.product_id ASC
    `,
    [userId],
  );

  const orders = new Map<number, CustomerOrder>();

  for (const row of rows) {
    const orderId = Number(row.order_id);
    const existing = orders.get(orderId);
    const releasedAt = row.released_at ? new Date(row.released_at).toISOString() : null;
    const order =
      existing ??
      ({
        id: `ORD-${String(orderId).padStart(4, "0")}`,
        dbId: orderId,
        completedAt: releasedAt,
        date: row.order_date ? new Date(row.order_date).toISOString().slice(0, 10) : "",
        deliveryMethod: row.delivery_method === "pickup" ? "pickup" : "delivery",
        paymentMethod: String(row.payment_method || ""),
        paymentStatus: String(row.payment_status || ""),
        releasedAt,
        releasingOfficer: String(row.releasing_officer || ""),
        status: String(row.order_status || "Pending"),
        total: Number(row.total_amount),
        items: [],
      } satisfies CustomerOrder);

    order.items.push({
      productId: Number(row.product_id),
      name: String(row.product_name || "Product"),
      imageUrl: String(row.image_url || ""),
      quantity: Number(row.quantity),
      price: Number(row.price),
    });

    orders.set(orderId, order);
  }

  return [...orders.values()];
}

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export async function cancelCustomerOrder(userId: number, orderId: number) {
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query<RowDataPacket[]>(
      `SELECT order_id, delivery_method, order_status
       FROM orders
       WHERE order_id = ? AND user_id = ?
       LIMIT 1
       FOR UPDATE`,
      [orderId, userId],
    );
    const order = orders[0];

    if (!order) {
      await connection.rollback();
      return { ok: false as const, message: "Order not found." };
    }

    const status = normalizeStatus(order.order_status);
    if (["cancelled", "delivered", "released"].includes(status)) {
      await connection.rollback();
      return { ok: false as const, message: "This order can no longer be cancelled." };
    }

    const [items] = await connection.query<RowDataPacket[]>(
      "SELECT product_id, quantity FROM order_item WHERE order_id = ?",
      [orderId],
    );

    for (const item of items) {
      await connection.query(
        `UPDATE INVENTORY
         SET stock_quantity = stock_quantity + ?,
             last_updated = NOW()
         WHERE product_id = ?`,
        [Number(item.quantity), Number(item.product_id)],
      );
      await connection.query(
        `UPDATE INVENTORY
         SET status = CASE
           WHEN stock_quantity <= 0 THEN 'Out of Stock'
           WHEN stock_quantity < 15 THEN 'Low Stock'
           ELSE 'Active'
         END
         WHERE product_id = ?`,
        [Number(item.product_id)],
      );
    }

    await connection.query("UPDATE orders SET order_status = 'cancelled' WHERE order_id = ?", [orderId]);

    if (String(order.delivery_method || "delivery").toLowerCase() === "pickup") {
      await connection.query("UPDATE PICKUP SET pickup_status = 'cancelled' WHERE order_id = ?", [orderId]);
    } else {
      await connection.query("UPDATE DELIVERY SET delivery_status = 'cancelled' WHERE order_id = ?", [orderId]);
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
