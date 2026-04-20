# ApplianSys

ApplianSys is a React + Vite storefront with a separate Express + MySQL backend for admin data and reports.

## Stack

- Frontend: React, TypeScript, Vite, React Router, MUI
- State: Redux Toolkit, React Redux
- Backend: Express, TypeScript, mysql2
- Auth/UI integrations: Firebase

## Project Layout

- `src/` frontend application code
- `backend/` Express API and MySQL access
- `database/` SQL schema / seed assets
- `public/` static assets served by Vite
- `.env.example` root environment template for the frontend
- `backend/.env.example` backend environment template for the API

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
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_ADMIN_EMAILS=admin@example.com
VITE_API_PROXY_TARGET=http://127.0.0.1:4000
```

Notes:

- `VITE_FIREBASE_*` values come from your Firebase web app config.
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
```

Notes:

- These values are local-development placeholders only.
- Use your own MySQL username and password.
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

## Backend Notes

- The admin dashboard depends on the backend API.
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
