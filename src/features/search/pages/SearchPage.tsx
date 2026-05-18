import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  fetchCatalogCategories,
  fetchCatalogProducts,
  type CatalogCategory,
  type CatalogProduct,
} from "@/features/category/lib/catalogApi";
import { fetchBestSellingProducts, type BestSellingProduct } from "@/shared/lib/statsApi";
import "@/shared/styles/Product.css";
import "@/shared/styles/SearchResults.css";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", { currency: "PHP", style: "currency" }).format(value);
}

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [bestSelling, setBestSelling] = useState<BestSellingProduct[]>([]);
  const [imageStep, setImageStep] = useState(0);
  const [fadingStep, setFadingStep] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [categoryResponse, productResponse, bestSellingResponse] = await Promise.all([
          fetchCatalogCategories(),
          fetchCatalogProducts(),
          fetchBestSellingProducts(),
        ]);
        if (!cancelled) {
          setCategories(categoryResponse.categories);
          setProducts(productResponse.products);
          setBestSelling(bestSellingResponse);
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFadingStep((current) => (current === null ? 0 : current + 1));
      setTimeout(() => {
        setImageStep((current) => current + 1);
        setFadingStep(null);
      }, 600);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const getCategoryImages = (categoryName: string) =>
    products
      .filter((product) => slugify(product.category) === slugify(categoryName) && product.image)
      .map((product) => product.image);

  // If there's a search query, show search results
  if (query.trim()) {
    const queryLower = query.toLowerCase();
    const matchedProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes(queryLower) ||
        p.category.toLowerCase().includes(queryLower) ||
        p.subcategory.toLowerCase().includes(queryLower) ||
        p.description.toLowerCase().includes(queryLower)
    );

    // Get the category of the first matched product (if any) to show related items
    const firstMatchCategory = matchedProducts.length > 0 ? matchedProducts[0].category : null;
    const relatedProducts = firstMatchCategory
      ? products.filter((p) => p.category === firstMatchCategory)
      : [];

    return (
      <div className="search-results-page">
        <section className="search-results-header">
          <h1 className="search-results-title">Search Results</h1>
          <p className="search-results-query">
            Results for "<strong>{query}</strong>"
          </p>
        </section>

        {/* Matched Products */}
        {matchedProducts.length > 0 && (
          <section className="search-results-section">
            <h2 className="search-results-section-title">
              Found {matchedProducts.length} Product{matchedProducts.length !== 1 ? "s" : ""}
            </h2>
            <div className="search-results-grid">
              {matchedProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="search-result-card"
                >
                  <div className="search-result-card__image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="search-result-card__placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2" aria-hidden>
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="search-result-card__body">
                    <p className="search-result-card__category">{product.category}</p>
                    <h3 className="search-result-card__name">{product.name}</h3>
                    <p className="search-result-card__price">{formatCurrency(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Products from Same Category */}
        {matchedProducts.length > 0 && relatedProducts.length > matchedProducts.length && (
          <section className="search-results-section">
            <h2 className="search-results-section-title">
              More from {firstMatchCategory}
            </h2>
            <div className="search-results-grid">
              {relatedProducts
                .filter((p) => !matchedProducts.find((m) => m.id === p.id))
                .slice(0, 8)
                .map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="search-result-card"
                  >
                    <div className="search-result-card__image">
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <div className="search-result-card__placeholder">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2" aria-hidden>
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="search-result-card__body">
                      <p className="search-result-card__category">{product.category}</p>
                      <h3 className="search-result-card__name">{product.name}</h3>
                      <p className="search-result-card__price">{formatCurrency(product.price)}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* No Results */}
        {matchedProducts.length === 0 && (
          <section className="search-results-section">
            <div className="search-results-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <h3 className="search-results-empty-title">No products found</h3>
              <p className="search-results-empty-text">
                Try searching with different keywords or browse our categories.
              </p>
              <Link to="/" className="search-results-empty-link">
                ← Back to Home
              </Link>
            </div>
          </section>
        )}
      </div>
    );
  }

  // Default home page view (categories)
  return (
    <div className="home-page">
      <section className="hero-banner">
        <div className="hero-content">
          <h2 className="hero-title">Transform Your Home</h2>
          <p className="hero-subtitle">Discover premium appliances for every room</p>
        </div>
        <div className="hero-image"></div>
      </section>

      <section className="featured-section">
        <h2 className="section-title">Explore Our Categories</h2>
        {isLoading ? <p className="home-category-note">Loading categories...</p> : null}
        {!isLoading && categories.length === 0 ? (
          <p className="home-category-note">No categories yet.</p>
        ) : null}
        <div className="category-tilebox">
          {categories.map((category) => {
            const images = getCategoryImages(category.name);
            const currentImg = images.length > 0 ? images[imageStep % images.length] : "";
            const nextImg =
              images.length > 1 ? images[(imageStep + 1) % images.length] : currentImg;
            const isFading = fadingStep !== null;

            return (
              <button
                key={category.id}
                type="button"
                className="category-tile"
                onClick={() => {
                  void navigate(`/category/${slugify(category.name)}`);
                }}
              >
                <span className="category-tile__media">
                  {currentImg ? (
                    <img
                      key={currentImg}
                      src={currentImg}
                      alt=""
                      className={`category-tile__media-img${isFading ? " category-tile__media-img--out" : ""}`}
                    />
                  ) : null}
                  {isFading && nextImg && nextImg !== currentImg ? (
                    <img
                      src={nextImg}
                      alt=""
                      className="category-tile__media-img category-tile__media-img--in"
                    />
                  ) : null}
                  <span className="category-tile__media-label">{category.name}</span>
                </span>
                <span className="category-tile__body">
                  <span className="category-tile__label">{category.name}</span>
                  <span className="category-tile__meta">
                    {category.subcategories.length} subcategor{category.subcategories.length === 1 ? "y" : "ies"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Best Selling Section */}
      <section className="best-selling-section">
        <h2 className="section-title">Best Selling Items</h2>
        {isLoading ? (
          <p className="home-category-note">Loading best sellers...</p>
        ) : bestSelling.length === 0 ? (
          <p className="home-category-note">No sales data yet.</p>
        ) : (
          <div className="best-selling-grid">
            {bestSelling.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="best-selling-card"
              >
                <div className="best-selling-card__image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="best-selling-card__placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                  {product.totalSold > 0 && (
                    <span className="best-selling-card__badge">
                      {product.totalSold} sold
                    </span>
                  )}
                </div>
                <div className="best-selling-card__body">
                  <h3 className="best-selling-card__name">{product.name}</h3>
                  <p className="best-selling-card__price">
                    {new Intl.NumberFormat("en-PH", { currency: "PHP", style: "currency" }).format(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SearchPage;
