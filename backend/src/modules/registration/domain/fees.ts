/**
 * Registration fees, in Tunisian dinars.
 *
 * The fee is never stored: it is derived from three facts that can each change
 * after registration (a RAS toggle, a membership-type switch, joining a team),
 * so a persisted value would go stale. The frontend keeps an identical copy in
 * `lib/fees.ts` - change both together.
 */

export const FEE_CURRENCY = 'TND';

/** Membership tier used to price a participant. */
export type FeeTier = 'IEEE_RAS' | 'IEEE' | 'NON_IEEE';

/**
 * Visitor = attends only; Challenger = on a competition or technical challenge
 * team; Fablab = on a Fablab team. Fablab wins over Challenger: a member of a
 * Fablab team pays the Fablab fee whatever other teams they are on.
 */
export type FeeRole = 'VISITOR' | 'CHALLENGER' | 'FABLAB';

export const FEES: Record<FeeRole, Record<FeeTier, number>> = {
  VISITOR: { IEEE_RAS: 170, IEEE: 175, NON_IEEE: 185 },
  CHALLENGER: { IEEE_RAS: 175, IEEE: 180, NON_IEEE: 190 },
  // Flat, whatever the tier.
  FABLAB: { IEEE_RAS: 100, IEEE: 100, NON_IEEE: 100 },
};

export interface FeeInput {
  /** `participantType !== NonIEEE`. */
  isIeee: boolean;
  /** Only meaningful for IEEE members; the service already forces it false otherwise. */
  isRas: boolean;
  /** Member of at least one selected team, whatever the activity. */
  isChallenger: boolean;
  /** Member of a selected Fablab team. Takes precedence over `isChallenger`. */
  isFablab: boolean;
}

export interface FeeBreakdown {
  /** Amount in `FEE_CURRENCY`. */
  fee: number;
  currency: typeof FEE_CURRENCY;
  feeRole: FeeRole;
  feeTier: FeeTier;
}

export function feeTierOf({ isIeee, isRas }: Pick<FeeInput, 'isIeee' | 'isRas'>): FeeTier {
  if (!isIeee) return 'NON_IEEE';
  return isRas ? 'IEEE_RAS' : 'IEEE';
}

/**
 * Prisma include for the memberships pricing looks at: selected teams only. A
 * team that did not pass the selection phase no longer makes its members
 * challengers.
 */
export const PRICED_MEMBERSHIPS = {
  memberships: { where: { team: { selected: true } }, select: { activity: true } },
} as const;

/** The team facts pricing needs, from the activity of each of the participant's selected memberships. */
export function teamFeeFacts(
  memberships: { activity: string }[] = [],
): Pick<FeeInput, 'isChallenger' | 'isFablab'> {
  return {
    isChallenger: memberships.length > 0,
    isFablab: memberships.some((m) => m.activity === 'FABLAB'),
  };
}

export function computeFee(input: FeeInput): FeeBreakdown {
  const feeRole: FeeRole = input.isFablab ? 'FABLAB' : input.isChallenger ? 'CHALLENGER' : 'VISITOR';
  const feeTier = feeTierOf(input);
  return { fee: FEES[feeRole][feeTier], currency: FEE_CURRENCY, feeRole, feeTier };
}
