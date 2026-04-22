import type { AppUser } from "@/shared/lib/auth";
import { Link } from "react-router-dom";
import { isAdminUser } from "@/features/admin";
import "@/shared/styles/Cart.css";

type CartPageProps = {
  user: AppUser | null;
  onAuthOpen: () => void;
};

function CartPage({ user, onAuthOpen }: CartPageProps) {
  if (!user) {
    return (
      <div className="cart-auth-wall">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <h2 className="cart-auth-wall__title">Sign in to view your cart</h2>
        <p className="cart-auth-wall__sub">You need to be logged in to access your shopping cart.</p>
        <button type="button" className="cart-auth-wall__btn" onClick={onAuthOpen}>
          Sign in / Log in
        </button>
      </div>
    );
  }

  if (isAdminUser(user)) {
    return (
      <div className="cart-auth-wall">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4 6 4v14"/>
          <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>
        </svg>
        <h2 className="cart-auth-wall__title">Admins cannot use the shopping cart</h2>
        <p className="cart-auth-wall__sub">
          Admin accounts are restricted to platform duties. Use the admin panel to manage the storefront.
        </p>
        <Link to="/admin" className="cart-auth-wall__btn cart-auth-wall__btn-link">
          Open Admin Panel
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-page__title">Shopping Cart</h1>

      <div className="cart-empty">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <p className="cart-empty__text">Your cart is empty.</p>
        <Link to="/" className="cart-actions__continue">Continue Shopping</Link>
      </div>
    </div>
  );
}

export default CartPage;
