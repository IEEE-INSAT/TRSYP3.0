/*
  Warnings:

  - You are about to drop the column `roomId` on the `participants` table. All the data in the column will be lost.
  - You are about to drop the `invitations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rooms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_guest_id_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_room_id_fkey";

-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_roomId_fkey";

-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_owner_id_fkey";

-- AlterTable
ALTER TABLE "participants" DROP COLUMN "roomId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "invitations";

-- DropTable
DROP TABLE "rooms";

-- DropEnum
DROP TYPE "InvitationStatus";

-- DropEnum
DROP TYPE "RoomStatus";

-- CreateTable
CREATE TABLE "activate_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "activated_at" TIMESTAMP(3),

    CONSTRAINT "activate_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activate_tokens_user_id_key" ON "activate_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activate_tokens_token_key" ON "activate_tokens"("token");

-- AddForeignKey
ALTER TABLE "activate_tokens" ADD CONSTRAINT "activate_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
