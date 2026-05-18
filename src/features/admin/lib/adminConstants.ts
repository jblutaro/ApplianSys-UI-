import type { AdminSettings, Product } from "./adminApi";

export type AdminSection = "dashboard" | "products" | "orders" | "platform" | "settings";

export const NAV_ITEMS: { key: AdminSection; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "platform", label: "Platform" },
  { key: "settings", label: "Settings" },
];

export const PRODUCT_CATEGORY_OPTIONS = [
  {
    label: "Kitchen",
    subcategories: [
      "Rice Cookers",
      "Microwaves",
      "Microwave Ovens",
      "Air Fryers",
      "Coffee Makers",
      "Blenders",
      "Refrigerators",
      "Induction Cookers",
    ],
  },
  {
    label: "Cleaning",
    subcategories: [
      "Vacuum Cleaners",
      "Washing Machines",
      "Dishwashers",
      "Air Purifiers",
      "Shavers",
      "Hair Dryers",
      "Hair Straighteners",
    ],
  },
  {
    label: "Cooling",
    subcategories: ["Electric Fans", "Air Conditioners", "Air Coolers"],
  },
  {
    label: "Entertainment",
    subcategories: ["Audio", "Visuals", "Gaming", "Televisions", "Speakers"],
  },
  {
    label: "Personal Care",
    subcategories: ["Shavers", "Hair Dryers", "Hair Straighteners"],
  },
  {
    label: "Household",
    subcategories: ["Air Purifiers", "Fans", "Small Appliances"],
  },
  {
    label: "Office",
    subcategories: ["Printers", "Coffee Makers", "Office Fans"],
  },
  {
    label: "Home",
    subcategories: ["Air Purifiers", "Fans", "Home Comfort"],
  },
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
  subcategory: "",
  subSubcategory: "",
  description: "",
  image: "",
  price: 0,
  stock: 0,
  status: "Active",
};
