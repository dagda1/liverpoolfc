import { z } from 'zod';

export const RecentMatchSchema = z.object({
  date: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  score: z.string(),
});

export const HeadToHeadSchema = z.object({
  opponent: z.string(),
  matches: z.number(),
  wins: z.number(),
  draws: z.number(),
  losses: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  recentMatches: z.array(RecentMatchSchema).optional(),
});

export type RecentMatch = z.infer<typeof RecentMatchSchema>;
export type HeadToHead = z.infer<typeof HeadToHeadSchema>;
