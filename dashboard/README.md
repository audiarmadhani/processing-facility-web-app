# Kopi Fabriek Dashboard

Standalone read-only analytics dashboard for the processing facility. Deployed on Vercel; data from Supabase Postgres.

**Repository:** [github.com/audiarmadhani/processingfacility-dashboard](https://github.com/audiarmadhani/processingfacility-dashboard)

## Routes

| Path | Description |
|------|-------------|
| `/` | Current platform dashboard (full port) |
| `/fermentation` | Fermentation analytics |
| `/finance` | Finance charts |
| `/inventory` | IMS inventory charts |
| `/production-analytics` | Advanced production analytics |

## Local development

```bash
git clone https://github.com/audiarmadhani/processingfacility-dashboard.git
cd processingfacility-dashboard
cp .env.example .env.local
# Set DATABASE_URL (Supabase Postgres) and optional Supabase keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Import [audiarmadhani/processingfacility-dashboard](https://github.com/audiarmadhani/processingfacility-dashboard) in Vercel (root directory is repo root — no subdirectory).
2. Set environment variables from `.env.example`:
   - `DATABASE_URL` — **required**
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — optional
3. Apply SQL migrations: `supabase db push` from `supabase/` (RLS + RPC).

## API

Server routes under `/api/*` mirror the former Render Express dashboard API (`dashboard-metrics`, `batch-tracking`, targets, environmental, fermentation, finance, inventory).

## Monorepo note

This app was developed alongside [processing-facility-web-app](https://github.com/audiarmadhani/processing-facility-web-app). **Use this repository** as the canonical home for the dashboard; the `dashboard/` folder in the monorepo is a mirror for convenience only.
