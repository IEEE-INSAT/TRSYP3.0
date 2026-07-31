-- Existing accounts remain valid; their avatar starts as NULL and is filled
-- when they complete the avatar step.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" JSONB;
