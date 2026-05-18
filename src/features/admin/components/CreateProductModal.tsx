import { useEffect, useRef, useState } from "react";
import type { CategoryOption, Product } from "../lib/adminApi";

const MAX_PRODUCT_PHOTO_BYTES = 2 * 1024 * 1024;

type CreateProductModalProps = {
  categories: CategoryOption[];
  draft: Product;
  isEditing: boolean;
  isOpen: boolean;
  onAddProduct: () => void;
  onCancelEdit: () => void;
  onClose: () => void;
  setDraft: (value: Product) => void;
};

export function CreateProductModal({
  categories,
  draft,
  isEditing,
  isOpen,
  onAddProduct,
  onCancelEdit,
  onClose,
  setDraft,
}: CreateProductModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [priceInput, setPriceInput] = useState<string>(draft.price === 0 ? "" : String(draft.price));
  const [stockInput, setStockInput] = useState<string>(draft.stock === 0 ? "" : String(draft.stock));

  // Sync inputs when draft swaps (edit / cancel)
  useEffect(() => {
    setPriceInput(draft.price === 0 ? "" : String(draft.price));
    setStockInput(draft.stock === 0 ? "" : String(draft.stock));
  }, [draft.id]);

  // Open / close the native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Close on backdrop click
  const handleDialogClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  const selectedCategory = categories.find((c) => c.name === draft.category);
  const selectedSubcategory = selectedCategory?.subcategories.find((s) => s.name === draft.subcategory);
  const subcategoryOptions = selectedCategory?.subcategories.map((s) => s.name) ?? [];
  const subSubcategoryOptions = selectedSubcategory?.subSubcategories.map((s) => s.name) ?? [];

  const handlePhotoChange = (file: File | undefined) => {
    if (!file) { setDraft({ ...draft, image: "" }); return; }
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_PRODUCT_PHOTO_BYTES) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft({ ...draft, image: typeof reader.result === "string" ? reader.result : "" });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onAddProduct();
    onClose();
  };

  const handleCancel = () => {
    onCancelEdit();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="admin-modal"
      onClose={onClose}
      onClick={handleDialogClick}
      aria-labelledby="create-product-modal-title"
    >
      <div className="admin-modal__panel">
        <header className="admin-modal__header">
          <div>
            <h2 id="create-product-modal-title" className="admin-modal__title">
              {isEditing ? "Edit Product" : "Create Product"}
            </h2>
            <p className="admin-modal__sub">
              {isEditing
                ? "Update the product details below."
                : "Add appliance details, inventory, pricing, and a product photo."}
            </p>
          </div>
          <button
            type="button"
            className="admin-modal__close"
            aria-label="Close modal"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="admin-modal__body">
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="modal-product-name">Product Name</label>
              <input
                id="modal-product-name"
                className="admin-input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Add a product name"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="modal-product-category">Category</label>
              <select
                id="modal-product-category"
                className="admin-select"
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value, subcategory: "", subSubcategory: "" })
                }
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="modal-product-subcategory">Subcategory</label>
              <select
                id="modal-product-subcategory"
                className="admin-select"
                value={draft.subcategory}
                onChange={(e) => setDraft({ ...draft, subcategory: e.target.value, subSubcategory: "" })}
                disabled={!selectedCategory}
              >
                <option value="">Select subcategory</option>
                {subcategoryOptions.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="modal-product-sub-subcategory">Sub-subcategory</label>
              <select
                id="modal-product-sub-subcategory"
                className="admin-select"
                value={draft.subSubcategory}
                onChange={(e) => setDraft({ ...draft, subSubcategory: e.target.value })}
                disabled={!selectedSubcategory}
              >
                <option value="">None</option>
                {subSubcategoryOptions.map((ss) => (
                  <option key={ss} value={ss}>{ss}</option>
                ))}
              </select>
            </div>
            <div className="admin-field--full">
              <label htmlFor="modal-product-description">Description</label>
              <textarea
                id="modal-product-description"
                className="admin-textarea"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Add product specifications, features, and notes"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="modal-product-price">Price</label>
              <input
                id="modal-product-price"
                className="admin-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  setDraft({ ...draft, price: e.target.value === "" ? 0 : Number(e.target.value) });
                }}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="modal-product-stock">Stock</label>
              <input
                id="modal-product-stock"
                className="admin-input"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={stockInput}
                onChange={(e) => {
                  setStockInput(e.target.value);
                  setDraft({ ...draft, stock: e.target.value === "" ? 0 : Number(e.target.value) });
                }}
              />
            </div>
            <div className="admin-field--full">
              <label htmlFor="modal-product-photo">Product Photo</label>
              <div className="admin-photo-field">
                <div className="admin-photo-preview">
                  {draft.image ? <img src={draft.image} alt="" /> : <span>No photo selected</span>}
                </div>
                <div className="admin-photo-controls">
                  <input
                    id="modal-product-photo"
                    className="admin-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e.target.files?.[0])}
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
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="admin-modal__footer">
          <button type="button" className="admin-secondary-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="admin-primary-btn" onClick={handleSave}>
            {isEditing ? "Save Product" : "Add Product"}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
