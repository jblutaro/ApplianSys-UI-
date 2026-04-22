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
- App shell components: `src/app/components/*`
- App-level hooks: `src/app/hooks/*`
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

Current shell/chat/auth example:

- `src/app/components/AppRoutes.tsx`
  Route composition only
- `src/app/components/AppHeader.tsx`
  Header composition only
- `src/app/components/header/*`
  Header navigation, dropdown menu, and avatar pieces
- `src/app/hooks/useAuthUser.ts`
  App-wide auth subscription
- `src/shared/components/AuthModal.tsx`
  Auth modal coordinator
- `src/shared/components/auth/*`
  Auth account view and credential form
- `src/shared/lib/http.ts`
  Shared JSON request wrapper for backend APIs
- `src/shared/lib/auth.ts`
  Frontend auth client and user state emitter
- `src/shared/lib/chat.ts`
  Chat message types and chat request client
- `src/shared/hooks/useChatbot.ts`
  Chatbot state and submit flow

Current feature example:

- `src/features/admin/pages/AdminPage.tsx`
  Admin route coordinator
- `src/features/admin/components/*`
  Dashboard, products, orders, platform settings, admin account settings, and access-state UI
- `src/features/admin/hooks/useAdminDashboard.ts`
  Admin loading and mutation orchestration
- `src/features/admin/lib/*`
  Admin API access, constants, formatting, and access checks
- `src/features/settings/*`
  Customer-only account settings outside the admin panel

### Backend

- Server entry: `backend/src/server.ts`
- Express app setup: `backend/src/app.ts`
- API router: `backend/src/routes/index.ts`
- Admin route aggregator: `backend/src/routes/admin.ts`
- Environment config: `backend/src/config/env.ts`
- Database pool: `backend/src/config/database.ts`

Backend code is now separated by responsibility:

- `backend/src/routes/*`
  Express transport layer and HTTP response mapping
- `backend/src/services/admin/*`
  Admin business/data orchestration
- `backend/src/services/auth/*`
  Local auth flow and auth-specific service errors
- `backend/src/services/chat/*`
  Chat validation, message shaping, OpenAI calls, and chat-specific errors
- `backend/src/auth/*`
  Session, password, user lookup, and auth middleware helpers

### Database

- Local SQL assets live in `database/`
- The backend uses MySQL via `mysql2`
- The default local database name in examples is `appliansys_db`
- `USER.user_id` remains the internal numeric primary key
- `USER.account_id` is the public-facing ULID-based account identifier

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
npm --prefix backend run migrate:account-ids
```

## Request Flow

During development:

1. The browser calls a frontend route or `/api/...`
2. Vite serves frontend assets
3. Vite proxies `/api` calls to `VITE_API_PROXY_TARGET`
4. The Express route layer validates input and delegates to services
5. Services call MySQL, session helpers, password utilities, or OpenAI as needed
6. The route layer maps service results into HTTP responses

Important consequence:

- If the backend is not running, frontend admin requests fail with proxy connection errors.
- If database credentials are wrong, backend endpoints can return `500`.

## Admin Area

The admin UI fetches data from backend routes under `/api/admin`.

Relevant backend endpoints include:

- `GET /api/health`
- `GET /api/db-test`
- `GET /api/auth/me`
- `GET /api/auth/account`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `PUT /api/auth/account`
- `PUT /api/auth/password`
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
- route layer in `backend/src/routes/auth.ts`
- local auth flow in `backend/src/services/auth/localAuth.ts`
- local seeded or registered email/password accounts
- ULID-based public account IDs in `USER.account_id`
- account profile read/update support via `/api/auth/account`
- password change support via `/api/auth/password`
- admin access checks based on user role, allowed email list, or `admin*` email prefixes
- password storage hashed with backend-side `scrypt`
- legacy plain-text or placeholder seeded passwords upgraded on successful login

Default seeded password:

- `ApplianSys123!`

Role constraints:

- customer accounts can use cart, orders, and customer settings
- admin accounts are restricted to admin duties and use `/admin`
- admin panel settings are split into:
  - `Platform` for global storefront configuration
  - `Settings` for the signed-in admin account and password controls

### Chat Assistant

The chat UI lives in `src/shared/components/ChatGPTBot.tsx`.
The chat UI state lives in `src/shared/hooks/useChatbot.ts`.
The frontend request client lives in `src/shared/lib/chat.ts`.
The OpenAI request is proxied through backend route `POST /api/chat`.
Backend chat responsibilities are split across:

- `backend/src/routes/chat.ts`
- `backend/src/services/chat/messages.ts`
- `backend/src/services/chat/openai.ts`

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
