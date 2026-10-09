-- Selection phase outcome. Every existing team starts as selected; teams that
-- did not pass are set to false by hand. Only selected teams count toward a
-- member's fee, so members of a team that is out are priced as visitors unless
-- another of their teams was selected.
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "selected" BOOLEAN NOT NULL DEFAULT true;
