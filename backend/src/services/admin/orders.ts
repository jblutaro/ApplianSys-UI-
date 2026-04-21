import type { RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";
import type { AdminOrder } from "./types.js";

export async function getOrders(): Promise<AdminOrder[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(`
    SELECT
      o.order_id,
      o.order_date,
      o.total_amount,
      o.order_status,
      u.email,
      CONCAT(u.fname, ' ', u.lname) AS customer_name
    FROM \`ORDER\` o
    INNER JOIN \`USER\` u ON u.user_id = o.user_id
    ORDER BY o.order_date DESC, o.order_id DESC
  `);

  return rows.map((row) => ({
    id: `ORD-${String(row.order_id).padStart(4, "0")}`,
    dbId: Number(row.order_id),
    customer: String(row.customer_name || "Customer"),
    email: String(row.email || ""),
    date: row.order_date ? new Date(row.order_date).toISOString().slice(0, 10) : "",
    total: Number(row.total_amount),
    status: String(row.order_status || "Pending"),
  }));
}

export async function updateOrderStatus(orderId: number, status: string) {
  await dbPool.query("UPDATE `ORDER` SET order_status = ? WHERE order_id = ?", [
    status,
    orderId,
  ]);

  return getOrders();
}
