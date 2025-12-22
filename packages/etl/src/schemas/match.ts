import { z } from 'zod';

import { SeasonSchema } from '~/schemas/season';
import { TeamSchema } from '~/schemas/team';

export const MatchSchema = z.object({
  id: z.string(),
  season: SeasonSchema,
  matchday: z.number(),
  date: z.date(),
  kickoffTime: z.string().optional(),
  homeTeam: TeamSchema,
  awayTeam: TeamSchema,
  homeScore: z.number(),
  awayScore: z.number(),
  halfTimeHomeScore: z.number().optional(),
  halfTimeAwayScore: z.number().optional(),
  venue: z.string().optional(),
});

export type Match = z.infer<typeof MatchSchema>;

export const MatchResultSchema = z.object({
  match: MatchSchema,
  liverpoolResult: z.enum(['win', 'draw', 'loss']),
  liverpoolGoalsFor: z.number(),
  liverpoolGoalsAgainst: z.number(),
  isHome: z.boolean(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;
