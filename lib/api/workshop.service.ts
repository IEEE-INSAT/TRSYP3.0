import { apiFetch } from './http';
import type { WorkshopOverview } from './types';

/**
 * Day-3 workshop booking. Seats, the one-per-session rule and the seats held
 * for technical challenge teams are all enforced by the server; every write
 * answers with the refreshed overview.
 */
export const workshopService = {
  /** GET /workshops */
  getOverview(token: string): Promise<WorkshopOverview> {
    return apiFetch<WorkshopOverview>('/workshops', { token });
  },

  /** POST /workshops/:id/booking - also moves an existing seat in the same session. */
  book(workshopId: string, token: string): Promise<WorkshopOverview> {
    return apiFetch<WorkshopOverview>(`/workshops/${workshopId}/booking`, { method: 'POST', token });
  },

  /** DELETE /workshops/:id/booking */
  cancel(workshopId: string, token: string): Promise<WorkshopOverview> {
    return apiFetch<WorkshopOverview>(`/workshops/${workshopId}/booking`, { method: 'DELETE', token });
  },
};
