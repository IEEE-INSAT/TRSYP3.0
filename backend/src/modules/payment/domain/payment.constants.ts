import { PaymentMethod } from '@prisma/client';

/**
 * Payment proof storage rules.
 *
 * The bucket is private: nothing here is ever served directly. Reads go
 * through a short-lived signed URL minted per request, so a leaked path is
 * worthless on its own.
 */

/**
 * Methods a participant may submit under right now.
 *
 * The Prisma enum keeps all four so historical proofs still read back, but the
 * congress chair settled on bank transfer alone. Enforced here rather than
 * only hidden in the UI: cash is the one method allowed to arrive without a
 * receipt, so leaving it accepted would let a crafted request register a
 * pending payment with no proof at all.
 */
export const OFFERED_METHODS: PaymentMethod[] = [PaymentMethod.BANK_TRANSFER];

/** Supabase Storage bucket holding the receipts. Must exist and stay private. */
export const PROOF_BUCKET = 'payment-proofs';

/**
 * 3 MB a file.
 *
 * Sized against the 1 GB storage plan and ~300 participants: one stored object
 * each leaves comfortable headroom, which is why `PaymentService` deletes the
 * previous object whenever somebody resubmits rather than accumulating them.
 */
export const MAX_PROOF_BYTES = 3 * 1024 * 1024;

/** A receipt is a screenshot, a photo, or a bank's PDF - nothing else. */
export const ALLOWED_PROOF_MIME = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

/** Extension to store the object under, keyed by the MIME type we accepted. */
export const PROOF_EXTENSION: Record<(typeof ALLOWED_PROOF_MIME)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

/** How long an admin's (or owner's) download link stays valid. */
export const PROOF_SIGNED_URL_TTL_SECONDS = 60;
