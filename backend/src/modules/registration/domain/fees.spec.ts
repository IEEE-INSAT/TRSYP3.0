import { computeFee, FEES } from './fees';

describe('computeFee', () => {
  // The published price list, one row per cell - keep in sync with FEES and lib/fees.ts.
  it.each([
    ['visitor, IEEE RAS member', { isIeee: true, isRas: true, isChallenger: false }, 170, 'VISITOR', 'IEEE_RAS'],
    ['visitor, IEEE member', { isIeee: true, isRas: false, isChallenger: false }, 175, 'VISITOR', 'IEEE'],
    ['visitor, non-IEEE', { isIeee: false, isRas: false, isChallenger: false }, 185, 'VISITOR', 'NON_IEEE'],
    ['challenger, IEEE RAS member', { isIeee: true, isRas: true, isChallenger: true }, 175, 'CHALLENGER', 'IEEE_RAS'],
    ['challenger, IEEE member', { isIeee: true, isRas: false, isChallenger: true }, 180, 'CHALLENGER', 'IEEE'],
    ['challenger, non-IEEE', { isIeee: false, isRas: false, isChallenger: true }, 190, 'CHALLENGER', 'NON_IEEE'],
  ])('%s -> %i TND', (_label, input, fee, feeRole, feeTier) => {
    expect(computeFee(input)).toEqual({ fee, currency: 'TND', feeRole, feeTier });
  });

  it('ignores a stray RAS flag on a non-IEEE participant', () => {
    expect(computeFee({ isIeee: false, isRas: true, isChallenger: false }).fee).toBe(FEES.VISITOR.NON_IEEE);
  });
});
