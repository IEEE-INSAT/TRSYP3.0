-- CreateTable
CREATE TABLE "aruco_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aruco_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aruco_progress_user_id_key" ON "aruco_progress"("user_id");

ALTER TABLE "aruco_progress" ENABLE ROW LEVEL SECURITY;
