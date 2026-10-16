-- Day-3 booking rules, final version:
-- * the two challenge pitching slots become bookable, each by the members of
--   the four teams pitching in it only. Each pitching team must also have a
--   member in a workshop - any of them, in either session - so the Pitching
--   workshop no longer holds seats of its own;
-- * CHAPPATI's members and Jesser Hamdaoui (SMURF) may book without a
--   confirmed payment;
-- * the IIoT workshop joins session 1;
-- * RAS Leaders is labelled for RAS chairs (not enforced).
-- No bookings existed when this was written.
ALTER TABLE "workshops" DROP COLUMN "reserves_challenge_seats";
ALTER TABLE "workshops" ADD COLUMN "audience" TEXT;

CREATE TABLE "workshop_teams" (
    "workshop_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "workshop_teams_pkey" PRIMARY KEY ("workshop_id", "team_id")
);

CREATE INDEX "workshop_teams_team_id_idx" ON "workshop_teams"("team_id");

ALTER TABLE "workshop_teams" ADD CONSTRAINT "workshop_teams_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workshop_teams" ADD CONSTRAINT "workshop_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "workshop_payment_waivers" (
    "participant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_payment_waivers_pkey" PRIMARY KEY ("participant_id")
);

ALTER TABLE "workshop_payment_waivers" ADD CONSTRAINT "workshop_payment_waivers_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Pitching slots first in their session: only their teams see them.
INSERT INTO "workshops" ("id", "title", "speaker", "room", "session", "start_time", "end_time", "capacity", "sort_order") VALUES
    ('challenge-pitching-1', 'Challenge Pitching · Session 1', NULL, 'Party Room', 1, '08:30', '10:00', 10, 0),
    ('iiot-breaking-the-cage', 'Breaking the Cage: How IIoT Gives Robots Senses, Reflexes, and a Human Connection', 'Yassine Houij', 'Salle Sphinx', 1, '09:00', '10:00', 45, 3),
    ('technical-pitching-2', 'Technical Challenge Pitching · Session 2', NULL, 'Party Room', 2, '12:00', '13:00', 10, 0);

UPDATE "workshops" SET "audience" = 'For RAS chairs' WHERE "id" = 'ras-leaders';

-- Teams by join code: names are not unique (NAWARAT and SMURF each have
-- teams in other activities).
--   Session 1: Duo nar, SMU'ltimate Squad, CARTHAGENA, Uriel
--   Session 2: CHAPPATI, NAWARAT, Hoka Thon, SMURF
INSERT INTO "workshop_teams" ("workshop_id", "team_id")
SELECT 'challenge-pitching-1', "id" FROM "teams" WHERE "code" IN ('TPWB2T', 'A9CPEK', 'RDWDD2', 'QCV5MY');

INSERT INTO "workshop_teams" ("workshop_id", "team_id")
SELECT 'technical-pitching-2', "id" FROM "teams" WHERE "code" IN ('KVEGX6', 'KAWFSL', 'JZY3UW', 'U99PUA');

-- Every member of CHAPPATI (technical challenge team, by join code).
INSERT INTO "workshop_payment_waivers" ("participant_id")
SELECT m."participant_id"
FROM "team_memberships" m JOIN "teams" t ON t."id" = m."team_id"
WHERE t."code" = 'KVEGX6';

-- Jesser Hamdaoui, SMURF.
INSERT INTO "workshop_payment_waivers" ("participant_id")
SELECT "id" FROM "participants" WHERE "id" = 'f9fe4431-413c-4656-afeb-00a7994ce492';
