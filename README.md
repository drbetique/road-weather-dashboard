# Road Weather Dashboard

Operations dashboard for winter road maintenance. It shows live road weather
readings, treatment recommendations and a 24-hour forecast for a monitored
region, and keeps a browsable history of past conditions.

Built with Next.js 16, React 19, TypeScript and Tailwind CSS v4. Data comes
from the companion FastAPI service, `road-weather-system`.

## How it fits together

```
Browser ──> Next.js (this app) ──> /api/proxy/* ──> FastAPI backend ──> Digitraffic, FMI, Postgres
```

The browser never talks to the backend directly. Requests go through a
server-side proxy route that checks the session and attaches the backend API
key, so the key never reaches the client bundle.

- **Live tab**: KPI summary, per-station conditions, treatment recommendations,
  forecast chart and upcoming risk periods. Refreshes every minute and
  immediately when the tab regains focus.
- **History tab**: daily statistics and treatment history over a chosen date
  range.
- **English / Finnish** interface.
- **Role-based access**: admin, operator and viewer.

## Getting started

```bash
npm ci
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Base URL of the FastAPI backend, no trailing `/api` |
| `API_KEY` | Shared secret; must match `API_KEY` on the backend |
| `JWT_SECRET` | Signs session cookies. Required, no fallback |

All three are server-side only. Never prefix them with `NEXT_PUBLIC_`.

Development accounts are defined in `lib/users.ts` with bcrypt-hashed
passwords. Replace them before any real deployment.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build, including type checking |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Data attribution

Road weather data: Fintraffic / digitraffic.fi, licensed under CC BY 4.0.
Forecast data: Finnish Meteorological Institute open data, licensed under CC BY 4.0.

## License

Copyright © 2026 Victor Betiku. All rights reserved. See [LICENSE](LICENSE).
