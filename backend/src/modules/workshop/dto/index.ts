import { z } from 'zod';

/** Workshop ids are the slugs seeded by the migration, e.g. `pitching`. */
export const WorkshopIdSchema = z
  .string()
  .regex(/^[a-z0-9-]{1,64}$/, { message: 'Invalid workshop id' });
