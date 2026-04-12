import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CATEGORIES } from "../categoryConfig";
import "@/shared/styles/Category.css";

function CategoryPage() {
  const { categorySlug, subSlug } = useParams<{
    categorySlug: string;
    subSlug?: string;
  }>();

  const category = CATEGORIES.find((c) => c.slug === categorySlug);

  const [sortBy, setSortBy] = useState("popularity");
  const [perPage, setPerPage] = useState(6);

  if (!category) {
    return (
      <div className="cat-page">
        <p>Category not found.</p>
        <Link to="/">← Back to Home</Link>
      </div>
    );
  }

  const activeSub = category.subcategories.find((s) => s.slug === subSlug);
  const pageTitle = activeSub ? activeSub.label : category.label;

  // Breadcrumb segments
  const crumbs = [
    { label: "Home", to: "/" },
    { label: category.label, to: `/category/${category.slug}` },
    ...(activeSub
      ? [{ label: activeSub.label, to: `/category/${category.slug}/${activeSub.slug}` }]
      : []),
  ];

  return (
    <div className="cat-page">
      {/* Breadcrumb */}
      <nav className="cat-breadcrumb" aria-label="breadcrumb">
        {crumbs.map((c, i) => (
          <span key={c.to} className="cat-breadcrumb__item">
            {i < crumbs.length - 1 ? (
              <>
                <Link to={c.to} className="cat-breadcrumb__link">{c.label}</Link>
                <span className="cat-breadcrumb__sep">›</span>
              </>
            ) : (
              <span className="cat-breadcrumb__current">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="cat-layout">
        {/* Sidebar */}
        <aside className="cat-sidebar">
          <Link to="/" className="cat-sidebar__show-all">
            Show all Categories <span>›</span>
          </Link>

          {category.subcategories.length > 0 && (
            <>
              <p className="cat-sidebar__group-label">{category.label}</p>
              <ul className="cat-sidebar__list">
                {category.subcategories.map((sub) => {
                  const isActive = sub.slug === subSlug;
                  return (
                    <li key={sub.slug}>
                      <Link
                        to={`/category/${category.slug}/${sub.slug}`}
                        className={`cat-sidebar__item${isActive ? " cat-sidebar__item--active" : ""}`}
                      >
                        {sub.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </aside>

        {/* Main content */}
        <main className="cat-main">
          <h1 className="cat-main__title">{pageTitle}</h1>

          {/* Toolbar */}
          <div className="cat-toolbar">
            <div className="cat-toolbar__left">
              <span className="cat-toolbar__label">Sort by:</span>
              <div className="cat-toolbar__select-wrap">
                <select
                  className="cat-toolbar__select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popularity">popularity</option>
                  <option value="price-asc">price: low to high</option>
                  <option value="price-desc">price: high to low</option>
                  <option value="newest">newest</option>
                </select>
              </div>

              <span className="cat-toolbar__label">Show:</span>
              <div className="cat-toolbar__select-wrap">
                <select
                  className="cat-toolbar__select cat-toolbar__select--sm"
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            </div>

            <div className="cat-toolbar__pagination">
              <button type="button" className="cat-toolbar__page-btn" disabled>1</button>
              <span className="cat-toolbar__page-of">of 1</span>
              <button type="button" className="cat-toolbar__page-arrow" disabled>→</button>
            </div>
          </div>

          {/* Empty product grid */}
          <div className="cat-empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden>
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            <p className="cat-empty__text">No products yet.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CategoryPage;
