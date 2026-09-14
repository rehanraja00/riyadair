# Economic Decision Support Platform

A content-managed platform for economic indicators and customizable dashboards. This is a **separate product** from the Riyadh Air vs Qatar Airways competitive dashboard at the repo root — different domain, different stack, own database. They happen to live in the same repository.

This build implements the six **High-priority** requirements from `BRD-DUI-001` (Dashboard & UI Customisation, May 2026): page/section builder, collage grid layout, growth-rate display modes, multi-source/unit management, multi-baseline support, and rolling forecast entry. See [BRD mapping](#brd-mapping) below for what maps to what, and what's still open.

## Content model

- **Section** — the top level of navigation; **Views** (pages) are created under a section.
- **View** — a customizable page: title, visibility (`PRIVATE` / `SHARED` / `PUBLIC`), a `published` draft flag, a `layoutTemplate` (`ONE_COL` / `TWO_COL` / `GRID`), and an ordered list of **Widgets**.
- **Widget** — a content block on a View: `KPI`, `LINE_CHART`, `BAR_CHART`, `TABLE`, or `CONTENT` (free-form text), referencing zero or more indicators. Under a `GRID` layout, a widget can carry an explicit `columnStart/columnSpan/rowStart/rowSpan` collage position.
- **Indicator** — a content item: an economic time series (code, name, frequency, category) plus its `IndicatorDataPoint` observations, `Target`s, `Forecast`s, and `Baseline`s.
- **Category** — groups indicators (Growth, Prices, Labor, Trade, Monetary by default).
- **Source** / **Unit** — first-class, deactivatable, mergeable reference data. An indicator can carry multiple of each via `IndicatorSource`/`IndicatorUnit` join rows (one unit flagged `isPrimary` for display).
- **Target** — an interval-level planned value per period (mirrors `IndicatorDataPoint`'s shape).
- **Forecast** — versioned: a new save never overwrites a prior forecast for the same period, it adds a new version. The "current" forecast is the highest version per period.
- **Baseline** — never edited in place, only superseded (`supersedesId` links to the baseline it replaces). Exactly one baseline per indicator can be `active` at a time — the default used when a widget doesn't pin a specific one.

Roles: `VIEWER` (read), `EDITOR` (create/edit content), `ADMIN` (also delete, deactivate/merge reference data).

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
npm run seed              # sample categories, indicators, sources/units, and a "Macro Overview" page
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
| `GET/POST/PUT/DELETE /sections` | Pages nest under sections (DU-01). Delete requires `ADMIN`. |
| `GET/POST/PUT /sources`, `GET/POST/PUT /units` | DU-04. `POST /:id/deactivate`, `/:id/reactivate`, `/:id/merge {intoId}` all require `ADMIN`; merge moves every indicator link and marks the source/unit inactive. |
| `GET/POST/PUT/DELETE /indicators` | `units`/`sources` are arrays of link objects, not strings. `GET` supports `?category=<slug>&search=<text>`. |
| `POST /indicators/:id/datapoints`, `/targets` | Upserts one point or an array, keyed by `(indicatorId, period)`. |
| `POST /indicators/:id/forecasts` | DU-10: always creates a new version, never overwrites. |
| `POST /indicators/:id/baselines` | DU-08: creates a new baseline, optionally `supersedesId`-linked to the one it replaces. |
| `POST /indicators/:id/baselines/:baselineId/activate` | Deactivates every other baseline on that indicator first. |
| `GET/POST/PUT/DELETE /views` | Visibility- and `published`-filtered on read; write requires the view's owner or `ADMIN`. |
| `PUT /views/:id/widgets` | Replaces the view's entire widget list, including grid position and growth-rate config. |

## BRD mapping

| Req | What it maps to |
| --- | --- |
| DU-01 (Page Builder) | `Section` + `View.layoutTemplate` + `View.published`; `CONTENT` widget type for free-form blocks. |
| DU-02 (Collage layout) | `View.layoutTemplate = GRID` + `View.gridColumns` + per-widget `columnStart/columnSpan/rowStart/rowSpan`. Rendered via CSS grid, collapses to one column under 640px. |
| DU-03 (Growth rate modes) | `ViewWidget.config.growthModes` (`PREVIOUS`/`TARGET`/`BASELINE`, all togglable together), `config.targetType` (`INTERVAL`/`LONG_TERM`), `config.baselineId`. Computed in `web/src/lib/growthRate.js`; both absolute and percent shown. |
| DU-04 (Sources/Units) | `Source`/`Unit` models with active/inactive + merge, `IndicatorSource`/`IndicatorUnit` join tables (multi-source/unit per indicator, one primary unit). |
| DU-08 (Multi-baseline) | `Baseline` model — create-only, `supersedesId` chain, single `active` baseline per indicator as the widget-level fallback. |
| DU-10 (Forecast entry) | `Forecast` model, versioned; UI mirrors the existing data-point/target entry pattern exactly (`IntervalPointsEditor`). |

The six **Medium**-priority requirements (DU-05 extended benchmarking, DU-06 preview-panel definition fix, DU-07 header management, DU-09 surplus/deficit labelling, DU-11 sub-indicator display) are **not implemented** — out of scope for this pass.

### Assumptions made for open questions (Section 4 of the BRD)

These were picked to unblock a working build, not to preempt stakeholder sign-off — flagged here so they're easy to revisit:

- **DU-01**: page creation is `EDITOR`+, not admin-only; pages have a `published` draft flag; no cap on pages per section.
- **DU-02**: constrained grid snap (explicit start/span), not free-form drag-and-drop; no PDF/image export; no hard widget cap.
- **DU-03**: growth rate shows both absolute and percent change; Target mode is user-selectable per widget (interval vs. long-term); Baseline mode defaults to the indicator's active baseline when a widget doesn't pin one.
- **DU-04**: `EDITOR`+ manages sources/units, `ADMIN` required to deactivate/merge; sourcing attribution on a widget shows every linked source with its note; no unit conversion factors.
- **DU-08**: baseline choice is a widget-level setting (`config.baselineId`), independent of the indicator's default active baseline; no Excel bulk import — CSV-paste, matching the data-point pattern.
- **DU-10**: manual forecast entry only (the BRD itself scopes this for v1); same `EDITOR`+ permission as targets; no KPI hide-logic (that concept doesn't exist elsewhere in this platform yet).

## Sample data

The seed script ships five illustrative Saudi macro series (GDP growth, CPI inflation, unemployment, SAMA policy rate, trade balance) as a synthetic random walk, always anchored so the latest point lands in the current month — this matters because widgets can filter to "last N months," and fixed-calendar sample data would eventually filter itself out. It also seeds sample targets/forecasts/baselines for GDP and CPI, three reference sources (GASTAT/SAMA/IMF), two units (Percent/USD Billion), and a "Macro Overview" page demonstrating the collage grid, a content block, and all three growth-rate modes. Every seeded source's name says where it stands in for a real feed — replace before relying on any of it.

## What's not here yet

This is a working MVP, not a production-hardened deployment:

- No password reset / email verification flow.
- No rate limiting or audit log on writes (DU-04 and DU-07 both call for an audit log; neither is built).
- No production database host is configured — `DATABASE_URL` currently points at local Postgres.
- Widget drag-and-drop reordering is up/down buttons, not drag handles; collage grid position is numeric inputs, not drag-and-drop placement.
- Free-form `CONTENT` widgets accept a small HTML allowlist (`p`, `strong`, `em`, `b`, `i`, `br`, `ul`, `ol`, `li`, `span`, no attributes), sanitized client-side before rendering — not a rich text editor, and not server-validated (an `EDITOR` could still store disallowed markup; it just won't render).
- The five Medium-priority BRD requirements (DU-05, 06, 07, 09, 11) are not implemented.

## Note on the aviation dashboard at the repo root

The `src/`, `package.json`, etc. at the repository root are the pre-existing Riyadh Air vs Qatar Airways competitive tracking dashboard — untouched by this work. It's a static React/Vite app with hardcoded data and no relation to this platform's database or auth.
