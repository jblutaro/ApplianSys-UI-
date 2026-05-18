import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSiteStats, type SiteStats } from "@/shared/lib/statsApi";
import "@/shared/styles/About.css";

// ── Timeline is generated from live stats ──────────────────────────────────
function buildTimeline(stats: SiteStats) {
  const { foundedYear, firstOrderYear, latestOrderYear, categories, categoryNames, customers, products } = stats;

  // Format a readable category list: "A, B, C and D"
  function listCategories(names: string[]) {
    if (names.length === 0) return "multiple categories";
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  }

  const items = [
    {
      year: String(foundedYear),
      title: "Founded",
      desc: `ApplianSys launched as an online appliance store, serving customers with a growing catalog of home and kitchen products.`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
  ];

  // First orders milestone — only add if different from founded year
  if (firstOrderYear > foundedYear) {
    items.push({
      year: String(firstOrderYear),
      title: "First Orders",
      desc: `Customers started placing orders, marking the beginning of our active sales journey across the Philippines.`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    });
  }

  // Catalog milestone — show current category spread
  const catalogYear = Math.max(firstOrderYear, foundedYear + 1);
  items.push({
    year: String(catalogYear),
    title: "Catalog Expanded",
    desc: `Grew to ${categories} product ${categories === 1 ? "category" : "categories"} — ${listCategories(categoryNames)} — offering a wider selection for every home.`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  });

  // Customer milestone
  if (customers > 0) {
    items.push({
      year: String(latestOrderYear),
      title: `${customers.toLocaleString()} Customers`,
      desc: `Reached ${customers.toLocaleString()} registered customers and ${products.toLocaleString()} products listed — a testament to the trust our community places in us.`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    });
  }

  // Deduplicate by year — keep last entry per year
  const seen = new Map<string, typeof items[number]>();
  for (const item of items) seen.set(item.year, item);
  return Array.from(seen.values()).sort((a, b) => Number(a.year) - Number(b.year));
}

// Skeleton placeholder items shown while loading
const TIMELINE_SKELETON = [
  { year: "····", title: "Loading…", desc: "" },
  { year: "····", title: "Loading…", desc: "" },
  { year: "····", title: "Loading…", desc: "" },
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
    name: "John Ralph P. Bone",
    role: "Lead Full-Stack Engineer",
    initial: "J",
    bio: "Architected and built the core platform — from the database schema and REST API to the React frontend, admin panel, and checkout flow. The primary driver behind ApplianSys.",
    highlight: true,
  },
  {
    name: "Jelaine Lutaro",
    role: "Full-Stack Developer",
    initial: "J",
    bio: "Co-led development across the entire stack, owning key features including the cart system, order management, and the AI chat assistant integration.",
    highlight: true,
  },
  {
    name: "Harvey Belleza",
    role: "Frontend Engineer",
    initial: "H",
    bio: "Built and refined the customer-facing UI components, product catalog pages, and responsive layouts across the storefront.",
  },
  {
    name: "Arabella Briongos",
    role: "UI/UX Designer & Frontend Developer",
    initial: "A",
    bio: "Designed the visual identity, component library, and user experience flows — translating wireframes into polished, accessible interfaces.",
  },
  {
    name: "Emmanuel Jacob Nedia",
    role: "Backend Developer & QA Engineer",
    initial: "E",
    bio: "Developed backend services and API routes, and led quality assurance efforts — writing tests and ensuring reliability across the platform.",
  },
];

function AboutPage() {
  const [stats, setStats] = useState<SiteStats | null>(null);

  useEffect(() => {
    void fetchSiteStats().then(setStats).catch(() => {
      // Fall back to nulls — UI shows "—" placeholders
    });
  }, []);

  function formatCount(n: number | undefined) {
    if (n === undefined) return "—";
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k+`;
    return String(n);
  }

  const liveStats = [
    { value: formatCount(stats?.products),   label: "Products Listed" },
    { value: formatCount(stats?.customers),  label: "Happy Customers" },
    { value: formatCount(stats?.categories), label: "Product Categories" },
  ];

  const timeline = stats ? buildTimeline(stats) : null;
  const isLoading = stats === null;
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
                <strong>{formatCount(stats?.customers)}</strong>
                <span>Happy Customers</span>
              </div>
            </div>

            <div className="about-hero__float">
              <div className="about-hero__float-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              </div>
              <div className="about-hero__float-text">
                <strong>{formatCount(stats?.products)}</strong>
                <span>Products Listed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="about-stats" aria-label="Key statistics">
        {liveStats.map((s) => (
          <div key={s.label} className={`about-stat${stats === null ? " about-stat--loading" : ""}`}>
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
            brands and everyday consumers — offering a curated selection across{" "}
            {stats ? (
              <strong>{stats.categories} {stats.categories === 1 ? "category" : "categories"}</strong>
            ) : (
              <span className="about-story__inline-skeleton" aria-hidden />
            )}{" "}
            with honest product information and a seamless shopping experience.
          </p>
          <p className="about-story__body">
            With{" "}
            {stats ? (
              <strong>{stats.products.toLocaleString()} products</strong>
            ) : (
              <span className="about-story__inline-skeleton" aria-hidden />
            )}{" "}
            and{" "}
            {stats ? (
              <strong>{stats.customers.toLocaleString()} customers</strong>
            ) : (
              <span className="about-story__inline-skeleton" aria-hidden />
            )}{" "}
            served, we're here to guide you every step of the way — whether
            you're upgrading your kitchen, refreshing your living room, or
            outfitting a new home.
          </p>
        </div>

        <div>
          <span className="about-eyebrow">Our Journey</span>
          <h2 className="about-section-title">How We Got Here</h2>
          <div className={`about-timeline${isLoading ? " about-timeline--loading" : ""}`}>
            {(timeline ?? TIMELINE_SKELETON).map((item, i) => (
              <div key={`${"year" in item ? item.year : i}-${i}`} className="about-timeline__item">
                <div className="about-timeline__dot">
                  {"icon" in item && item.icon ? item.icon : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  )}
                </div>
                <div className="about-timeline__body">
                  <p className="about-timeline__year">{item.year}</p>
                  <h3 className="about-timeline__title">{item.title}</h3>
                  {item.desc && <p className="about-timeline__desc">{item.desc}</p>}
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
            <div key={m.name} className={`about-team-card${m.highlight ? " about-team-card--highlight" : ""}`}>
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
            Browse {stats ? stats.products.toLocaleString() : "thousands of"} products
            across {stats ? stats.categories : ""} {stats?.categories === 1 ? "category" : "categories"} — all in one place,
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
