# TRSYP 3.0

TRSYP's production application:

- repository root - Next.js application hosted on Render
- `backend/` - NestJS API hosted on Render
- Supabase - PostgreSQL and authentication
- Prisma - the API's typed ORM for the Supabase PostgreSQL database

`old_trs/` is intentionally retained for future work and is not part of the
active application.

## Local development

Requires Node.js 20 or newer.

```bash
cd backend
cp .env.example .env
npm ci
npx prisma generate
npm run start:dev
```

```bash
cp .env.example .env.local
npm ci
npm run dev
```

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

## Render deployment

[`render.yaml`](render.yaml) defines both services. Import it as a Render
Blueprint and provide every environment variable marked `sync: false`.
Render automatically redeploys each service on commits to its linked branch.

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
