# ApplianSys

ApplianSys is a React + Vite storefront with a separate Express + MySQL backend for admin data and reports.

## Stack

- Frontend: React, TypeScript, Vite, React Router, MUI
- State: Redux Toolkit, React Redux
- Backend: Express, TypeScript, mysql2
- Auth/UI integrations: Local backend auth

## Project Layout

- `src/` frontend application code
- `backend/` Express API and MySQL access
- `database/` SQL schema / seed assets
- `public/` static assets served by Vite
- `.env.example` root environment template for the frontend
- `backend/.env.example` backend environment template for the API

### Frontend Structure

The frontend is organized by layer:

- `src/app/`
  App shell, route composition, top-level hooks, providers, and store setup
- `src/features/`
  Route features such as admin, about, cart, category, orders, and search
- `src/shared/`
  Cross-feature components, hooks, request helpers, chat/auth clients, assets, and styles

Current shell/auth/chat split:

- `src/app/App.tsx`
  Top-level composition only
- `src/app/components/AppHeader.tsx`
  Header composition
- `src/app/components/header/*`
  Header navigation, user menu, and avatar subcomponents
- `src/app/components/AppRoutes.tsx`
  Route mapping
- `src/app/hooks/useAuthUser.ts`
  App-wide auth subscription hook
- `src/shared/components/AuthModal.tsx`
  Auth modal coordinator
- `src/shared/components/auth/*`
  Auth account and credentials panels
- `src/shared/lib/http.ts`
  Shared JSON request helper
- `src/shared/lib/auth.ts`
  Frontend auth client and auth state emitter
- `src/shared/lib/chat.ts`
  Chat API client and message types
- `src/shared/hooks/useChatbot.ts`
  Chatbot state/orchestration hook

The admin feature remains split by responsibility:

- `src/features/admin/pages/`
  Route-level composition
- `src/features/admin/components/`
  Section UI such as dashboard, products, orders, platform settings, account settings, and access states
- `src/features/admin/hooks/`
  Admin data orchestration and mutations
- `src/features/admin/lib/`
  API access, constants, access checks, and formatting helpers
- `src/features/settings/`
  Customer-only signed-user settings page and preference persistence

## Environment Files

This project uses two separate environment files:

1. Root `.env`
   Used by Vite and the frontend application.

2. `backend/.env`
   Used by the Express backend and database connection.

Do not commit real credentials, tokens, or production values into either file.

### Root `.env`

Create it from the template:

```bash
copy .env.example .env
```

Expected keys:

```env
VITE_ADMIN_EMAILS=admin@example.com
VITE_API_PROXY_TARGET=http://127.0.0.1:4000
```

Notes:

- `VITE_ADMIN_EMAILS` is a comma-separated list of emails allowed into the admin UI.
- `VITE_API_PROXY_TARGET` is the backend URL Vite proxies `/api` requests to during development.
- Restart the frontend dev server after changing the root `.env`.

### Backend `.env`

Create it from the template:

```bash
copy backend\.env.example backend\.env
```

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

Notes:

- These values are local-development placeholders only.
- Use your own MySQL username and password.
- `OPENAI_API_KEY` is used by the backend chatbot route.
- `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`.
- Do not paste real secrets into the documentation or source-controlled examples.

## Setup

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
npm run install:backend
```

Create the environment files:

```bash
copy .env.example .env
copy backend\.env.example backend\.env
```

Import or create the local MySQL database using the SQL in `database/`.

## Running the App

Start frontend and backend together:

```bash
npm run dev
```

Start only the frontend:

```bash
npm run start
```

Start only the backend:

```bash
npm run start:backend
```

## Scripts

- `npm run dev` starts both dev servers
- `npm run start` starts Vite only
- `npm run start:backend` starts the backend only
- `npm run install:backend` installs backend dependencies
- `npm run lint` runs ESLint
- `npm run format` runs Prettier
- `npm run build` builds the frontend
- `npm run preview` previews the frontend build
- `npm --prefix backend run hash:password -- <password>` generates a backend password hash
- `npm --prefix backend run migrate:passwords` migrates plain-text `USER.password` rows to hashed storage
- `npm --prefix backend run migrate:account-ids` backfills ULID-based public account IDs into `USER.account_id`

## Backend Notes

- The admin dashboard depends on the backend API.
- Email/password authentication is handled by backend routes under `/api/auth`.
- Backend auth flow is split between:
  - `backend/src/routes/auth.ts`
  - `backend/src/services/auth/*`
  - `backend/src/auth/*`
- The storefront chatbot now calls backend route `/api/chat`.
- Backend chat flow is split between:
  - `backend/src/routes/chat.ts`
  - `backend/src/services/chat/*`
- The OpenAI key must stay in `backend/.env`.
- Users now have a public ULID-based `account_id` in the database while numeric `user_id` remains the internal primary key.
- Auth now exposes account profile/password endpoints under `/api/auth/account` and `/api/auth/password`.
- Admin backend flow is split between:
  - `backend/src/routes/admin*.ts`
  - `backend/src/services/admin/*`
- Seeded local users default to password `ApplianSys123!`.
- Admin accounts are constrained to admin work only:
  - no cart
  - no customer order page
  - no customer settings page
- Admin panel navigation now separates:
  - `Platform` for storefront-wide settings
  - `Settings` for the signed-in admin's own account and password management
- In dev mode, frontend `/api/...` requests are proxied through Vite to `VITE_API_PROXY_TARGET`.
- If the backend is down, admin requests will fail with proxy errors such as `ECONNREFUSED 127.0.0.1:4000`.
- If the backend is up but database credentials are wrong, admin endpoints can return `500`.

## Common Local Checks

- Frontend health: open the Vite URL shown in the terminal
- Backend health: `GET http://127.0.0.1:4000/api/health`
- Database test: `GET http://127.0.0.1:4000/api/db-test`

## Security

- Keep `.env` and `backend/.env` local only.
- Never commit API keys, database passwords, or production endpoints.
- Use placeholder values in docs, examples, screenshots, and pull requests.

See `DOCUMENTATION.md` for a fuller architecture and workflow summary.
