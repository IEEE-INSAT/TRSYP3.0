import { z } from 'zod';

/** What a moderator sets: the step every screen shows, and whether voting is open. */
export const SetEthicsStateSchema = z.object({
  step: z.number().int().min(0).max(50),
  votingOpen: z.boolean(),
});

export type SetEthicsStateInput = z.infer<typeof SetEthicsStateSchema>;
