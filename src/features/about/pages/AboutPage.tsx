import "@/shared/styles/About.css";

const STATS = [
  { value: "10,000+", label: "Products Listed" },
  { value: "50,000+", label: "Happy Customers" },
  { value: "200+", label: "Trusted Brands" },
  { value: "8", label: "Product Categories" },
];

const VALUES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Quality Assurance",
    desc: "Every product on ApplianSys is vetted for quality and reliability. We partner only with brands that meet our strict standards.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Fast & Reliable",
    desc: "We know your time matters. Our platform is built for speed — from browsing to checkout to delivery tracking.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Customer First",
    desc: "Our support team is always ready to help. We listen, adapt, and continuously improve based on your feedback.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Best Value",
    desc: "Competitive pricing across all categories. We work directly with suppliers to bring you the best deals without compromising quality.",
  },
];

const TEAM = [
  { name: "Maria Santos", role: "Founder & CEO", initial: "M" },
  { name: "James Reyes", role: "Head of Product", initial: "J" },
  { name: "Carla Mendoza", role: "Lead Designer", initial: "C" },
  { name: "Paolo Cruz", role: "Engineering Lead", initial: "P" },
];

function AboutPage() {
  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero__content">
          <span className="about-hero__eyebrow">About Us</span>
          <h1 className="about-hero__title">
            Your Trusted Home<br />Appliance Destination
          </h1>
          <p className="about-hero__sub">
            ApplianSys was built with one goal in mind — to make finding the right
            home appliance simple, affordable, and enjoyable. From kitchen essentials
            to entertainment systems, we bring everything under one roof.
          </p>
        </div>
        <div className="about-hero__visual">
          <div className="about-hero__badge">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Est. 2020</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="about-stats">
        {STATS.map((s) => (
          <div key={s.label} className="about-stat">
            <span className="about-stat__value">{s.value}</span>
            <span className="about-stat__label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section className="about-mission">
        <div className="about-mission__text">
          <span className="about-section-eyebrow">Our Mission</span>
          <h2 className="about-section-title">Empowering Every Home</h2>
          <p className="about-mission__body">
            We believe every household deserves access to quality appliances that
            make daily life easier. ApplianSys bridges the gap between top-tier
            brands and everyday consumers — offering a curated selection, honest
            product information, and a seamless shopping experience.
          </p>
          <p className="about-mission__body">
            Whether you're upgrading your kitchen, refreshing your living room, or
            outfitting a new home, we're here to guide you every step of the way.
          </p>
        </div>
        <div className="about-mission__card">
          <div className="about-mission__card-inner">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
            <h3>Founded in 2020</h3>
            <p>Started as a small online store, ApplianSys has grown into a full-featured e-commerce platform serving thousands of customers across the Philippines.</p>
            <div className="about-mission__divider" />
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h3>Community Driven</h3>
            <p>Our product catalog and features are shaped by real customer feedback. You tell us what you need — we make it happen.</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="about-values__header">
          <span className="about-section-eyebrow">What We Stand For</span>
          <h2 className="about-section-title">Our Core Values</h2>
        </div>
        <div className="about-values__grid">
          {VALUES.map((v) => (
            <div key={v.title} className="about-value-card">
              <div className="about-value-card__icon">{v.icon}</div>
              <h3 className="about-value-card__title">{v.title}</h3>
              <p className="about-value-card__desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="about-team">
        <div className="about-values__header">
          <span className="about-section-eyebrow">The People Behind It</span>
          <h2 className="about-section-title">Meet Our Team</h2>
        </div>
        <div className="about-team__grid">
          {TEAM.map((m) => (
            <div key={m.name} className="about-team-card">
              <div className="about-team-card__avatar">{m.initial}</div>
              <h3 className="about-team-card__name">{m.name}</h3>
              <p className="about-team-card__role">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <h2 className="about-cta__title">Ready to find your next appliance?</h2>
        <p className="about-cta__sub">
          Browse thousands of products across 8 categories — all in one place.
        </p>
        <a href="/" className="about-cta__btn">Shop Now</a>
      </section>

    </div>
  );
}

export default AboutPage;
