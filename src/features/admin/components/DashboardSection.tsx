import type {
  Order,
  Product,
  ReportPeriod,
  RevenuePoint,
  SalesReportRow,
} from "../lib/adminApi";
import { downloadExcelReport, formatCurrency } from "../lib/adminUtils";

type DashboardSectionProps = {
  orders: Order[];
  period: ReportPeriod;
  products: Product[];
  reportRows: SalesReportRow[];
  revenueOverTime: RevenuePoint[];
  setPeriod: (value: ReportPeriod) => void;
};

export function DashboardSection({
  orders,
  period,
  products,
  reportRows,
  revenueOverTime,
  setPeriod,
}: DashboardSectionProps) {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const activeProducts = products.filter((product) => product.status === "Active").length;
  const lowInventory = products.filter((product) => product.status !== "Active").length;
  const maxRevenue = Math.max(1, ...revenueOverTime.map((item) => item.revenue));

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

          <div className="admin-chart">
            {revenueOverTime.map((item) => (
              <div key={item.month} className="admin-chart__col">
                <div className="admin-chart__bar-wrap">
                  <div
                    className={`admin-chart__bar${item.revenue === maxRevenue ? " admin-chart__bar--highlight" : ""}`}
                    style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="admin-chart__label">{item.month}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2 className="admin-card__title">Sales Report</h2>
              <p className="admin-card__sub">Export the selected sales report as an Excel file.</p>
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
              onClick={() => downloadExcelReport(period, orders, reportRows)}
            >
              Export Report
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
      </section>
    </>
  );
}
