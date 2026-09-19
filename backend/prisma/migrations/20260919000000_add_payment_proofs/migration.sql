-- Payment proofs: the audit trail behind `participants.paid`.
-- Approving a proof is what flips that flag; a rejected row is kept so a
-- resubmission can be compared against what was turned down.

CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'D17', 'FLOUCI', 'CASH');
CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "payment_proofs" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    -- Null for cash handed to the committee: no receipt exists to upload.
    "storage_path" TEXT,
    "file_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    -- The fee as it stood when the proof was submitted, in TND.
    "amount_snapshot" INTEGER NOT NULL,
    "status" "PaymentProofStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_proofs_status_idx" ON "payment_proofs"("status");
CREATE INDEX "payment_proofs_participant_id_idx" ON "payment_proofs"("participant_id");

ALTER TABLE "payment_proofs"
    ADD CONSTRAINT "payment_proofs_participant_id_fkey"
    FOREIGN KEY ("participant_id") REFERENCES "participants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
