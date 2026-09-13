# Economic Decision Support Platform

A content-managed platform for economic indicators and customizable dashboards. This is a **separate product** from the Riyadh Air vs Qatar Airways competitive dashboard at the repo root — different domain, different stack, own database. They happen to live in the same repository.

## Content model

- **Indicator** — a content item: an economic time series (code, name, unit, frequency, source, category) plus its `IndicatorDataPoint` observations. Created and edited through the admin UI instead of hardcoded in source.
- **Category** — groups indicators (Growth, Prices, Labor, Trade, Monetary by default).
- **View** — a customizable dashboard: a title, visibility (`PRIVATE` / `SHARED` / `PUBLIC`), and an ordered list of **Widgets**.
- **Widget** — a content block on a View: `KPI`, `LINE_CHART`, `BAR_CHART`, or `TABLE`, referencing one or more indicators.

Roles: `VIEWER` (read), `EDITOR` (create/edit indicators, categories, views), `ADMIN` (also delete, manage users' content).

## Stack

- **server**: Node.js, Express, PostgreSQL via Prisma, JWT auth (bcrypt-hashed passwords).
- **web**: React, Vite, React Router, Recharts.

## Local setup

### 1. Database

```bash
sudo service postgresql start
sudo -u postgres psql -c "CREATE ROLE econ_platform LOGIN PASSWORD 'econ_platform' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE economic_platform OWNER econ_platform;"
```

(`CREATEDB` is only needed so Prisma can create its shadow database for `migrate dev`; drop it for a production role.)

### 2. API server

```bash
cd server
cp .env.example .env   # edit JWT_SECRET before any real deployment
npm install
npm run prisma:migrate   # creates schema
npm run seed              # sample categories, indicators, and a "Macro Overview" view
npm run dev                # http://localhost:4000
```

The seed script creates an admin login: `rehanraja00@gmail.com` / `ChangeMe123!` — **change this password immediately**, it's a placeholder for local development only.

### 3. Web client

```bash
cd web
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

## API surface

All routes are under `/api`.

| Route | Notes |
| --- | --- |
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | First registered user becomes `ADMIN`; everyone after starts as `VIEWER`. |
| `GET/POST/PUT/DELETE /categories` | Write requires `EDITOR`+, delete requires `ADMIN`. |
| `GET/POST/PUT/DELETE /indicators` | Same role rules. `GET` supports `?category=<slug>&search=<text>`. |
| `POST /indicators/:id/datapoints` | Upserts one point or an array, keyed by `(indicatorId, period)`. |
| `DELETE /indicators/:id/datapoints/:pointId` | |
| `GET/POST/PUT/DELETE /views` | Visibility-filtered on read; write requires the view's owner or `ADMIN`. |
| `PUT /views/:id/widgets` | Replaces the view's entire widget list (add/remove/reorder in one call). |

## Sample data

The seed script ships five illustrative Saudi macro series (GDP growth, CPI inflation, unemployment, SAMA policy rate, trade balance) as a synthetic random walk, always anchored so the latest point lands in the current month — this matters because Views can filter widgets to "last N months," and fixed-calendar sample data would eventually filter itself out. Every seeded indicator's `source` field says "Seed sample data" — replace with a real feed integration before relying on it for anything.

## What's not here yet

This is a working MVP, not a production-hardened deployment:

- No password reset / email verification flow.
- No rate limiting or audit log on writes.
- No production database host is configured — `DATABASE_URL` currently points at local Postgres.
- Widget drag-and-drop reordering is up/down buttons, not drag handles.

## Note on the aviation dashboard at the repo root

The `src/`, `package.json`, etc. at the repository root are the pre-existing Riyadh Air vs Qatar Airways competitive tracking dashboard — untouched by this work. It's a static React/Vite app with hardcoded data and no relation to this platform's database or auth.
