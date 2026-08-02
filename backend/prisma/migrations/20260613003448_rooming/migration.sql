/*
  Warnings:

  - You are about to drop the `email_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('NonIEEE', 'Student', 'YoungProfessional');

-- CreateEnum
CREATE TYPE "SB" AS ENUM ('INSAT', 'ESPRIT', 'SUPCOM', 'ENIT', 'ENETCOM', 'ENIS', 'Other');

-- CreateEnum
CREATE TYPE "COUNTRY" AS ENUM ('Tunisia', 'Algeria', 'Morocco', 'Libya', 'Egypt', 'USA', 'UK', 'Canada', 'Germany', 'France', 'Italy', 'Spain', 'UAE', 'SaudiArabia', 'Jordan', 'Lebanon', 'Palestine', 'Syria', 'Iraq', 'Sudan', 'Turkey', 'India', 'Pakistan', 'Bangladesh', 'China', 'Japan', 'SouthKorea', 'Australia', 'Brazil', 'Argentina', 'Mexico', 'Other');

-- CreateEnum
CREATE TYPE "VisaStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'LetterSent');

-- CreateEnum
CREATE TYPE "POSITION" AS ENUM ('Chair', 'ViceChair', 'Secretary', 'Treasurer', 'Other');

-- DropTable
DROP TABLE "email_logs";

-- DropTable
DROP TABLE "notifications";

-- DropEnum
DROP TYPE "EmailStatus";

-- DropEnum
DROP TYPE "NotificationType";

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ieee_id" INTEGER,
    "phone" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "is_international" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "participant_type" "ParticipantType" NOT NULL,
    "sb" "SB",
    "country" "COUNTRY" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "international_info" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "country_of_residence" TEXT NOT NULL,
    "city_of_residence" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "expected_arrival_date" TIMESTAMP(3) NOT NULL,
    "expected_departure_date" TIMESTAMP(3) NOT NULL,
    "requires_visa_letter" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "international_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visa_applications" (
    "id" TEXT NOT NULL,
    "international_info_id" TEXT NOT NULL,
    "passport_number" TEXT NOT NULL,
    "passport_issuance_country" TEXT NOT NULL,
    "issuing_office" TEXT NOT NULL,
    "passport_issuance_date" TIMESTAMP(3) NOT NULL,
    "passport_expiry_date" TIMESTAMP(3) NOT NULL,
    "embassy_address" TEXT NOT NULL,
    "residence_address" TEXT NOT NULL,
    "status" "VisaStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visa_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "participants_user_id_key" ON "participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "international_info_participant_id_key" ON "international_info"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "visa_applications_international_info_id_key" ON "visa_applications"("international_info_id");

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "international_info" ADD CONSTRAINT "international_info_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visa_applications" ADD CONSTRAINT "visa_applications_international_info_id_fkey" FOREIGN KEY ("international_info_id") REFERENCES "international_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
