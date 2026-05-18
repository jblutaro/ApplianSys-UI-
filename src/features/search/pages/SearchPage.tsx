import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCatalogCategories,
  fetchCatalogProducts,
  type CatalogCategory,
  type CatalogProduct,
} from "@/features/category/lib/catalogApi";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SearchPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [imageStep, setImageStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
      setImageStep((current) => current + 1);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const getCategoryImages = (categoryName: string) =>
    products
      .filter((product) => slugify(product.category) === slugify(categoryName) && product.image)
      .map((product) => product.image);

  return (
    <div className="home-page">
      <section className="hero-banner">
        <div className="hero-content">
          <h2 className="hero-title">Transform Your Home</h2>
          <p className="hero-subtitle">Discover premium appliances for every room</p>
          <button className="hero-button">Shop Now</button>
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
            const activeImage = images.length > 0 ? images[imageStep % images.length] : "";
            return (
            <button
              key={category.id}
              type="button"
              className="category-tile"
              onClick={() => {
                void navigate(`/category/${slugify(category.name)}`);
              }}
            >
              <span
                className="category-tile__media"
                style={activeImage ? { backgroundImage: `url(${activeImage})` } : undefined}
              >
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
    </div>
  );
}

export default SearchPage;
