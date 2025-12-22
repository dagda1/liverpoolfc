import { z } from 'zod';

export const ManagerSchema = z.object({
  id: z.string(),
  name: z.string(),
  nationality: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isInterim: z.boolean(),
});

export type Manager = z.infer<typeof ManagerSchema>;

export const ManagerStatsSchema = z.object({
  manager: ManagerSchema,
  matches: z.number(),
  won: z.number(),
  drawn: z.number(),
  lost: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  winPercentage: z.number(),
  pointsPerGame: z.number(),
  trophies: z.array(z.string()),
});

export type ManagerStats = z.infer<typeof ManagerStatsSchema>;
