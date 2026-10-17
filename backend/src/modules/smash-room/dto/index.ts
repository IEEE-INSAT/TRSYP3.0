import { z } from 'zod';
import { SB, SmashPassType } from '@prisma/client';

/**
 * A Smash Room submission. IEEE members give their student branch, everyone
 * else their university - exactly one of the two.
 */
export const SubmitSmashRoomSchema = z
  .object({
    firstName: z.string().trim().min(1, { message: 'Enter your name' }).max(60),
    lastName: z.string().trim().min(1, { message: 'Enter your surname' }).max(60),
    sb: z.nativeEnum(SB).nullable().default(null),
    university: z.string().trim().max(120).nullable().default(null),
    riddleAnswer: z.string().trim().min(1, { message: 'Enter your riddle solution' }).max(500),
    passType: z.nativeEnum(SmashPassType, { message: 'Choose duo, trio or squad' }),
  })
  .refine((d) => (d.sb === null) !== (d.university === null || d.university === ''), {
    message: 'Give your student branch or your university',
    path: ['sb'],
  })
  .transform((d) => ({ ...d, university: d.university || null }));

export type SubmitSmashRoomInput = z.infer<typeof SubmitSmashRoomSchema>;
