-- Fablab concept submission: the Google Drive folder link a team's leader
-- submits from the dashboard, and when it was last (re)submitted.
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "submission_url" TEXT;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP(3);
