import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchCatalogCategories,
  fetchCatalogProducts,
  type CatalogCategory,
  type CatalogProduct,
} from "../lib/catalogApi";
import "@/shared/styles/Category.css";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(value);
}

function CategoryPage() {
  const { categorySlug, subSlug, subSubSlug } = useParams<{
    categorySlug: string;
    subSlug?: string;
    subSubSlug?: string;
  }>();
  const [sortBy, setSortBy] = useState("popularity");
  const [perPage, setPerPage] = useState(6);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [categoryResponse, productResponse] = await Promise.all([
          fetchCatalogCategories(),
          fetchCatalogProducts(),
        ]);

        if (!cancelled) {
          setCategories(categoryResponse.categories);
          setProducts(productResponse.products);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load products.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const category = categories.find((item) => slugify(item.name) === categorySlug);
  const activeSub = category?.subcategories.find((item) => slugify(item.name) === subSlug);
  const activeSubSub = activeSub?.subSubcategories.find((item) => slugify(item.name) === subSubSlug);

  const categoryProducts = useMemo(
    () => (category ? products.filter((product) => slugify(product.category) === slugify(category.name)) : []),
    [category, products],
  );

  const visibleProducts = useMemo(() => {
    let filtered = categoryProducts;
    if (activeSub) {
      filtered = filtered.filter((p) => slugify(p.subcategory) === slugify(activeSub.name));
    }
    if (activeSubSub) {
      filtered = filtered.filter((p) => slugify(p.subSubcategory) === slugify(activeSubSub.name));
    }
    const sorted = [...filtered];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest") sorted.sort((a, b) => b.dbId - a.dbId);
    return sorted.slice(0, perPage);
  }, [activeSub, activeSubSub, categoryProducts, perPage, sortBy]);

  if (!isLoading && !category) {
    return (
      <div className="cat-page">
        <p>Category not found.</p>
        <Link to="/">Back to Home</Link>
      </div>
    );
  }

  const pageTitle = activeSubSub?.name ?? activeSub?.name ?? category?.name ?? "Category";
  const catBase = category ? `/category/${slugify(category.name)}` : "/";
  const subBase = activeSub ? `${catBase}/${slugify(activeSub.name)}` : catBase;

  const crumbs = [
    { label: "Home", to: "/" },
    ...(category ? [{ label: category.name, to: catBase }] : []),
    ...(activeSub ? [{ label: activeSub.name, to: subBase }] : []),
    ...(activeSubSub ? [{ label: activeSubSub.name, to: `${subBase}/${slugify(activeSubSub.name)}` }] : []),
  ];

  return (
    <div className="cat-page">
      <nav className="cat-breadcrumb" aria-label="breadcrumb">
        {crumbs.map((crumb, index) => (
          <span key={crumb.to} className="cat-breadcrumb__item">
            {index < crumbs.length - 1 ? (
              <>
                <Link to={crumb.to} className="cat-breadcrumb__link">
                  {crumb.label}
                </Link>
                <span className="cat-breadcrumb__sep">&gt;</span>
              </>
            ) : (
              <span className="cat-breadcrumb__current">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="cat-layout">
        <aside className="cat-sidebar">
          {categories.length > 0 ? (
            <details className="cat-sidebar__cat-dropdown">
              <summary className="cat-sidebar__cat-summary">
                All Categories
                <span className="cat-sidebar__cat-chevron" aria-hidden="true">&#8964;</span>
              </summary>
              <ul className="cat-sidebar__list cat-sidebar__list--categories">
                {categories.map((cat) => {
                  const catSlug = slugify(cat.name);
                  const isActive = catSlug === categorySlug;
                  return (
                    <li key={cat.id}>
                      <Link
                        to={`/category/${catSlug}`}
                        className={`cat-sidebar__item cat-sidebar__item--category${isActive ? " cat-sidebar__item--category-active" : ""}`}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}

          {category?.subcategories.length ? (
            <>
              <p className="cat-sidebar__group-label">{category.name}</p>
              <ul className="cat-sidebar__list">
                {category.subcategories.map((sub) => {
                  const subcategorySlug = slugify(sub.name);
                  const isSubActive = subcategorySlug === subSlug;
                  const hasChildren = sub.subSubcategories.length > 0;

                  if (hasChildren) {
                    return (
                      <li key={sub.id}>
                        <details
                          className="cat-sidebar__sub-dropdown"
                          open={isSubActive}
                        >
                          <summary
                            className={`cat-sidebar__item cat-sidebar__item--expandable${isSubActive ? " cat-sidebar__item--active" : ""}`}
                          >
                            <Link
                              to={`/category/${slugify(category.name)}/${subcategorySlug}`}
                              className="cat-sidebar__item-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {sub.name}
                            </Link>
                            <span className="cat-sidebar__sub-chevron" aria-hidden="true">&#8964;</span>
                          </summary>
                          <ul className="cat-sidebar__sub-list">
                            {sub.subSubcategories.map((ss) => {
                              const ssSlug = slugify(ss.name);
                              const isSsActive = ssSlug === subSubSlug && isSubActive;
                              return (
                                <li key={ss.id}>
                                  <Link
                                    to={`/category/${slugify(category.name)}/${subcategorySlug}/${ssSlug}`}
                                    className={`cat-sidebar__item cat-sidebar__item--sub${isSsActive ? " cat-sidebar__item--active" : ""}`}
                                  >
                                    {ss.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </details>
                      </li>
                    );
                  }

                  return (
                    <li key={sub.id}>
                      <Link
                        to={`/category/${slugify(category.name)}/${subcategorySlug}`}
                        className={`cat-sidebar__item${isSubActive ? " cat-sidebar__item--active" : ""}`}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </aside>

        <main className="cat-main">
          <h1 className="cat-main__title">{pageTitle}</h1>

          <div className="cat-toolbar">
            <div className="cat-toolbar__left">
              <span className="cat-toolbar__label">Sort by:</span>
              <div className="cat-toolbar__select-wrap">
                <select
                  className="cat-toolbar__select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
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
                  onChange={(event) => setPerPage(Number(event.target.value))}
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="cat-empty">
              <p className="cat-empty__text">Loading products...</p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="cat-empty">
              <p className="cat-empty__text">{errorMessage}</p>
            </div>
          ) : null}

          {!isLoading && !errorMessage && visibleProducts.length > 0 ? (
            <div className="cat-grid">
              {visibleProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="cat-product-card"
                  style={{ textDecoration: "none" }}
                >
                  <div className="cat-product-card__img">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <span>{product.subcategory}</span>
                    )}
                  </div>
                  <div className="cat-product-card__body">
                    <p className="cat-product-card__subcategory">
                      {product.subSubcategory
                        ? `${product.subcategory} / ${product.subSubcategory}`
                        : product.subcategory}
                    </p>
                    <h2 className="cat-product-card__name">{product.name}</h2>
                    <p className="cat-product-card__description">
                      {product.description || "No description available."}
                    </p>
                    <strong className="cat-product-card__price">{formatCurrency(product.price)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

          {!isLoading && !errorMessage && visibleProducts.length === 0 ? (
            <div className="cat-empty">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden>
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
              <p className="cat-empty__text">No products yet.</p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default CategoryPage;
