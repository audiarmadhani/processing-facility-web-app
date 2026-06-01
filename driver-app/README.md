# Cherry Pickup Driver PWA

Mobile-first field app for coffee cherry pickup drivers (BTM HEQA platform).

**Repository:** [github.com/audiarmadhani/processing-facility-driver-app](https://github.com/audiarmadhani/processing-facility-driver-app)

## Local development

```bash
git clone https://github.com/audiarmadhani/processing-facility-driver-app.git
cd processing-facility-driver-app
cp .env.example .env.local
npm install && npm run dev
```

Runs at [http://localhost:3001](http://localhost:3001).

## Deploy

Import the dedicated repo on Vercel with the **repository root** as the project root. Set env vars from `.env.example` and add `DRIVER_APP_ORIGIN` to the platform backend for CORS.

See the canonical repo README for database migrations, driver sign-up, and PWA install.
