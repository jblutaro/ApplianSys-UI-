import type { Order, OrderStatus } from "../lib/adminApi";
import { formatCurrency, getStatusClass } from "../lib/adminUtils";

type OrdersSectionProps = {
  onChangeStatus: (id: string, status: OrderStatus) => void;
  orders: Order[];
};

export function OrdersSection({ onChangeStatus, orders }: OrdersSectionProps) {
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
