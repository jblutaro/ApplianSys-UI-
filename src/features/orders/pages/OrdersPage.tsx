import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isAdminUser } from "@/features/admin";
import type { AppUser } from "@/shared/lib/auth";
import { cancelOrder, fetchOrders, type CustomerOrder } from "@/shared/lib/ordersApi";
import "@/shared/styles/Orders.css";

type FulfillmentFilter = "all" | "delivery" | "pickup";
type OrdersView = "active" | "archive";
type StatusFilter = "all" | "pending" | "shipping" | "shipped" | "delivered" | "preparing" | "ready_for_pickup" | "released" | "cancelled" | "failed";

const ORDER_VIEWS: { key: OrdersView; label: string }[] = [
  { key: "active", label: "Orders" },
  { key: "archive", label: "Order Archives" },
];

const FULFILLMENT_FILTERS: { key: FulfillmentFilter; label: string }[] = [
  { key: "all", label: "All orders" },
  { key: "delivery", label: "Delivery Orders" },
  { key: "pickup", label: "Pick-up Orders" },
];

const DELIVERY_STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All delivery" },
  { key: "pending", label: "Pending" },
  { key: "shipping", label: "Shipping" },
];

const PICKUP_STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All pick-up" },
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready_for_pickup", label: "Ready" },
];

const ARCHIVE_STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All archived" },
  { key: "delivered", label: "Delivered" },
  { key: "released", label: "Released" },
  { key: "cancelled", label: "Cancelled" },
  { key: "failed", label: "Failed" },
];

const ARCHIVED_STATUSES = new Set(["delivered", "released", "cancelled", "failed"]);

// Status badge color
const STATUS_COLOR: Record<string, string> = {
  cancelled: "#6b7280",
  Cancelled: "#6b7280",
  delivered: "#27ae60",
  Pending: "#e67e22",
  pending: "#e67e22",
  Processing: "#8c6500",
  processing: "#8c6500",
  Shipped: "#2980b9",
  shipped: "#2980b9",
  Delivered: "#27ae60",
  released: "#0d8a5c",
  failed: "#b42318",
};

function normalizeStatus(value: string) {
  return value.toLowerCase().replace(/[\s-]+/g, "_");
}

function formatStatusLabel(value: string) {
  if (value === "ready_for_pickup") return "Ready for Pickup";

  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatToken(value: string) {
  if (!value.trim()) return "Not available";
  if (value === "ready_for_pickup") return "Ready for Pickup";

  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function formatPaymentStatus(value: string) {
  const normalized = normalizeStatus(value);
  if (normalized === "paid") return "Paid";
  if (normalized === "unpaid") return "Unsettled";
  return formatToken(value);
}

function getDisplayStatus(order: CustomerOrder) {
  const status = formatStatusLabel(order.status);
  if (order.deliveryMethod === "pickup" && !ARCHIVED_STATUSES.has(normalizeStatus(order.status))) {
    return `${status} - ${formatPaymentStatus(order.paymentStatus)}`;
  }

  return status;
}

function isArchivedOrder(order: CustomerOrder) {
  return ARCHIVED_STATUSES.has(normalizeStatus(order.status));
}

type OrdersPageProps = {
  onAuthOpen: () => void;
  user: AppUser | null;
};

function OrdersPage({ onAuthOpen, user }: OrdersPageProps) {
  const [activeView, setActiveView] = useState<OrdersView>("active");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user || isAdminUser(user)) return;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        setOrders(await fetchOrders());
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load orders.");
      } finally {
        setIsLoading(false);
      }
    });
  }, [user]);

  if (!user) {
    return (
      <div className="orders-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <path d="M9 12h6M9 16h4"/>
        </svg>
        <h2 className="orders-page__title">Sign in to view your orders</h2>
        <p className="orders-empty__text">You need to be logged in to access customer orders.</p>
        <button type="button" className="orders-empty__btn" onClick={onAuthOpen}>
          Sign in / Log in
        </button>
      </div>
    );
  }

  if (isAdminUser(user)) {
    return (
      <div className="orders-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4 6 4v14"/>
          <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>
        </svg>
        <h2 className="orders-page__title">Management accounts do not have customer orders</h2>
        <p className="orders-empty__text">
          Admin and staff accounts are limited to management work. Review storefront orders inside the panel instead.
        </p>
        <Link to="/admin?section=orders" className="orders-empty__btn orders-empty__btn-link">
          Open Order Management
        </Link>
      </div>
    );
  }

  const visibleOrders = orders.filter((order) => (
    activeView === "archive" ? isArchivedOrder(order) : !isArchivedOrder(order)
  ));

  const filtered = visibleOrders.filter((o) => {
    const normalizedStatus = normalizeStatus(o.status);
    const matchesFulfillment =
      fulfillmentFilter === "all" || o.deliveryMethod === fulfillmentFilter;
    const matchesStatus =
      statusFilter === "all" ||
      normalizedStatus === statusFilter ||
      (statusFilter === "shipping" && normalizedStatus === "shipped");
    const matchSearch =
      search.trim() === "" ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return matchesFulfillment && matchesStatus && matchSearch;
  });

  const handleCancelOrder = (order: CustomerOrder) => {
    void (async () => {
      setCancellingOrderId(order.dbId);
      setErrorMessage("");

      try {
        setOrders(await cancelOrder(order.dbId));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to cancel order.");
      } finally {
        setCancellingOrderId(null);
      }
    })();
  };

  return (
    <div className="orders-page">
      <h1 className="orders-page__title">My Orders</h1>

      <div className="orders-toolbar">
        <div className="orders-filter-groups">
          <div className="orders-tabs" aria-label="Order sections">
            {ORDER_VIEWS.map((view) => (
              <button
                key={view.key}
                type="button"
                className={`orders-tab${activeView === view.key ? " orders-tab--active" : ""}`}
                onClick={() => {
                  setActiveView(view.key);
                  setFulfillmentFilter("all");
                  setStatusFilter("all");
                }}
              >
                {view.label}
              </button>
            ))}
          </div>

          <div className="orders-tabs" aria-label="Order type filters">
            {FULFILLMENT_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`orders-tab${fulfillmentFilter === filter.key ? " orders-tab--active" : ""}`}
                onClick={() => {
                  setFulfillmentFilter(filter.key);
                  setStatusFilter("all");
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {activeView === "archive" ? (
            <div className="orders-tabs" aria-label="Archive status filters">
              {ARCHIVE_STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`orders-tab${statusFilter === filter.key ? " orders-tab--active" : ""}`}
                  onClick={() => setStatusFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          ) : fulfillmentFilter !== "all" ? (
            <div className="orders-tabs" aria-label="Order status filters">
              {(fulfillmentFilter === "delivery" ? DELIVERY_STATUS_FILTERS : PICKUP_STATUS_FILTERS).map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`orders-tab${statusFilter === filter.key ? " orders-tab--active" : ""}`}
                  onClick={() => setStatusFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="orders-search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="orders-search"
            placeholder="Search by Order Name or Order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="orders-empty">
          <p className="orders-empty__text">Loading orders...</p>
        </div>
      ) : errorMessage ? (
        <div className="orders-empty">
          <p className="orders-empty__text">{errorMessage}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="orders-empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 12h6M9 16h4"/>
          </svg>
          <p className="orders-empty__text">
            {activeView === "archive" ? "No archived orders yet." : "No active orders."}
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => (
            (() => {
              const normalizedStatus = normalizeStatus(order.status);
              const canCancel = !["cancelled", "delivered", "released"].includes(normalizedStatus);
              const statusColor = STATUS_COLOR[order.status] ?? STATUS_COLOR[normalizedStatus];

              return (
              <div key={order.id} className="order-card">
                <div className="order-card__header">
                  <span className="order-card__id">Order #{order.id}</span>
                  <span className="order-card__date">Placed on: {order.date}</span>
                  <span className="order-card__status" style={{ color: statusColor }}>
                    Status: <strong>{getDisplayStatus(order)}</strong>
                  </span>
                  <span className="order-card__date">
                    {order.deliveryMethod === "pickup" ? "Store pickup" : "Home delivery"}
                  </span>
                </div>

                <div className="order-card__items">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.productId}`} className="order-item">
                      <div className="order-item__img-placeholder">
                        {item.imageUrl ? <img src={item.imageUrl} alt="" /> : null}
                      </div>
                      <div className="order-item__info">
                        <span className="order-item__name">{item.name}</span>
                        <span className="order-item__qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="order-item__price">
                        ₱{item.price.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="order-card__footer">
                  <span className="order-card__total">
                    Order Total:{" "}
                    <strong className="order-card__total-amount">
                      ₱{order.total.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                    </strong>
                  </span>
                  <div className="order-card__actions">
                    <button type="button" className="order-card__btn order-card__btn--outline">
                      View Details
                    </button>
                    <button type="button" className="order-card__btn order-card__btn--outline">
                      Check Order Status
                    </button>
                    {canCancel ? (
                      <button
                        type="button"
                        className="order-card__btn order-card__btn--danger"
                        disabled={cancellingOrderId === order.dbId}
                        onClick={() => handleCancelOrder(order)}
                      >
                        {cancellingOrderId === order.dbId ? "Cancelling..." : "Cancel Order"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="order-card__meta">
                  <span>Method: <strong>{order.deliveryMethod === "pickup" ? "Pickup" : "Delivery"}</strong></span>
                  <span>Payment: <strong>{formatToken(order.paymentMethod)} - {formatPaymentStatus(order.paymentStatus)}</strong></span>
                  {activeView === "archive" ? (
                    <>
                      <span>Final Status: <strong>{formatStatusLabel(order.status)}</strong></span>
                      <span>
                        Completed: <strong>{formatDateTime(order.completedAt || order.releasedAt)}</strong>
                      </span>
                      {order.deliveryMethod === "pickup" && normalizeStatus(order.status) === "released" ? (
                        <span>
                          Releasing Account: <strong>{order.releasingOfficer || "Not available"}</strong>
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
              );
            })()
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
