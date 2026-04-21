# Project Documentation

## Overview

ApplianSys is split into two runtime layers:

- Frontend: a React + Vite application in `src/`
- Backend: an Express + TypeScript API in `backend/`

The storefront UI can render without the backend for some routes, but the admin area depends on the backend and database being available.

## Runtime Architecture

### Frontend

- Entry: `src/app/main.tsx`
- Providers: `src/app/providers/AppProviders.tsx`
- App shell and routes: `src/app/App.tsx`
- Feature pages: `src/features/*/pages`
- Shared assets/components: `src/shared/`

For larger frontend features, code is split into:

- `pages/`
  Route-level containers
- `components/`
  Section or presentational UI
- `hooks/`
  Feature-scoped state orchestration
- `lib/`
  API clients, constants, utilities, and guards

Current concrete example:

- `src/features/admin/pages/AdminPage.tsx`
  Admin route coordinator
- `src/features/admin/components/*`
  Dashboard, products, orders, settings, and access-state UI
- `src/features/admin/hooks/useAdminDashboard.ts`
  Admin loading and mutation orchestration
- `src/features/admin/lib/*`
  Admin API access, constants, formatting, and access checks

### Backend

- Server entry: `backend/src/server.ts`
- Express app setup: `backend/src/app.ts`
- API router: `backend/src/routes/index.ts`
- Admin routes: `backend/src/routes/admin.ts`
- Environment config: `backend/src/config/env.ts`
- Database pool: `backend/src/config/database.ts`

### Database

- Local SQL assets live in `database/`
- The backend uses MySQL via `mysql2`
- The default local database name in examples is `appliansys_db`

## Environment Configuration

Two separate `.env` files are expected.

### 1. Root `.env`

Purpose:

- Vite environment values
- Admin email allowlist
- Dev proxy target for `/api`

Source template:

- `.env.example`

Expected keys:

```env
VITE_ADMIN_EMAILS=admin@example.com
VITE_API_PROXY_TARGET=http://127.0.0.1:4000
```

Guidance:

- All `VITE_*` variables are exposed to the frontend bundle.
- Do not place private server-only secrets in the root `.env`.
- Restart Vite after editing these values.

### 2. `backend/.env`

Purpose:

- Backend port
- MySQL connection settings

Source template:

- `backend/.env.example`

Expected keys:

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

Guidance:

- These values remain server-side and must stay local.
- Use your actual local database credentials.
- Keep `OPENAI_API_KEY` in `backend/.env`, not the frontend `.env`.
- Do not commit populated backend credentials.

## Development Workflow

### Install

Frontend:

```bash
npm install
```

Backend:

```bash
npm run install:backend
```

### Run

Both services together:

```bash
npm run dev
```

Frontend only:

```bash
npm run start
```

Backend only:

```bash
npm run start:backend
```

### Build / Quality

```bash
npm run build
npm run lint
npm run format
npm --prefix backend run hash:password -- <password>
npm --prefix backend run migrate:passwords
```

## Request Flow

During development:

1. The browser calls a frontend route or `/api/...`
2. Vite serves frontend assets
3. Vite proxies `/api` calls to `VITE_API_PROXY_TARGET`
4. The Express backend handles the request
5. Admin routes may read from MySQL and local JSON settings storage

Important consequence:

- If the backend is not running, frontend admin requests fail with proxy connection errors.
- If database credentials are wrong, backend endpoints can return `500`.

## Admin Area

The admin UI fetches data from backend routes under `/api/admin`.

Relevant backend endpoints include:

- `GET /api/health`
- `GET /api/db-test`
- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/chat`
- `GET /api/admin/dashboard`
- `GET /api/admin/products`
- `GET /api/admin/orders`
- `GET /api/admin/settings`
- `GET /api/admin/reports/sales`

The admin dashboard is not purely static. It depends on:

- backend availability
- valid MySQL credentials
- expected database schema
- readable admin settings storage under `backend/data/`

## Frontend State

Redux is configured in `src/app/store/`.

Current notes:

- The store is initialized so React Redux can mount cleanly.
- Typed hooks live in `src/app/store/hooks.ts`.
- Additional feature slices can be added later under `src/features/<feature>/`.

## Chat / Auth Integrations

### Local Auth

Authentication is handled by the Express backend and the MySQL `USER` table.

Current usage:

- backend session cookie auth via `/api/auth/*`
- local seeded or registered email/password accounts
- admin access checks based on user role, allowed email list, or `admin*` email prefixes
- password storage hashed with backend-side `scrypt`

Default seeded password:

- `ApplianSys123!`

### Chat Assistant

The chat UI lives in `src/shared/components/ChatGPTBot.tsx`.
The OpenAI request is proxied through backend route `POST /api/chat`.

Documentation rule:

- keep API keys and provider secrets out of committed files
- use placeholder examples only

## Local Troubleshooting

### Proxy errors

Example:

- `http proxy error: /api/admin/dashboard`
- `connect ECONNREFUSED 127.0.0.1:4000`

Meaning:

- the frontend is running
- the backend target is not reachable

Checks:

- confirm `npm run start:backend` works
- confirm `VITE_API_PROXY_TARGET` matches the backend URL
- confirm the backend port matches `PORT` in `backend/.env`

### Backend 500 errors

Common causes:

- invalid database credentials
- missing database schema
- route/query errors

Checks:

- open `http://127.0.0.1:4000/api/health`
- open `http://127.0.0.1:4000/api/db-test`
- inspect backend terminal logs

## Security and Documentation Rules

- Never place real credentials in `README.md`, `DOCUMENTATION.md`, committed `.env.example` files, or screenshots.
- Use placeholders such as `your-api-key`, `your-db-user`, and `your-db-password`.
- Treat `backend/.env` as local machine configuration, not shared project documentation.
