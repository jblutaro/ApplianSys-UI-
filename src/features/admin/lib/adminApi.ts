export type ProductStatus = "Active" | "Low Stock" | "Out of Stock";
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "preparing"
  | "ready_for_pickup"
  | "released";
export type ReportPeriod = "weekly" | "monthly" | "yearly";

export type Product = {
  id: string;
  dbId: number;
  name: string;
  category: string;
  subcategory: string;
  subSubcategory: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  status: ProductStatus;
};

export type Order = {
  id: string;
  dbId: number;
  customer: string;
  customerContact: string;
  deliveryMethod: "delivery" | "pickup";
  fulfillmentMethod: "delivery" | "pickup";
  email: string;
  date: string;
  createdAt: string;
  items: string[];
  paymentMethod: string;
  paymentStatus: "paid" | "unpaid";
  releasingOfficer: string;
  releasedAt: string | null;
  total: number;
  status: OrderStatus;
  orderStatus: OrderStatus;
};

export type PickupReleaseOrder = {
  orderId: number;
  orderRef: string;
  customerName: string;
  customerContact: string;
  items: string[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  pickupStatus: string;
  createdAt: string;
  releasedAt: string | null;
  releasingOfficer: string;
};

export type AdminSettings = {
  siteName: string;
  supportEmail: string;
  description: string;
  currency: string;
  baseDeliveryFee: number;
  deliveryRatePerKm: number;
  taxRate: number;
  maintenanceMode: boolean;
  orderNotifications: boolean;
  emailCampaigns: boolean;
};

export type CategoryOption = {
  id: number;
  name: string;
  subcategories: {
    id: number;
    name: string;
    subSubcategories: {
      id: number;
      name: string;
    }[];
  }[];
};

export type AdminAccountProfile = {
  accountId: string;
  contactNumber: string;
  createdAt: string | null;
  displayName: string;
  email: string;
  firstName: string;
  lastLogin: string | null;
  lastName: string;
  middleName: string;
  role: "admin" | "staff" | "customer";
  status: string;
};

export type RevenuePoint = {
  month: string;
  revenue: number;
};

export type ItemSalesRow = {
  productId: number;
  productName: string;
  quantitySold: number;
  averageUnitPrice: number;
  grossSales: number;
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
  itemSales: ItemSalesRow[];
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { message?: string };
      throw new Error(payload.message || "Request failed");
    }

    const body = await response.text();
    throw new Error(body || "Request failed");
  }

  return response.json() as unknown as Promise<T>;
}

export async function fetchAdminDashboard(period: ReportPeriod) {
  return request<{ ok: true; dashboard: DashboardPayload }>(`/api/admin/dashboard?period=${period}`);
}

export async function fetchSalesReport(period: ReportPeriod) {
  return request<{
    ok: true;
    period: ReportPeriod;
    report: SalesReportRow[];
    itemSales: ItemSalesRow[];
    orders: Order[];
  }>(`/api/admin/reports/sales?period=${period}`);
}

export async function createProduct(payload: {
  name: string;
  category: string;
  subcategory: string;
  subSubcategory: string;
  description: string;
  image: string;
  price: number;
  stock: number;
}) {
  return request<{ ok: true; products: Product[] }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminCategories() {
  return request<{ ok: true; categories: CategoryOption[] }>("/api/admin/categories");
}

export async function createCategory(payload: {
  categoryName: string;
  subcategoryName: string;
}) {
  return request<{ ok: true; categories: CategoryOption[] }>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createSubSubcategory(
  subcategoryId: number,
  payload: {
    subSubcategoryName: string;
  },
) {
  return request<{ ok: true; categories: CategoryOption[] }>(
    `/api/admin/subcategories/${subcategoryId}/sub-subcategories`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteSubcategory(subcategoryId: number) {
  return request<{ ok: true; categories: CategoryOption[] }>(`/api/admin/subcategories/${subcategoryId}`, {
    method: "DELETE",
  });
}

export async function deleteSubSubcategory(subSubcategoryId: number) {
  return request<{ ok: true; categories: CategoryOption[] }>(
    `/api/admin/sub-subcategories/${subSubcategoryId}`,
    {
      method: "DELETE",
    },
  );
}

export async function updateProduct(
  productId: number,
  payload: {
    name: string;
    category: string;
    subcategory: string;
    subSubcategory: string;
    description: string;
    image: string;
    price: number;
    stock: number;
  },
) {
  return request<{ ok: true; products: Product[] }>(`/api/admin/products/${productId}`, {
    method: "PUT",
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

export async function fetchPickupReleaseOrders() {
  return request<{ ok: true; orders: PickupReleaseOrder[] }>("/api/admin/pickup-releases");
}

export async function releasePickupOrder(
  orderId: number,
  confirmPaymentReceived: boolean,
) {
  return request<{ ok: true; orders: PickupReleaseOrder[] }>(`/api/admin/pickup-releases/${orderId}/release`, {
    method: "POST",
    body: JSON.stringify({ confirmPaymentReceived }),
  });
}

export async function updateAdminSettings(settings: AdminSettings) {
  return request<{ ok: true; settings: AdminSettings }>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function fetchAdminAccount() {
  return request<{ ok: true; account: AdminAccountProfile }>("/api/auth/account");
}

export async function updateAdminAccount(payload: {
  contactNumber: string;
  firstName: string;
  lastName: string;
  middleName: string;
}) {
  return request<{ ok: true; account: AdminAccountProfile }>("/api/auth/account", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function changeAdminPassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  return request<{ ok: true }>("/api/auth/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
