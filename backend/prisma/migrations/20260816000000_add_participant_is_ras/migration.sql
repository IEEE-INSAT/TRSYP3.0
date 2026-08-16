-- RAS (Robotics and Automation Society) membership, answered at registration.
-- Already applied by hand on production; kept here so a fresh database matches.
-- Existing participants default to "not a RAS member".
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "is_ras" BOOLEAN NOT NULL DEFAULT false;
