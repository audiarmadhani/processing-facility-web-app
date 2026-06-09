Web Application for Kopi Fabriek Processing Facility

## Repositories

| App | Repository |
|-----|------------|
| Platform (frontend + backend) | This repo |
| **Cherry pickup driver PWA** | [processing-facility-driver-app](https://github.com/audiarmadhani/processing-facility-driver-app) |
| **Field app PWA** (fermentation + GB QC) | [processingfacility-field-app](https://github.com/audiarmadhani/processingfacility-field-app) |
| **Analytics dashboard (Vercel)** | [processingfacility-dashboard](https://github.com/audiarmadhani/processingfacility-dashboard) |

The driver app and dashboard are standalone Next.js apps. Clone, develop, and deploy them from their dedicated repos — not from `driver-app/` or `dashboard/` in this monorepo (see [driver-app/REPOSITORY.md](driver-app/REPOSITORY.md) and [dashboard/REPOSITORY.md](dashboard/REPOSITORY.md)).

```bash
git clone https://github.com/audiarmadhani/processing-facility-driver-app.git
cd processing-facility-driver-app
cp .env.example .env.local
npm install && npm run dev
```

```bash
git clone https://github.com/audiarmadhani/processingfacility-dashboard.git
cd processingfacility-dashboard
cp .env.example .env.local
npm install && npm run dev
```
