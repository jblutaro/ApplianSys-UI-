import type { RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";
import type { ReportPeriod, RevenuePoint, SalesReportRow } from "./types.js";

function formatMonthLabel(monthNumber: number) {
  return new Date(2026, monthNumber - 1, 1).toLocaleString("en-US", {
    month: "short",
  });
}

export async function getRevenueSeries(): Promise<RevenuePoint[]> {
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

export async function getSalesReport(
  period: ReportPeriod,
  taxRate: number,
): Promise<SalesReportRow[]> {
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
