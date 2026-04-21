import { PRODUCT_CATEGORIES } from "../lib/adminConstants";
import type { Product } from "../lib/adminApi";
import { formatCurrency, getStatusClass } from "../lib/adminUtils";

type ProductsSectionProps = {
  draft: Product;
  onAddProduct: () => void;
  onDeleteProduct: (id: string) => void;
  products: Product[];
  setDraft: (value: Product) => void;
};

export function ProductsSection({
  draft,
  onAddProduct,
  onDeleteProduct,
  products,
  setDraft,
}: ProductsSectionProps) {
  return (
    <article className="admin-card">
      <div className="admin-card__header">
        <div>
          <h2 className="admin-card__title">Products</h2>
          <p className="admin-card__sub">Manage your appliance inventory, pricing, and stock.</p>
        </div>
      </div>

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
              onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            >
              <option value="">Select category</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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
        </div>

        <button type="button" className="admin-primary-btn" onClick={onAddProduct}>
          Add Product
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="admin-table__strong">{product.name}</td>
                <td>{product.category}</td>
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
                      className="admin-icon-btn"
                      aria-label={`Delete ${product.name}`}
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      x
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
