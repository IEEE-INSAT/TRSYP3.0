-- The ArUco challenge becomes three Garden games (Human, Machine, Alliance),
-- each giving its own meaning to the same printed markers, played in rounds
-- the admin portal starts for chosen Competition teams. The single register,
-- the per-team scans and the two env-configured collectors go; progress was
-- empty when this was written.
DROP TABLE IF EXISTS "aruco_markers";
DROP TABLE IF EXISTS "aruco_scans";
DROP TABLE IF EXISTS "aruco_collector_progress";

-- CreateTable
CREATE TABLE "aruco_games" (
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "word" TEXT NOT NULL,

    CONSTRAINT "aruco_games_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "aruco_markers" (
    "game" INTEGER NOT NULL,
    "marker_id" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "hint_number" INTEGER,

    CONSTRAINT "aruco_markers_pkey" PRIMARY KEY ("game", "marker_id"),
    -- DICT_4X4_50 has IDs 0 to 49.
    CONSTRAINT "aruco_markers_id_range" CHECK ("marker_id" BETWEEN 0 AND 49),
    CONSTRAINT "aruco_markers_kind" CHECK ("kind" IN ('letter', 'hint', 'collector')),
    CONSTRAINT "aruco_markers_hint_number" CHECK (("kind" = 'hint') = ("hint_number" IS NOT NULL))
);

-- CreateTable
CREATE TABLE "aruco_rounds" (
    "id" TEXT NOT NULL,
    "game" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_by" TEXT NOT NULL,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "aruco_rounds_pkey" PRIMARY KEY ("id")
);

-- At most one live round.
CREATE UNIQUE INDEX "aruco_rounds_one_live" ON "aruco_rounds" ((true)) WHERE "ended_at" IS NULL;

-- CreateTable
CREATE TABLE "aruco_round_teams" (
    "round_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "aruco_round_teams_pkey" PRIMARY KEY ("round_id", "team_id")
);

-- CreateTable
CREATE TABLE "aruco_scans" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "marker_id" INTEGER NOT NULL,
    "kind" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "hint_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aruco_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aruco_scans_round_id_team_id_marker_id_key" ON "aruco_scans"("round_id", "team_id", "marker_id");

-- CreateTable
CREATE TABLE "aruco_word_progress" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aruco_word_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aruco_word_progress_round_id_team_id_key" ON "aruco_word_progress"("round_id", "team_id");

-- CreateTable
CREATE TABLE "aruco_events" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "marker_id" INTEGER,
    "outcome" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aruco_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aruco_events_round_id_created_at_idx" ON "aruco_events"("round_id", "created_at");

-- AddForeignKey
ALTER TABLE "aruco_markers" ADD CONSTRAINT "aruco_markers_game_fkey" FOREIGN KEY ("game") REFERENCES "aruco_games"("number") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aruco_rounds" ADD CONSTRAINT "aruco_rounds_game_fkey" FOREIGN KEY ("game") REFERENCES "aruco_games"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "aruco_round_teams" ADD CONSTRAINT "aruco_round_teams_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "aruco_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aruco_events" ADD CONSTRAINT "aruco_events_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "aruco_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase exposes public tables over PostgREST; only the backend and the
-- admin portal's direct connections should touch these.
ALTER TABLE "aruco_games" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aruco_markers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aruco_rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aruco_round_teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aruco_scans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aruco_word_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aruco_events" ENABLE ROW LEVEL SECURITY;

-- The games of 17 October 2026. Red beacons give a letter, blue beacons a
-- numbered hint; IDs 6 and 47 ask for the game's word in every game.
INSERT INTO "aruco_games" ("number", "name", "word") VALUES
    (1, 'Human', 'HUMAN'),
    (2, 'Machine', 'MACHINE'),
    (3, 'Alliance', 'ALLIANCE');

INSERT INTO "aruco_markers" ("game", "marker_id", "kind", "content", "hint_number") VALUES
    -- Game 1: Human
    (1, 40, 'letter', 'M', NULL),
    (1, 20, 'letter', 'H', NULL),
    (1, 0,  'letter', 'N', NULL),
    (1, 32, 'letter', 'I', NULL),
    (1, 12, 'letter', 'N', NULL),
    (1, 30, 'letter', 'A', NULL),
    (1, 10, 'letter', 'U', NULL),
    (1, 22, 'letter', 'R', NULL),
    (1, 27, 'hint', 'The word contains 5 letters', 1),
    (1, 37, 'hint', '2 letters of the beacons where the arrows point are correct', 2),
    (1, 7,  'hint', '“Made of flesh”', 3),
    (1, 17, 'hint', '2 letters of the beacons where the arrows point are wrong', 4),
    (1, 6,  'collector', '', NULL),
    (1, 47, 'collector', '', NULL),
    -- Game 2: Machine
    (2, 20, 'letter', 'M', NULL),
    (2, 40, 'letter', 'H', NULL),
    (2, 32, 'letter', 'P', NULL),
    (2, 0,  'letter', 'I', NULL),
    (2, 30, 'letter', 'C', NULL),
    (2, 12, 'letter', 'E', NULL),
    (2, 22, 'letter', 'A', NULL),
    (2, 10, 'letter', 'N', NULL),
    (2, 37, 'hint', '7 letters', 1),
    (2, 27, 'hint', '2 letters of the beacons where the arrows point are right', 2),
    (2, 17, 'hint', '“Made by humans to automate”', 3),
    (2, 7,  'hint', '2 letters of the beacons where the arrows point are right', 4),
    (2, 6,  'collector', '', NULL),
    (2, 47, 'collector', '', NULL),
    -- Game 3: Alliance
    (3, 0,  'letter', 'A', NULL),
    (3, 32, 'letter', 'K', NULL),
    (3, 40, 'letter', 'N', NULL),
    (3, 20, 'letter', 'I', NULL),
    (3, 10, 'letter', 'L', NULL),
    (3, 22, 'letter', 'S', NULL),
    (3, 12, 'letter', 'C', NULL),
    (3, 30, 'letter', 'E', NULL),
    (3, 7,  'hint', '8 letters', 1),
    (3, 17, 'hint', '2 letters of the beacons where the arrows point are wrong', 2),
    (3, 27, 'hint', '“Is an act of union between two sides”', 3),
    (3, 37, 'hint', '2 letters of the beacons where the arrows point are right', 4),
    (3, 6,  'collector', '', NULL),
    (3, 47, 'collector', '', NULL);
