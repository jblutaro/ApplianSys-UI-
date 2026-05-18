import { useEffect, useRef } from "react";
import type { CategoryOption } from "../lib/adminApi";

type CategoryManagerModalProps = {
  categories: CategoryOption[];
  categoryDraft: {
    categoryName: string;
    subcategoryId: number;
    subcategoryName: string;
    subSubcategoryName: string;
  };
  isOpen: boolean;
  onAddCategory: () => void;
  onAddSubSubcategory: () => void;
  onClose: () => void;
  onDeleteSubcategory: (id: number) => void;
  onDeleteSubSubcategory: (id: number) => void;
  setCategoryDraft: (value: {
    categoryName: string;
    subcategoryId: number;
    subcategoryName: string;
    subSubcategoryName: string;
  }) => void;
};

export function CategoryManagerModal({
  categories,
  categoryDraft,
  isOpen,
  onAddCategory,
  onAddSubSubcategory,
  onClose,
  onDeleteSubcategory,
  onDeleteSubSubcategory,
  setCategoryDraft,
}: CategoryManagerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleDialogClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  const allSubcategories = categories.flatMap((cat) =>
    cat.subcategories.map((sub) => ({ ...sub, categoryName: cat.name })),
  );

  return (
    <dialog
      ref={dialogRef}
      className="admin-modal"
      onClose={onClose}
      onClick={handleDialogClick}
      aria-labelledby="category-manager-modal-title"
    >
      <div className="admin-modal__panel">
        <header className="admin-modal__header">
          <div>
            <h2 id="category-manager-modal-title" className="admin-modal__title">
              Category Manager
            </h2>
            <p className="admin-modal__sub">
              Create categories, subcategories, and sub-subcategories.
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
          {/* ── New category + subcategory ── */}
          <h3 className="admin-card__title admin-card__title--small">New Category</h3>
          <p className="admin-card__sub" style={{ marginBottom: 12 }}>
            A category requires at least one subcategory.
          </p>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="catmgr-category-name">Category</label>
              <input
                id="catmgr-category-name"
                className="admin-input"
                value={categoryDraft.categoryName}
                onChange={(e) => setCategoryDraft({ ...categoryDraft, categoryName: e.target.value })}
                placeholder="Example: Outdoor"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="catmgr-subcategory-name">Subcategory</label>
              <input
                id="catmgr-subcategory-name"
                className="admin-input"
                value={categoryDraft.subcategoryName}
                onChange={(e) => setCategoryDraft({ ...categoryDraft, subcategoryName: e.target.value })}
                placeholder="Example: Grills"
              />
            </div>
          </div>
          <button type="button" className="admin-secondary-btn" onClick={onAddCategory}>
            Add Category
          </button>

          <hr className="admin-modal__divider" />

          {/* ── Sub-subcategory ── */}
          <h3 className="admin-card__title admin-card__title--small">New Sub-subcategory</h3>
          <p className="admin-card__sub" style={{ marginBottom: 12 }}>
            Attach a sub-subcategory to an existing subcategory.
          </p>
          <div className="admin-form-grid admin-form-grid--compact">
            <div className="admin-field">
              <label htmlFor="catmgr-sub-subcategory-parent">Parent subcategory</label>
              <select
                id="catmgr-sub-subcategory-parent"
                className="admin-select"
                value={categoryDraft.subcategoryId}
                onChange={(e) =>
                  setCategoryDraft({ ...categoryDraft, subcategoryId: Number(e.target.value) })
                }
              >
                <option value={0}>Select subcategory</option>
                {allSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.categoryName} / {sub.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="catmgr-sub-subcategory-name">Sub-subcategory</label>
              <input
                id="catmgr-sub-subcategory-name"
                className="admin-input"
                value={categoryDraft.subSubcategoryName}
                onChange={(e) =>
                  setCategoryDraft({ ...categoryDraft, subSubcategoryName: e.target.value })
                }
                placeholder="Example: Stand Fan"
              />
            </div>
          </div>
          <button type="button" className="admin-secondary-btn" onClick={onAddSubSubcategory}>
            Add Sub-subcategory
          </button>

          <hr className="admin-modal__divider" />

          {/* ── Existing categories list ── */}
          <h3 className="admin-card__title admin-card__title--small">Existing Categories</h3>
          <div className="admin-category-list" style={{ marginTop: 12 }}>
            {categories.length === 0 ? (
              <span className="admin-field-hint">No categories yet.</span>
            ) : null}
            {categories.map((category) => (
              <div key={category.id} className="admin-category-list__item">
                <div className="admin-category-list__header">
                  <strong>{category.name}</strong>
                </div>
                {category.subcategories.length > 0 ? (
                  <div className="admin-subcategory-list">
                    {category.subcategories.map((sub) => (
                      <span key={sub.id} className="admin-subcategory-pill">
                        {sub.name}
                        <button
                          type="button"
                          aria-label={`Delete ${sub.name}`}
                          onClick={() => onDeleteSubcategory(sub.id)}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="admin-field-hint">No subcategories.</span>
                )}
                {category.subcategories.map((sub) =>
                  sub.subSubcategories.length > 0 ? (
                    <div key={`${sub.id}-nested`} className="admin-sub-subcategory-list">
                      <span>{sub.name}</span>
                      <div className="admin-subcategory-list">
                        {sub.subSubcategories.map((ss) => (
                          <span key={ss.id} className="admin-subcategory-pill admin-subcategory-pill--nested">
                            {ss.name}
                            <button
                              type="button"
                              aria-label={`Delete ${ss.name}`}
                              onClick={() => onDeleteSubSubcategory(ss.id)}
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

        <footer className="admin-modal__footer">
          <button type="button" className="admin-secondary-btn" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </dialog>
  );
}
