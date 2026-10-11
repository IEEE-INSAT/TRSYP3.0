-- How each payment actually arrived, as the treasurer confirms it. Every
-- existing row starts null ("To confirm") and is filled in from the admin
-- Payments page.
CREATE TYPE "PaymentType" AS ENUM ('BANK_TRANSFER', 'INTERNAL_FUND', 'CASH');

ALTER TABLE "payment_proofs" ADD COLUMN IF NOT EXISTS "payment_type" "PaymentType";
