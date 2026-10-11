-- Agreed exceptions to the fee table. Null means the participant is priced by
-- the usual rules; a value is what they owe instead, in TND.
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "fee_override" INTEGER;
