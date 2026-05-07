# AuraSpice React

AuraSpice is a Vite + React restaurant ordering app with a protected staff dashboard, serverless API routes, and Supabase-backed order/session storage.

This repo is now structured for production deployment:

- Public clients can create orders only.
- Staff reads and all privileged mutations go through `/api/*`.
- No default admin account or establishment key is seeded by the schema.
- Staff auth uses signed JWT sessions plus secure `HttpOnly` cookies.
- Lint, typecheck, build, tests, and coverage are all wired into the repo.

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Backend: Vercel Serverless Functions
- Database: Supabase Postgres
- Auth: bcrypt + JWT + server-side session table
- Testing: Vitest + Testing Library

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Fill in these required values:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
ALLOWED_ORIGINS=http://localhost:5173
```

4. Apply the schema in Supabase:

- Run [supabase/schema.sql](/Users/anshu_sir/Codeing/AntiGravty/Experiments/AuraSpice-React/supabase/schema.sql)
- If you are upgrading an existing database, run [supabase/migrations/20260503_production_hardening.sql](/Users/anshu_sir/Codeing/AntiGravty/Experiments/AuraSpice-React/supabase/migrations/20260503_production_hardening.sql)

5. Bootstrap the first admin account and establishment key:

```bash
BOOTSTRAP_ADMIN_ID=owner \
BOOTSTRAP_ADMIN_NAME="Restaurant Owner" \
BOOTSTRAP_ADMIN_PASSWORD="replace-with-a-strong-password" \
BOOTSTRAP_ESTABLISHMENT_KEY="replace-with-a-long-random-key" \
node scripts/init-admin.mjs
```

6. Start the backend and frontend in separate terminals:

```bash
npm start
```

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Vercel API dev server: `http://localhost:5174`

## Development Commands

```bash
npm run dev
npm start
npm run lint
npm run typecheck
npm run build
npm test
npm run test:coverage
```

Optional smoke check for auth throttling:

```bash
bash scripts/rate-limit-smoke.sh
```

## Environment Variables

Client-exposed variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET` to the browser.

## Security Model

- Public order creation still uses the Supabase anon key.
- Public order status reads are served through `/api/orders/status`.
- Staff order lists, establishment key access, and order status changes are served through authenticated `/api/*` routes.
- Staff registration always creates `Staff` accounts only. It cannot mint `Admin` users from request payloads.
- The first admin account must be created explicitly with `scripts/init-admin.mjs`.

## Deployment

Deploy on Vercel with the same environment variables from `.env.example`.

Required production variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`

`ALLOWED_ORIGINS` should contain your exact production frontend origin, for example:

```env
ALLOWED_ORIGINS=https://app.example.com
```

## Verification

Before deploying, run:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:coverage
npm audit --omit=dev
```

The current test suite focuses on auth/session handling, rate limiting, validation, cart state, and protected-route gating.
