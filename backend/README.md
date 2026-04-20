# ApplianSys Backend

This folder contains the backend scaffold for ApplianSys.

## Database

The default MySQL connection is configured for:

- Database: `appliansys_db`
- Username: `root`
- Password: empty by default (common XAMPP setup)

## Setup

1. Copy `.env.example` to `.env`
2. Run `npm install`
3. Run `npm run dev`

From the repo root you can do the same with:

1. `npm run install:backend`
2. `npm run start:backend`

## Available routes

- `GET /api/health`
- `GET /api/db-test`
