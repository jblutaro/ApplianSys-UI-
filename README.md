# ApplianSys

ApplianSys is a full-stack appliance e-commerce system. The frontend is a React + Vite single-page app, and the backend is an Express + TypeScript REST API backed by MySQL.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 7 (SWC) |
| Routing | React Router v7 |
| UI | MUI v7, Emotion, MUI icons |
| Styling | Custom CSS with CSS variables; Tailwind v4 is installed |
| State | Redux Toolkit and React Redux |
| Backend | Express 4, TypeScript, tsx |
| Database | MySQL via mysql2 |
| Auth | HttpOnly session-cookie auth with in-memory sessions |
| Chat | OpenAI chat completions through the backend, with a fallback response |

## Project Layout

```text
ApplianSys/
|-- src/                         Frontend application
|   |-- app/                     App shell, routes, providers, store
|   |-- features/                Route-level features
|   |   |-- about/
|   |   |-- admin/
|   |   |-- cart/
|   |   |-- category/
|   |   |-- orders/
|   |   |-- payment/
|   |   |-- product/
|   |   |-- search/
|   |   `-- settings/
|   |-- shared/                  Cross-feature components, hooks, API clients, styles
|   `-- theme/                   MUI theme
|-- backend/                     Express API
|   |-- data/                    File-backed admin settings
|   `-- src/
|       |-- auth/                Sessions, password hashing, user helpers, middleware
|       |-- config/              Environment and database configuration
|       |-- routes/              Express routers
|       |-- scripts/             Seed and migration utilities
|       `-- services/            Business logic
|-- database/                    MySQL schema: appliansysdb.sql
|-- public/                      Static Vite assets
|-- scripts/dev.mjs              Starts backend, then frontend
|-- DOCUMENTATION.md             Detailed architecture and API reference
`-- changelog.md                 Project change history
```

## Features

- Public storefront with home/search, category browse, product detail, and about pages.
- Customer auth with registration, login, account profile, password changes, and session persistence through cookies.
- Customer cart backed by database tables, including quantity updates, remove actions, and stock warnings.
- Checkout for delivery or pickup, with Albay delivery validation and mock GCash payment flow.
- Customer order history with cancellation support.
- Admin/staff panel for dashboard metrics, product and category management, orders, pickup releases, platform settings, and reports.
- Floating chatbot that calls the backend OpenAI proxy and falls back gracefully when OpenAI is unavailable.

## Environment Files

Create two local environment files. Do not commit real credentials.

### Root `.env`

Used by Vite and browser-exposed variables:

```bash
copy .env.example .env
```

```env
VITE_ADMIN_EMAILS=admin@appliansys.com
VITE_API_PROXY_TARGET=http://127.0.0.1:4000
```

- `VITE_ADMIN_EMAILS` is a comma-separated list of emails granted admin access by the frontend guard.
- `VITE_API_PROXY_TARGET` is the Express backend URL used by the Vite dev proxy.

### `backend/.env`

Used only by the Express server:

```bash
copy backend\.env.example backend\.env
```

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

The backend also reads `ADMIN_EMAILS` if present, and falls back to `VITE_ADMIN_EMAILS`.

## Setup

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run install:backend

# Create local env files
copy .env.example .env
copy backend\.env.example backend\.env

# Import database/appliansysdb.sql into MySQL
```

The default database name is `appliansys_db`, matching the included schema and backend defaults.

## Running

```bash
# Start backend first, then Vite
npm run dev

# Frontend only
npm run start

# Backend only
npm run start:backend
```

Useful URLs:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` or the port Vite prints |
| Backend health | `http://127.0.0.1:4000/api/health` |
| DB test | `http://127.0.0.1:4000/api/db-test` |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start backend and frontend together |
| `npm run start` | Start Vite only |
| `npm run start:frontend` | Start Vite only |
| `npm run start:backend` | Start the backend dev server |
| `npm run install:backend` | Install backend dependencies |
| `npm run build` | Type-check and build the frontend |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run preview` | Preview the production build |
| `npm --prefix backend run build` | Compile the backend |
| `npm --prefix backend run seed` | Run backend seed script |
| `npm --prefix backend run hash:password -- <password>` | Hash a password for manual DB insertion |
| `npm --prefix backend run migrate:passwords` | Upgrade legacy plain-text passwords |
| `npm --prefix backend run migrate:account-ids` | Backfill public account IDs |

## Frontend Routes

| Path | Page |
| --- | --- |
| `/` | Search/home page |
| `/about` | About page |
| `/category/:categorySlug` | Category browse |
| `/category/:categorySlug/:subSlug` | Subcategory browse |
| `/category/:categorySlug/:subSlug/:subSubSlug` | Sub-subcategory browse |
| `/product/:productId` | Product detail |
| `/cart` | Customer cart |
| `/orders` | Customer orders |
| `/settings` | Customer settings |
| `/admin` | Admin/staff panel |
| `/mock-gcash-payment` | Mock GCash payment screen |

## API Overview

All API routes are mounted under `/api`.

### Public

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service health check |
| GET | `/db-test` | Database connectivity check |
| GET | `/products` | Product catalog |
| GET | `/categories` | Category tree |
| GET | `/stats` | Site/catalog summary stats |
| GET | `/best-selling` | Best-selling products |
| POST | `/chat` | Chat completions proxy |

### Auth

| Method | Path | Description |
| --- | --- | --- |
| GET | `/auth/me` | Current session user |
| POST | `/auth/login` | Sign in |
| POST | `/auth/register` | Register a customer |
| POST | `/auth/logout` | Sign out |
| GET | `/auth/account` | Read account profile |
| PUT | `/auth/account` | Update account profile |
| PUT | `/auth/password` | Change password |

### Customer

| Method | Path | Description |
| --- | --- | --- |
| GET | `/cart` | Get current user's cart |
| POST | `/cart/items` | Add or increase a cart item |
| PATCH | `/cart/items/:productId` | Set item quantity; `0` removes |
| DELETE | `/cart/items/:productId` | Remove item |
| POST | `/checkout` | Place a delivery or pickup order |
| GET | `/checkout/settings` | Checkout settings and shop location |
| POST | `/checkout/mock-gcash/email` | Log a mock GCash confirmation email |
| GET | `/orders` | Customer order history |
| POST | `/orders/:orderId/cancel` | Cancel a customer order |

Customer routes require a signed-in customer. Admin and staff users are rejected from customer-only routes.

### Admin

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/dashboard?period=weekly|monthly|yearly` | Dashboard metrics |
| GET | `/admin/products` | Product list |
| POST | `/admin/products` | Create product |
| PUT | `/admin/products/:productId` | Update product |
| DELETE | `/admin/products/:productId` | Delete product |
| GET | `/admin/categories` | Category tree |
| POST | `/admin/categories` | Create category and subcategory |
| DELETE | `/admin/categories/:categoryId` | Delete category |
| POST | `/admin/subcategories/:subcategoryId/sub-subcategories` | Create sub-subcategory |
| DELETE | `/admin/subcategories/:subcategoryId` | Delete subcategory |
| DELETE | `/admin/sub-subcategories/:subSubcategoryId` | Delete sub-subcategory |
| GET | `/admin/orders` | Admin order list |
| PATCH | `/admin/orders/:orderId/status` | Update order status |
| GET | `/admin/pickup-releases` | Pending pickup release orders |
| POST | `/admin/pickup-releases/:orderId/release` | Release pickup order |
| GET | `/admin/settings` | Platform settings |
| PUT | `/admin/settings` | Update platform settings |
| GET | `/admin/reports/sales?period=...` | Sales report |

Admin routes require an admin or staff session. Some category-management actions are admin-only.

## Auth and Roles

- Sessions use the `appliansys_session` HttpOnly cookie with a 7-day TTL.
- Sessions are stored in memory, so they are cleared when the backend restarts.
- Passwords are hashed with Node's built-in `scrypt`.
- Legacy plain-text passwords are upgraded after successful login.
- Roles are `customer`, `staff`, and `admin`.
- Default seeded password: `ApplianSys123!`.

## Security Notes

- Keep `.env` and `backend/.env` local.
- Put OpenAI and database credentials only in `backend/.env`.
- Root `VITE_*` variables are exposed to the browser bundle, so they must not contain secrets.

See `DOCUMENTATION.md` for architecture details and a fuller API reference.
