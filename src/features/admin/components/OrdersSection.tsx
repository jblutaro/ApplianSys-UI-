import { useMemo, useState } from "react";
import type { Order, OrderStatus, PickupReleaseOrder } from "../lib/adminApi";
import { formatCurrency, getStatusClass } from "../lib/adminUtils";
import { PickupReleaseSection } from "./PickupReleaseSection";

type OrdersSectionProps = {
  isReleasing: boolean;
  mode: "active" | "archive";
  onChangeStatus: (id: string, status: OrderStatus) => void;
  onReleaseOrder: (
    orderId: number,
    confirmPaymentReceived: boolean,
  ) => void;
  orders: Order[];
  pickupOrders: PickupReleaseOrder[];
};

const DELIVERY_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const ARCHIVED_STATUSES = new Set(["delivered", "released", "cancelled", "failed"]);

function formatDateTime(value: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function formatMethod(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatStatus(value: string) {
  if (value === "ready_for_pickup") return "Ready for Pickup";
  return formatMethod(value);
}

function isTerminalDeliveryStatus(status: string) {
  return status === "delivered" || status === "cancelled";
}

function isArchivedStatus(status: string) {
  return ARCHIVED_STATUSES.has(status.toLowerCase());
}

export function OrdersSection({
  isReleasing,
  mode,
  onChangeStatus,
  onReleaseOrder,
  orders,
  pickupOrders,
}: OrdersSectionProps) {
  const [activeTab, setActiveTab] = useState<"delivery" | "pickup">("delivery");
  const isArchive = mode === "archive";
  const deliveryOrders = useMemo(
    () => orders.filter((order) => (
      order.fulfillmentMethod === "delivery" &&
      (isArchive ? isArchivedStatus(order.orderStatus) : !isArchivedStatus(order.orderStatus))
    )),
    [isArchive, orders],
  );

  return (
    <div className="admin-orders-module">
      <div className="admin-tabbar" role="tablist" aria-label="Orders">
        <button
          type="button"
          className={`admin-tabbar__btn${activeTab === "delivery" ? " admin-tabbar__btn--active" : ""}`}
          onClick={() => setActiveTab("delivery")}
        >
          Delivery Orders
        </button>
        <button
          type="button"
          className={`admin-tabbar__btn${activeTab === "pickup" ? " admin-tabbar__btn--active" : ""}`}
          onClick={() => setActiveTab("pickup")}
        >
          Pickup Orders
        </button>
      </div>

      {activeTab === "delivery" ? (
        <article className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2 className="admin-card__title">Delivery Orders</h2>
              <p className="admin-card__sub">
                {isArchive
                  ? "Review completed, cancelled, and inactive delivery orders."
                  : "Manage active delivery fulfillment without mixing pickup workflows."}
              </p>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Delivery Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveryOrders.length === 0 ? (
                  <tr>
                    <td className="admin-table__empty" colSpan={9}>
                      {isArchive ? "No archived orders yet." : "No active orders."}
                    </td>
                  </tr>
                ) : (
                  deliveryOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="admin-table__strong">{order.id}</td>
                      <td>
                        <div className="admin-order-customer">
                          <span>{order.customer}</span>
                          <small>{order.email}</small>
                        </div>
                      </td>
                      <td className="admin-table__muted">{order.items.join(", ")}</td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>{formatMethod(order.paymentMethod)}</td>
                      <td>
                        <span className={`admin-status admin-status--${getStatusClass(order.paymentStatus)}`}>
                          {formatStatus(order.paymentStatus)}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status admin-status--${getStatusClass(order.orderStatus)}`}>
                          {formatStatus(order.orderStatus)}
                        </span>
                      </td>
                      <td>
                        {isArchive ? (
                          <span className="admin-table__muted">Archived</span>
                        ) : (
                          <select
                            className="admin-select"
                            value={order.orderStatus}
                            disabled={isTerminalDeliveryStatus(order.orderStatus)}
                            onChange={(event) => onChangeStatus(order.id, event.target.value as OrderStatus)}
                          >
                            {DELIVERY_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      ) : (
        <PickupReleaseSection
          orders={pickupOrders}
          isReleasing={isReleasing}
          onReleaseOrder={onReleaseOrder}
          mode={mode}
        />
      )}
    </div>
  );
}
