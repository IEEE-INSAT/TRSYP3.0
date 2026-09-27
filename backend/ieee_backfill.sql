-- One-off: make existing IEEE verifications the source of truth for pricing.
--
-- For every participant with an ieee_verifications row (written by the admin
-- portal), set participant_type / is_ras from the row with the same rules as
-- src/modules/registration/domain/ieee-membership.ts, then rewrite the row's
-- claimed_type / claimed_is_ras to match, so the admin portal keeps reading it
-- as fresh. Grade is ignored: Student vs Young Professional stays the
-- participant's own answer (career_stage).
--
-- Run AFTER the 20260930000000_add_ieee_verifications migration (it needs
-- career_stage). Rows whose lookup keys (member number, email) changed since
-- the check are skipped: the backend's sweep re-checks those with IEEE.
--
-- Step 1 previews the changes; step 2 applies them in one transaction.

-- ── Step 1: preview (read-only) ─────────────────────────────────────────────
WITH derived AS (
  SELECT
    p.id,
    p.participant_type::text AS old_type,
    p.is_ras AS old_ras,
    CASE
      WHEN lower(trim(coalesce(v.member_status, ''))) IN ('active', 'applicant')
        THEN coalesce(p.career_stage::text, CASE WHEN p.sb IS NOT NULL THEN 'Student' ELSE 'YoungProfessional' END)
      ELSE 'NonIEEE'
    END AS new_type,
    lower(trim(coalesce(v.member_status, ''))) = 'active'
      AND EXISTS (SELECT 1 FROM unnest(v.societies) s WHERE upper(trim(s)) = 'MEMRA024') AS new_ras,
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.participant_id = p.id) AS challenger,
    p.paid
  FROM participants p
  JOIN users u ON u.id = p.user_id
  JOIN ieee_verifications v ON v.participant_id = p.id
  WHERE v.claimed_ieee_id IS NOT DISTINCT FROM p.ieee_id
    AND v.claimed_email = u.email
),
tiers AS (
  SELECT *,
    CASE WHEN old_type = 'NonIEEE' THEN 'NON_IEEE' WHEN old_ras THEN 'IEEE_RAS' ELSE 'IEEE' END AS old_tier,
    CASE WHEN new_type = 'NonIEEE' THEN 'NON_IEEE' WHEN new_ras THEN 'IEEE_RAS' ELSE 'IEEE' END AS new_tier
  FROM derived
)
SELECT old_tier, new_tier,
       CASE WHEN challenger THEN 'CHALLENGER' ELSE 'VISITOR' END AS role,
       paid,
       count(*) AS participants
FROM tiers
GROUP BY 1, 2, 3, 4
ORDER BY (old_tier = new_tier), 5 DESC;

-- ── Step 2: apply ───────────────────────────────────────────────────────────
BEGIN;

WITH derived AS (
  SELECT
    p.id,
    CASE
      WHEN lower(trim(coalesce(v.member_status, ''))) IN ('active', 'applicant')
        THEN coalesce(p.career_stage::text, CASE WHEN p.sb IS NOT NULL THEN 'Student' ELSE 'YoungProfessional' END)
      ELSE 'NonIEEE'
    END AS new_type,
    lower(trim(coalesce(v.member_status, ''))) = 'active'
      AND EXISTS (SELECT 1 FROM unnest(v.societies) s WHERE upper(trim(s)) = 'MEMRA024') AS new_ras
  FROM participants p
  JOIN users u ON u.id = p.user_id
  JOIN ieee_verifications v ON v.participant_id = p.id
  WHERE v.claimed_ieee_id IS NOT DISTINCT FROM p.ieee_id
    AND v.claimed_email = u.email
),
updated AS (
  UPDATE participants p
  SET participant_type = d.new_type::"ParticipantType",
      is_ras = d.new_ras,
      updated_at = CURRENT_TIMESTAMP
  FROM derived d
  WHERE p.id = d.id
    AND (p.participant_type::text <> d.new_type OR p.is_ras <> d.new_ras)
  RETURNING p.id, p.participant_type, p.is_ras
)
UPDATE ieee_verifications v
SET claimed_type = u.participant_type::text,
    claimed_is_ras = u.is_ras
FROM updated u
WHERE v.participant_id = u.id;

-- Every row must now be fresh on all four claimed values (expect 0).
SELECT count(*) AS still_stale
FROM ieee_verifications v
JOIN participants p ON p.id = v.participant_id
JOIN users u ON u.id = p.user_id
WHERE v.claimed_type <> p.participant_type::text
   OR v.claimed_is_ras <> p.is_ras
   OR v.claimed_ieee_id IS DISTINCT FROM p.ieee_id
   OR v.claimed_email <> u.email;

COMMIT;
