import type { AvatarConfig } from '@/lib/api/types';

/**
 * A stored avatar only counts if it carries both halves of the hybrid - the
 * human layer and the robot layer. Anything narrower is treated as "not set",
 * so the editor seeds a fresh draft instead of rendering half a face and the
 * gate keeps holding the user until a real avatar exists.
 *
 * Shared by the editor, the nav lock and the dashboard gate so all three agree
 * on what "has an avatar" means.
 */
export function hasFullAvatar(value: unknown): value is AvatarConfig {
  return !!value && typeof value === 'object' &&
    'topType' in value && 'robotColor' in value;
}
