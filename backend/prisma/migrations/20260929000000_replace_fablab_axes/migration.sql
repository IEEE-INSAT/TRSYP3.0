-- The Fablab Challenge now has two axes instead of three. Postgres can't drop
-- enum values, so the type is rebuilt. No real team had registered when the
-- axes changed, so any old value is cleared (the leader re-picks from the
-- dashboard) rather than mapped.
CREATE TYPE "FablabAxis_new" AS ENUM ('SAMPLE_PREPARATION', 'WEIGHING_DOSING');

ALTER TABLE "teams" ALTER COLUMN "axis" TYPE "FablabAxis_new" USING (NULL);

DROP TYPE "FablabAxis";

ALTER TYPE "FablabAxis_new" RENAME TO "FablabAxis";
