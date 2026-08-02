/*
  Warnings:

  - You are about to drop the column `password` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[supabaseId]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supabaseId` to the `admins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" DROP COLUMN "password",
ADD COLUMN     "supabaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "password";

-- CreateIndex
CREATE UNIQUE INDEX "admins_supabaseId_key" ON "admins"("supabaseId");
