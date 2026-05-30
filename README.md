Web Application for Kopi Fabriek Processing Facility

## Repositories

| App | Repository |
|-----|------------|
| Platform (frontend + backend) | This repo |
| **Analytics dashboard (Vercel)** | [processingfacility-dashboard](https://github.com/audiarmadhani/processingfacility-dashboard) |

The dashboard is a standalone Next.js app. Clone, develop, and deploy it from the dedicated repo — not from `dashboard/` in this monorepo (see [dashboard/REPOSITORY.md](dashboard/REPOSITORY.md)).

```bash
git clone https://github.com/audiarmadhani/processingfacility-dashboard.git
cd processingfacility-dashboard
cp .env.example .env.local
npm install && npm run dev
```
