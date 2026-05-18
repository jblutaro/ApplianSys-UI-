import type { RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";

export type CustomerOrder = {
  id: string;
  dbId: number;
  date: string;
  deliveryMethod: "delivery" | "pickup";
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
      oi.product_id,
      oi.quantity,
      oi.price,
      p.product_name,
      COALESCE(p.image_url, p.product_image, '') AS image_url
    FROM orders o
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
    const order =
      existing ??
      ({
        id: `ORD-${String(orderId).padStart(4, "0")}`,
        dbId: orderId,
        date: row.order_date ? new Date(row.order_date).toISOString().slice(0, 10) : "",
        deliveryMethod: row.delivery_method === "pickup" ? "pickup" : "delivery",
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
