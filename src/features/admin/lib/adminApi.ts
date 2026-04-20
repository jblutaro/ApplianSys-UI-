export type ProductStatus = "Active" | "Low Stock" | "Out of Stock";
export type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Pending";
export type ReportPeriod = "weekly" | "monthly" | "yearly";

export type Product = {
  id: string;
  dbId: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
};

export type Order = {
  id: string;
  dbId: number;
  customer: string;
  email: string;
  date: string;
  total: number;
  status: OrderStatus;
};

export type AdminSettings = {
  siteName: string;
  supportEmail: string;
  description: string;
  currency: string;
  taxRate: number;
  maintenanceMode: boolean;
  orderNotifications: boolean;
  emailCampaigns: boolean;
};

export type RevenuePoint = {
  month: string;
  revenue: number;
};

export type SalesReportRow = {
  label: string;
  orders: number;
  taxCollected: number;
  grossRevenue: number;
};

export type DashboardPayload = {
  products: Product[];
  orders: Order[];
  settings: AdminSettings;
  revenueOverTime: RevenuePoint[];
  report: SalesReportRow[];
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function fetchAdminDashboard(period: ReportPeriod) {
  return request<{ ok: true; dashboard: DashboardPayload }>(`/api/admin/dashboard?period=${period}`);
}

export async function fetchSalesReport(period: ReportPeriod) {
  return request<{ ok: true; period: ReportPeriod; report: SalesReportRow[]; orders: Order[] }>(
    `/api/admin/reports/sales?period=${period}`,
  );
}

export async function createProduct(payload: {
  name: string;
  category: string;
  price: number;
  stock: number;
}) {
  return request<{ ok: true; products: Product[] }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(productId: number) {
  return request<{ ok: true; products: Product[] }>(`/api/admin/products/${productId}`, {
    method: "DELETE",
  });
}

export async function patchOrderStatus(orderId: number, status: OrderStatus) {
  return request<{ ok: true; orders: Order[] }>(`/api/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateAdminSettings(settings: AdminSettings) {
  return request<{ ok: true; settings: AdminSettings }>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}
