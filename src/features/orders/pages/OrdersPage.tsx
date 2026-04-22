import { useState } from "react";
import { Link } from "react-router-dom";
import { isAdminUser } from "@/features/admin";
import type { AppUser } from "@/shared/lib/auth";
import "@/shared/styles/Orders.css";

type Tab = "all" | "pending" | "shipped" | "delivered";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All orders" },
  { key: "pending", label: "Pending" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

// Status badge color
const STATUS_COLOR: Record<string, string> = {
  Pending: "#e67e22",
  Shipped: "#2980b9",
  Delivered: "#27ae60",
};

// Placeholder orders — empty for now, structure is ready
const ORDERS: {
  id: string;
  date: string;
  status: "Pending" | "Shipped" | "Delivered";
  items: { name: string; qty: number; price: number }[];
}[] = [];

type OrdersPageProps = {
  onAuthOpen: () => void;
  user: AppUser | null;
};

function OrdersPage({ onAuthOpen, user }: OrdersPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

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
        <h2 className="orders-page__title">Admins do not have customer orders</h2>
        <p className="orders-empty__text">
          Admin accounts are limited to management work. Review storefront orders inside the admin panel instead.
        </p>
        <Link to="/admin?section=orders" className="orders-empty__btn orders-empty__btn-link">
          Open Order Management
        </Link>
      </div>
    );
  }

  const filtered = ORDERS.filter((o) => {
    const matchTab =
      activeTab === "all" || o.status.toLowerCase() === activeTab;
    const matchSearch =
      search.trim() === "" ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  return (
    <div className="orders-page">
      <h1 className="orders-page__title">My Orders</h1>

      <div className="orders-toolbar">
        <div className="orders-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`orders-tab${activeTab === t.key ? " orders-tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
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

      {filtered.length === 0 ? (
        <div className="orders-empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 12h6M9 16h4"/>
          </svg>
          <p className="orders-empty__text">No orders found.</p>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => {
            const total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
            return (
              <div key={order.id} className="order-card">
                <div className="order-card__header">
                  <span className="order-card__id">Order #{order.id}</span>
                  <span className="order-card__date">Placed on: {order.date}</span>
                  <span className="order-card__status" style={{ color: STATUS_COLOR[order.status] }}>
                    Status: <strong>{order.status}</strong>
                  </span>
                </div>

                <div className="order-card__items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div className="order-item__img-placeholder" />
                      <div className="order-item__info">
                        <span className="order-item__name">{item.name}</span>
                        <span className="order-item__qty">Qty: {item.qty}</span>
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
                      ₱{total.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                    </strong>
                  </span>
                  <div className="order-card__actions">
                    <button type="button" className="order-card__btn order-card__btn--outline">
                      View Details
                    </button>
                    <button type="button" className="order-card__btn order-card__btn--outline">
                      Check Order Status
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
