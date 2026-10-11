-- The first ArUco game counted attempts per account on a single collector.
-- The register of 11 October has two collectors with attempts per team, so
-- the old per-account rows (from the retired markers) no longer mean anything.
DROP TABLE IF EXISTS "aruco_progress";

-- CreateTable
CREATE TABLE "aruco_collector_progress" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "collector" INTEGER NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aruco_collector_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aruco_collector_progress_team_id_collector_key" ON "aruco_collector_progress"("team_id", "collector");

ALTER TABLE "aruco_collector_progress" ENABLE ROW LEVEL SECURITY;
