import { useMemo, useState } from "react";
import type { PickupReleaseOrder } from "../lib/adminApi";
import { formatCurrency, getStatusClass } from "../lib/adminUtils";

type PickupReleaseSectionProps = {
  isReleasing: boolean;
  orders: PickupReleaseOrder[];
  onReleaseOrder: (
    orderId: number,
    confirmPaymentReceived: boolean,
  ) => void;
};

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatToken(value: string) {
  if (value === "ready_for_pickup") return "Ready for Pickup";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPickupDisplayStatus(order: PickupReleaseOrder) {
  const payment = order.paymentStatus.toLowerCase() === "paid" ? "Paid" : "Unsettled";
  return `${formatToken(order.orderStatus || order.pickupStatus)} - ${payment}`;
}

function requiresPaymentConfirmation(order: PickupReleaseOrder | null) {
  if (!order) return false;
  return order.paymentStatus.toLowerCase() !== "paid";
}

function isTerminalPickupStatus(status: string) {
  return status === "released" || status === "cancelled";
}

function canOpenRelease(order: PickupReleaseOrder) {
  const status = order.orderStatus || order.pickupStatus;
  return !isTerminalPickupStatus(status);
}

export function PickupReleaseSection({
  isReleasing,
  orders,
  onReleaseOrder,
}: PickupReleaseSectionProps) {
  const [query, setQuery] = useState("");
  const [pickupStatus, setPickupStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<PickupReleaseOrder | null>(null);
  const [confirmPaymentReceived, setConfirmPaymentReceived] = useState(false);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const status = (order.orderStatus || order.pickupStatus).toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        order.orderRef.toLowerCase().includes(normalizedQuery) ||
        order.customerName.toLowerCase().includes(normalizedQuery);
      const matchesPickupStatus = pickupStatus === "all" || status === pickupStatus;
      const matchesPaymentStatus =
        paymentStatus === "all" || order.paymentStatus.toLowerCase() === paymentStatus;

      return matchesQuery && matchesPickupStatus && matchesPaymentStatus;
    });
  }, [orders, paymentStatus, pickupStatus, query]);

  const canReleaseSelected =
    Boolean(selectedOrder) &&
    (!requiresPaymentConfirmation(selectedOrder) || confirmPaymentReceived) &&
    !isReleasing;

  const openReleaseModal = (order: PickupReleaseOrder) => {
    setSelectedOrder(order);
    setConfirmPaymentReceived(false);
  };

  const closeReleaseModal = () => {
    if (isReleasing) return;
    setSelectedOrder(null);
    setConfirmPaymentReceived(false);
  };

  const handleRelease = () => {
    if (!selectedOrder || !canReleaseSelected) return;
    onReleaseOrder(selectedOrder.orderId, confirmPaymentReceived);
    setSelectedOrder(null);
    setConfirmPaymentReceived(false);
  };

  return (
    <article className="admin-card">
      <div className="admin-card__header admin-card__header--stacked">
        <div>
          <h2 className="admin-card__title">Pickup Orders</h2>
          <p className="admin-card__sub">
            Manage pickup fulfillment, payment settlement, and release records.
          </p>
        </div>

        <div className="admin-release-filters">
          <label className="admin-table-search">
            <span>Search</span>
            <input
              className="admin-input"
              placeholder="Order reference or customer"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="admin-field">
            <span>Pickup Status</span>
            <select
              className="admin-select"
              value={pickupStatus}
              onChange={(event) => setPickupStatus(event.target.value)}
            >
              <option value="all">All</option>
              <option value="preparing">Preparing</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="released">Released</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Payment Status</span>
            <select
              className="admin-select"
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </label>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment Method</th>
              <th>Payment Status</th>
              <th>Pickup Status</th>
              <th>Created</th>
              <th>Releasing Officer</th>
              <th>Released At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td className="admin-table__empty" colSpan={11}>
                  No pickup orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const status = order.orderStatus || order.pickupStatus;

                return (
                  <tr key={order.orderId}>
                    <td className="admin-table__strong">{order.orderRef}</td>
                    <td>
                      <div className="admin-order-customer">
                        <span>{order.customerName}</span>
                        <small>{order.customerContact || "No contact saved"}</small>
                      </div>
                    </td>
                    <td className="admin-table__muted">{order.items.join(", ")}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>{formatToken(order.paymentMethod)}</td>
                    <td>
                      <span className={`admin-status admin-status--${getStatusClass(order.paymentStatus)}`}>
                        {formatToken(order.paymentStatus)}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status admin-status--${getStatusClass(status)}`}>
                        {formatPickupDisplayStatus(order)}
                      </span>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>{order.releasingOfficer || "Not released yet"}</td>
                    <td>{formatDateTime(order.releasedAt)}</td>
                    <td>
                      {canOpenRelease(order) ? (
                        <div className="admin-inline-actions admin-inline-actions--compact">
                          <button
                            type="button"
                            className="admin-primary-btn admin-table-action-btn"
                            disabled={isReleasing}
                            onClick={() => openReleaseModal(order)}
                          >
                            Release
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder ? (
        <div className="admin-release-modal" role="dialog" aria-modal="true" aria-label="Release pickup order">
          <div className="admin-release-modal__panel">
            <div className="admin-card__header">
              <div>
                <h3 className="admin-card__title admin-card__title--small">Release {selectedOrder.orderRef}</h3>
                <p className="admin-card__sub">Verify the customer and payment details before release.</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={closeReleaseModal} aria-label="Close">
                x
              </button>
            </div>

            <div className="admin-release-details">
              <div>
                <span>Customer</span>
                <strong>{selectedOrder.customerName}</strong>
              </div>
              <div>
                <span>Contact</span>
                <strong>{selectedOrder.customerContact || "No contact saved"}</strong>
              </div>
              <div>
                <span>Items</span>
                <strong>{selectedOrder.items.join(", ")}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{formatToken(selectedOrder.paymentMethod)}</strong>
              </div>
              <div>
                <span>Payment Status</span>
                <strong>{formatToken(selectedOrder.paymentStatus)}</strong>
              </div>
            </div>

            {requiresPaymentConfirmation(selectedOrder) ? (
              <label className="admin-release-confirm">
                <input
                  type="checkbox"
                  checked={confirmPaymentReceived}
                  onChange={(event) => setConfirmPaymentReceived(event.target.checked)}
                />
                <span>Confirm payment received at the shop</span>
              </label>
            ) : null}

            <div className="admin-modal__footer">
              <button type="button" className="admin-secondary-btn" onClick={closeReleaseModal}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                disabled={!canReleaseSelected}
                onClick={handleRelease}
              >
                Release
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
