-- The ArUco register moves from code (aruco.data.ts) to this table so the
-- organizers can reassign what each ID does from the admin portal without a
-- redeploy. Seeded with the register of 11 October 2026.

-- CreateTable
CREATE TABLE "aruco_markers" (
    "marker_id" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clue" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER,
    "collector" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aruco_markers_pkey" PRIMARY KEY ("marker_id"),
    -- DICT_4X4_50 has IDs 0 to 49.
    CONSTRAINT "aruco_markers_id_range" CHECK ("marker_id" BETWEEN 0 AND 49),
    CONSTRAINT "aruco_markers_kind" CHECK ("kind" IN ('beacon', 'indicator', 'collector')),
    CONSTRAINT "aruco_markers_game" CHECK ("game" IN ('Garden', 'Mine')),
    -- Only beacons have a quantity; only collectors have a collector number,
    -- and it must be one with an ARUCO_COLLECTOR_<n>_ANSWER.
    CONSTRAINT "aruco_markers_quantity" CHECK (("kind" = 'beacon') = ("quantity" IS NOT NULL) AND ("quantity" IS NULL OR "quantity" >= 1)),
    CONSTRAINT "aruco_markers_collector" CHECK (("kind" = 'collector') = ("collector" IS NOT NULL) AND ("collector" IS NULL OR "collector" IN (1, 2)))
);

ALTER TABLE "aruco_markers" ENABLE ROW LEVEL SECURITY;

INSERT INTO "aruco_markers" ("marker_id", "kind", "game", "name", "clue", "quantity", "collector") VALUES
    -- Red beacons - Garden (L and E are each placed twice on the field, same ID).
    (0,  'beacon', 'Garden', 'Red beacon', 'A', 1, NULL),
    (10, 'beacon', 'Garden', 'Red beacon', 'L', 2, NULL),
    (20, 'beacon', 'Garden', 'Red beacon', 'I', 1, NULL),
    (30, 'beacon', 'Garden', 'Red beacon', 'E', 2, NULL),
    (40, 'beacon', 'Garden', 'Red beacon', 'N', 1, NULL),
    (12, 'beacon', 'Garden', 'Red beacon', 'C', 1, NULL),
    (22, 'beacon', 'Garden', 'Red beacon', 'S', 1, NULL),
    (32, 'beacon', 'Garden', 'Red beacon', 'K', 1, NULL),
    -- Red beacons - Mine (clues not decided yet).
    (28, 'beacon', 'Mine', 'Red beacon 1', '', 1, NULL),
    (2,  'beacon', 'Mine', 'Red beacon 2', '', 1, NULL),
    (3,  'beacon', 'Mine', 'Red beacon 3', '', 1, NULL),
    (43, 'beacon', 'Mine', 'Red beacon 4', '', 1, NULL),
    -- Indicators - Garden.
    (7,  'indicator', 'Garden', 'Indicator 1', 'two worlds don’t need to be one in order to move together', NULL, NULL),
    (17, 'indicator', 'Garden', 'Indicator 2', 'some connections are stronger if one hand holds the other', NULL, NULL),
    (27, 'indicator', 'Garden', 'Indicator 3', 'One extra letter on the left', NULL, NULL),
    (37, 'indicator', 'Garden', 'Indicator 4', 'At least 3 correct letters on the right', NULL, NULL),
    -- Collectors - Garden. Their words come from ARUCO_COLLECTOR_<n>_ANSWER.
    (47, 'collector', 'Garden', 'Collector 1', '', NULL, 1),
    (6,  'collector', 'Garden', 'Collector 2', '', NULL, 2)
ON CONFLICT ("marker_id") DO NOTHING;
