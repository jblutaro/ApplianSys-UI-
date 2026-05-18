# Project Documentation

## Overview

ApplianSys is a full-stack appliance e-commerce application split into two runtime layers:

- **Frontend** — React + Vite SPA in `src/`
- **Backend** — Express + TypeScript REST API in `backend/`

The storefront (home, category browse, product detail) renders without the backend for static content, but auth, cart, admin, and chat all require the backend and database to be running.

---

## Runtime Architecture

### Frontend

**Entry points**

| File                                   | Purpose                                                        |
| -------------------------------------- | -------------------------------------------------------------- |
| `src/app/main.tsx`                   | React DOM root mount                                           |
| `src/app/providers/AppProviders.tsx` | BrowserRouter, Redux Provider, MUI ThemeProvider               |
| `src/app/App.tsx`                    | Top-level composition — header, main, chat widget, auth modal |
| `src/app/components/AppRoutes.tsx`   | Route mapping only                                             |
| `src/app/components/AppHeader.tsx`   | Header composition                                             |
| `src/app/hooks/useAuthUser.ts`       | App-wide auth subscription hook                                |
| `src/theme/index.ts`                 | MUI theme (bare `createTheme`)                               |

**Feature structure**

Each feature under `src/features/` follows this layout:

```
src/features/<feature>/
├── index.ts          Public exports
├── pages/            Route-level containers
├── components/       Section or presentational UI
├── hooks/            Feature-scoped state orchestration
└── lib/              API clients, constants, utilities, guards
```

**Current features**

| Feature     | Route(s)                                                          | Notes                                                                                   |
| ------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `search`   | `/`                                                             | Home page — hero banner, category tiles with cycling product images                    |
| `category` | `/category/:categorySlug`, `/category/:categorySlug/:subSlug` | Product grid with sidebar, sort, and pagination controls                                |
| `product`  | `/product/:productId`                                           | Product detail page — gallery, price, quantity selector, Add to Cart, related products |
| `cart`     | `/cart`                                                         | Shopping cart — live DB-backed items, quantity controls, remove                        |
| `orders`   | `/orders`                                                       | Customer order history (stub)                                                           |
| `settings` | `/settings`                                                     | Customer account profile and preferences                                                |
| `about`    | `/about`                                                        | Static about page                                                                       |
| `admin`    | `/admin`                                                        | Admin panel — dashboard, products, orders, platform settings, account settings         |

**Shared layer (`src/shared/`)**

```
src/shared/
├── assets/images/          Static images (category icon, hero, search icon)
├── components/
│   ├── AuthModal.tsx        Auth modal coordinator (sign-in / register)
│   ├── ChatGPTBot.tsx       Floating chat widget
│   └── auth/
│       ├── AuthAccountPanel.tsx     Signed-in account view inside the modal
│       └── AuthCredentialsForm.tsx  Sign-in / register form
├── hooks/
│   └── useChatbot.ts        Chatbot state and submit orchestration
├── lib/
│   ├── auth.ts              Frontend auth client — session state emitter, sign-in/out/register
│   ├── cartApi.ts           Cart API client — fetch, add, update quantity, remove
│   ├── chat.ts              Chat API client and message types
│   └── http.ts              Shared JSON request wrapper (fetch + credentials: include)
└── styles/
    ├── App.css              Global CSS variables, header, home page, auth modal, user menu
    ├── Admin.css            Admin panel styles
    ├── About.css            About page styles
    ├── Cart.css             Cart page styles
    ├── Category.css         Category page and product card styles
    ├── ChatBot.css          Chat widget styles
    ├── index.css            Base reset
    ├── Orders.css           Orders page styles
    ├── Product.css          Product detail page styles
    └── Settings.css         Settings page styles
```

**Styling approach**

- Primary: hand-written CSS with CSS custom properties defined in `App.css`
- MUI is installed and wrapped via `ThemeProvider` but the theme is a bare `createTheme({})` — MUI icons are used in the admin panel
- Tailwind v4 is installed but not actively used in components
- Key CSS variables:

```css
--primary-gold: #aa6d27
--primary-gold-hover: #ca9355
--text-main: #1a1a1a
--text-muted: #666666
--bg-light: #fbfbfb
--bg-white: #ffffff
--card-shadow: 0 4px 20px rgba(0,0,0,0.06)
--card-shadow-hover: 0 10px 30px rgba(0,0,0,0.12)
--max-content-width: 1440px
--page-margin: clamp(16px, 5vw, 10%)
```

**Redux store**

- Configured in `src/app/store/index.ts`
- Currently uses a placeholder reducer — no feature slices yet
- Typed hooks (`useAppDispatch`, `useAppSelector`) live in `src/app/store/hooks.ts`

---

### Backend

**Entry points**

| File                               | Purpose                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| `backend/src/server.ts`          | HTTP server — binds Express app to `env.port`                                       |
| `backend/src/app.ts`             | Express app setup — CORS, JSON body parser, static uploads, API router, error handler |
| `backend/src/routes/index.ts`    | API router — mounts all sub-routers                                                   |
| `backend/src/config/env.ts`      | Reads and exports all environment variables                                            |
| `backend/src/config/database.ts` | mysql2 connection pool (`dbPool`)                                                    |

**Route layer (`backend/src/routes/`)**

| File                  | Mounted at     | Auth guard               |
| --------------------- | -------------- | ------------------------ |
| `auth.ts`           | `/api/auth`  | None (public)            |
| `products.ts`       | `/api`       | None (public)            |
| `cart.ts`           | `/api/cart`  | `requireAuthenticated` |
| `chat.ts`           | `/api/chat`  | None (public)            |
| `admin.ts`          | `/api/admin` | `requireAdmin`         |
| `adminDashboard.ts` | `/api/admin` | (via admin router)       |
| `adminProducts.ts`  | `/api/admin` | (via admin router)       |
| `adminOrders.ts`    | `/api/admin` | (via admin router)       |
| `adminSettings.ts`  | `/api/admin` | (via admin router)       |

**Service layer (`backend/src/services/`)**

```
backend/src/services/
├── admin/
│   ├── orders.ts       Order queries and status updates
│   ├── products.ts     Product CRUD, category/subcategory management, image upload
│   ├── reports.ts      Sales report aggregation
│   └── types.ts        Shared admin types (AdminProduct, AdminCategoryOption, etc.)
├── auth/
│   ├── errors.ts       AuthServiceError class
│   └── localAuth.ts    Sign-in, register, profile read/update, password change
├── cart/
│   └── cart.ts         Cart CRUD — ensureCart, getCartItems, upsertCartItem,
│                       updateCartItemQuantity, removeCartItem
└── chat/
    ├── errors.ts        ChatServiceError class
    ├── fallback.ts      Fallback response when OpenAI is unavailable
    ├── messages.ts      Message validation and shaping
    ├── openai.ts        OpenAI API call
    └── types.ts         Chat message types
```

**Auth layer (`backend/src/auth/`)**

| File              | Responsibility                                                       |
| ----------------- | -------------------------------------------------------------------- |
| `session.ts`    | In-memory session store, cookie read/write/clear, 7-day TTL          |
| `password.ts`   | scrypt hash and verify                                               |
| `users.ts`      | User DB queries, role mapping, display name, account profile mapping |
| `accountId.ts`  | ULID-based public account ID generation                              |
| `middleware.ts` | `requireAuthenticated` and `requireAdmin` Express middleware     |

**File-backed data**

- `backend/data/admin-settings.json` — platform settings (site name, currency, tax rate, feature flags) persisted as JSON on disk

**Product image storage**

- Images are stored as files under `backend/uploads/products/`
- Served statically at `/api/uploads/products/<filename>`
- Base64 data URIs submitted from the admin form are decoded and written to disk on create/update

---

### Database

Schema lives in `database/appliansysdb.sql`. The default database name is `appliansys_db`.

**Key tables**

| Table               | Description                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `USER`            | All users — customers, staff, admin.`user_id` is the internal PK; `account_id` is the public ULID |
| `CUSTOMER_USER`   | Customer-specific data (address fields) — 1:1 with `USER`                                           |
| `STAFF_USER`      | Staff-specific data (role type) — 1:1 with `USER`                                                   |
| `CATEGORY`        | Top-level product categories                                                                           |
| `SUBCATEGORY`     | Subcategories — FK to `CATEGORY`                                                                    |
| `SUB_SUBCATEGORY` | Sub-subcategories — FK to `SUBCATEGORY`                                                             |
| `PRODUCT`         | Products — FK to `SUBCATEGORY` and optionally `SUB_SUBCATEGORY`                                   |
| `INVENTORY`       | Stock quantity and status per product — 1:1 with `PRODUCT`                                          |
| `CART`            | One cart per customer user                                                                             |
| `CART_ITEM`       | Items in a cart — composite PK `(cart_id, product_id)`, stores quantity and price at time of add    |
| `ORDER`           | Customer orders                                                                                        |
| `ORDER_ITEM`      | Line items per order                                                                                   |
| `PROMO`           | Promotional codes                                                                                      |
| `PAYMENT_DETAILS` | Payment records                                                                                        |
| `DELIVERY`        | Delivery records per order                                                                             |
| `PICKUP`          | Pickup records per order                                                                               |

**Product ID format**

Products are stored with a numeric `product_id` in the DB. The frontend and API expose them as `PRD-001`, `PRD-002`, etc. (zero-padded to 3 digits). The `dbId` field carries the raw numeric ID for API calls.

---

## Environment Configuration

### Root `.env`

Used by Vite and the frontend bundle. Source template: `.env.example`.

```env
VITE_ADMIN_EMAILS=admin@example.com
VITE_API_PROXY_TARGET=http://127.0.0.1:4000
```

- `VITE_*` variables are exposed to the browser bundle — do not put secrets here.
- Restart Vite after editing.

### `backend/.env`

Used by the Express server only. Source template: `backend/.env.example`.

```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=appliansys_db
DB_USER=your-db-user
DB_PASSWORD=your-db-password
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

- Keep this file local. Never commit real credentials.
- `OPENAI_MODEL` defaults to `gpt-4o-mini` if omitted.

---

## Development Workflow

### Install

```bash
npm install
npm run install:backend
```

### Run

```bash
npm run dev          # frontend + backend together
npm run start        # frontend only
npm run start:backend  # backend only
```

### Build and quality

```bash
npm run build
npm run lint
npm run format
```

### Utility scripts

```bash
# Hash a password for manual DB insertion
npm --prefix backend run hash:password -- <password>

# Upgrade any plain-text USER.password rows to scrypt hashes
npm --prefix backend run migrate:passwords

# Backfill ULID account_id values for users that don't have one
npm --prefix backend run migrate:account-ids
```

---

## Request Flow

During development:

1. Browser requests a frontend route or `/api/...`
2. Vite serves frontend assets
3. Vite proxies `/api/...` to `VITE_API_PROXY_TARGET` (the Express backend)
4. Express route layer validates input and calls the appropriate service
5. Service layer queries MySQL, reads/writes files, calls OpenAI, or manages sessions
6. Route layer maps the result to an HTTP response

---

## Feature Details

### Product Catalog

- `GET /api/products` returns all products with category, subcategory, sub-subcategory, price, stock, and image URL
- `GET /api/categories` returns the full category tree
- Products are displayed in a 3-column grid on `CategoryPage`
- Each product card links to `/product/:productId`

### Product Detail Page

Route: `/product/:productId`

- Fetches all products on mount and finds the matching one by ID
- Displays: product image (with hover zoom), category/subcategory badges, name, price, stock badge, description, quantity selector, Add to Cart, Buy Now, product meta panel, related products grid
- Stock badge states: In Stock / Low Stock (≤5 units) / Out of Stock
- Quantity selector is capped at available stock
- Add to Cart is disabled for out-of-stock products and for admin/staff accounts
- Unauthenticated users are redirected to `/cart` (which shows the sign-in wall)
- Related products shows up to 4 products from the same category

### Cart

Route: `/cart`

- Requires a customer session — shows a sign-in prompt for guests, and a restriction notice for admin/staff
- Cart is account-specific: each customer has one `CART` row; items are stored in `CART_ITEM`
- `CART` is created lazily on first add-to-cart
- `CART_ITEM` stores `quantity` and `price` at the time of adding
- Quantity controls call `PATCH /api/cart/items/:productId` and update state immediately
- Remove button calls `DELETE /api/cart/items/:productId`
- Individual item controls are disabled while their request is in flight
- Subtotal is calculated client-side from `price × quantity`
- Product name links back to the product detail page

### Admin Panel

Route: `/admin`

Sections:

| Section   | Description                                                               |
| --------- | ------------------------------------------------------------------------- |
| Dashboard | Revenue chart, key metrics, recent orders, sales report                   |
| Products  | Product table with search/sort, create/edit/delete form, category manager |
| Orders    | Order table with status update controls                                   |
| Platform  | Site name, currency, tax rate, maintenance mode, notification toggles     |
| Settings  | Admin account profile and password change                                 |

- Admin and staff accounts are identified by `user_type` in the DB, matching `VITE_ADMIN_EMAILS`, or an `admin*` email prefix
- Platform settings are persisted to `backend/data/admin-settings.json`
- Product images are uploaded as base64 from the form, decoded server-side, and stored under `backend/uploads/products/`

### Authentication

- Session cookie: `appliansys_session` (HttpOnly, SameSite=Lax, 7-day TTL)
- Sessions are stored in-memory on the backend — they do not survive a backend restart
- Passwords are hashed with Node's built-in `scrypt`
- Legacy plain-text passwords are upgraded to hashed on successful login
- Three roles: `customer`, `staff`, `admin`
- Role constraints:
  - `customer` — storefront, cart, orders, settings
  - `staff` — admin panel only
  - `admin` — admin panel only
- Default seeded password: `ApplianSys123!`

### Chat Assistant

- Floating widget rendered on all non-admin routes
- Frontend: `src/shared/components/ChatGPTBot.tsx` + `src/shared/hooks/useChatbot.ts`
- API client: `src/shared/lib/chat.ts`
- Backend route: `POST /api/chat` → `backend/src/services/chat/`
- Falls back to a canned response if OpenAI is unavailable or the key is missing

---

## API Reference

### Public endpoints

| Method | Path                | Description                 |
| ------ | ------------------- | --------------------------- |
| GET    | `/api/health`     | Service health check        |
| GET    | `/api/db-test`    | Database connectivity check |
| GET    | `/api/products`   | All products                |
| GET    | `/api/categories` | Category tree               |
| POST   | `/api/chat`       | Chat completions proxy      |

### Auth endpoints (`/api/auth`)

| Method | Path                   | Auth    | Description                    |
| ------ | ---------------------- | ------- | ------------------------------ |
| GET    | `/api/auth/me`       | None    | Current session user or null   |
| POST   | `/api/auth/login`    | None    | Sign in with email + password  |
| POST   | `/api/auth/register` | None    | Register new customer          |
| POST   | `/api/auth/logout`   | None    | Clear session                  |
| GET    | `/api/auth/account`  | Session | Get account profile            |
| PUT    | `/api/auth/account`  | Session | Update profile (name, contact) |
| PUT    | `/api/auth/password` | Session | Change password                |

### Cart endpoints (`/api/cart`)

All require an active customer session. Admin/staff sessions are rejected with 401.

| Method | Path                           | Body                        | Description                    |
| ------ | ------------------------------ | --------------------------- | ------------------------------ |
| GET    | `/api/cart`                  | —                          | Get all cart items             |
| POST   | `/api/cart/items`            | `{ productId, quantity }` | Add item or increase quantity  |
| PATCH  | `/api/cart/items/:productId` | `{ quantity }`            | Set exact quantity (0 removes) |
| DELETE | `/api/cart/items/:productId` | —                          | Remove item                    |

Cart item response shape:

```json
{
  "productId": 1,
  "productName": "Example Fan",
  "imageUrl": "/api/uploads/products/example.jpg",
  "price": 1299.00,
  "quantity": 2,
  "stock": 14,
  "status": "Active"
}
```

### Admin endpoints (`/api/admin`)

All require an admin or staff session.

| Method | Path                                                  | Description                   |
| ------ | ----------------------------------------------------- | ----------------------------- |
| GET    | `/api/admin/dashboard?period=weekly\|monthly\|yearly` | Dashboard payload             |
| GET    | `/api/admin/products`                               | Product list                  |
| POST   | `/api/admin/products`                               | Create product                |
| PUT    | `/api/admin/products/:id`                           | Update product                |
| DELETE | `/api/admin/products/:id`                           | Delete product                |
| GET    | `/api/admin/categories`                             | Category tree                 |
| POST   | `/api/admin/categories`                             | Create category + subcategory |
| POST   | `/api/admin/subcategories/:id/sub-subcategories`    | Add sub-subcategory           |
| DELETE | `/api/admin/subcategories/:id`                      | Delete subcategory            |
| DELETE | `/api/admin/sub-subcategories/:id`                  | Delete sub-subcategory        |
| GET    | `/api/admin/orders`                                 | Order list                    |
| PATCH  | `/api/admin/orders/:id/status`                      | Update order status           |
| GET    | `/api/admin/settings`                               | Platform settings             |
| PUT    | `/api/admin/settings`                               | Update platform settings      |
| GET    | `/api/admin/reports/sales?period=...`               | Sales report                  |

---

## Troubleshooting

### Proxy errors

```
http proxy error: /api/admin/dashboard
connect ECONNREFUSED 127.0.0.1:4000
```

The frontend is running but the backend is not reachable.

- Confirm `npm run start:backend` is running
- Confirm `VITE_API_PROXY_TARGET` matches the backend address
- Confirm `PORT` in `backend/.env` matches the proxy target port

### Backend 500 errors

Common causes: wrong DB credentials, missing schema, query errors.

- Check `GET http://127.0.0.1:4000/api/health`
- Check `GET http://127.0.0.1:4000/api/db-test`
- Inspect the backend terminal for stack traces

### Cart returns 401

- The user is not signed in, or the session cookie expired (7-day TTL, in-memory — lost on backend restart)
- Admin/staff accounts cannot use the cart — this is intentional

### Sessions lost after backend restart

Sessions are stored in-memory. Restarting the backend clears all active sessions. Users need to sign in again.

---

## Security and Documentation Rules

- Never place real credentials in `README.md`, `DOCUMENTATION.md`, `.env.example` files, or screenshots.
- Use placeholders: `your-api-key`, `your-db-user`, `your-db-password`.
- Treat `backend/.env` as local machine configuration, not shared project documentation.
- `OPENAI_API_KEY` must stay in `backend/.env` only — never in the root `.env` or frontend code.
