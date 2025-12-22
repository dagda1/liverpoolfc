import { z } from 'zod';

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().optional(),
});

export type Team = z.infer<typeof TeamSchema>;

export const LIVERPOOL: Team = {
  id: 'liverpool',
  name: 'Liverpool FC',
  shortName: 'Liverpool',
};
