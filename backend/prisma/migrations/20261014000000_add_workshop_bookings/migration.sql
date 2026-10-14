-- Day-3 workshop booking. Capacity is enforced in the service under a
-- `SELECT ... FOR UPDATE` on the workshop row; one booking per participant
-- per session is enforced here.
CREATE TABLE "workshops" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "speaker" TEXT,
    "room" TEXT NOT NULL,
    "session" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "reserves_challenge_seats" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workshops_capacity_check" CHECK ("capacity" >= 0)
);

CREATE TABLE "workshop_bookings" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "session" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_bookings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workshop_bookings_participant_id_session_key" ON "workshop_bookings"("participant_id", "session");
CREATE INDEX "workshop_bookings_workshop_id_idx" ON "workshop_bookings"("workshop_id");

ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 18 October 2026. Session 1 is 09:00, session 2 is 12:00.
INSERT INTO "workshops" ("id", "title", "speaker", "room", "session", "start_time", "end_time", "capacity", "reserves_challenge_seats", "sort_order") VALUES
    ('pitching', 'Pitching Workshop', 'Yosr Bayar', 'Salle Césarion', 1, '09:00', '10:00', 45, true, 1),
    ('yp-transition-lab', 'YP Transition Lab · Round Tables', 'IEEE Young Professionals', 'Salle César', 1, '09:00', '10:00', 60, false, 2),
    ('agentic-multimodal', 'Building Agentic & Multimodal Systems', 'Mohamed Ali Farhat', 'Salle Sphinx', 2, '12:00', '13:30', 45, false, 1),
    ('if-else-or-ai-agent', 'If/Else or AI Agent? Picking the Right Tool for the Job', 'Khalil Masmoudi', 'Salle César', 2, '12:00', '13:00', 60, false, 2),
    ('ras-leaders', 'RAS Leaders', NULL, 'Salle Césarion', 2, '12:00', '13:00', 12, false, 3);
