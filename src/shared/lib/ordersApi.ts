import { requestJson } from "@/shared/lib/http";

export type CustomerOrder = {
  id: string;
  dbId: number;
  completedAt: string | null;
  date: string;
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: string;
  paymentStatus: string;
  releasedAt: string | null;
  releasingOfficer: string;
  status: string;
  total: number;
  items: {
    productId: number;
    name: string;
    imageUrl: string;
    quantity: number;
    price: number;
  }[];
};

export async function fetchOrders(): Promise<CustomerOrder[]> {
  const data = await requestJson<{ ok: true; orders: CustomerOrder[] }>("/api/orders");
  return data.orders;
}

export async function cancelOrder(orderId: number): Promise<CustomerOrder[]> {
  const data = await requestJson<{ ok: true; orders: CustomerOrder[] }>(`/api/orders/${orderId}/cancel`, {
    method: "POST",
  });
  return data.orders;
}
