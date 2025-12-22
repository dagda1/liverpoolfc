import { z } from 'zod';

import { MatchSchema } from '~/schemas/match';
import { SeasonSchema } from '~/schemas/season';
import { TeamSchema } from '~/schemas/team';

export const RecordSchema = z.object({
  won: z.number(),
  drawn: z.number(),
  lost: z.number(),
});

export type Record = z.infer<typeof RecordSchema>;

export const SeasonStatsSchema = z.object({
  season: SeasonSchema,
  leaguePosition: z.number(),
  played: z.number(),
  won: z.number(),
  drawn: z.number(),
  lost: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  goalDifference: z.number(),
  points: z.number(),
  homeRecord: RecordSchema,
  awayRecord: RecordSchema,
});

export type SeasonStats = z.infer<typeof SeasonStatsSchema>;

export const HeadToHeadSchema = z.object({
  opponent: TeamSchema,
  matches: z.array(MatchSchema),
  liverpoolWins: z.number(),
  liverpoolDraws: z.number(),
  liverpoolLosses: z.number(),
  liverpoolGoalsFor: z.number(),
  liverpoolGoalsAgainst: z.number(),
});

export type HeadToHead = z.infer<typeof HeadToHeadSchema>;
