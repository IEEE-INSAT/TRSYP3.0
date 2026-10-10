import { apiFetch } from './http';
import type { MyRoom, Room } from './types';

/**
 * Rooming service - same create / join-by-code flow as teams. Every room is a
 * double, shared by two participants of the same gender; the server enforces
 * both rules.
 */
export const roomingService = {
  /** GET /rooming - the caller's room, or `{ room: null }`. */
  async getMyRoom(token: string): Promise<Room | null> {
    const { room } = await apiFetch<MyRoom>('/rooming', { token });
    return room;
  },

  /** POST /rooming - create a room; the caller becomes its owner. */
  async createRoom(token: string): Promise<Room> {
    return apiFetch<Room>('/rooming', { method: 'POST', token });
  },

  /** POST /rooming/join - move into a room with its 6-character code. */
  async joinRoom(code: string, token: string): Promise<Room> {
    return apiFetch<Room>('/rooming/join', {
      method: 'POST',
      body: { code: code.toUpperCase() },
      token,
    });
  },

  /** DELETE /rooming/leave - roommate moves out. */
  async leaveRoom(token: string): Promise<void> {
    await apiFetch<void>('/rooming/leave', { method: 'DELETE', token });
  },

  /** DELETE /rooming/members/:id - owner removes their roommate. */
  async removeRoommate(participantId: string, token: string): Promise<Room> {
    return apiFetch<Room>(`/rooming/members/${participantId}`, { method: 'DELETE', token });
  },

  /** DELETE /rooming - owner disbands the room, freeing both occupants. */
  async disbandRoom(token: string): Promise<void> {
    await apiFetch<void>('/rooming', { method: 'DELETE', token });
  },
};
