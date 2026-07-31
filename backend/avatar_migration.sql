-- Run once against the Supabase PostgreSQL database before deploying the
-- backend that exposes PATCH /auth/avatar.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar jsonb;
