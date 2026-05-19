# Changelog

All notable changes to this project are documented here.
Update this file whenever code changes are merged.

---

## Unreleased

### Changed

- Updated `README.md`, `DOCUMENTATION.md`, and `backend/README.md` to match the current React/Vite frontend, Express backend, routes, scripts, checkout/order/payment flows, admin pickup release flow, stats endpoints, and environment setup.
- Replaced corrupted tree/list glyphs in documentation with ASCII-safe diagrams.

---

## v1.3.0

### Added

- Cart feature: fully functional, account-specific shopping cart backed by the database.
- `backend/src/services/cart/cart.ts`: service layer with `ensureCart`, `getCartItems`, `upsertCartItem`, `updateCartItemQuantity`, and `removeCartItem`.
- `backend/src/routes/cart.ts`: REST endpoints for `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:productId`, and `DELETE /api/cart/items/:productId`.
- Cart routes mounted at `/api/cart` behind `requireAuthenticated` middleware.
- Admin and staff sessions are rejected from cart endpoints.
- `CART` rows are created lazily on first add-to-cart per user.
- `CART_ITEM` stores quantity and price at time of add.
- `src/shared/lib/cartApi.ts`: typed frontend API client for fetch, add, update quantity, and remove actions.
- `CartPage`: replaced stub with live cart UI, database-backed items, quantity controls, remove actions, low-stock warnings, subtotal calculation, and product links.
- Product detail Add to Cart flow: real API integration, loading state, success confirmation, inline errors, guest handling, out-of-stock disabling, and admin/staff restrictions.

---

## v1.2.0

### Added

- Product detail page at `/product/:productId`.
- `src/features/product/pages/ProductDetailPage.tsx`.
- `src/features/product/index.ts`.
- `src/shared/styles/Product.css`.
- Sticky product image gallery with hover zoom.
- Category, subcategory, and sub-subcategory badges.
- Price display, stock badge, quantity selector, Add to Cart, and Buy Now actions.
- Product meta panel and related products grid.
- Breadcrumb navigation.
- Shimmer skeleton loader, error state, and not-found state.
- `/product/:productId` route in `AppRoutes.tsx`.
- Category page product cards link to product detail pages.

---

## v1.1.0

### Added

- Category browse page at `/category/:categorySlug` and `/category/:categorySlug/:subSlug`.
- Sidebar with subcategory links.
- Product grid with sort and per-page controls.
- Breadcrumb navigation.
- `src/shared/styles/Category.css`.
- Public catalog API endpoints: `GET /api/products` and `GET /api/categories`.
- `src/features/category/lib/catalogApi.ts`.
- Admin panel at `/admin`.
- Admin dashboard with revenue chart, metrics, recent orders, and sales report.
- Admin product table with search/sort, create/edit/delete form, and category manager.
- Admin orders table with status update controls.
- Platform settings for site name, currency, tax rate, maintenance mode, and notification toggles.
- Admin account settings for profile edits and password changes.
- `src/features/admin/`.
- `backend/src/routes/admin*.ts` and `backend/src/services/admin/*`.
- Platform settings persisted to `backend/data/admin-settings.json`.
- Product images stored under `backend/uploads/products/`.
- Auth system with session-cookie auth, `scrypt` password hashing, registration, login, logout, profile, password change, and roles.
- ULID-based public `account_id` in `USER`.
- Legacy plain-text password upgrade on login.
- Role-based access for `customer`, `staff`, and `admin`.
- Admin access by `user_type`, configured admin emails, or `admin*` email prefix.
- Customer settings page at `/settings`.
- Orders page at `/orders`.
- Header user avatar and dropdown.
- Auth modal with sign-in and register forms.
- Migration scripts: `migrate:passwords` and `migrate:account-ids`.
- Utility script: `hash:password`.

---

## v1.0.0

### Added

- Home/search landing page with hero banner and category tiles.
- About page with static content.
- Cart placeholder page.
- Floating ChatGPT assistant widget through the backend proxy.
- React + TypeScript + Vite app setup.
- Redux Toolkit store and React Router.
- MUI + Emotion styling.
- Tailwind CSS tooling.
- ESLint and Prettier scripts.
- VS Code extension recommendations.
