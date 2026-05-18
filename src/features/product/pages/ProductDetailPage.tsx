import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchCatalogProducts,
  type CatalogProduct,
} from "@/features/category/lib/catalogApi";
import { useAuthUser } from "@/app/hooks/useAuthUser";
import { addToCart } from "@/shared/lib/cartApi";
import "@/shared/styles/Product.css";

function slugify(value: string) {
  return value.trim().toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", { currency: "PHP", style: "currency" }).format(value);
}

function getStockBadge(product: CatalogProduct) {
  const status = product.status?.toLowerCase() ?? "";
  if (status === "out of stock" || product.stock === 0)
    return { label: "Out of Stock", cls: "pdp-badge--out-of-stock" };
  if (status === "low stock" || product.stock <= 5)
    return { label: `Low Stock — ${product.stock} left`, cls: "pdp-badge--low-stock" };
  return { label: "In Stock", cls: "pdp-badge--in-stock" };
}

/** Parse description into spec rows if it contains "Key: Value" lines. */
function parseSpecs(description: string): { key: string; value: string }[] {
  return description
    .split("\n")
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx < 1) return null;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      return key && value ? { key, value } : null;
    })
    .filter((r): r is { key: string; value: string } => r !== null);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="pdp-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24"
          fill={n <= Math.round(rating) ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="2" aria-hidden>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="pdp-skeleton">
      <div className="pdp-skeleton__block pdp-skeleton__img" />
      <div className="pdp-skeleton__lines">
        <div className="pdp-skeleton__block pdp-skeleton__line" style={{ height: 18, width: "35%" }} />
        <div className="pdp-skeleton__block pdp-skeleton__line" style={{ height: 34, width: "85%" }} />
        <div className="pdp-skeleton__block pdp-skeleton__line" style={{ height: 34, width: "55%" }} />
        <div className="pdp-skeleton__block pdp-skeleton__line" style={{ height: 72, width: "100%", marginTop: 4 }} />
        <div className="pdp-skeleton__block pdp-skeleton__line" style={{ height: 90, width: "100%" }} />
        <div className="pdp-skeleton__block pdp-skeleton__line" style={{ height: 52, width: "100%", marginTop: 8 }} />
        <div className="pdp-skeleton__block pdp-skeleton__line" style={{ height: 52, width: "100%" }} />
      </div>
    </div>
  );
}

type Tab = "description" | "specs" | "delivery";

function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const user = useAuthUser();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartState, setCartState] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [cartError, setCartError] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetchCatalogProducts();
        if (!cancelled) setProducts(response.products);
      } catch (error) {
        if (!cancelled)
          setErrorMessage(error instanceof Error ? error.message : "Failed to load product.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setQuantity(1);
    setCartState("idle");
    setCartError("");
    setActiveTab("description");
  }, [productId]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen]);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && slugify(p.category) === slugify(product.category))
      .slice(0, 4);
  }, [product, products]);

  const isOutOfStock = product?.status?.toLowerCase() === "out of stock" || product?.stock === 0;

  const handleAddToCart = async () => {
    if (!user) { void navigate("/cart"); return; }
    if (!product || isOutOfStock) return;
    setCartState("loading");
    setCartError("");
    try {
      await addToCart(product.dbId, quantity);
      setCartState("added");
      setTimeout(() => setCartState("idle"), 2500);
    } catch (error) {
      setCartState("error");
      setCartError(error instanceof Error ? error.message : "Could not add to cart.");
      setTimeout(() => setCartState("idle"), 3000);
    }
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (isLoading) return <div className="pdp"><SkeletonLoader /></div>;

  if (errorMessage) {
    return (
      <div className="pdp">
        <div className="pdp-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <h1 className="pdp-state__title">Something went wrong</h1>
          <p className="pdp-state__text">{errorMessage}</p>
          <Link to="/" className="pdp-state__back">← Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp">
        <div className="pdp-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden>
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
          <h1 className="pdp-state__title">Product not found</h1>
          <p className="pdp-state__text">This product may have been removed or the link is incorrect.</p>
          <Link to="/" className="pdp-state__back">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const stockBadge = getStockBadge(product);
  const categorySlug = slugify(product.category);
  const subSlug = slugify(product.subcategory);
  const specs = product.description ? parseSpecs(product.description) : [];
  const hasSpecs = specs.length >= 2;

  const crumbs = [
    { label: "Home", to: "/" },
    { label: product.category, to: `/category/${categorySlug}` },
    ...(product.subcategory
      ? [{ label: product.subcategory, to: `/category/${categorySlug}/${subSlug}` }]
      : []),
    { label: product.name, to: "" },
  ];

  return (
    <div className="pdp">
      {/* Breadcrumb */}
      <nav className="pdp-breadcrumb" aria-label="breadcrumb">
        {crumbs.map((crumb, index) => (
          <span key={`${crumb.to}-${index}`} className="pdp-breadcrumb__item">
            {index < crumbs.length - 1 ? (
              <>
                {crumb.to
                  ? <Link to={crumb.to} className="pdp-breadcrumb__link">{crumb.label}</Link>
                  : <span className="pdp-breadcrumb__link">{crumb.label}</span>}
                <span className="pdp-breadcrumb__sep">/</span>
              </>
            ) : (
              <span className="pdp-breadcrumb__current">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Main layout */}
      <div className="pdp-layout">

        {/* ── Gallery ── */}
        <div className="pdp-gallery">
          <div
            className="pdp-gallery__main"
            role="button"
            tabIndex={product.image ? 0 : -1}
            aria-label="View full image"
            onClick={() => product.image && setLightboxOpen(true)}
            onKeyDown={(e) => e.key === "Enter" && product.image && setLightboxOpen(true)}
          >
            {product.image ? (
              <>
                <img className="pdp-gallery__main-img" src={product.image} alt={product.name} />
                <div className="pdp-gallery__zoom-hint" aria-hidden>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  Click to zoom
                </div>
              </>
            ) : (
              <div className="pdp-gallery__placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span className="pdp-gallery__placeholder-text">No image available</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Info panel ── */}
        <div className="pdp-info">

          {/* Badges */}
          <div className="pdp-info__badges">
            <span className="pdp-badge pdp-badge--category">{product.category}</span>
            {product.subcategory && <span className="pdp-badge pdp-badge--subcategory">{product.subcategory}</span>}
            {product.subSubcategory && <span className="pdp-badge pdp-badge--subcategory">{product.subSubcategory}</span>}
          </div>

          {/* Name */}
          <h1 className="pdp-info__name">{product.name}</h1>

          {/* Rating row */}
          <div className="pdp-info__rating-row">
            <StarRating rating={4} />
            <span className="pdp-info__rating-count">4.0 · 128 reviews</span>
          </div>

          {/* Price block */}
          <div className="pdp-info__price-block">
            <span className="pdp-info__price">{formatCurrency(product.price)}</span>
            <span className="pdp-info__price-note">
              Inclusive of all taxes<br />Free shipping on orders over ₱2,000
            </span>
          </div>

          {/* Stock */}
          <div className="pdp-info__stock-row">
            <span className={`pdp-badge ${stockBadge.cls}`}>{stockBadge.label}</span>
            {!isOutOfStock && product.stock > 5 && (
              <span><span className="pdp-info__stock-count">{product.stock}</span> units available</span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          {!isOutOfStock && (
            <div className="pdp-qty">
              <span className="pdp-qty__label">Qty:</span>
              <div className="pdp-qty__control">
                <button type="button" className="pdp-qty__btn" aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
                <span className="pdp-qty__value" aria-live="polite">{quantity}</span>
                <button type="button" className="pdp-qty__btn" aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}>+</button>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="pdp-cta">
            <button type="button" className="pdp-cta__add-to-cart"
              disabled={isOutOfStock || cartState === "loading"}
              onClick={() => void handleAddToCart()}>
              {cartState === "loading" ? (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden style={{ animation: "spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Adding…</>
              ) : cartState === "added" ? (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M20 6L9 17l-5-5" /></svg>Added to Cart</>
              ) : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                {isOutOfStock ? "Out of Stock" : !user ? "Sign in to Add to Cart" : "Add to Cart"}</>
              )}
            </button>
            {cartState === "error" && <p className="pdp-cta__error">{cartError}</p>}
            <button type="button" className="pdp-cta__buy-now"
              disabled={isOutOfStock} onClick={() => void navigate("/cart")}>
              Buy Now
            </button>
          </div>

          {/* Trust strip */}
          <div className="pdp-trust">
            <div className="pdp-trust__item">
              <svg className="pdp-trust__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="pdp-trust__label">Secure Payment</span>
            </div>
            <div className="pdp-trust__item">
              <svg className="pdp-trust__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 5v3h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span className="pdp-trust__label">Fast Delivery</span>
            </div>
            <div className="pdp-trust__item">
              <svg className="pdp-trust__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span className="pdp-trust__label">30-Day Returns</span>
            </div>
          </div>

          {/* Tabs — Description / Specs / Delivery */}
          <div className="pdp-tabs">
            <div className="pdp-tabs__nav" role="tablist">
              {(["description", ...(hasSpecs ? ["specs"] : []), "delivery"] as Tab[]).map((tab) => (
                <button key={tab} type="button" role="tab"
                  className={`pdp-tabs__btn${activeTab === tab ? " pdp-tabs__btn--active" : ""}`}
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}>
                  {tab === "description" ? "Description" : tab === "specs" ? "Specifications" : "Delivery & Returns"}
                </button>
              ))}
            </div>

            {activeTab === "description" && (
              <div className="pdp-tabs__panel" role="tabpanel">
                {product.description
                  ? product.description
                  : <span className="pdp-tabs__panel--empty">No description available.</span>}
              </div>
            )}

            {activeTab === "specs" && hasSpecs && (
              <div className="pdp-specs" role="tabpanel">
                {specs.map((row) => (
                  <div key={row.key} className="pdp-specs__row">
                    <span className="pdp-specs__key">{row.key}</span>
                    <span className="pdp-specs__val">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "delivery" && (
              <div className="pdp-delivery-info" role="tabpanel">
                <div className="pdp-delivery-item">
                  <div className="pdp-delivery-item__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 5v3h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="pdp-delivery-item__title">Home Delivery</p>
                    <p className="pdp-delivery-item__desc">3–5 business days · Free on orders over ₱2,000, otherwise ₱150.</p>
                  </div>
                </div>
                <div className="pdp-delivery-item">
                  <div className="pdp-delivery-item__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div>
                    <p className="pdp-delivery-item__title">Store Pickup</p>
                    <p className="pdp-delivery-item__desc">Ready next business day · Free · Mon–Sat 8 AM–6 PM.</p>
                  </div>
                </div>
                <div className="pdp-delivery-item">
                  <div className="pdp-delivery-item__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </div>
                  <div>
                    <p className="pdp-delivery-item__title">30-Day Returns</p>
                    <p className="pdp-delivery-item__desc">Hassle-free returns within 30 days of delivery. Item must be unused and in original packaging.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Meta table */}
          <div className="pdp-meta">
            <div className="pdp-meta__row">
              <span className="pdp-meta__key">Product ID</span>
              <span className="pdp-meta__val">{product.id}</span>
            </div>
            <div className="pdp-meta__row">
              <span className="pdp-meta__key">Category</span>
              <span className="pdp-meta__val">{product.category}</span>
            </div>
            {product.subcategory && (
              <div className="pdp-meta__row">
                <span className="pdp-meta__key">Subcategory</span>
                <span className="pdp-meta__val">{product.subcategory}</span>
              </div>
            )}
            {product.subSubcategory && (
              <div className="pdp-meta__row">
                <span className="pdp-meta__key">Type</span>
                <span className="pdp-meta__val">{product.subSubcategory}</span>
              </div>
            )}
            <div className="pdp-meta__row">
              <span className="pdp-meta__key">Availability</span>
              <span className="pdp-meta__val">{stockBadge.label}</span>
            </div>
          </div>

          {/* Share */}
          <div className="pdp-share">
            <span className="pdp-share__label">Share:</span>
            <button type="button" className="pdp-share__btn" aria-label="Copy link" onClick={handleCopyLink}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            <button type="button" className="pdp-share__btn" aria-label="Share on Facebook"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </button>
            {linkCopied && <span className="pdp-share__copied">Link copied!</span>}
          </div>

        </div>{/* end pdp-info */}
      </div>{/* end pdp-layout */}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="pdp-related">
          <div className="pdp-related__header">
            <h2 className="pdp-related__title">More from {product.category}</h2>
            <Link to={`/category/${categorySlug}`} className="pdp-related__link">
              View all →
            </Link>
          </div>
          <div className="pdp-related__grid">
            {relatedProducts.map((related) => (
              <Link key={related.id} to={`/product/${related.id}`} className="pdp-related-card">
                <div className="pdp-related-card__img">
                  {related.image
                    ? <img src={related.image} alt={related.name} />
                    : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>}
                </div>
                <div className="pdp-related-card__body">
                  <p className="pdp-related-card__sub">{related.subSubcategory || related.subcategory}</p>
                  <h3 className="pdp-related-card__name">{related.name}</h3>
                  <strong className="pdp-related-card__price">{formatCurrency(related.price)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxOpen && product.image && (
        <div className="pdp-lightbox" onClick={() => setLightboxOpen(false)} role="dialog" aria-modal aria-label="Product image">
          <img className="pdp-lightbox__img" src={product.image} alt={product.name} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="pdp-lightbox__close" onClick={() => setLightboxOpen(false)} aria-label="Close image">✕</button>
        </div>
      )}

    </div>
  );
}

export default ProductDetailPage;
