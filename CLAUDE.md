# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TRSYP 3.0 is a two-package monorepo (no shared root tooling — the root `package.json` is nearly empty):

- **`backend/`** — NestJS 10 modular monolith, Prisma 7 + PostgreSQL (Supabase), TypeScript. Runs on `:3001`, API prefixed under `/` (Swagger at `/api/docs` in non-production).
- **`frontend/`** — Next.js 16 (App Router) + React 19, Zustand, Supabase JS client. Runs on `:3000`.

Auth is delegated to **Supabase**: the frontend authenticates against Supabase and sends the Supabase access token as a Bearer token; the backend verifies it via JWKS and resolves an internal DB user.

## Commands

Each package is developed independently from its own directory.

### Backend (`cd backend`)
```bash
npm run start:dev          # watch-mode dev server (:3001)
npm run build              # nest build
npm run lint               # eslint --fix over src/test
npm test                   # jest (all *.spec.ts, colocated in src/)
npm test -- auth.service   # run a single test file by name pattern
npm run test:cov           # coverage
npm run test:e2e           # jest with test/jest-e2e.json
npx prisma generate        # regenerate client after schema.prisma changes
npx prisma migrate dev     # apply/create a migration
npm run prisma:studio      # Prisma Studio
npm run prisma:seed        # ts-node prisma/seed.ts
```

### Frontend (`cd frontend`)
```bash
npm run dev                # next dev (:3000)
npm run build              # next build
npm run lint               # eslint
npm run typecheck          # tsc --noEmit
```

### Docker
`docker-compose up -d postgres qdrant` for infra only, or `docker-compose up --build` for the full stack.

## Backend Architecture

**Modular monolith with clean architecture.** Modules live in `src/modules/<name>/` and follow a consistent internal layout: `controller/`, `service/`, `interfaces/` (injection-token contracts), `entities/`, `dto/`, `domain/`, `events/`. Shared code is in `src/common/` (`guards/`, `decorators/`, `events/`, `pipes/`, `interfaces/`).

Path aliases (see `tsconfig.json` / jest `moduleNameMapper`): `@modules/*`, `@config/*`, `@common/*`.

**Cross-module rules (enforced by convention, not tooling):**
- No direct imports between feature modules. Modules communicate via **EventEmitter2** domain events — event names live in `src/common/events/event-names.ts`, base class in `base-domain.event.ts`.
- Each module owns its Prisma models. `prisma/schema.prisma` is a single file but sectioned by module boundary — do **not** add cross-module relations.

**⚠️ Only some modules are wired up.** `app.module.ts` currently imports only `Auth`, `Admin`, `Rooming`, and `Registration`. The `chatbot/`, `payment/`, `visa/`, `email/`, and `notification/` directories exist but are **not registered** — their routes are dead until added to `AppModule.imports`. When touching those, check whether they're actually mounted before assuming an endpoint is live.

**Auth flow** (`modules/auth/`):
1. `SupabaseJwtStrategy` (`supabase-jwt.strategy.ts`) verifies the Supabase JWT cryptographically via JWKS.
2. It looks up the DB `User` by `supabaseId` and swaps `payload.sub` for the internal DB user id. If no DB user exists it sets `_noDbUser: true`.
3. `JwtAuthGuard` (`common/guards/jwt-auth.guard.ts`) rejects `_noDbUser` requests with a "call /auth/sync-user first" error — users must be synced into the local DB before authenticated routes work.
4. Admin routes stack `SupabaseAuthGuard` + `AdminGuard` (or `@common` `RolesGuard` + `@Roles`).

> Note: `backend/README_Registration.md` documents a static `dev-token`/`admin-token` scheme — that is **stale**; the live auth is the Supabase JWKS flow above.

Global config: `main.ts` applies `helmet`, CORS (origin = `FRONTEND_URL`), a global `ValidationPipe({ whitelist, transform })`, and a global `ThrottlerGuard` (20 req/60s). Env is validated by a Joi schema in `app.module.ts` (required: `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`, `JWT_EXPIRES_IN`).

## Frontend Architecture

App Router lives at the repo-root of `frontend/` (`app/`, `components/`, `lib/`) — **not** under `src/`. Path alias `@/*` maps to `./*`.

- **State:** Zustand stores in `lib/store/` (`auth-store`, `admin-store`, `registration-store`, `team-store`). `auth-provider.tsx` + `use-auth.ts` bridge Supabase session → store; `use-hydrated.ts` guards SSR hydration.
- **API layer:** `lib/api/` — `http.ts` is a thin typed `fetch` wrapper (`apiFetch`) that prefixes `NEXT_PUBLIC_API_URL`, attaches the Bearer token, and throws a normalized `ApiError`. Domain services (`auth.service.ts`, `admin.service.ts`, `registration.service.ts`) sit on top.
- **Supabase:** browser client in `lib/supabase/client.ts`.

**⚠️ Feature-flag / placeholder pattern** (`lib/config.ts`): because several backend routes aren't live, service methods fall back to **localStorage-backed seed data** unless a feature flag is set. Flags are `NEXT_PUBLIC_FEATURE_REGISTRATION_API` and `NEXT_PUBLIC_FEATURE_ADMIN_API`. `isApiConfigured` / `isSupabaseConfigured` gate real calls. When a backend route becomes real, flip the flag and remove the placeholder path — don't assume admin/registration data is coming from the server.

**Next.js 16 caveat** (from `frontend/AGENTS.md`): this is a newer Next.js than most training data — APIs and conventions may differ. Consult `frontend/node_modules/next/dist/docs/` before writing framework code.

## AI / Vector Search (planned)

The `chatbot/` module (`embeddings/`, `faq/`, `vector-store/`) targets SBERT embeddings + Qdrant (compose service on `:6333`). Not currently wired into `AppModule`.
