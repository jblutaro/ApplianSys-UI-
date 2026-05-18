import { useMemo, useState } from "react";
import type { CategoryOption, Product } from "../lib/adminApi";
import { formatCurrency, getStatusClass } from "../lib/adminUtils";

const MAX_PRODUCT_PHOTO_BYTES = 2 * 1024 * 1024;

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
  canManageCategories: boolean;
  categories: CategoryOption[];
  categoryDraft: {
    categoryName: string;
    subcategoryId: number;
    subcategoryName: string;
    subSubcategoryName: string;
  };
  draft: Product;
  isEditing: boolean;
  onAddCategory: () => void;
  onAddProduct: () => void;
  onAddSubSubcategory: () => void;
  onCancelEdit: () => void;
  onDeleteProduct: (id: string) => void;
  onDeleteSubcategory: (id: number) => void;
  onDeleteSubSubcategory: (id: number) => void;
  onEditProduct: (id: string) => void;
  products: Product[];
  setCategoryDraft: (value: {
    categoryName: string;
    subcategoryId: number;
    subcategoryName: string;
    subSubcategoryName: string;
  }) => void;
  setDraft: (value: Product) => void;
};

export function ProductsSection({
  canManageCategories,
  categories,
  categoryDraft,
  draft,
  isEditing,
  onAddCategory,
  onAddProduct,
  onAddSubSubcategory,
  onCancelEdit,
  onDeleteProduct,
  onDeleteSubcategory,
  onDeleteSubSubcategory,
  onEditProduct,
  products,
  setCategoryDraft,
  setDraft,
}: ProductsSectionProps) {
  const [productSearch, setProductSearch] = useState("");
  const [sortKey, setSortKey] = useState<ProductSortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const selectedCategory = categories.find((category) => category.name === draft.category);
  const selectedSubcategory = selectedCategory?.subcategories.find(
    (subcategory) => subcategory.name === draft.subcategory,
  );
  const selectedSubcategories = selectedCategory?.subcategories.map((subcategory) => subcategory.name);
  const subcategoryOptions = selectedSubcategories ?? [];
  const subSubcategoryOptions = selectedSubcategory?.subSubcategories.map((item) => item.name) ?? [];
  const allSubcategories = categories.flatMap((category) =>
    category.subcategories.map((subcategory) => ({
      ...subcategory,
      categoryName: category.name,
    })),
  );

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

    return [...filteredProducts].sort((firstProduct, secondProduct) => {
      const firstValue = firstProduct[sortKey] ?? "";
      const secondValue = secondProduct[sortKey] ?? "";
      const direction = sortDirection === "asc" ? 1 : -1;

      if (typeof firstValue === "number" && typeof secondValue === "number") {
        return (firstValue - secondValue) * direction;
      }

      return String(firstValue).localeCompare(String(secondValue), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * direction;
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

  const handlePhotoChange = (file: File | undefined) => {
    if (!file) {
      setDraft({ ...draft, image: "" });
      return;
    }

    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_PRODUCT_PHOTO_BYTES) return;

    const reader = new FileReader();
    reader.onload = () => {
      setDraft({ ...draft, image: typeof reader.result === "string" ? reader.result : "" });
    };
    reader.readAsDataURL(file);
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
                            ? sortDirection === "asc"
                              ? "ascending"
                              : "descending"
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

      <article className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Create Product</h2>
            <p className="admin-card__sub">Add or update appliance details, inventory, pricing, and product photos.</p>
          </div>
        </div>

      {canManageCategories ? (
        <div className="admin-category-manager">
          <div className="admin-card__header">
            <div>
              <h3 className="admin-card__title admin-card__title--small">Categories</h3>
              <p className="admin-card__sub">Create a category with its first subcategory.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="new-category-name">Category</label>
              <input
                id="new-category-name"
                className="admin-input"
                value={categoryDraft.categoryName}
                onChange={(event) =>
                  setCategoryDraft({ ...categoryDraft, categoryName: event.target.value })
                }
                placeholder="Example: Outdoor"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="new-subcategory-name">Subcategory</label>
              <input
                id="new-subcategory-name"
                className="admin-input"
                value={categoryDraft.subcategoryName}
                onChange={(event) =>
                  setCategoryDraft({ ...categoryDraft, subcategoryName: event.target.value })
                }
                placeholder="Example: Grills"
              />
            </div>
          </div>
          <button type="button" className="admin-secondary-btn" onClick={onAddCategory}>
            Add Category
          </button>
          <div className="admin-form-grid admin-form-grid--compact">
            <div className="admin-field">
              <label htmlFor="new-sub-subcategory-parent">Parent subcategory</label>
              <select
                id="new-sub-subcategory-parent"
                className="admin-select"
                value={categoryDraft.subcategoryId}
                onChange={(event) =>
                  setCategoryDraft({ ...categoryDraft, subcategoryId: Number(event.target.value) })
                }
              >
                <option value={0}>Select subcategory</option>
                {allSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.categoryName} / {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="new-sub-subcategory-name">Sub-subcategory</label>
              <input
                id="new-sub-subcategory-name"
                className="admin-input"
                value={categoryDraft.subSubcategoryName}
                onChange={(event) =>
                  setCategoryDraft({ ...categoryDraft, subSubcategoryName: event.target.value })
                }
                placeholder="Example: Stand Fan"
              />
            </div>
          </div>
          <button type="button" className="admin-secondary-btn" onClick={onAddSubSubcategory}>
            Add Sub-subcategory
          </button>
          <div className="admin-category-list">
            {categories.map((category) => (
              <div key={category.id} className="admin-category-list__item">
                <div className="admin-category-list__header">
                  <strong>{category.name}</strong>
                </div>
                {category.subcategories.length > 0 ? (
                  <div className="admin-subcategory-list">
                    {category.subcategories.map((subcategory) => (
                      <span key={subcategory.id} className="admin-subcategory-pill">
                        {subcategory.name}
                        <button
                          type="button"
                          aria-label={`Delete ${subcategory.name}`}
                          onClick={() => onDeleteSubcategory(subcategory.id)}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="admin-field-hint">No subcategories.</span>
                )}
                {category.subcategories.map((subcategory) =>
                  subcategory.subSubcategories.length > 0 ? (
                    <div key={`${subcategory.id}-nested`} className="admin-sub-subcategory-list">
                      <span>{subcategory.name}</span>
                      <div className="admin-subcategory-list">
                        {subcategory.subSubcategories.map((subSubcategory) => (
                          <span
                            key={subSubcategory.id}
                            className="admin-subcategory-pill admin-subcategory-pill--nested"
                          >
                            {subSubcategory.name}
                            <button
                              type="button"
                              aria-label={`Delete ${subSubcategory.name}`}
                              onClick={() => onDeleteSubSubcategory(subSubcategory.id)}
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="admin-products-toolbar">
        <div className="admin-form-grid" style={{ flex: 1 }}>
          <div className="admin-field">
            <label htmlFor="product-name">Product Name</label>
            <input
              id="product-name"
              className="admin-input"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Add a product name"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="product-category">Category</label>
            <select
              id="product-category"
              className="admin-select"
              value={draft.category}
              onChange={(event) =>
                setDraft({ ...draft, category: event.target.value, subcategory: "", subSubcategory: "" })
              }
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="product-subcategory">Subcategory</label>
            <select
              id="product-subcategory"
              className="admin-select"
              value={draft.subcategory}
              onChange={(event) => setDraft({ ...draft, subcategory: event.target.value, subSubcategory: "" })}
              disabled={!selectedCategory}
            >
              <option value="">Select subcategory</option>
              {subcategoryOptions.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="product-sub-subcategory">Sub-subcategory</label>
            <select
              id="product-sub-subcategory"
              className="admin-select"
              value={draft.subSubcategory}
              onChange={(event) => setDraft({ ...draft, subSubcategory: event.target.value })}
              disabled={!selectedSubcategory}
            >
              <option value="">None</option>
              {subSubcategoryOptions.map((subSubcategory) => (
                <option key={subSubcategory} value={subSubcategory}>
                  {subSubcategory}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field--full">
            <label htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              className="admin-textarea"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="Add product specifications, features, and notes"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="product-price">Price</label>
            <input
              id="product-price"
              className="admin-input"
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="product-stock">Stock</label>
            <input
              id="product-stock"
              className="admin-input"
              type="number"
              min="0"
              step="1"
              value={draft.stock}
              onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })}
            />
          </div>
          <div className="admin-field--full">
            <label htmlFor="product-photo">Product Photo</label>
            <div className="admin-photo-field">
              <div className="admin-photo-preview">
                {draft.image ? (
                  <img src={draft.image} alt="" />
                ) : (
                  <span>No photo selected</span>
                )}
              </div>
              <div className="admin-photo-controls">
                <input
                  id="product-photo"
                  className="admin-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handlePhotoChange(event.target.files?.[0])}
                />
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setDraft({ ...draft, image: "" })}
                  disabled={!draft.image}
                >
                  Remove Photo
                </button>
                <span className="admin-field-hint">One image only, up to 2 MB.</span>
                <button type="button" className="admin-primary-btn" onClick={onAddProduct}>
                  {isEditing ? "Save Product" : "Add Product"}
                </button>
                {isEditing ? (
                  <button type="button" className="admin-secondary-btn" onClick={onCancelEdit}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      </article>
    </div>
  );
}
