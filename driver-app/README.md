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

## Deploy on Vercel

1. Import the repo with the **repository root** as the project root.
2. Set environment variables from `.env.example`.
3. **Important — do not use `AUTH_URL=http://localhost:3001` on Vercel.** Either:
   - **Delete `AUTH_URL`** from Vercel env (recommended; the app uses `VERCEL_URL` automatically), or
   - Set `AUTH_URL` to your production URL, e.g. `https://your-app.vercel.app` (no trailing slash).
4. Set `AUTH_TRUST_HOST=true` and a strong `AUTH_SECRET`.
5. Add `DRIVER_APP_ORIGIN=https://your-app.vercel.app` on the **platform backend** (Render) and redeploy backend for CORS.

Redeploy after changing environment variables.

See the canonical repo README for database migrations, driver sign-up, and PWA install.
