/**
 * How a participant can pay the registration fee.
 *
 * The list is the single source of truth for the radio group on the payment
 * page and for the value stored on the profile, so adding a method here is
 * enough to offer it.
 */

export const PAYMENT_METHODS = ['BANK_TRANSFER', 'D17', 'FLOUCI', 'CASH'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  D17: 'D17',
  FLOUCI: 'Flouci',
  CASH: 'Cash',
};

/** One line under each label, so the choice is obvious without a legend. */
export const PAYMENT_METHOD_HINTS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Virement bancaire to the RIB above',
  D17: 'Mobile payment via the D17 app',
  FLOUCI: 'Mobile payment via the Flouci app',
  CASH: 'Handed to a member of the organizing committee',
};
