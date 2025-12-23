import { z } from 'zod';

export const ManagerStatsSchema = z.object({
  manager: z.string(),
  matches: z.number(),
  wins: z.number(),
  draws: z.number(),
  losses: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  points: z.number(),
  pointsPerGame: z.string(),
  winPercentage: z.string(),
});

export const ManagerComparisonSchema = z.object({
  comparison: z.object({
    period: z.string(),
    manager1: ManagerStatsSchema,
    manager2: ManagerStatsSchema,
  }),
});

export type ManagerStats = z.infer<typeof ManagerStatsSchema>;
export type ManagerComparison = z.infer<typeof ManagerComparisonSchema>;
