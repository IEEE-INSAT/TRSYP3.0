/**
 * Workshop booking window, from `WORKSHOP_BOOKING_PHASE`.
 * `soon` and `closed` both block booking and cancelling; they differ only in
 * the message shown, so the frontend can render the right copy.
 */
export type WorkshopBookingPhase = 'soon' | 'open' | 'closed';
