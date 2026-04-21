import "@/shared/styles/App.css";
import { useEffect, useRef, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";

import { AboutPage } from "@/features/about";
import { AdminPage, isAdminUser } from "@/features/admin";
import { CartPage } from "@/features/cart";
import { CategoryPage } from "@/features/category";
import { OrdersPage } from "@/features/orders";
import { SearchPage } from "@/features/search";
import { AuthModal } from "@/shared/components/AuthModal";
import ChatGPTBot from "@/shared/components/ChatGPTBot";
import { signOutUser, subscribeAuthState, type AppUser } from "@/shared/lib/auth";
import { useLocation } from "react-router-dom";

function UserAvatar({ user }: { user: AppUser }) {
  const letter = (user.displayName || user.email || "U")[0].toUpperCase();
  if (user.photoURL) {
    return <img src={user.photoURL} alt={letter} className="user-avatar__img" />;
  }
  return <span className="user-avatar__letter">{letter}</span>;
}

function NavCartLink({ user, onAuthOpen }: { user: AppUser | null; onAuthOpen: () => void }) {
  const navigate = useNavigate();
  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      onAuthOpen();
    } else {
      void navigate("/cart");
    }
  };
  return (
    <Link to="/cart" className="cartButton" onClick={handleClick}>
      Cart
    </Link>
  );
}

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const canAccessAdmin = isAdminUser(user);

  useEffect(() => {
    return subscribeAuthState(setUser);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOutUser();
  };

  const handleAuthenticated = (authenticatedUser: AppUser | null) => {
    if (authenticatedUser?.role === "admin") {
      void navigate("/admin");
    }
  };

  return (
    <div>
      {!isAdminRoute ? (
        <header className="header">
          <h1>ApplianSys</h1>

          <input
            type="text"
            placeholder="Search for appliances..."
            className="search-box"
          />

          <nav className="navButton">
            <Link to="/" className="homeButton">Home</Link>
            {" | "}
            <Link to="/about" className="aboutButton">About</Link>
            {" | "}
            <NavCartLink user={user} onAuthOpen={() => setAuthOpen(true)} />
          </nav>

          {user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                type="button"
                className="user-avatar"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
              >
                <UserAvatar user={user} />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown__header">
                    <div className="user-dropdown__info">
                      <span className="user-dropdown__name">
                        {user.displayName || "User"}
                      </span>
                      <span className="user-dropdown__email">{user.email}</span>
                    </div>
                  </div>

                  <div className="user-dropdown__divider" />

                  {canAccessAdmin ? (
                    <button
                      type="button"
                      className="user-dropdown__item"
                      onClick={() => { setDropdownOpen(false); void navigate("/admin"); }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 21h18"/><path d="M5 21V7l8-4 6 4v14"/><path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/></svg>
                      Admin Panel
                    </button>
                  ) : null}

                  <button type="button" className="user-dropdown__item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Settings
                  </button>

                  <button type="button" className="user-dropdown__item" onClick={() => { setDropdownOpen(false); void navigate("/orders"); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
                    Orders
                  </button>

                  <button type="button" className="user-dropdown__item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    Help / Support
                  </button>

                  <div className="user-dropdown__divider" />

                  <button
                    type="button"
                    className="user-dropdown__item user-dropdown__item--logout"
                    onClick={() => { void handleSignOut(); }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="sign-in"
              onClick={() => setAuthOpen(true)}
            >
              Sign in
            </button>
          )}
        </header>
      ) : null}

      <main className={isAdminRoute ? "app-main app-main--admin" : "app-main"}>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/cart" element={<CartPage user={user} onAuthOpen={() => setAuthOpen(true)} />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/admin" element={<AdminPage user={user} onAuthOpen={() => setAuthOpen(true)} />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/category/:categorySlug/:subSlug" element={<CategoryPage />} />
        </Routes>
      </main>

      {!isAdminRoute ? <ChatGPTBot /> : null}

      <AuthModal
        open={authOpen}
        onAuthenticated={handleAuthenticated}
        onClose={() => setAuthOpen(false)}
        user={user}
      />
    </div>
  );
}

export default App;
