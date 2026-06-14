# TRSYP 3.0 — Frontend

Next.js 16 (App Router) + React 19. Marketing site, participant & challenger
registration, participant dashboard, and an admin panel. State is managed with
**Zustand**; backend access goes through a thin **services layer**.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values when ready
npm run dev                  # http://localhost:3000
```

Useful scripts: `npm run build`, `npm run typecheck`, `npm run lint`.

## Environment

All config is read in [`lib/config.ts`](lib/config.ts) from `NEXT_PUBLIC_*`
vars (see [`.env.example`](.env.example)). Every value is optional — when
something is missing the app falls back to a local/offline **placeholder mode**
so the UI keeps working until the backend is finished.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | NestJS backend base URL (no trailing slash). |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project; enables real auth. |
| `NEXT_PUBLIC_FEATURE_REGISTRATION_API` | Flip to `true` once `/registration/*` is live. |
| `NEXT_PUBLIC_FEATURE_ADMIN_API` | Flip to `true` once `/registration/admin/*` is live. |

## Architecture

```
lib/
  config.ts          # env + feature flags (single source of truth)
  supabase/client.ts # browser Supabase client (null when unconfigured)
  api/               # SERVICES LAYER — the only place that talks to the backend
    http.ts          #   typed fetch wrapper + ApiError
    types.ts         #   types mirroring backend DTOs
    auth.service.ts  #   /auth/* (wired — exists on the backend today)
    admin.service.ts #   /admin/* (wired) + registrations data (placeholder)
    registration.service.ts # /registration/* (placeholder, flag-gated)
  store/             # STATE MANAGEMENT — Zustand
    auth-store.ts          # Supabase session + backend user
    registration-store.ts  # the signed-in user's profile (persisted)
    admin-store.ts         # admin gate + registrations list
    use-auth.ts            # convenience hook composing the stores
    auth-provider.tsx      # mounts init + gates hydration
  admin/             # admin-view domain types + demo seed (placeholder)
```

**Components never call `fetch` or `localStorage` directly** — they read/write
Zustand stores, and the stores call the services layer.

## Backend wiring status

The backend (`../backend`, NestJS + Supabase + Prisma) currently exposes only
`/auth/*` and `/admin/create-admin` + `/admin/delete-account`, which are wired
for real. Everything else is a **placeholder** that already contains the
intended call, guarded by a feature flag:

- **Auth** — `signUp`/`signIn` via Supabase, then `POST /auth/sync-user`. With
  no Supabase creds the auth store runs offline so the flow is still demoable.
- **Registration** (`/registration/*`) — the backend controller exists but its
  module isn't imported into `app.module.ts` yet. The profile is kept locally;
  set `NEXT_PUBLIC_FEATURE_REGISTRATION_API=true` to switch to the live route.
  ⚠️ The form does not yet collect `gender` / `participantType` / `country`, and
  `university` is free text vs. the backend `sb` enum — see the `TODO(backend/
  form)` note in `registration-store.ts` before going live.
- **Challenger / teams** — frontend-only for now; the leader registers as a
  participant and team details are kept client-side (no backend team model yet).
- **Admin lists & moderation** — served from local seed data until
  `/registration/admin/*` lands (`NEXT_PUBLIC_FEATURE_ADMIN_API`). The admin
  password gate (`admin.service.ts`) is a placeholder for real admin auth.

Search the codebase for `TODO(backend` to find every seam that flips to live.
