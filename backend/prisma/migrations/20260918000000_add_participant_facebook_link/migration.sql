- Optional Facebook profile URL, collected at registration.
-- Already applied by hand on production; kept here so a fresh database matches.
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "facebook_link" TEXT;