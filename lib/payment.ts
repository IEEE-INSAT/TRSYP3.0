/**
 * How a participant can pay the registration fee.
 *
 * The list is the single source of truth for the radio group on the payment
 * page and for the value stored on the profile, so adding a method here is
 * enough to offer it.
 */

/**
 * Every method the system knows about. Kept complete even when some are not
 * offered, because proofs submitted under an older policy still have to be
 * read back and labelled.
 */
export const PAYMENT_METHODS = ['BANK_TRANSFER', 'D17', 'FLOUCI', 'CASH'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * What a participant may actually choose right now.
 *
 * The congress chair settled on bank transfer alone, so the other three are
 * known but closed. Widening this array is all it takes to reopen one - the
 * backend keeps its own copy and is the half that enforces it.
 */
export const OFFERED_PAYMENT_METHODS = ['BANK_TRANSFER'] as const satisfies readonly PaymentMethod[];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  D17: 'D17',
  FLOUCI: 'Flouci',
  CASH: 'Cash',
};

/** One line under each label, so the choice is obvious without a legend. */
export const PAYMENT_METHOD_HINTS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Virement bancaire to the account below',
  D17: 'Mobile payment via the D17 app',
  FLOUCI: 'Mobile payment via the Flouci app',
  CASH: 'Handed to a member of the organizing committee',
};

/**
 * 3 MB a receipt, matching `MAX_PROOF_BYTES` in the backend's payment
 * constants. Checked here only to fail fast - the server enforces it.
 */
export const MAX_PROOF_BYTES = 3 * 1024 * 1024;

/** MIME types the upload accepts, matching the backend's allow-list. */
export const ACCEPTED_PROOF_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
];
