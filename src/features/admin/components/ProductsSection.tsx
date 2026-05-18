import { useMemo, useState } from "react";
import type { CategoryOption, Product } from "../lib/adminApi";
import { formatCurrency, getStatusClass } from "../lib/adminUtils";

type ProductSortKey =
  | "image"
  | "id"
  | "name"
  | "category"
  | "subcategory"
  | "subSubcategory"
  | "description"
  | "price"
  | "stock"
  | "status";

type SortDirection = "asc" | "desc";

type ProductTableHeader =
  | { key: ProductSortKey; label: string; sortable: true }
  | { key: "image" | "actions"; label: string; sortable?: false };

const productTableHeaders: ProductTableHeader[] = [
  { key: "image", label: "Photo" },
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Product Name", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "subcategory", label: "Subcategory", sortable: true },
  { key: "subSubcategory", label: "Sub-subcategory", sortable: true },
  { key: "description", label: "Description", sortable: true },
  { key: "price", label: "Price", sortable: true },
  { key: "stock", label: "Stock", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "actions", label: "Actions" },
];

type ProductsSectionProps = {
  categories: CategoryOption[];
  onDeleteProduct: (id: string) => void;
  onEditProduct: (id: string) => void;
  products: Product[];
};

export function ProductsSection({
  onDeleteProduct,
  onEditProduct,
  products,
}: ProductsSectionProps) {
  const [productSearch, setProductSearch] = useState("");
  const [sortKey, setSortKey] = useState<ProductSortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const visibleProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLowerCase();
    const filteredProducts = normalizedSearch
      ? products.filter((product) =>
          [
            product.id,
            product.name,
            product.category,
            product.subcategory,
            product.subSubcategory || "None",
            product.description || "No description",
            formatCurrency(product.price),
            String(product.stock),
            product.status,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch),
        )
      : products;

    return [...filteredProducts].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const dir = sortDirection === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [productSearch, products, sortDirection, sortKey]);

  const toggleSort = (key: ProductSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <div className="admin-products-layout">
      <article className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Products list</h2>
            <p className="admin-card__sub">Review current inventory and edit existing product records.</p>
          </div>
          <div className="admin-table-search">
            <label htmlFor="product-table-search">Search products</label>
            <input
              id="product-table-search"
              className="admin-input"
              type="search"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Search products"
            />
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--centered">
            <thead>
              <tr>
                {productTableHeaders.map((header) => (
                  <th key={header.key}>
                    {header.sortable ? (
                      <button
                        type="button"
                        className="admin-table-header-btn"
                        onClick={() => toggleSort(header.key)}
                        aria-sort={
                          sortKey === header.key
                            ? sortDirection === "asc" ? "ascending" : "descending"
                            : "none"
                        }
                      >
                        <span>{header.label}</span>
                        <span className="admin-table-header-btn__icon">
                          {sortKey === header.key ? (sortDirection === "asc" ? "^" : "v") : "-"}
                        </span>
                      </button>
                    ) : (
                      header.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-table-photo">
                      {product.image ? <img src={product.image} alt="" /> : <span>No photo</span>}
                    </div>
                  </td>
                  <td className="admin-table__strong">{product.id}</td>
                  <td className="admin-table__strong">{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.subcategory}</td>
                  <td>{product.subSubcategory || "None"}</td>
                  <td className="admin-table__muted">{product.description || "No description"}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`admin-status admin-status--${getStatusClass(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="admin-secondary-btn admin-table-action-btn"
                        onClick={() => onEditProduct(product.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--danger"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        X
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleProducts.length === 0 ? (
                <tr>
                  <td className="admin-table__empty" colSpan={productTableHeaders.length}>
                    No products found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
