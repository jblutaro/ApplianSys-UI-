import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/database.js";
import { readAdminSettings, writeAdminSettings } from "../data/adminSettingsStore.js";

type ReportPeriod = "weekly" | "monthly" | "yearly";

const adminRouter = Router();

function normalizeProductStatus(stock: number) {
  if (stock <= 0) return "Out of Stock";
  if (stock < 15) return "Low Stock";
  return "Active";
}

function formatMonthLabel(monthNumber: number) {
  return new Date(2026, monthNumber - 1, 1).toLocaleString("en-US", {
    month: "short",
  });
}

async function ensureCategoryAndSubcategory(categoryName: string) {
  const category = await dbPool.query<RowDataPacket[]>(
    "SELECT category_id FROM CATEGORY WHERE category_name = ? LIMIT 1",
    [categoryName],
  );

  let categoryId = category[0][0]?.category_id as number | undefined;

  if (!categoryId) {
    const insertCategory = await dbPool.query<ResultSetHeader>(
      "INSERT INTO CATEGORY (category_name, category_description) VALUES (?, ?)",
      [categoryName, `${categoryName} appliances`],
    );
    categoryId = insertCategory[0].insertId;
  }

  const subcategory = await dbPool.query<RowDataPacket[]>(
    "SELECT subcategory_id FROM SUBCATEGORY WHERE category_id = ? AND subcategory_name = ? LIMIT 1",
    [categoryId, categoryName],
  );

  let subcategoryId = subcategory[0][0]?.subcategory_id as number | undefined;

  if (!subcategoryId) {
    const insertSubcategory = await dbPool.query<ResultSetHeader>(
      "INSERT INTO SUBCATEGORY (category_id, subcategory_name, subcategory_description) VALUES (?, ?, ?)",
      [categoryId, categoryName, `${categoryName} subcategory`],
    );
    subcategoryId = insertSubcategory[0].insertId;
  }

  return subcategoryId;
}

async function getProducts() {
  const [rows] = await dbPool.query<RowDataPacket[]>(`
    SELECT
      p.product_id,
      p.product_name,
      c.category_name,
      p.price,
      COALESCE(i.stock_quantity, 0) AS stock_quantity
    FROM PRODUCT p
    INNER JOIN SUBCATEGORY s ON s.subcategory_id = p.subcategory_id
    INNER JOIN CATEGORY c ON c.category_id = s.category_id
    LEFT JOIN INVENTORY i ON i.product_id = p.product_id
    ORDER BY p.product_id DESC
  `);

  return rows.map((row) => {
    const stock = Number(row.stock_quantity ?? 0);

    return {
      id: `PRD-${String(row.product_id).padStart(3, "0")}`,
      dbId: Number(row.product_id),
      name: String(row.product_name),
      category: String(row.category_name),
      price: Number(row.price),
      stock,
      status: normalizeProductStatus(stock),
    };
  });
}

async function getOrders() {
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

async function getRevenueSeries() {
  const [rows] = await dbPool.query<RowDataPacket[]>(`
    SELECT
      MONTH(order_date) AS month_number,
      COALESCE(SUM(total_amount), 0) AS revenue
    FROM \`ORDER\`
    WHERE order_date IS NOT NULL
    GROUP BY MONTH(order_date)
    ORDER BY MONTH(order_date)
  `);

  const revenueByMonth = new Map<number, number>();

  for (const row of rows) {
    revenueByMonth.set(Number(row.month_number), Number(row.revenue));
  }

  return Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    return {
      month: formatMonthLabel(monthNumber),
      revenue: revenueByMonth.get(monthNumber) ?? 0,
    };
  });
}

async function getSalesReport(period: ReportPeriod, taxRate: number) {
  if (period === "weekly") {
    const [rows] = await dbPool.query<RowDataPacket[]>(`
      SELECT
        WEEK(order_date, 1) AS bucket,
        COUNT(*) AS orders,
        COALESCE(SUM(total_amount), 0) AS gross_revenue
      FROM \`ORDER\`
      WHERE order_date IS NOT NULL
      GROUP BY WEEK(order_date, 1)
      ORDER BY WEEK(order_date, 1) DESC
      LIMIT 4
    `);

    return rows
      .map((row) => ({
        label: `Week ${row.bucket}`,
        orders: Number(row.orders),
        taxCollected: Number(row.gross_revenue) * (taxRate / 100),
        grossRevenue: Number(row.gross_revenue),
      }))
      .reverse();
  }

  if (period === "yearly") {
    const [rows] = await dbPool.query<RowDataPacket[]>(`
      SELECT
        YEAR(order_date) AS bucket,
        COUNT(*) AS orders,
        COALESCE(SUM(total_amount), 0) AS gross_revenue
      FROM \`ORDER\`
      WHERE order_date IS NOT NULL
      GROUP BY YEAR(order_date)
      ORDER BY YEAR(order_date) DESC
      LIMIT 5
    `);

    return rows
      .map((row) => ({
        label: String(row.bucket),
        orders: Number(row.orders),
        taxCollected: Number(row.gross_revenue) * (taxRate / 100),
        grossRevenue: Number(row.gross_revenue),
      }))
      .reverse();
  }

  const [rows] = await dbPool.query<RowDataPacket[]>(`
    SELECT
      DATE_FORMAT(order_date, '%Y-%m') AS bucket,
      COUNT(*) AS orders,
      COALESCE(SUM(total_amount), 0) AS gross_revenue
    FROM \`ORDER\`
    WHERE order_date IS NOT NULL
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
    ORDER BY DATE_FORMAT(order_date, '%Y-%m') DESC
    LIMIT 6
  `);

  return rows
    .map((row) => ({
      label: new Date(`${String(row.bucket)}-01`).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
      orders: Number(row.orders),
      taxCollected: Number(row.gross_revenue) * (taxRate / 100),
      grossRevenue: Number(row.gross_revenue),
    }))
    .reverse();
}

adminRouter.get("/products", async (_req, res, next) => {
  try {
    const products = await getProducts();
    res.json({ ok: true, products });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/products", async (req, res, next) => {
  try {
    const { name, category, price, stock } = req.body as {
      name?: string;
      category?: string;
      price?: number;
      stock?: number;
    };

    if (!name || !category) {
      res.status(400).json({ ok: false, message: "Product name and category are required." });
      return;
    }

    const subcategoryId = await ensureCategoryAndSubcategory(category);
    const [productResult] = await dbPool.query<ResultSetHeader>(
      "INSERT INTO PRODUCT (subcategory_id, product_name, product_description, price, product_image) VALUES (?, ?, ?, ?, ?)",
      [subcategoryId, name, "", Number(price ?? 0), ""],
    );

    await dbPool.query<ResultSetHeader>(
      "INSERT INTO INVENTORY (product_id, stock_quantity, status, last_updated) VALUES (?, ?, ?, NOW())",
      [
        productResult.insertId,
        Number(stock ?? 0),
        normalizeProductStatus(Number(stock ?? 0)),
      ],
    );

    const products = await getProducts();
    res.status(201).json({ ok: true, products });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/products/:productId", async (req, res, next) => {
  const productId = Number(req.params.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).json({ ok: false, message: "A valid product id is required." });
    return;
  }

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [productRows] = await connection.query<RowDataPacket[]>(
      "SELECT product_id FROM PRODUCT WHERE product_id = ? LIMIT 1",
      [productId],
    );

    if (!productRows[0]) {
      await connection.rollback();
      res.status(404).json({ ok: false, message: "Product not found." });
      return;
    }

    const [orderItemRows] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM ORDER_ITEM WHERE product_id = ?",
      [productId],
    );

    const orderItemCount = Number(orderItemRows[0]?.count ?? 0);

    if (orderItemCount > 0) {
      await connection.rollback();
      res.status(409).json({
        ok: false,
        message: "This product cannot be deleted because it is referenced by existing orders.",
      });
      return;
    }

    await connection.query("DELETE FROM CART_ITEM WHERE product_id = ?", [productId]);
    await connection.query("DELETE FROM INVENTORY WHERE product_id = ?", [productId]);
    await connection.query("DELETE FROM PRODUCT WHERE product_id = ?", [productId]);

    await connection.commit();

    const products = await getProducts();
    res.json({ ok: true, products });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

adminRouter.get("/orders", async (_req, res, next) => {
  try {
    const orders = await getOrders();
    res.json({ ok: true, orders });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/orders/:orderId/status", async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const { status } = req.body as { status?: string };

    if (!status) {
      res.status(400).json({ ok: false, message: "Order status is required." });
      return;
    }

    await dbPool.query("UPDATE `ORDER` SET order_status = ? WHERE order_id = ?", [status, orderId]);
    const orders = await getOrders();
    res.json({ ok: true, orders });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/settings", async (_req, res, next) => {
  try {
    const settings = await readAdminSettings();
    res.json({ ok: true, settings });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/settings", async (req, res, next) => {
  try {
    const settings = await writeAdminSettings(req.body);
    res.json({ ok: true, settings });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/dashboard", async (req, res, next) => {
  try {
    const period = (req.query.period as ReportPeriod | undefined) ?? "monthly";
    const [products, orders, settings, revenueOverTime] = await Promise.all([
      getProducts(),
      getOrders(),
      readAdminSettings(),
      getRevenueSeries(),
    ]);

    const report = await getSalesReport(period, settings.taxRate);

    res.json({
      ok: true,
      dashboard: {
        products,
        orders,
        settings,
        revenueOverTime,
        report,
      },
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/reports/sales", async (req, res, next) => {
  try {
    const period = (req.query.period as ReportPeriod | undefined) ?? "monthly";
    const [orders, settings] = await Promise.all([getOrders(), readAdminSettings()]);
    const report = await getSalesReport(period, settings.taxRate);

    res.json({
      ok: true,
      period,
      report,
      orders,
    });
  } catch (error) {
    next(error);
  }
});

export { adminRouter };
