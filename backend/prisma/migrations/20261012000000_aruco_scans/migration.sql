-- CreateTable
CREATE TABLE "aruco_scans" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "marker_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aruco_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aruco_scans_team_id_marker_id_key" ON "aruco_scans"("team_id", "marker_id");

ALTER TABLE "aruco_scans" ENABLE ROW LEVEL SECURITY;
