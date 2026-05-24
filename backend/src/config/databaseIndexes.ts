import type { RowDataPacket } from "mysql2";
import { dbPool } from "./database.js";

type IndexDefinition = {
  columns: string;
  name: string;
  table: string;
};

const RESILIENCE_INDEXES: IndexDefinition[] = [
  { table: "PRODUCT", name: "idx_product_subcategory", columns: "subcategory_id" },
  { table: "INVENTORY", name: "idx_inventory_product", columns: "product_id" },
  { table: "CART", name: "idx_cart_user", columns: "user_id" },
  { table: "CART_ITEM", name: "idx_cart_item_cart_product", columns: "cart_id, product_id" },
  { table: "orders", name: "idx_orders_user_date", columns: "user_id, order_date" },
  { table: "orders", name: "idx_orders_status_date", columns: "order_status, order_date" },
  { table: "order_item", name: "idx_order_item_order_product", columns: "order_id, product_id" },
  { table: "PAYMENT_DETAILS", name: "idx_payment_status_method", columns: "payment_status, payment_method" },
  { table: "DELIVERY", name: "idx_delivery_order", columns: "order_id" },
  { table: "PICKUP", name: "idx_pickup_order", columns: "order_id" },
];

async function indexExists(table: string, name: string) {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?
     LIMIT 1`,
    [table, name],
  );

  return rows.length > 0;
}

export async function ensureDatabaseResilienceIndexes() {
  for (const index of RESILIENCE_INDEXES) {
    if (await indexExists(index.table, index.name)) continue;

    try {
      await dbPool.query(
        `CREATE INDEX \`${index.name}\` ON \`${index.table}\` (${index.columns})`,
      );
    } catch (error) {
      console.warn(`Could not create index ${index.name} on ${index.table}:`, error);
    }
  }
}
