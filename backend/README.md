# ApplianSys Backend

This folder contains the Express + TypeScript API for ApplianSys.

## Stack

- Express 4
- TypeScript
- `tsx` for development
- MySQL via `mysql2`
- Session-cookie auth with in-memory session storage

## Setup

From the repository root:

```bash
npm run install:backend
copy backend\.env.example backend\.env
```

From this folder directly:

```bash
npm install
copy .env.example .env
```

Import `../database/appliansysdb.sql` into MySQL before starting the server.

## Environment

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

Optional:

```env
ADMIN_EMAILS=admin@appliansys.com
```

`ADMIN_EMAILS` overrides the backend fallback to `VITE_ADMIN_EMAILS`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled `dist/server.js` |
| `npm run seed` | Run the seed script |
| `npm run hash:password -- <password>` | Generate a scrypt password hash |
| `npm run migrate:passwords` | Upgrade legacy plain-text passwords |
| `npm run migrate:account-ids` | Backfill public account IDs |

## Runtime

The server reads `.env`, builds the Express app from `src/app.ts`, and listens from `src/server.ts`.

Development health checks:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Confirms the API process is running |
| `GET /api/db-test` | Confirms MySQL connectivity |

## Main Routes

All routes are mounted under `/api`.

| Router | Path | Notes |
| --- | --- | --- |
| `auth.ts` | `/auth` | Login, register, session, profile, password |
| `products.ts` | `/products`, `/categories` | Public catalog |
| `stats.ts` | `/stats`, `/best-selling` | Public stats |
| `chat.ts` | `/chat` | OpenAI proxy with fallback |
| `cart.ts` | `/cart` | Customer-only cart |
| `checkout.ts` | `/checkout` | Customer checkout, settings, mock GCash email |
| `orders.ts` | `/orders` | Customer orders and cancellation |
| `admin.ts` | `/admin` | Admin/staff dashboard, products, orders, pickup release, settings, reports |

## Data and Files

- MySQL schema: `../database/appliansysdb.sql`
- File-backed platform settings: `data/admin-settings.json`
- Product uploads: `uploads/products/`, served as `/api/uploads/products/<filename>`

## Notes

- Sessions are stored in memory and are cleared on backend restart.
- Keep database and OpenAI credentials in `backend/.env` only.
- The chat service returns a fallback response if OpenAI is not configured.
