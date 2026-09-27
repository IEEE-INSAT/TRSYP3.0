-- The admin portal created "ieee_verifications" in production before this
-- backend knew about it, and it holds real results. Everything here is
-- guarded so it is a no-op where the table already exists and creates the
-- same shape on a fresh database. Never drop or recreate it.
DO $$ BEGIN
  CREATE TYPE "IeeeCheckStatus" AS ENUM ('VERIFIED', 'MISMATCH', 'INACTIVE', 'NOT_FOUND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ieee_verifications" (
  "id"              TEXT PRIMARY KEY,
  "participant_id"  TEXT NOT NULL UNIQUE REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "status"          "IeeeCheckStatus" NOT NULL,
  "member_status"   TEXT,
  "grade"           TEXT,
  "societies"       TEXT[] NOT NULL DEFAULT '{}',
  "first_initial"   TEXT,
  "last_initial"    TEXT,
  "matched_by"      TEXT,
  "issues"          JSONB NOT NULL DEFAULT '[]',
  "claimed_ieee_id" INTEGER,
  "claimed_type"    TEXT NOT NULL,
  "claimed_is_ras"  BOOLEAN NOT NULL,
  "claimed_email"   TEXT NOT NULL,
  "checked_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checked_by"      TEXT NOT NULL
);

ALTER TABLE "ieee_verifications" ENABLE ROW LEVEL SECURITY;

-- Student / Young Professional is now asked on its own, apart from IEEE
-- membership, so it survives while a participant is priced as NonIEEE.
DO $$ BEGIN
  CREATE TYPE "CareerStage" AS ENUM ('Student', 'YoungProfessional');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "career_stage" "CareerStage";

-- Existing members answered it through their membership type. Rows that
-- registered as non-members never answered and stay null.
UPDATE "participants"
SET "career_stage" = "participant_type"::text::"CareerStage"
WHERE "career_stage" IS NULL AND "participant_type" <> 'NonIEEE';
