import { Link } from "react-router-dom";
import "@/shared/styles/About.css";

const STATS = [
  { value: "10,000+", label: "Products Listed" },
  { value: "50,000+", label: "Happy Customers" },
  { value: "200+",    label: "Trusted Brands" },
  { value: "8",       label: "Product Categories" },
];

const TIMELINE = [
  {
    year: "2020",
    title: "Founded",
    desc: "ApplianSys launched as a small online store focused on kitchen appliances, serving customers across Metro Manila.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    year: "2021",
    title: "Expanded Catalog",
    desc: "Grew to 8 product categories and partnered with over 100 brands to offer a wider selection of home appliances.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    year: "2022",
    title: "50,000 Customers",
    desc: "Reached a major milestone — 50,000 happy customers and launched our loyalty program and live chat support.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    year: "2024",
    title: "Full Platform Launch",
    desc: "Launched the full e-commerce platform with admin tools, AI chat assistant, and real-time inventory management.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

const VALUES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Quality Assurance",
    desc: "Every product is vetted for quality and reliability. We partner only with brands that meet our strict standards.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Fast & Reliable",
    desc: "Our platform is built for speed — from browsing to checkout to delivery tracking, every step is seamless.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
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
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Best Value",
    desc: "Competitive pricing across all categories. We work directly with suppliers to bring you the best deals.",
  },
];

const TEAM = [
  {
    name: "Maria Santos",
    role: "Founder & CEO",
    initial: "M",
    bio: "Visionary behind ApplianSys with 12 years in retail and e-commerce.",
  },
  {
    name: "James Reyes",
    role: "Head of Product",
    initial: "J",
    bio: "Shapes the product roadmap and ensures every feature delights customers.",
  },
  {
    name: "Carla Mendoza",
    role: "Lead Designer",
    initial: "C",
    bio: "Crafts the visual identity and user experience across the platform.",
  },
  {
    name: "Paolo Cruz",
    role: "Engineering Lead",
    initial: "P",
    bio: "Architects the tech stack and keeps the platform fast and reliable.",
  },
];

function AboutPage() {
  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero__content">
          <span className="about-eyebrow">About Us</span>
          <h1 className="about-hero__title">
            Your Trusted Home<br />
            <em>Appliance</em> Destination
          </h1>
          <p className="about-hero__sub">
            ApplianSys was built with one goal — to make finding the right home
            appliance simple, affordable, and enjoyable. From kitchen essentials
            to entertainment systems, we bring everything under one roof.
          </p>
          <div className="about-hero__actions">
            <Link to="/" className="about-hero__btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Shop Now
            </Link>
            <a href="#our-story" className="about-hero__btn-secondary">
              Our Story
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </a>
          </div>
        </div>

        <div className="about-hero__visual" aria-hidden>
          <div className="about-hero__emblem">
            {/* Spinning dashed ring */}
            <div className="about-hero__ring">
              <div className="about-hero__orbit-dot" />
              <div className="about-hero__orbit-dot" />
              <div className="about-hero__orbit-dot" />
              <div className="about-hero__orbit-dot" />
            </div>

            {/* Center badge */}
            <div className="about-hero__center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="about-hero__center-year">2020</span>
              <span className="about-hero__center-label">Est.</span>
            </div>

            {/* Floating mini-cards */}
            <div className="about-hero__float">
              <div className="about-hero__float-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="about-hero__float-text">
                <strong>50,000+</strong>
                <span>Happy Customers</span>
              </div>
            </div>

            <div className="about-hero__float">
              <div className="about-hero__float-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="about-hero__float-text">
                <strong>200+ Brands</strong>
                <span>Trusted Partners</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="about-stats" aria-label="Key statistics">
        {STATS.map((s) => (
          <div key={s.label} className="about-stat">
            <span className="about-stat__value">{s.value}</span>
            <span className="about-stat__label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Story / Mission ── */}
      <section id="our-story" className="about-story">
        <div>
          <span className="about-eyebrow">Our Mission</span>
          <h2 className="about-section-title">Empowering Every Home</h2>
          <p className="about-story__body">
            We believe every household deserves access to quality appliances that
            make daily life easier. ApplianSys bridges the gap between top-tier
            brands and everyday consumers — offering a curated selection, honest
            product information, and a seamless shopping experience.
          </p>
          <p className="about-story__body">
            Whether you're upgrading your kitchen, refreshing your living room, or
            outfitting a new home, we're here to guide you every step of the way.
          </p>
        </div>

        <div>
          <span className="about-eyebrow">Our Journey</span>
          <h2 className="about-section-title">How We Got Here</h2>
          <div className="about-timeline">
            {TIMELINE.map((item) => (
              <div key={item.year} className="about-timeline__item">
                <div className="about-timeline__dot">{item.icon}</div>
                <div className="about-timeline__body">
                  <p className="about-timeline__year">{item.year}</p>
                  <h3 className="about-timeline__title">{item.title}</h3>
                  <p className="about-timeline__desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="about-values">
        <div className="about-values__header">
          <span className="about-eyebrow">What We Stand For</span>
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

      {/* ── Team ── */}
      <section className="about-team">
        <div className="about-team__header">
          <span className="about-eyebrow">The People Behind It</span>
          <h2 className="about-section-title">Meet Our Team</h2>
        </div>
        <div className="about-team__grid">
          {TEAM.map((m) => (
            <div key={m.name} className="about-team-card">
              <div className="about-team-card__avatar-wrap">
                <div className="about-team-card__avatar-ring" aria-hidden />
                <div className="about-team-card__avatar">{m.initial}</div>
              </div>
              <h3 className="about-team-card__name">{m.name}</h3>
              <p className="about-team-card__role">{m.role}</p>
              <div className="about-team-card__divider" />
              <p className="about-team-card__bio">{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="about-cta">
        <div className="about-cta__inner">
          <span className="about-cta__eyebrow">Ready to get started?</span>
          <h2 className="about-cta__title">Find Your Next Appliance Today</h2>
          <p className="about-cta__sub">
            Browse thousands of products across 8 categories — all in one place,
            with fast delivery and easy returns.
          </p>
          <div className="about-cta__actions">
            <Link to="/" className="about-cta__btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Shop Now
            </Link>
            <Link to="/cart" className="about-cta__btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              View Cart
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default AboutPage;
