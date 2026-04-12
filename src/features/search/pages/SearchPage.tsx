import { useNavigate } from "react-router-dom";

const CATEGORY_CARDS = [
  { slug: "kitchen",       className: "kitchen",       title: "Kitchen Appliances",  subtitle: "Cook smarter, live better",     label: "Kitchen" },
  { slug: "cleaning",      className: "cleaning",      title: "Cleaning Appliances", subtitle: "Effortless home maintenance",   label: "Cleaning" },
  { slug: "cooling",       className: "cooling",       title: "Cooling & Heating",   subtitle: "Perfect climate control",       label: "Cooling" },
  { slug: "entertainment", className: "entertainment", title: "Entertainment",       subtitle: "Elevate your experience",       label: "Entertainment" },
];

const BEST_SELLER_CARDS = [
  { slug: "personal",  className: "personal",  title: "Personal Care",     subtitle: "Your daily essentials",  label: "Personal" },
  { slug: "household", className: "household", title: "Small Household",   subtitle: "Compact solutions",      label: "Household" },
  { slug: "office",    className: "office",    title: "Office Appliances", subtitle: "Productivity boosters",  label: "Office" },
  { slug: "home",      className: "home",      title: "Home Appliances",   subtitle: "Complete your home",     label: "Home" },
];

function SearchPage() {
  const navigate = useNavigate();

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
        <div className="photo-grid">
          {CATEGORY_CARDS.map((c) => (
            <div
              key={c.slug}
              className="photo-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/category/${c.slug}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/category/${c.slug}`)}
            >
              <div className={`card-image ${c.className}`}>{c.label}</div>
              <div className="card-content">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="discover-section">
        <h2 className="section-title">Discover Our Best Sellers</h2>
        <div className="photo-grid">
          {BEST_SELLER_CARDS.map((c) => (
            <div
              key={c.slug}
              className="photo-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/category/${c.slug}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/category/${c.slug}`)}
            >
              <div className={`card-image ${c.className}`}>{c.label}</div>
              <div className="card-content">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default SearchPage;
