import type { AdminSettings, Product } from "./adminApi";

export type AdminSection = "dashboard" | "products" | "orders" | "platform" | "settings";

export const NAV_ITEMS: { key: AdminSection; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "platform", label: "Platform" },
  { key: "settings", label: "Settings" },
];

export const PRODUCT_CATEGORIES = [
  "Kitchen",
  "Cleaning",
  "Cooling",
  "Entertainment",
  "Home",
  "Office",
  "Personal Care",
  "Household",
] as const;

export const EMPTY_SETTINGS: AdminSettings = {
  siteName: "ApplianSys",
  supportEmail: "support@appliansys.com",
  description: "Premium appliances for every household.",
  currency: "PHP (PHP)",
  taxRate: 8.5,
  maintenanceMode: false,
  orderNotifications: true,
  emailCampaigns: true,
};

export const EMPTY_PRODUCT_DRAFT: Product = {
  id: "PRD-NEW",
  dbId: 0,
  name: "",
  category: "",
  price: 0,
  stock: 0,
  status: "Active",
};
