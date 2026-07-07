# Auth Module

This directory contains the Authentication module for the NestJS backend, which integrates with **Supabase Authentication**. It leverages `@nestjs/passport` and `passport-jwt` to validate external tokens.

User provisioning into the local `public.users` table is handled by a **Postgres trigger on `auth.users`** (see [`backend/supabase_triggers.sql`](../../../supabase_triggers.sql)), which runs inside the signup transaction — so the row exists before the client ever receives a token. The strategy keeps a lazy-upsert fallback for the rare case the trigger did not run. There is **no** `/auth/sync-user` endpoint anymore.

## Architecture

1. **Authentication Strategy (`supabase-jwt.strategy.ts`)**: 
   - Uses `passport-jwt` combined with `jwks-rsa`.
   - Instead of checking against a hardcoded secret, it fetches the public JSON Web Key Set (JWKS) directy from Supabase (`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`).
   - Parses the Bearer JWT token from the incoming requests.

2. **Guards (`SupabaseAuthGuard`)**:
   - Ensures that only users with valid JWTs from Supabase can access protected routes.
   - Extracts the `sub` (Supabase User ID) from the decoded token securely.

3. **Service (`auth.service.ts`)**:
   - Manages communication with the `PrismaService`.
   - `findbySupabaseId`: Fetches a user record given their Supabase ID.
   - `findByEmail`, `resetPassword`: profile lookup and password-reset email dispatch.

## Exposed Endpoints

All endpoints are prefixed with `/auth`.

### 1. Get Current Validated User
- **Route**: `GET /auth/me`
- **Protection**: Requires Supabase authentication (`@UseGuards(SupabaseAuthGuard)`).
- **Description**: Retrieves the currently authenticated user's profile from the local database using the validated `supabaseId` attached to the request.
- **Response**: The corresponding user object from the database.

## Environment Variables Required

For this module to successfully function, the following must be defined in your `.env` file:
- `SUPABASE_URL`: The URL of your Supabase project (used to dynamically fetch the JWKS configurations).

## Usage in Other Modules

You can import the `AuthModule` in any core modules where routing protection is necessary. Because `AuthService` is exported, other services inside the application can directly utilize the local database synchronization and lookup functionality using `AuthService`.

