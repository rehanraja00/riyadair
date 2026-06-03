# Gulf Aviation Competitive Tracking Dashboard

A production-oriented React dashboard for tracking the competitive threat from Riyadh Air and King Salman International Airport against Qatar Airways and Emirates.

## What is included

- Executive KPI view
- Airline comparison panel
- Riyadh Air fleet order matrix
- Threat exposure matrix for Qatar Airways and Emirates
- Route corridor watchlist
- Action register
- Source lineage register
- Data model in `src/data/dashboardData.js`
- Scoring utilities in `src/lib/scoring.js`
- Responsive CSS layout with no charting dependency

## Tech stack

- React
- Vite
- Plain CSS
- `lucide-react` for icons

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run preview
```

The production build will be generated in the `dist/` folder.

## Data model

All baseline data is stored in:

```text
src/data/dashboardData.js
```

Replace this file with API responses when connecting to production systems. The current structure is already split into domain-specific arrays:

- `executiveKpis`
- `fleetOrders`
- `airlineProfiles`
- `threatAssessment`
- `routeCorridors`
- `actionRegister`
- `metricTracker`
- `sourceLinks`

## Recommended production integration

For a live version, connect these datasets to:

1. Route schedule feed
2. Airport traffic data feed
3. Airline fleet/order tracker
4. Fare and yield benchmark source
5. Cargo volume source
6. Action register backend
7. Source lineage table

## Notes

The dashboard uses official-source baseline figures available at the time of preparation. Before formal publication, confirm the most recent figures directly from the source register inside the dashboard.
