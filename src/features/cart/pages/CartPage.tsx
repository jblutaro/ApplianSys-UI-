import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AppUser } from "@/shared/lib/auth";
import {
  fetchCart,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "@/shared/lib/cartApi";
import { isAdminUser } from "@/features/admin";
import { CheckoutModal } from "@/shared/components/CheckoutModal";
import "@/shared/styles/Cart.css";

type CartPageProps = {
  user: AppUser | null;
  onAuthOpen: () => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(value);
}

/* ── Skeleton rows shown while loading ── */
function CartSkeleton() {
  return (
    <div className="cart-skeleton">
      {[1, 2, 3].map((n) => (
        <div key={n} className="cart-skeleton__item">
          <div className="cart-skeleton__block cart-skeleton__img" />
          <div className="cart-skeleton__lines">
            <div className="cart-skeleton__block cart-skeleton__line" style={{ width: "70%" }} />
            <div className="cart-skeleton__block cart-skeleton__line" style={{ width: "40%" }} />
            <div className="cart-skeleton__block cart-skeleton__line" style={{ width: "55%" }} />
          </div>
          <div className="cart-skeleton__block cart-skeleton__price" />
        </div>
      ))}
    </div>
  );
}

function CartPage({ user, onAuthOpen }: CartPageProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const isCustomer = user && !isAdminUser(user);

  const loadCart = () => {
    if (!isCustomer) return;

    setIsLoading(true);
    setErrorMessage("");

    void (async () => {
      try {
        const cartItems = await fetchCart();
        setItems(cartItems);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load cart.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  };

  useEffect(() => {
    void Promise.resolve().then(loadCart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer]);

  useEffect(() => {
    const handleCheckoutCompleted = (event: StorageEvent) => {
      if (event.key !== "appliansys:checkout-completed") return;

      setCheckoutOpen(false);
      setItems([]);
      void navigate("/orders");
    };

    window.addEventListener("storage", handleCheckoutCompleted);
    return () => window.removeEventListener("storage", handleCheckoutCompleted);
  }, [isCustomer, navigate]);

  const setPending = (productId: number, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  };

  const handleQuantityChange = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1 || newQty > item.stock) return;
    setPending(item.productId, true);
    try {
      const updated = await updateCartQuantity(item.productId, newQty);
      setItems(updated);
    } catch {
      /* keep current state */
    } finally {
      setPending(item.productId, false);
    }
  };

  const handleRemove = async (productId: number) => {
    setPending(productId, true);
    try {
      const updated = await removeFromCart(productId);
      setItems(updated);
    } catch {
      /* keep current state */
    } finally {
      setPending(productId, false);
    }
  };

  const totalItems = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal;

  /* ── Not signed in ── */
  if (!user) {
    return (
      <div className="cart-auth-wall">
        <div className="cart-auth-wall__icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <h2 className="cart-auth-wall__title">Your cart is waiting</h2>
        <p className="cart-auth-wall__sub">
          Sign in to view your saved items and continue shopping where you left off.
        </p>
        <button type="button" className="cart-auth-wall__btn" onClick={onAuthOpen}>
          Sign in to continue
        </button>
      </div>
    );
  }

  /* ── Admin / staff ── */
  if (isAdminUser(user)) {
    return (
      <div className="cart-auth-wall">
        <div className="cart-auth-wall__icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4 6 4v14" />
            <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
          </svg>
        </div>
        <h2 className="cart-auth-wall__title">Management accounts can&apos;t shop</h2>
        <p className="cart-auth-wall__sub">
          Admin and staff accounts are for managing the storefront. Use the admin panel to manage products and orders.
        </p>
        <Link to="/admin" className="cart-auth-wall__btn">
          Go to Admin Panel
        </Link>
      </div>
    );
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <h1 className="cart-header__title">Shopping Cart</h1>
        </div>
        <div className="cart-layout">
          <CartSkeleton />
          <div />
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (errorMessage) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <h1 className="cart-header__title">Shopping Cart</h1>
        </div>
        <div className="cart-error-state">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <h2 className="cart-error-state__title">Couldn&apos;t load your cart</h2>
          <p className="cart-error-state__text">{errorMessage}</p>
          <button type="button" className="cart-error-state__retry" onClick={loadCart}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <h1 className="cart-header__title">Shopping Cart</h1>
        </div>
        <div className="cart-empty-state">
          <div className="cart-empty-state__icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h2 className="cart-empty-state__title">Your cart is empty</h2>
          <p className="cart-empty-state__sub">
            Looks like you haven&apos;t added anything yet. Browse our catalog and find something you&apos;ll love.
          </p>
          <Link to="/" className="cart-empty-state__btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  /* ── Cart with items ── */
  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1 className="cart-header__title">Shopping Cart</h1>
        <span className="cart-header__count">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="cart-layout">
        {/* ── Left: item list ── */}
        <div>
          <div className="cart-items-panel">
            <div className="cart-items-panel__header">
              <span className="cart-items-panel__label">Your Items</span>
            </div>

            <ul role="list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {items.map((item) => {
                const isPending = pendingIds.has(item.productId);
                const isOutOfStock =
                  item.stock === 0 || item.status.toLowerCase() === "out of stock";
                const isLowStock = !isOutOfStock && item.stock <= 5;
                const productPath = `/product/PRD-${String(item.productId).padStart(3, "0")}`;

                return (
                  <li
                    key={item.productId}
                    className={`cart-item${isPending ? " cart-item--pending" : ""}`}
                  >
                    {/* Image */}
                    <Link to={productPath} className="cart-item__img" tabIndex={-1} aria-hidden>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} />
                      ) : (
                        <svg className="cart-item__img-placeholder-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="cart-item__info">
                      <Link to={productPath} className="cart-item__name">
                        {item.productName}
                      </Link>
                      <span className="cart-item__unit-price">
                        {formatCurrency(item.price)} each
                      </span>
                      <div className="cart-item__badges">
                        {isOutOfStock ? (
                          <span className="cart-item__badge cart-item__badge--out">
                            Out of stock
                          </span>
                        ) : isLowStock ? (
                          <span className="cart-item__badge cart-item__badge--low">
                            Only {item.stock} left
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="cart-item__controls">
                      <span className="cart-item__line-price">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      <div className="cart-item__qty" aria-label={`Quantity for ${item.productName}`}>
                        <button
                          type="button"
                          className="cart-item__qty-btn"
                          aria-label="Decrease quantity"
                          disabled={isPending || item.quantity <= 1}
                          onClick={() => void handleQuantityChange(item, -1)}
                        >
                          −
                        </button>
                        <span className="cart-item__qty-val">{item.quantity}</span>
                        <button
                          type="button"
                          className="cart-item__qty-btn"
                          aria-label="Increase quantity"
                          disabled={isPending || item.quantity >= item.stock}
                          onClick={() => void handleQuantityChange(item, 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-item__remove"
                        aria-label={`Remove ${item.productName}`}
                        disabled={isPending}
                        onClick={() => void handleRemove(item.productId)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ── Right: order summary ── */}
        <div className="cart-summary">
          <div className="cart-summary__card">
            <h2 className="cart-summary__title">Order Summary</h2>

            <div className="cart-summary__rows">
              <div className="cart-summary__row">
                <span>Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                <span className="cart-summary__row-val">{formatCurrency(subtotal)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Shipping</span>
                <span className="cart-summary__row-val">Calculated at checkout</span>
              </div>
              <div className="cart-summary__row cart-summary__row--total">
                <span>Total</span>
                <span className="cart-summary__row-val">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="button"
              className="cart-summary__checkout"
              onClick={() => setCheckoutOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="1" y="3" width="15" height="13" rx="1" />
                <path d="M16 8h4l3 5v3h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              Proceed to Checkout
            </button>

            <Link to="/" className="cart-summary__continue">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Continue Shopping
            </Link>
          </div>

          {/* Trust badges */}
          <div className="cart-summary__card cart-trust">
            <div className="cart-trust__item">
              <div className="cart-trust__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="cart-trust__text">
                <strong>Secure Checkout</strong>
                <span>Your data is always protected</span>
              </div>
            </div>
            <div className="cart-trust__item">
              <div className="cart-trust__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <path d="M16 8h4l3 5v3h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div className="cart-trust__text">
                <strong>Fast Delivery</strong>
                <span>Free on orders over ₱2,000</span>
              </div>
            </div>
            <div className="cart-trust__item">
              <div className="cart-trust__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </div>
              <div className="cart-trust__text">
                <strong>Easy Returns</strong>
                <span>30-day hassle-free returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {checkoutOpen ? (
        <CheckoutModal
          items={items}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => {
            setItems([]);
          }}
        />
      ) : null}
    </div>
  );
}

export default CartPage;
