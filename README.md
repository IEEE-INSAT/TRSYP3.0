# TRSYP 3.0

TRSYP's production application:

- repository root - Next.js application
- `backend/` - NestJS API
- root `Dockerfile` - runs both applications in one Render web service
- Supabase - PostgreSQL and authentication
- Prisma - the API's typed ORM for the Supabase PostgreSQL database

`old_trs/` is intentionally retained for future work and is not part of the
active application.

## Local development

Requires Node.js 20 or newer.

```bash
cp .env.example .env
npm --prefix backend ci
cd backend
npx prisma generate
npm run start:dev
```

```bash
npm ci
npm run dev
```

Both applications and Prisma read the single root `.env` file.

The frontend runs at `http://localhost:3000`; the API runs at
`http://localhost:3001`.

## Checks

```bash
cd backend
npm run build
npm test -- --runInBand

cd ..
npm run typecheck
npm run lint
npm run build
```

## Container deployment

The root [`Dockerfile`](Dockerfile) builds both applications. Next.js listens on
Render's public `PORT`; NestJS listens internally on port `3001`. Next proxies
`/api/*` and `/health` to Nest, so the entire application uses one origin and
one Render web service. [`docker-compose.yml`](docker-compose.yml) provides the
same topology for local container testing.

[`render.yaml`](render.yaml) defines that single Docker service. Provide every
environment variable marked `sync: false` before deploying it.

The public frontend variables are compiled into the browser bundle, so changing
a `NEXT_PUBLIC_*` value requires a frontend redeploy.

Supabase authentication emails are configured in the Supabase dashboard, not
in Render. Set the public frontend as the Auth Site URL and allow:

```text
https://rtc.ieee.tn/verify-email/
https://rtc.ieee.tn/reset-password/
```

For local development, also add the following under **Supabase Dashboard →
Authentication → URL Configuration → Redirect URLs**:

```text
http://localhost:3000/**
```

Without this allow-list entry Supabase ignores the localhost `redirectTo`
requested by the app and falls back to the production Site URL.
