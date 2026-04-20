import "@/shared/styles/Admin.css";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { isAdminUser } from "../lib/adminAccess";
import {
  createProduct,
  deleteProduct,
  fetchAdminDashboard,
  fetchSalesReport,
  patchOrderStatus,
  updateAdminSettings,
  type AdminSettings,
  type Order,
  type OrderStatus,
  type Product,
  type ReportPeriod,
  type RevenuePoint,
  type SalesReportRow,
} from "../lib/adminApi";

type AdminPageProps = {
  user: User | null;
  onAuthOpen: () => void;
};

type AdminSection = "dashboard" | "products" | "orders" | "settings";

const NAV_ITEMS: { key: AdminSection; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "settings", label: "Settings" },
];

const PRODUCT_CATEGORIES = [
  "Kitchen",
  "Cleaning",
  "Cooling",
  "Entertainment",
  "Home",
  "Office",
  "Personal Care",
  "Household",
] as const;

const EMPTY_SETTINGS: AdminSettings = {
  siteName: "ApplianSys",
  supportEmail: "support@appliansys.com",
  description: "Premium appliances for every household.",
  currency: "PHP (PHP)",
  taxRate: 8.5,
  maintenanceMode: false,
  orderNotifications: true,
  emailCampaigns: true,
};

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
});

function formatCurrency(value: number) {
  return CURRENCY.format(value);
}

function getStatusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function downloadExcelReport(period: ReportPeriod, orders: Order[], rows: SalesReportRow[]) {
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
  const totalTax = rows.reduce((sum, row) => sum + row.taxCollected, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.grossRevenue, 0);
  const summaryHeader = ["Period", "Total Orders", "Tax Collected", "Gross Revenue"];
  const orderHeader = ["Order ID", "Customer", "Email", "Date", "Total", "Status"];

  const escapeCell = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const makeRow = (cells: Array<string | number>) =>
    `<Row>${cells
      .map(
        (cell) =>
          `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${escapeCell(String(cell))}</Data></Cell>`,
      )
      .join("")}</Row>`;

  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Sales Report">
  <Table>
   ${makeRow(["ApplianSys Sales Report"])}
   ${makeRow([`Period: ${period}`])}
   ${makeRow([])}
   ${makeRow(summaryHeader)}
   ${rows.map((row) => makeRow([row.label, row.orders, Number(row.taxCollected.toFixed(2)), Number(row.grossRevenue.toFixed(2))])).join("")}
   ${makeRow(["Totals", totalOrders, Number(totalTax.toFixed(2)), Number(totalRevenue.toFixed(2))])}
   ${makeRow([])}
   ${makeRow(orderHeader)}
   ${orders.map((order) => makeRow([order.id, order.customer, order.email, order.date, Number(order.total.toFixed(2)), order.status])).join("")}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `appliansys-sales-report-${period}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function DashboardSection({
  orders,
  products,
  period,
  setPeriod,
  revenueOverTime,
  reportRows,
}: {
  orders: Order[];
  products: Product[];
  period: ReportPeriod;
  setPeriod: (value: ReportPeriod) => void;
  revenueOverTime: RevenuePoint[];
  reportRows: SalesReportRow[];
}) {
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
          <span className="admin-stat__meta admin-stat__meta--muted">{products.length} listed on platform</span>
        </article>
        <article className="admin-card">
          <span className="admin-stat__label">Inventory Alerts</span>
          <strong className="admin-stat__value">{lowInventory}</strong>
          <span className="admin-stat__meta admin-stat__meta--muted">Needs restock or review</span>
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

function ProductsSection({
  products,
  draft,
  setDraft,
  onAddProduct,
  onDeleteProduct,
}: {
  products: Product[];
  draft: Product;
  setDraft: (value: Product) => void;
  onAddProduct: () => void;
  onDeleteProduct: (id: string) => void;
}) {
  return (
    <article className="admin-card">
      <div className="admin-card__header">
        <div>
          <h2 className="admin-card__title">Products</h2>
          <p className="admin-card__sub">Manage your appliance inventory, pricing, and stock.</p>
        </div>
      </div>

      <div className="admin-products-toolbar">
        <div className="admin-form-grid" style={{ flex: 1 }}>
          <div className="admin-field">
            <label htmlFor="product-name">Product Name</label>
            <input
              id="product-name"
              className="admin-input"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Add a product name"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="product-category">Category</label>
            <select
              id="product-category"
              className="admin-select"
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            >
              <option value="">Select category</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="product-price">Price</label>
            <input
              id="product-price"
              className="admin-input"
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="product-stock">Stock</label>
            <input
              id="product-stock"
              className="admin-input"
              type="number"
              min="0"
              step="1"
              value={draft.stock}
              onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })}
            />
          </div>
        </div>

        <button type="button" className="admin-primary-btn" onClick={onAddProduct}>
          Add Product
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="admin-table__strong">{product.name}</td>
                <td>{product.category}</td>
                <td>{formatCurrency(product.price)}</td>
                <td>{product.stock}</td>
                <td>
                  <span className={`admin-status admin-status--${getStatusClass(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="admin-icon-btn"
                      aria-label={`Delete ${product.name}`}
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function OrdersSection({
  orders,
  onChangeStatus,
}: {
  orders: Order[];
  onChangeStatus: (id: string, status: OrderStatus) => void;
}) {
  return (
    <article className="admin-card">
      <div className="admin-card__header">
        <div>
          <h2 className="admin-card__title">Orders</h2>
          <p className="admin-card__sub">View and update customer order statuses.</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="admin-table__strong">{order.id}</td>
                <td>
                  <div className="admin-order-customer">
                    <span>{order.customer}</span>
                    <small>{order.email}</small>
                  </div>
                </td>
                <td>{order.date}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <span className={`admin-status admin-status--${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <select
                    className="admin-select"
                    value={order.status}
                    onChange={(event) => onChangeStatus(order.id, event.target.value as OrderStatus)}
                  >
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Pending">Pending</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function SettingsSection({
  settings,
  setSettings,
  onSave,
  isSaving,
}: {
  settings: AdminSettings;
  setSettings: (value: AdminSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <section className="admin-settings-grid">
      <article className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Platform Settings</h2>
            <p className="admin-card__sub">Configure global application settings and preferences.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="site-name">Site Name</label>
            <input
              id="site-name"
              className="admin-input"
              value={settings.siteName}
              onChange={(event) => setSettings({ ...settings, siteName: event.target.value })}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="support-email">Support Email</label>
            <input
              id="support-email"
              className="admin-input"
              type="email"
              value={settings.supportEmail}
              onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })}
            />
          </div>

          <div className="admin-field--full">
            <label htmlFor="site-description">Site Description</label>
            <textarea
              id="site-description"
              className="admin-textarea"
              value={settings.description}
              onChange={(event) => setSettings({ ...settings, description: event.target.value })}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="currency">Default Currency</label>
            <input
              id="currency"
              className="admin-input"
              value={settings.currency}
              onChange={(event) => setSettings({ ...settings, currency: event.target.value })}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="tax-rate">Base Tax Rate (%)</label>
            <input
              id="tax-rate"
              className="admin-input"
              type="number"
              min="0"
              step="0.1"
              value={settings.taxRate}
              onChange={(event) => setSettings({ ...settings, taxRate: Number(event.target.value) })}
            />
          </div>
        </div>

        <button type="button" className="admin-primary-btn" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </article>

      <article className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">System Preferences</h2>
            <p className="admin-card__sub">Feature flags that alter how the platform behaves.</p>
          </div>
        </div>

        <div className="admin-toggle-list">
          {[
            {
              key: "maintenanceMode",
              title: "Enable Maintenance Mode",
              body: "Temporarily pause storefront activity while you update the platform.",
            },
            {
              key: "orderNotifications",
              title: "New Order Notifications",
              body: "Keep admins informed when new orders come in.",
            },
            {
              key: "emailCampaigns",
              title: "Enable Email Campaigns",
              body: "Allow scheduled promotional email pushes from the platform.",
            },
          ].map((item) => {
            const value = settings[item.key as keyof AdminSettings] as boolean;
            return (
              <div key={item.key} className="admin-toggle">
                <div className="admin-toggle__text">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
                <button
                  type="button"
                  className={`admin-switch${value ? " admin-switch--on" : ""}`}
                  aria-pressed={value}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      [item.key]: !value,
                    })
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="admin-note">
          Important warning: enabling maintenance mode will log out storefront users and hide checkout actions until it is turned off again.
        </div>
      </article>
    </section>
  );
}

function AdminPage({ user, onAuthOpen }: AdminPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const section = NAV_ITEMS.some((item) => item.key === sectionParam)
    ? (sectionParam as AdminSection)
    : "dashboard";

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(EMPTY_SETTINGS);
  const [revenueOverTime, setRevenueOverTime] = useState<RevenuePoint[]>([]);
  const [reportRows, setReportRows] = useState<SalesReportRow[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [productDraft, setProductDraft] = useState<Product>({
    id: "PRD-NEW",
    dbId: 0,
    name: "",
    category: "",
    price: 0,
    stock: 0,
    status: "Active",
  });

  const isAllowed = isAdminUser(user);
  const currentSectionLabel = NAV_ITEMS.find((item) => item.key === section)?.label ?? "Dashboard";

  useEffect(() => {
    if (!user || !isAllowed) return;

    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchAdminDashboard(period);
        if (cancelled) return;

        setProducts(response.dashboard.products);
        setOrders(response.dashboard.orders);
        setSettings(response.dashboard.settings);
        setRevenueOverTime(response.dashboard.revenueOverTime);
        setReportRows(response.dashboard.report);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load admin data.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [isAllowed, period, user]);

  const handleAddProduct = () => {
    if (!productDraft.name.trim() || !productDraft.category.trim()) return;

    void (async () => {
      try {
        const response = await createProduct({
          name: productDraft.name,
          category: productDraft.category,
          price: productDraft.price,
          stock: productDraft.stock,
        });

        setProducts(response.products);
        setProductDraft({
          id: "PRD-NEW",
          dbId: 0,
          name: "",
          category: "",
          price: 0,
          stock: 0,
          status: "Active",
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to create product.");
      }
    })();
  };

  const handleDeleteProduct = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    void (async () => {
      try {
        const response = await deleteProduct(product.dbId);
        setProducts(response.products);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to delete product.");
      }
    })();
  };

  const handleOrderStatusChange = (id: string, status: OrderStatus) => {
    const order = orders.find((item) => item.id === id);
    if (!order) return;

    void (async () => {
      try {
        const response = await patchOrderStatus(order.dbId, status);
        setOrders(response.orders);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to update order status.");
      }
    })();
  };

  const handleSaveSettings = () => {
    void (async () => {
      setIsSavingSettings(true);

      try {
        const response = await updateAdminSettings(settings);
        setSettings(response.settings);

        const reportResponse = await fetchSalesReport(period);
        setReportRows(reportResponse.report);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to save settings.");
      } finally {
        setIsSavingSettings(false);
      }
    })();
  };

  const content = (() => {
    switch (section) {
      case "products":
        return (
          <ProductsSection
            products={products}
            draft={productDraft}
            setDraft={setProductDraft}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case "orders":
        return (
          <OrdersSection
            orders={orders}
            onChangeStatus={handleOrderStatusChange}
          />
        );
      case "settings":
        return (
          <SettingsSection
            settings={settings}
            setSettings={setSettings}
            onSave={handleSaveSettings}
            isSaving={isSavingSettings}
          />
        );
      case "dashboard":
      default:
        return (
          <DashboardSection
            orders={orders}
            products={products}
            period={period}
            setPeriod={setPeriod}
            revenueOverTime={revenueOverTime}
            reportRows={reportRows}
          />
        );
    }
  })();

  if (!user) {
    return (
      <div className="admin-empty-state">
        <div className="admin-empty-card">
          <h1>Admin sign-in required</h1>
          <p>Sign in with your admin account to manage products, orders, reports, and platform settings.</p>
          <div className="admin-empty-card__actions">
            <button type="button" className="admin-primary-btn" onClick={onAuthOpen}>
              Sign in
            </button>
            <Link to="/" className="admin-secondary-btn">
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="admin-empty-state">
        <div className="admin-empty-card">
          <h1>Admin access only</h1>
          <p>
            Your current account is signed in, but it is not marked as an admin. Add the email to
            <code> VITE_ADMIN_EMAILS </code>
            or use an email that starts with <code>admin</code>.
          </p>
          <div className="admin-empty-card__actions">
            <button type="button" className="admin-primary-btn" onClick={() => { void navigate("/"); }}>
              Return home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h1 className="admin-brand__title">ApplianSys Admin</h1>
          <span className="admin-brand__text">Control the storefront, orders, products, and platform behavior.</span>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-sidebar__link${section === item.key ? " admin-sidebar__link--active" : ""}`}
              onClick={() => setSearchParams({ section: item.key })}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <span className="admin-sidebar__user-label">Signed in as</span>
            <span className="admin-sidebar__user-value">{user.email}</span>
          </div>

          <Link to="/" className="admin-sidebar__back">
            Back to Storefront
          </Link>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-toolbar">
          <div>
            <h1 className="admin-toolbar__title">{currentSectionLabel}</h1>
            <p className="admin-toolbar__sub">Admin tools for shaping the live ApplianSys platform.</p>
          </div>

          <div className="admin-toolbar__actions">
            <span className="admin-chip">{settings.maintenanceMode ? "Maintenance mode on" : "Platform live"}</span>
            {section === "dashboard" ? (
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => downloadExcelReport(period, orders, reportRows)}
              >
                Export Excel Report
              </button>
            ) : null}
          </div>
        </header>

        {errorMessage ? (
          <div className="admin-note" style={{ marginBottom: 18 }}>
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="admin-note" style={{ marginBottom: 18 }}>
            Loading admin data...
          </div>
        ) : null}

        {content}
      </main>
    </div>
  );
}

export default AdminPage;
