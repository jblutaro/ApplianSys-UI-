import type {
  Order,
  Product,
  ReportPeriod,
  RevenuePoint,
  ItemSalesRow,
  SalesReportRow,
} from "../lib/adminApi";
import { downloadExcelReport, downloadPdfReport, formatCurrency } from "../lib/adminUtils";

type DashboardSectionProps = {
  orders: Order[];
  period: ReportPeriod;
  products: Product[];
  itemSalesRows: ItemSalesRow[];
  reportRows: SalesReportRow[];
  revenueOverTime: RevenuePoint[];
  setPeriod: (value: ReportPeriod) => void;
};

export function DashboardSection({
  orders,
  period,
  products,
  itemSalesRows,
  reportRows,
  revenueOverTime,
  setPeriod,
}: DashboardSectionProps) {
  const totalRevenue = orders
    .filter((order) => order.paymentStatus === "paid" && order.orderStatus !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const activeProducts = products.filter((product) => product.status === "Active").length;
  const lowInventory = products.filter((product) => product.status !== "Active").length;
  const maxRevenue = Math.max(1, ...revenueOverTime.map((item) => item.revenue));
  const chartScale = maxRevenue * 1.25;
  const totalUnitsSold = itemSalesRows.reduce((sum, item) => sum + item.quantitySold, 0);
  const totalItemSales = itemSalesRows.reduce((sum, item) => sum + item.grossSales, 0);

  return (
    <>
      <section className="admin-metrics">
        <article className="admin-card">
          <span className="admin-stat__label">Gross Revenue</span>
          <strong className="admin-stat__value">{formatCurrency(totalRevenue)}</strong>
          <span className="admin-stat__meta">Live from backend data</span>
        </article>
        <article className="admin-card">
          <span className="admin-stat__label">Total Orders</span>
          <strong className="admin-stat__value">{totalOrders}</strong>
          <span className="admin-stat__meta">Current stored orders</span>
        </article>
        <article className="admin-card">
          <span className="admin-stat__label">Active Products</span>
          <strong className="admin-stat__value">{activeProducts}</strong>
          <span className="admin-stat__meta admin-stat__meta--muted">
            {products.length} listed on platform
          </span>
        </article>
        <article className="admin-card">
          <span className="admin-stat__label">Inventory Alerts</span>
          <strong className="admin-stat__value">{lowInventory}</strong>
          <span className="admin-stat__meta admin-stat__meta--muted">
            Needs restock or review
          </span>
        </article>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2 className="admin-card__title">Revenue Over Time</h2>
              <p className="admin-card__sub">Monthly sales performance from stored orders.</p>
            </div>
          </div>

          {revenueOverTime.length === 0 ? (
            <div className="admin-chart-empty">
              <span>No order data yet.</span>
            </div>
          ) : (
            <div className="admin-chart">
              {revenueOverTime.map((item) => (
                <div key={item.month} className="admin-chart__col">
                  <div className="admin-chart__bar-wrap">
                    {item.revenue > 0 ? (
                      <span className="admin-chart__bar-value">
                        {formatCurrency(item.revenue)}
                      </span>
                    ) : null}
                    <div
                      className={`admin-chart__bar${item.revenue === maxRevenue ? " admin-chart__bar--highlight" : ""}`}
                      style={{ height: `${(item.revenue / chartScale) * 100}%` }}
                    />
                  </div>
                  <span className="admin-chart__label">{item.month}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2 className="admin-card__title">Sales Report</h2>
              <p className="admin-card__sub">
                Export the selected sales report, including item totals, as an Excel file.
              </p>
            </div>
          </div>

          <div className="admin-report-controls">
            <select
              className="admin-select"
              value={period}
              onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>

            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() => {
                void downloadExcelReport(period, reportRows, itemSalesRows);
              }}
            >
              Export Excel
            </button>

            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() => downloadPdfReport(period, orders, reportRows, itemSalesRows)}
            >
              Export PDF
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Total Orders</th>
                  <th>Tax Collected</th>
                  <th>Gross Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.orders}</td>
                    <td>{formatCurrency(row.taxCollected)}</td>
                    <td className="admin-table__strong">{formatCurrency(row.grossRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-card admin-card--wide">
          <div className="admin-card__header">
            <div>
              <h2 className="admin-card__title">Items Sold</h2>
              <p className="admin-card__sub">
                Individual product totals for the selected report period.
              </p>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item Sold</th>
                  <th>Units Sold</th>
                  <th>Average Price</th>
                  <th>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {itemSalesRows.length > 0 ? (
                  itemSalesRows.map((item) => (
                    <tr key={item.productId}>
                      <td>{item.productName}</td>
                      <td>{item.quantitySold}</td>
                      <td>{formatCurrency(item.averageUnitPrice)}</td>
                      <td className="admin-table__strong">{formatCurrency(item.grossSales)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No items sold for this period.</td>
                  </tr>
                )}
                <tr>
                  <td className="admin-table__strong">Grand Total Sold by System</td>
                  <td className="admin-table__strong">{totalUnitsSold}</td>
                  <td />
                  <td className="admin-table__strong">{formatCurrency(totalItemSales)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}
