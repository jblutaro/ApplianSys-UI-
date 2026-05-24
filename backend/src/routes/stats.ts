import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/database.js";

export const statsRouter = Router();

statsRouter.get("/stats", async (_req, res, next) => {
  try {
    const [
      [productRow],
      [customerRow],
      [categoryRow],
      [categoryNamesRows],
      [firstUserRow],
      [firstOrderRow],
      [latestOrderRow],
    ] = await Promise.all([
      dbPool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM PRODUCT"),
      dbPool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS total FROM `USER` WHERE user_type = 'customer'",
      ),
      dbPool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM CATEGORY"),
      dbPool.query<RowDataPacket[]>(
        "SELECT category_name FROM CATEGORY ORDER BY category_name ASC",
      ),
      dbPool.query<RowDataPacket[]>(
        "SELECT YEAR(MIN(created_at)) AS yr FROM `USER` WHERE created_at IS NOT NULL",
      ),
      dbPool.query<RowDataPacket[]>(
        "SELECT YEAR(MIN(order_date)) AS yr FROM orders WHERE order_date IS NOT NULL",
      ),
      dbPool.query<RowDataPacket[]>(
        "SELECT YEAR(MAX(order_date)) AS yr FROM orders WHERE order_date IS NOT NULL",
      ),
    ]);

    const currentYear = new Date().getFullYear();

    res.setHeader("Cache-Control", "public, max-age=60");
    res.json({
      ok: true,
      stats: {
        products: Number(productRow[0]?.total ?? 0),
        customers: Number(customerRow[0]?.total ?? 0),
        categories: Number(categoryRow[0]?.total ?? 0),
        categoryNames: (categoryNamesRows as RowDataPacket[]).map((r) =>
          String(r.category_name),
        ),
        foundedYear: Number(firstUserRow[0]?.yr ?? currentYear),
        firstOrderYear: Number(firstOrderRow[0]?.yr ?? currentYear),
        latestOrderYear: Number(latestOrderRow[0]?.yr ?? currentYear),
      },
    });
  } catch (error) {
    next(error);
  }
});

statsRouter.get("/best-selling", async (_req, res, next) => {
  try {
    const [rows] = await dbPool.query<RowDataPacket[]>(`
      SELECT
        p.product_id,
        p.product_name,
        p.image_url,
        p.price,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(pd.payment_status, '')) = 'paid' AND LOWER(COALESCE(o.order_status, '')) <> 'cancelled' THEN oi.quantity ELSE 0 END), 0) AS total_sold,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(pd.payment_status, '')) = 'paid' AND LOWER(COALESCE(o.order_status, '')) <> 'cancelled' THEN oi.quantity * oi.price ELSE 0 END), 0) AS total_revenue
      FROM PRODUCT p
      LEFT JOIN order_item oi ON oi.product_id = p.product_id
      LEFT JOIN orders o ON o.order_id = oi.order_id
      LEFT JOIN PAYMENT_DETAILS pd ON pd.payment_id = o.payment_id
      GROUP BY p.product_id, p.product_name, p.image_url, p.price
      ORDER BY
        SUM(CASE WHEN LOWER(COALESCE(pd.payment_status, '')) = 'paid' AND LOWER(COALESCE(o.order_status, '')) <> 'cancelled' THEN oi.quantity ELSE 0 END) DESC,
        SUM(CASE WHEN LOWER(COALESCE(pd.payment_status, '')) = 'paid' AND LOWER(COALESCE(o.order_status, '')) <> 'cancelled' THEN oi.quantity * oi.price ELSE 0 END) DESC
      LIMIT 8
    `);

    const bestSelling = rows.map((row) => ({
      id: `PRD-${String(row.product_id).padStart(3, "0")}`,
      dbId: Number(row.product_id),
      name: String(row.product_name),
      image: String(row.image_url ?? ""),
      price: Number(row.price),
      totalSold: Number(row.total_sold),
    }));

    res.setHeader("Cache-Control", "public, max-age=60");
    res.json({
      ok: true,
      products: bestSelling,
    });
  } catch (error) {
    next(error);
  }
});

