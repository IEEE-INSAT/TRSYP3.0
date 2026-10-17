-- The two Mine games. Each of four markers shows a safe or an unsafe path;
-- there is no word, and teams get 6 tries instead of ARUCO_SCAN_LIMIT.
-- They are played at other times than the Garden games, one round at a time.

-- AlterTable
ALTER TABLE "aruco_games" ADD COLUMN "field" TEXT NOT NULL DEFAULT 'Garden';
ALTER TABLE "aruco_games" ADD COLUMN "scan_limit" INTEGER;
ALTER TABLE "aruco_games" ALTER COLUMN "word" DROP NOT NULL;
ALTER TABLE "aruco_games" ADD CONSTRAINT "aruco_games_field" CHECK ("field" IN ('Garden', 'Mine'));
ALTER TABLE "aruco_games" ADD CONSTRAINT "aruco_games_scan_limit" CHECK ("scan_limit" IS NULL OR "scan_limit" >= 1);

-- A path marker says whether its path is safe.
ALTER TABLE "aruco_markers" DROP CONSTRAINT "aruco_markers_kind";
ALTER TABLE "aruco_markers" ADD CONSTRAINT "aruco_markers_kind" CHECK ("kind" IN ('letter', 'hint', 'collector', 'path'));
ALTER TABLE "aruco_markers" ADD CONSTRAINT "aruco_markers_path_content" CHECK ("kind" <> 'path' OR "content" IN ('safe', 'unsafe'));

INSERT INTO "aruco_games" ("number", "name", "word", "field", "scan_limit") VALUES
    (4, 'Mine 1', NULL, 'Mine', 6),
    (5, 'Mine 2', NULL, 'Mine', 6);

INSERT INTO "aruco_markers" ("game", "marker_id", "kind", "content", "hint_number") VALUES
    -- Mine 1
    (4, 43, 'path', 'unsafe', NULL),
    (4, 28, 'path', 'safe', NULL),
    (4, 2,  'path', 'unsafe', NULL),
    (4, 3,  'path', 'safe', NULL),
    -- Mine 2
    (5, 43, 'path', 'safe', NULL),
    (5, 28, 'path', 'unsafe', NULL),
    (5, 2,  'path', 'safe', NULL),
    (5, 3,  'path', 'unsafe', NULL);
