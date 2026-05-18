# ApplianSys

ApplianSys is a full-stack appliance e-commerce storefront. The frontend is a React + Vite SPA; the backend is an Express + TypeScript API backed by MySQL.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7 (SWC) |
| Routing | React Router v7 |
| UI library | MUI v7 + Emotion |
| Styling | Custom CSS (CSS variables), Tailwind v4 (installed) |
| State | Redux Toolkit + React Redux |
| Backend | Express 4, TypeScript, tsx |
| Database | MySQL via mysql2 |
| Auth | Session-cookie auth (in-memory, server-side) |
| Chat | OpenAI chat completions via backend proxy |

## Project Layout

```
ApplianSys/
├── src/                    Frontend application
│   ├── app/                Shell, routes, providers, store
│   ├── features/           Route-level features
│   │   ├── about/
│   │   ├── admin/
│   │   ├── cart/
│   │   ├── category/
│   │   ├── orders/
│   │   ├── product/        Product detail page
│   │   ├── search/         Home / category browse
│   │   └── settings/
│   ├── shared/             Cross-feature components, hooks, lib, styles
│   └── theme/              MUI theme
├── backend/                Express API
│   └── src/
│       ├── auth/           Session, password, user helpers, middleware
│       ├── config/         env.ts, database.ts
│       ├── data/           admin-settings.json (file-backed settings)
│       ├── routes/         Express routers
│       ├── scripts/        One-off migration and seed scripts
│       └── services/       Business logic (admin/, auth/, cart/, chat/)
├── database/               SQL schema (appliansysdb.sql)
├── public/                 Static assets served by Vite
├── .env.example            Root env template (frontend + Vite proxy)
└── backend/.env.example    Backend env template (DB, OpenAI, port)
```

## Environment Files

Two separate `.env` files are required.

### Root `.env` (frontend / Vite)

```bash
copy .env.example .env
```

```env
VITE_ADMIN_EMAILS=admin@example.com
VITE_API_PROXY_TARGET=http://127.0.0.1:4000
```

- `VITE_ADMIN_EMAILS` — comma-separated list of emails granted admin access.
- `VITE_API_PROXY_TARGET` — backend URL that Vite proxies `/api` requests to in dev.
- Restart Vite after editing.

### `backend/.env` (server / database)

```bash
copy backend\.env.example backend\.env
```

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

- Never commit real credentials. Keep `backend/.env` local only.

## Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
npm run install:backend

# 3. Create env files
copy .env.example .env
copy backend\.env.example backend\.env

# 4. Import the database schema
#    Open MySQL and run: database/appliansysdb.sql
```

## Running

```bash
# Both services together
npm run dev

# Frontend only
npm run start

# Backend only
npm run start:backend
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend together |
| `npm run start` | Start Vite dev server only |
| `npm run start:backend` | Start Express backend only |
| `npm run install:backend` | Install backend npm dependencies |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run preview` | Preview the production build |
| `npm --prefix backend run hash:password -- <pw>` | Hash a password with scrypt |
| `npm --prefix backend run migrate:passwords` | Upgrade plain-text passwords to hashed |
| `npm --prefix backend run migrate:account-ids` | Backfill ULID account IDs |

## API Endpoints

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Service health check |
| GET | `/api/db-test` | Database connectivity check |
| GET | `/api/products` | List all products (catalog) |
| GET | `/api/categories` | List all categories with subcategories |
| POST | `/api/chat` | Chatbot — proxies to OpenAI |

### Auth (`/api/auth`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/me` | Current session user |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/register` | Register new customer account |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/account` | Get account profile |
| PUT | `/api/auth/account` | Update account profile |
| PUT | `/api/auth/password` | Change password |

### Cart (`/api/cart`) — requires customer session

| Method | Path | Description |
|---|---|---|
| GET | `/api/cart` | Get current user's cart items |
| POST | `/api/cart/items` | Add item (or increase quantity) |
| PATCH | `/api/cart/items/:productId` | Set exact quantity (0 = remove) |
| DELETE | `/api/cart/items/:productId` | Remove item |

### Admin (`/api/admin`) — requires admin or staff session

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard metrics, products, orders, revenue |
| GET | `/api/admin/products` | Product list |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| GET | `/api/admin/categories` | Category tree |
| POST | `/api/admin/categories` | Create category + subcategory |
| POST | `/api/admin/subcategories/:id/sub-subcategories` | Add sub-subcategory |
| DELETE | `/api/admin/subcategories/:id` | Delete subcategory |
| DELETE | `/api/admin/sub-subcategories/:id` | Delete sub-subcategory |
| GET | `/api/admin/orders` | Order list |
| PATCH | `/api/admin/orders/:id/status` | Update order status |
| GET | `/api/admin/settings` | Platform settings |
| PUT | `/api/admin/settings` | Update platform settings |
| GET | `/api/admin/reports/sales` | Sales report |

## Auth and Roles

- Authentication uses an in-memory session cookie (`appliansys_session`, 7-day TTL).
- Passwords are hashed with Node's built-in `scrypt`.
- Three roles: `customer`, `staff`, `admin`.
- Admin access is granted by `user_type = 'admin'` in the DB, or by matching `VITE_ADMIN_EMAILS`, or by an `admin*` email prefix.
- Admin and staff accounts cannot use the cart, orders, or customer settings pages.
- Default seeded password: `ApplianSys123!`

## Common Checks

```
Frontend:   http://localhost:5173  (or the port Vite prints)
Backend:    http://127.0.0.1:4000/api/health
DB test:    http://127.0.0.1:4000/api/db-test
```

If the backend is unreachable, admin and cart requests fail with `ECONNREFUSED 127.0.0.1:4000`.

## Security

- Keep `.env` and `backend/.env` local. Never commit real credentials.
- Use placeholder values in docs, examples, and pull requests.
- `OPENAI_API_KEY` must stay in `backend/.env` only.

See `DOCUMENTATION.md` for full architecture details.
