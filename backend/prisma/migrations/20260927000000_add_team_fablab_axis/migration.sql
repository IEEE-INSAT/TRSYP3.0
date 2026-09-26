-- Fablab Challenge axis, chosen by the team leader. Only set on FABLAB teams.
-- Guarded so it is safe to re-run on a database already patched by hand.
DO $$
BEGIN
  CREATE TYPE "FablabAxis" AS ENUM ('PIPETTING_DILUTION', 'INSPECTION_GROWTH', 'CONTAINMENT_HANDLING');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "axis" "FablabAxis";
