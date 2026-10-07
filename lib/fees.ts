/**
 * Registration fees, in Tunisian dinars.
 *
 * Mirror of `backend/src/modules/registration/domain/fees.ts` - the server
 * returns `fee` on every participant response for the admin dashboard, but
 * the participant's own dashboard prices itself locally so the number updates
 * the moment they create or join a team, without a profile refetch. Change
 * both files together.
 */

export const FEE_CURRENCY = 'TND';

export type FeeTier = 'IEEE_RAS' | 'IEEE' | 'NON_IEEE';
/** Fablab wins over Challenger: a Fablab team member pays the Fablab fee whatever other teams they are on. */
export type FeeRole = 'VISITOR' | 'CHALLENGER' | 'FABLAB';

export const FEES: Record<FeeRole, Record<FeeTier, number>> = {
  VISITOR: { IEEE_RAS: 170, IEEE: 175, NON_IEEE: 185 },
  CHALLENGER: { IEEE_RAS: 175, IEEE: 180, NON_IEEE: 190 },
  // Flat, whatever the tier.
  FABLAB: { IEEE_RAS: 100, IEEE: 100, NON_IEEE: 100 },
};

export const FEE_TIER_LABELS: Record<FeeTier, string> = {
  IEEE_RAS: 'IEEE RAS member',
  IEEE: 'IEEE member',
  NON_IEEE: 'Non-IEEE member',
};

export const FEE_ROLE_LABELS: Record<FeeRole, string> = {
  VISITOR: 'Visitor',
  CHALLENGER: 'Challenger',
  FABLAB: 'Fablab participant',
};

export interface FeeInput {
  isIeee: boolean;
  isRas: boolean;
  /** On at least one team (competition or technical challenge). */
  isChallenger: boolean;
  /** Member of a Fablab team. Takes precedence over `isChallenger`. */
  isFablab: boolean;
}

export interface FeeBreakdown {
  fee: number;
  currency: typeof FEE_CURRENCY;
  feeRole: FeeRole;
  feeTier: FeeTier;
}

export function feeTierOf({ isIeee, isRas }: Pick<FeeInput, 'isIeee' | 'isRas'>): FeeTier {
  if (!isIeee) return 'NON_IEEE';
  return isRas ? 'IEEE_RAS' : 'IEEE';
}

export function computeFee(input: FeeInput): FeeBreakdown {
  const feeRole: FeeRole = input.isFablab ? 'FABLAB' : input.isChallenger ? 'CHALLENGER' : 'VISITOR';
  const feeTier = feeTierOf(input);
  return { fee: FEES[feeRole][feeTier], currency: FEE_CURRENCY, feeRole, feeTier };
}

/** "175 TND" */
export function formatFee({ fee, currency }: Pick<FeeBreakdown, 'fee' | 'currency'>): string {
  return `${fee} ${currency}`;
}
