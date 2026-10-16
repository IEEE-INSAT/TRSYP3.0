import { apiFetch } from './http';
import type { WorkshopOverview } from './types';

/**
 * Day-3 workshop booking. Seats, the one-per-session rule and the seats held
 * for pitching teams are all enforced by the server. Bookings are final.
 */
export const workshopService = {
  /** GET /workshops */
  getOverview(token: string): Promise<WorkshopOverview> {
    return apiFetch<WorkshopOverview>('/workshops', { token });
  },

  /** POST /workshops/:id/booking - final; answers with the refreshed overview. */
  book(workshopId: string, token: string): Promise<WorkshopOverview> {
    return apiFetch<WorkshopOverview>(`/workshops/${workshopId}/booking`, { method: 'POST', token });
  },
};
