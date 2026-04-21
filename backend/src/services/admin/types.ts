export type ReportPeriod = "weekly" | "monthly" | "yearly";

export type AdminProduct = {
  id: string;
  dbId: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
};

export type AdminOrder = {
  id: string;
  dbId: number;
  customer: string;
  email: string;
  date: string;
  total: number;
  status: string;
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
