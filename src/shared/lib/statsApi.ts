import { requestJsonPublic } from "@/shared/lib/http";

export type SiteStats = {
  products: number;
  customers: number;
  categories: number;
  categoryNames: string[];
  foundedYear: number;
  firstOrderYear: number;
  latestOrderYear: number;
};

export type BestSellingProduct = {
  id: string;
  dbId: number;
  name: string;
  image: string;
  price: number;
  totalSold: number;
};

export async function fetchSiteStats(): Promise<SiteStats> {
  const data = await requestJsonPublic<{ ok: true; stats: SiteStats }>("/api/stats");
  return data.stats;
}

export async function fetchBestSellingProducts(): Promise<BestSellingProduct[]> {
  const data = await requestJsonPublic<{ ok: true; products: BestSellingProduct[] }>("/api/best-selling");
  return data.products;
}

