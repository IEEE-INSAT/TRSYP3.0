-- Smash Room: one final submission per participant.
CREATE TYPE "SmashPassType" AS ENUM ('DUO', 'TRIO', 'SQUAD');

CREATE TABLE "smash_room_entries" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "sb" "SB",
    "university" TEXT,
    "riddle_answer" TEXT NOT NULL,
    "pass_type" "SmashPassType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smash_room_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "smash_room_entries_affiliation_check" CHECK (("sb" IS NULL) <> ("university" IS NULL))
);

CREATE UNIQUE INDEX "smash_room_entries_participant_id_key" ON "smash_room_entries"("participant_id");

ALTER TABLE "smash_room_entries" ADD CONSTRAINT "smash_room_entries_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
