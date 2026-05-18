export type ReportPeriod = "weekly" | "monthly" | "yearly";

export type AdminProduct = {
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
  status: string;
};

export type AdminCategoryOption = {
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

export type AdminOrder = {
  id: string;
  dbId: number;
  customer: string;
  deliveryMethod: string;
  email: string;
  date: string;
  total: number;
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
