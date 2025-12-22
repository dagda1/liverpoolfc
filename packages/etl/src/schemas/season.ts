import { z } from 'zod';

export const SeasonSchema = z.object({
  id: z.string(),
  name: z.string(),
  startYear: z.number(),
  endYear: z.number(),
});

export type Season = z.infer<typeof SeasonSchema>;
