import { requestJson } from "@/shared/lib/http";

export type CartItem = {
  productId: number;
  productName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  stock: number;
  status: string;
};

type CartResponse = { ok: true; items: CartItem[] };

export async function fetchCart(): Promise<CartItem[]> {
  const data = await requestJson<CartResponse>("/api/cart");
  return data.items;
}

export async function addToCart(productId: number, quantity: number): Promise<CartItem[]> {
  const data = await requestJson<CartResponse>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
  return data.items;
}

export async function updateCartQuantity(productId: number, quantity: number): Promise<CartItem[]> {
  const data = await requestJson<CartResponse>(`/api/cart/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  return data.items;
}

export async function removeFromCart(productId: number): Promise<CartItem[]> {
  const data = await requestJson<CartResponse>(`/api/cart/items/${productId}`, {
    method: "DELETE",
  });
  return data.items;
}
