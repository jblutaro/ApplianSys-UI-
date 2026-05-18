import { requestJson } from "@/shared/lib/http";

export type FulfillmentDelivery = {
  method: "delivery";
  street: string;
  barangay: string;
  city: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
};

export type FulfillmentPickup = {
  method: "pickup";
};

export type CheckoutPayload = {
  fulfillment: FulfillmentDelivery | FulfillmentPickup;
  paymentMethod: string;
};

export type PlacedOrder = {
  orderId: number;
  orderRef: string;
  deliveryDistanceKm: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryMethod: "delivery" | "pickup";
  status: string;
  items: {
    productId: number;
    productName: string;
    imageUrl: string;
    quantity: number;
    price: number;
  }[];
};

export type CheckoutSettings = {
  deliveryRatePerKm: number;
  shopLocation: {
    lat: number;
    lng: number;
  };
};

export async function submitCheckout(payload: CheckoutPayload): Promise<PlacedOrder> {
  const data = await requestJson<{ ok: true; order: PlacedOrder }>("/api/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.order;
}

export async function fetchCheckoutSettings(): Promise<CheckoutSettings> {
  const data = await requestJson<{ ok: true; checkout: CheckoutSettings }>("/api/checkout/settings");
  return data.checkout;
}

export async function sendMockGcashReceiptEmail(payload: {
  orderId: number;
  paidAt: string;
  receiptNumber: string;
}) {
  return requestJson<{
    ok: true;
    delivered: boolean;
    message: string;
    mode: string;
  }>("/api/checkout/mock-gcash/email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
