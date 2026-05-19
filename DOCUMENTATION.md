# Project Documentation

## Overview

ApplianSys is a full-stack appliance e-commerce application split into two runtime layers:

- Frontend: React + Vite SPA in `src/`
- Backend: Express + TypeScript REST API in `backend/`

The storefront renders through the frontend. Dynamic data flows through the backend for auth, catalog data, cart, checkout, orders, admin workflows, stats, and chat.

## Runtime Architecture

### Frontend

Entry points:

| File | Purpose |
| --- | --- |
| `src/app/main.tsx` | React DOM root mount |
| `src/app/providers/AppProviders.tsx` | BrowserRouter, Redux Provider, MUI ThemeProvider |
| `src/app/App.tsx` | Top-level composition: header, main content, chat widget, auth modal |
| `src/app/components/AppRoutes.tsx` | Route mapping |
| `src/app/components/AppHeader.tsx` | Header composition |
| `src/app/hooks/useAuthUser.ts` | App-wide auth subscription hook |
| `src/theme/index.ts` | MUI theme |

Feature layout:

```text
src/features/<feature>/
|-- index.ts
|-- pages/
|-- components/
|-- hooks/
`-- lib/
```

Current frontend features:

| Feature | Route(s) | Notes |
| --- | --- | --- |
| `search` | `/` | Home/search page with hero, catalog stats, best-selling products, and category tiles |
| `category` | `/category/:categorySlug`, `/category/:categorySlug/:subSlug`, `/category/:categorySlug/:subSlug/:subSubSlug` | Product grid with category navigation, sorting, and pagination controls |
| `product` | `/product/:productId` | Gallery, pricing, stock state, quantity selector, add-to-cart, related products |
| `cart` | `/cart` | Customer-only database-backed cart |
| `orders` | `/orders` | Customer order history and cancellation |
| `payment` | `/mock-gcash-payment` | Mock GCash payment experience |
| `settings` | `/settings` | Customer account profile and preferences |
| `about` | `/about` | About page using public stats |
| `admin` | `/admin` | Admin/staff panel for dashboard, products, orders, pickup releases, settings, account |

Shared layer:

```text
src/shared/
|-- assets/images/          Static images
|-- components/             Auth modal, checkout modal, chatbot, shared auth UI
|-- hooks/                  Shared hooks such as useChatbot
|-- lib/                    API clients and helpers
`-- styles/                 Global and feature CSS files
```

Important shared API clients:

| File | Purpose |
| --- | --- |
| `src/shared/lib/http.ts` | JSON request helper with `credentials: include` |
| `src/shared/lib/auth.ts` | Session state and auth/account API client |
| `src/shared/lib/cartApi.ts` | Cart API client |
| `src/shared/lib/checkoutApi.ts` | Checkout and mock GCash API client |
| `src/shared/lib/ordersApi.ts` | Customer orders API client |
| `src/shared/lib/statsApi.ts` | Site stats and best-selling products client |
| `src/shared/lib/chat.ts` | Chat API client |
| `src/features/category/lib/catalogApi.ts` | Public catalog client |
| `src/features/admin/lib/adminApi.ts` | Admin API client |

Styling:

- Primary styling is hand-written CSS under `src/shared/styles/`.
- MUI is installed and used through `ThemeProvider`; MUI icons appear in the admin UI.
- Tailwind v4 is installed but not the main component styling approach.
- Global CSS variables live primarily in `src/shared/styles/App.css`.

Redux:

- Store setup is in `src/app/store/index.ts`.
- Typed hooks are in `src/app/store/hooks.ts`.
- The current store has a placeholder reducer and no feature slices yet.

### Backend

Entry points:

| File | Purpose |
| --- | --- |
| `backend/src/server.ts` | Starts the HTTP server |
| `backend/src/app.ts` | Express setup: CORS, JSON parser, static uploads, API router, error handler |
| `backend/src/routes/index.ts` | Mounts all API sub-routers |
| `backend/src/config/env.ts` | Reads environment variables |
| `backend/src/config/database.ts` | MySQL connection pool and DB test helper |

Backend layout:

```text
backend/src/
|-- auth/                  Session, password, user, account ID, middleware helpers
|-- config/                Environment and database setup
|-- data/                  Admin settings JSON store
|-- routes/                Express route handlers
|-- scripts/               Seed and migration utilities
`-- services/              Business logic grouped by domain
```

Route layer:

| Router | Mounted at | Guard |
| --- | --- | --- |
| `auth.ts` | `/api/auth` | Public route handlers with per-endpoint account checks |
| `chat.ts` | `/api/chat` | Public |
| `products.ts` | `/api` | Public |
| `stats.ts` | `/api` | Public |
| `cart.ts` | `/api/cart` | `requireAuthenticated`, then customer-only checks |
| `checkout.ts` | `/api/checkout` | `requireAuthenticated`, then customer-only checks |
| `orders.ts` | `/api/orders` | `requireAuthenticated`, then customer-only checks |
| `admin.ts` | `/api/admin` | `requireAdmin` |

Service layer:

```text
backend/src/services/
|-- admin/                 Product/category CRUD, orders, pickup releases, reports
|-- auth/                  Local auth, registration, profile updates, password changes
|-- cart/                  Cart CRUD
|-- chat/                  Message validation, OpenAI call, fallback response
|-- checkout/              Order placement for delivery and pickup
`-- orders/                Customer order history and cancellation
```

Auth layer:

| File | Responsibility |
| --- | --- |
| `backend/src/auth/session.ts` | In-memory session store and cookie read/write/clear helpers |
| `backend/src/auth/password.ts` | `scrypt` hash and verification helpers |
| `backend/src/auth/users.ts` | User queries, role checks, profile mapping |
| `backend/src/auth/accountId.ts` | Public account ID generation |
| `backend/src/auth/middleware.ts` | `requireAuthenticated` and `requireAdmin` middleware |

File-backed data:

- `backend/data/admin-settings.json` stores platform settings such as site name, currency, tax rate, delivery rate, maintenance mode, and notification toggles.

Product image storage:

- Product images are written under `backend/uploads/products/`.
- Express serves them at `/api/uploads/products/<filename>`.
- Admin forms submit either an existing `/api/uploads/products/...` path or a base64 image data URI.

## Database

The schema lives in `database/appliansysdb.sql`. The default database name is `appliansys_db`.

Key tables:

| Table | Description |
| --- | --- |
| `USER` | Customers, staff, and admins. `user_id` is internal; `account_id` is public. |
| `CUSTOMER_USER` | Customer-specific fields such as address data. |
| `STAFF_USER` | Staff-specific fields. |
| `CATEGORY` | Top-level product categories. |
| `SUBCATEGORY` | Subcategories under categories. |
| `SUB_SUBCATEGORY` | Third-level product categorization. |
| `PRODUCT` | Products and catalog metadata. |
| `INVENTORY` | Product stock and status. |
| `CART` | One cart per customer user. |
| `CART_ITEM` | Cart line items with quantity and price at time of add. |
| `orders` | Customer orders. |
| `order_item` | Order line items. |
| `PAYMENT_DETAILS` | Payment method and status records. |
| `DELIVERY` | Delivery details per order. |
| `PICKUP` | Pickup details per order. |
| `PROMO` | Promotional codes. |

Product ID format:

- The database stores numeric `product_id` values.
- Frontend/API display IDs as `PRD-001`, `PRD-002`, and so on.
- Some API payloads include `dbId` for operations that need the numeric ID.

## Environment Configuration

### Root `.env`

Source template: `.env.example`.

```env
VITE_ADMIN_EMAILS=admin@appliansys.com
VITE_API_PROXY_TARGET=http://127.0.0.1:4000
```

`VITE_*` values are exposed to the browser bundle. Do not put secrets in the root env file.

### `backend/.env`

Source template: `backend/.env.example`.

```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=appliansys_db
DB_USER=root
DB_PASSWORD=
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

The backend reads `ADMIN_EMAILS` first and falls back to `VITE_ADMIN_EMAILS`.

## Development Workflow

Install:

```bash
npm install
npm run install:backend
```

Run:

```bash
npm run dev             # backend + frontend
npm run start           # frontend only
npm run start:backend   # backend only
```

Build and checks:

```bash
npm run build
npm run lint
npm --prefix backend run build
```

Utilities:

```bash
npm --prefix backend run seed
npm --prefix backend run hash:password -- <password>
npm --prefix backend run migrate:passwords
npm --prefix backend run migrate:account-ids
```

## Request Flow

During local development:

1. The browser requests a frontend route or `/api/...`.
2. Vite serves frontend assets.
3. Vite proxies `/api/...` to `VITE_API_PROXY_TARGET`.
4. Express validates the request and calls the domain service.
5. Services query MySQL, read/write files, manage sessions, or call OpenAI.
6. The route layer maps service results to JSON responses.

## Feature Details

### Product Catalog

- `GET /api/products` returns products with category, subcategory, sub-subcategory, price, stock, status, and image URL.
- `GET /api/categories` returns the category tree.
- Category routes support top-level, subcategory, and sub-subcategory browsing.
- Product cards link to `/product/:productId`.

### Product Detail

Route: `/product/:productId`

- Fetches catalog data and finds the selected product by display ID.
- Shows image gallery, category badges, price, stock badge, description, quantity selector, related products, and product metadata.
- Add to Cart is customer-only and disabled for out-of-stock products.

### Cart

Route: `/cart`

- Requires a customer session.
- Each customer has one `CART` row, created lazily.
- `CART_ITEM` stores quantity and price at time of add.
- Quantity and remove actions call the live cart API.

### Checkout and Payment

Routes: `/cart`, `/mock-gcash-payment`

- Checkout supports `delivery` and `pickup` fulfillment methods.
- Delivery requires street, barangay, city, province, latitude, and longitude inside the configured Albay delivery bounds.
- Delivery payment methods are GCash and Cash on Delivery.
- Pickup payment methods are GCash and Pay on Pick Up.
- Mock GCash confirmation email output is logged to the backend console.

### Orders

Route: `/orders`

- Customer-only order history.
- Supports cancellation through `POST /api/orders/:orderId/cancel`.

### Admin Panel

Route: `/admin`

Sections:

| Section | Description |
| --- | --- |
| Dashboard | Revenue, metrics, recent orders, sales report |
| Products | Product table, create/edit/delete, category manager |
| Orders | Order list and status updates |
| Pickup Release | Pending pickup orders and release workflow |
| Platform Settings | Site, currency, tax, delivery, maintenance, notifications |
| Account Settings | Admin/staff profile and password update |

Admin/staff access is derived from database role checks. Some category mutations require a true admin user.

### Authentication

- Cookie: `appliansys_session`
- Cookie settings: HttpOnly, SameSite=Lax, 7-day TTL
- Session storage: in-memory backend map
- Password hashing: Node `scrypt`
- Roles: `customer`, `staff`, `admin`
- Default seeded password: `ApplianSys123!`

### Chat Assistant

- Frontend widget: `src/shared/components/ChatGPTBot.tsx`
- State hook: `src/shared/hooks/useChatbot.ts`
- API client: `src/shared/lib/chat.ts`
- Backend route: `POST /api/chat`
- Backend services: `backend/src/services/chat/`
- Missing OpenAI configuration returns a fallback response instead of crashing the UI.

## API Reference

### Public

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Service health check |
| GET | `/api/db-test` | Database connectivity check |
| GET | `/api/products` | Product catalog |
| GET | `/api/categories` | Category tree |
| GET | `/api/stats` | Public site stats |
| GET | `/api/best-selling` | Best-selling products |
| POST | `/api/chat` | Chat completions proxy |

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/auth/me` | Optional session | Current session user or null |
| POST | `/api/auth/login` | Public | Sign in |
| POST | `/api/auth/register` | Public | Register customer |
| POST | `/api/auth/logout` | Public | Clear session |
| GET | `/api/auth/account` | Session | Read profile |
| PUT | `/api/auth/account` | Session | Update profile |
| PUT | `/api/auth/password` | Session | Change password |

### Cart

All cart endpoints require a customer session.

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| GET | `/api/cart` | None | Get cart items |
| POST | `/api/cart/items` | `{ productId, quantity }` | Add item or increase quantity |
| PATCH | `/api/cart/items/:productId` | `{ quantity }` | Set exact quantity |
| DELETE | `/api/cart/items/:productId` | None | Remove item |

### Checkout

All checkout endpoints require a customer session.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/checkout` | Place an order from the current cart |
| GET | `/api/checkout/settings` | Read delivery rate and shop location |
| POST | `/api/checkout/mock-gcash/email` | Log a mock purchase confirmation email |

Example checkout body:

```json
{
  "fulfillment": {
    "method": "delivery",
    "street": "Rizal St.",
    "barangay": "Centro",
    "city": "Legazpi",
    "province": "Albay",
    "latitude": 13.1391,
    "longitude": 123.7438
  },
  "paymentMethod": "cash_on_delivery"
}
```

### Orders

All customer order endpoints require a customer session.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/orders` | Customer order history |
| POST | `/api/orders/:orderId/cancel` | Cancel an order |

### Admin

All admin endpoints require an admin or staff session.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/dashboard?period=weekly|monthly|yearly` | Dashboard payload |
| GET | `/api/admin/products` | Product list |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:productId` | Update product |
| DELETE | `/api/admin/products/:productId` | Delete product |
| GET | `/api/admin/categories` | Category tree |
| POST | `/api/admin/categories` | Create category and subcategory |
| DELETE | `/api/admin/categories/:categoryId` | Delete category |
| POST | `/api/admin/subcategories/:subcategoryId/sub-subcategories` | Add sub-subcategory |
| DELETE | `/api/admin/subcategories/:subcategoryId` | Delete subcategory |
| DELETE | `/api/admin/sub-subcategories/:subSubcategoryId` | Delete sub-subcategory |
| GET | `/api/admin/orders` | Order list |
| PATCH | `/api/admin/orders/:orderId/status` | Update order status |
| GET | `/api/admin/pickup-releases` | Pending pickup releases |
| POST | `/api/admin/pickup-releases/:orderId/release` | Release pickup order |
| GET | `/api/admin/settings` | Platform settings |
| PUT | `/api/admin/settings` | Update platform settings |
| GET | `/api/admin/reports/sales?period=...` | Sales report |

## Troubleshooting

### Proxy errors

```text
http proxy error: /api/admin/dashboard
connect ECONNREFUSED 127.0.0.1:4000
```

The frontend is running but the backend is not reachable.

- Start the backend with `npm run start:backend`.
- Confirm `VITE_API_PROXY_TARGET` matches the backend address.
- Confirm `PORT` in `backend/.env` matches the proxy target port.

### Backend 500 errors

Common causes are wrong database credentials, missing schema, or query errors.

- Check `GET http://127.0.0.1:4000/api/health`.
- Check `GET http://127.0.0.1:4000/api/db-test`.
- Inspect the backend terminal stack trace.

### Cart, checkout, or orders return 401

- The user is not signed in, the session expired, or the backend restarted.
- Admin/staff accounts cannot use customer-only endpoints.

### Chat returns fallback text

- `OPENAI_API_KEY` may be missing or invalid.
- The backend intentionally returns fallback chat content rather than failing the widget.
