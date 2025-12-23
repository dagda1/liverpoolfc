import type { TamboTool } from '@tambo-ai/react';
import { subYears } from 'date-fns';
import { z } from 'zod';

import { loadMatches } from '../data/loader';
import { HeadToHeadSchema } from '../schemas/head-to-head';

const toolSchema = z.object({
  opponent: z.string().describe('The opponent team name (e.g., "Manchester United", "Chelsea")'),
  lastYears: z.number().optional().describe('Filter to last N years (e.g., 5 for last 5 years)'),
  fromDate: z.string().optional().describe('Start date in ISO format'),
  toDate: z.string().optional().describe('End date in ISO format'),
});

type ToolParams = z.infer<typeof toolSchema>;

export const getHeadToHead: TamboTool = {
  name: 'getHeadToHead',
  description: 'Get Liverpool head-to-head record against a specific opponent with optional date filtering',
  toolSchema: z.function().args(toolSchema).returns(HeadToHeadSchema),
  tool: async (params: ToolParams) => {
    const matches = await loadMatches();

    let filtered = matches.filter((match) => {
      const opponentName = match.homeTeam.id === 'liverpool' ? match.awayTeam.name : match.homeTeam.name;
      return opponentName.toLowerCase().includes(params.opponent.toLowerCase());
    });

    if (params.lastYears) {
      const cutoffDate = subYears(new Date(), params.lastYears);
      filtered = filtered.filter((m) => new Date(m.date) >= cutoffDate);
    }

    if (params.fromDate) {
      const fromDate = new Date(params.fromDate);
      filtered = filtered.filter((m) => new Date(m.date) >= fromDate);
    }

    if (params.toDate) {
      const toDate = new Date(params.toDate);
      filtered = filtered.filter((m) => new Date(m.date) <= toDate);
    }

    const wins = filtered.filter((m) => {
      if (m.homeTeam.id === 'liverpool') {
        return m.homeScore > m.awayScore;
      }
      return m.awayScore > m.homeScore;
    }).length;

    const draws = filtered.filter((m) => m.homeScore === m.awayScore).length;
    const losses = filtered.length - wins - draws;

    const goalsFor = filtered.reduce((sum, m) => {
      return sum + (m.homeTeam.id === 'liverpool' ? m.homeScore : m.awayScore);
    }, 0);

    const goalsAgainst = filtered.reduce((sum, m) => {
      return sum + (m.homeTeam.id === 'liverpool' ? m.awayScore : m.homeScore);
    }, 0);

    return {
      opponent: params.opponent,
      matches: filtered.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      recentMatches: filtered.slice(-5).map((m) => ({
        date: m.date,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        score: `${m.homeScore}-${m.awayScore}`,
      })),
    };
  },
};
