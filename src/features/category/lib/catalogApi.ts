import { requestJson } from "@/shared/lib/http";

export type CatalogProduct = {
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

export type CatalogCategory = {
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

export async function fetchCatalogProducts() {
  return requestJson<{ ok: true; products: CatalogProduct[] }>("/api/products");
}

export async function fetchCatalogCategories() {
  return requestJson<{ ok: true; categories: CatalogCategory[] }>("/api/categories");
}
