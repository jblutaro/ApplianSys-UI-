import type { RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";
import type { ItemSalesRow, ReportPeriod, RevenuePoint, SalesReportRow } from "./types.js";

function toMonthKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
}

async function getLatestOrderYear() {
  const [rows] = await dbPool.query<RowDataPacket[]>(`
    SELECT YEAR(MAX(order_date)) AS latest_year
    FROM orders
    INNER JOIN PAYMENT_DETAILS pd ON pd.payment_id = orders.payment_id
    WHERE order_date IS NOT NULL
      AND LOWER(COALESCE(pd.payment_status, '')) = 'paid'
      AND LOWER(COALESCE(orders.order_status, '')) <> 'cancelled'
  `);

  return Number(rows[0]?.latest_year ?? new Date().getUTCFullYear());
}

export async function getRevenueSeries(): Promise<RevenuePoint[]> {
  const latestYear = await getLatestOrderYear();
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `
    SELECT
      DATE_FORMAT(order_date, '%Y-%m') AS month_key,
      COALESCE(SUM(total_amount), 0)   AS revenue
    FROM orders
    INNER JOIN PAYMENT_DETAILS pd ON pd.payment_id = orders.payment_id
    WHERE order_date IS NOT NULL
      AND YEAR(order_date) = ?
      AND LOWER(COALESCE(pd.payment_status, '')) = 'paid'
      AND LOWER(COALESCE(orders.order_status, '')) <> 'cancelled'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
    ORDER BY DATE_FORMAT(order_date, '%Y-%m') ASC
  `,
    [latestYear],
  );

  const revenueByMonth = new Map(
    rows.map((row) => [String(row.month_key), Number(row.revenue)]),
  );

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(latestYear, index, 1));
    const monthKey = toMonthKey(date);

    return {
      month: formatMonthLabel(monthKey),
      revenue: revenueByMonth.get(monthKey) ?? 0,
    };
  });
}

export async function getSalesReport(
  period: ReportPeriod,
  taxRate: number,
): Promise<SalesReportRow[]> {
  if (period === "weekly") {
    const [rows] = await dbPool.query<RowDataPacket[]>(`
      SELECT
        YEARWEEK(order_date, 1) AS bucket_key,
        YEAR(order_date) AS order_year,
        WEEK(order_date, 1) AS bucket,
        COUNT(*) AS orders,
        COALESCE(SUM(total_amount), 0) AS gross_revenue
      FROM orders
      INNER JOIN PAYMENT_DETAILS pd ON pd.payment_id = orders.payment_id
      WHERE order_date IS NOT NULL
        AND order_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
        AND LOWER(COALESCE(pd.payment_status, '')) = 'paid'
        AND LOWER(COALESCE(orders.order_status, '')) <> 'cancelled'
      GROUP BY YEARWEEK(order_date, 1), YEAR(order_date), WEEK(order_date, 1)
      ORDER BY YEARWEEK(order_date, 1) DESC
      LIMIT 4
    `);

    return rows
      .map((row) => ({
        label: `Week ${row.bucket}, ${row.order_year}`,
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
      FROM orders
      INNER JOIN PAYMENT_DETAILS pd ON pd.payment_id = orders.payment_id
      WHERE order_date IS NOT NULL
        AND order_date >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
        AND LOWER(COALESCE(pd.payment_status, '')) = 'paid'
        AND LOWER(COALESCE(orders.order_status, '')) <> 'cancelled'
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

  const latestYear = await getLatestOrderYear();
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `
    SELECT
      DATE_FORMAT(order_date, '%Y-%m') AS bucket,
      COUNT(*) AS orders,
      COALESCE(SUM(total_amount), 0) AS gross_revenue
    FROM orders
    INNER JOIN PAYMENT_DETAILS pd ON pd.payment_id = orders.payment_id
    WHERE order_date IS NOT NULL
      AND YEAR(order_date) = ?
      AND LOWER(COALESCE(pd.payment_status, '')) = 'paid'
      AND LOWER(COALESCE(orders.order_status, '')) <> 'cancelled'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
    ORDER BY DATE_FORMAT(order_date, '%Y-%m') ASC
  `,
    [latestYear],
  );

  const reportByMonth = new Map(
    rows.map((row) => [
      String(row.bucket),
      {
        grossRevenue: Number(row.gross_revenue),
        orders: Number(row.orders),
      },
    ]),
  );

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(latestYear, index, 1));
    const monthKey = toMonthKey(date);
    const monthReport = reportByMonth.get(monthKey);

    return {
      label: new Date(Date.UTC(latestYear, index, 1)).toLocaleString("en-US", {
        month: "long",
        timeZone: "UTC",
        year: "numeric",
      }),
      orders: monthReport?.orders ?? 0,
      taxCollected: (monthReport?.grossRevenue ?? 0) * (taxRate / 100),
      grossRevenue: monthReport?.grossRevenue ?? 0,
    };
  });
}

async function getItemSalesPeriodScope(period: ReportPeriod) {
  if (period === "weekly") {
    return {
      params: [] as number[],
      where: "o.order_date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)",
    };
  }

  if (period === "yearly") {
    return {
      params: [] as number[],
      where: "o.order_date >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)",
    };
  }

  const latestYear = await getLatestOrderYear();

  return {
    params: [latestYear],
    where: "YEAR(o.order_date) = ?",
  };
}

export async function getItemSalesReport(period: ReportPeriod): Promise<ItemSalesRow[]> {
  const scope = await getItemSalesPeriodScope(period);
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `
    SELECT
      oi.product_id,
      COALESCE(p.product_name, CONCAT('Product #', oi.product_id)) AS product_name,
      COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
      COALESCE(SUM(oi.quantity * oi.price), 0) AS gross_sales,
      CASE
        WHEN COALESCE(SUM(oi.quantity), 0) > 0
          THEN COALESCE(SUM(oi.quantity * oi.price), 0) / SUM(oi.quantity)
        ELSE 0
      END AS average_unit_price
    FROM order_item oi
    INNER JOIN orders o ON o.order_id = oi.order_id
    INNER JOIN PAYMENT_DETAILS pd ON pd.payment_id = o.payment_id
    LEFT JOIN PRODUCT p ON p.product_id = oi.product_id
    WHERE o.order_date IS NOT NULL
      AND LOWER(COALESCE(pd.payment_status, '')) = 'paid'
      AND LOWER(COALESCE(o.order_status, '')) <> 'cancelled'
      AND ${scope.where}
    GROUP BY oi.product_id, p.product_name
    ORDER BY gross_sales DESC, quantity_sold DESC, product_name ASC
  `,
    scope.params,
  );

  return rows.map((row) => ({
    productId: Number(row.product_id),
    productName: String(row.product_name),
    quantitySold: Number(row.quantity_sold),
    averageUnitPrice: Number(row.average_unit_price),
    grossSales: Number(row.gross_sales),
  }));
}
