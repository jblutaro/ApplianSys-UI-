# Changelog

All notable changes to this project are documented here.
Update this file whenever code changes are merged.

---

## v1.3.0
### Added
- **Cart feature** — fully functional, account-specific shopping cart backed by the database
  - `backend/src/services/cart/cart.ts` — service layer: `ensureCart`, `getCartItems`, `upsertCartItem`, `updateCartItemQuantity`, `removeCartItem`
  - `backend/src/routes/cart.ts` — REST endpoints: `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:productId`, `DELETE /api/cart/items/:productId`
  - Cart routes mounted at `/api/cart` behind `requireAuthenticated` middleware
  - Admin and staff sessions are rejected from cart endpoints (customer-only)
  - `CART` row is created lazily on first add-to-cart per user
  - `CART_ITEM` stores quantity and price at time of add; composite PK `(cart_id, product_id)`
  - `src/shared/lib/cartApi.ts` — typed frontend API client (`fetchCart`, `addToCart`, `updateCartQuantity`, `removeFromCart`)
- **CartPage** — replaced stub with live cart UI
  - Fetches items from the database on mount
  - Quantity +/− controls call `PATCH /api/cart/items/:productId`
  - Remove button calls `DELETE /api/cart/items/:productId`
  - Per-item controls disabled while their request is in flight
  - Stock warnings shown for low-stock and out-of-stock items
  - Subtotal calculated client-side from `price × quantity`
  - Product name links back to the product detail page
  - Auth wall for guests; restriction notice for admin/staff
- **Add to Cart on ProductDetailPage** — wired to the real API
  - Spinner during request, checkmark confirmation on success, inline error on failure
  - Unauthenticated users see "Sign in to Add to Cart" and are redirected to `/cart`
  - Disabled for out-of-stock products and admin/staff accounts

---

## v1.2.0
### Added
- **Product detail page** (`/product/:productId`)
  - `src/features/product/pages/ProductDetailPage.tsx`
  - `src/features/product/index.ts`
  - `src/shared/styles/Product.css`
  - Sticky product image gallery with hover zoom
  - Category, subcategory, and sub-subcategory badges
  - Price display, stock badge (In Stock / Low Stock / Out of Stock)
  - Quantity selector capped at available stock
  - Add to Cart and Buy Now CTA buttons
  - Product meta panel (ID, category, subcategory, type, availability)
  - Related products grid (up to 4 from the same category)
  - Breadcrumb navigation
  - Shimmer skeleton loader, error state, and not-found state
- **Route** `/product/:productId` added to `AppRoutes.tsx`
- **Category page product cards** now link to `/product/:productId`

---

## v1.1.0
### Added
- Category browse page (`/category/:categorySlug`, `/category/:categorySlug/:subSlug`)
  - Sidebar with subcategory links
  - Product grid (3 columns) with sort and per-page controls
  - Breadcrumb navigation
  - `src/shared/styles/Category.css`
- Public catalog API endpoints
  - `GET /api/products` — all products with category, stock, and image
  - `GET /api/categories` — full category tree
  - `src/features/category/lib/catalogApi.ts`
- Admin panel (`/admin`)
  - Dashboard with revenue chart, metrics, recent orders, and sales report
  - Products section — table with search/sort, create/edit/delete form, category manager
  - Orders section — table with status update controls
  - Platform settings — site name, currency, tax rate, maintenance mode, notification toggles
  - Admin account settings — profile edit and password change
  - `src/features/admin/` — pages, components, hooks, lib
  - `backend/src/routes/admin*.ts` and `backend/src/services/admin/*`
  - Platform settings persisted to `backend/data/admin-settings.json`
  - Product images stored under `backend/uploads/products/`
- Auth system
  - Session-cookie auth (in-memory, 7-day TTL, HttpOnly)
  - scrypt password hashing
  - Register, login, logout, account profile, password change
  - `backend/src/auth/` and `backend/src/services/auth/`
  - ULID-based public `account_id` in `USER` table
  - Legacy plain-text password upgrade on login
  - Role-based access: `customer`, `staff`, `admin`
  - Admin access by `user_type`, `VITE_ADMIN_EMAILS`, or `admin*` email prefix
- Customer settings page (`/settings`) — account profile and preferences
- Orders page (`/orders`) — auth wall for guests, stub for customers
- Header user avatar and dropdown menu
- Auth modal — sign-in and register forms
- Migration scripts: `migrate:passwords`, `migrate:account-ids`
- Utility script: `hash:password`

---

## v1.0.0
### Added
- Home/search landing page with hero banner and category tiles
- About page with static content
- Cart placeholder page
- Floating ChatGPT assistant widget (calls OpenAI via backend proxy)
- React + TypeScript + Vite (SWC) app setup
- Redux Toolkit store and React Router
- MUI + Emotion styling
- Tailwind CSS tooling
- ESLint and Prettier scripts
- VS Code extension recommendations
