import { LIVERPOOL_MANAGERS } from '@liverpool/etl';
import type { TamboTool } from '@tambo-ai/react';
import { addMonths } from 'date-fns';
import { z } from 'zod';

import { loadMatches } from '../data/loader';
import { ManagerComparisonSchema } from '../schemas/manager-comparison';

const toolSchema = z.object({
  manager1: z.string().describe('First manager name (e.g., "Klopp", "Slot")'),
  manager2: z.string().describe('Second manager name'),
  months: z.number().optional().describe('Number of months to compare (e.g., 6 for first 6 months)'),
  matches: z.number().optional().describe('Number of matches to compare (e.g., 100 for first 100 matches)'),
});

type ToolSchema = z.infer<typeof toolSchema>;

export const compareManagers: TamboTool = {
  name: 'compareManagers',
  description: 'Compare performance of two Liverpool managers over their first N months or N matches',
  toolSchema: z.function().args(toolSchema).returns(ManagerComparisonSchema),
  tool: async (params: ToolSchema) => {
    const matches = await loadMatches();

    if (!params.months && !params.matches) {
      return { error: 'Must specify either months or matches to compare' };
    }

    const findManager = (name: string) => {
      return LIVERPOOL_MANAGERS.find((m: { name: string }) => m.name.toLowerCase().includes(name.toLowerCase()));
    };

    const mgr1 = findManager(params.manager1);
    const mgr2 = findManager(params.manager2);

    if (!mgr1 || !mgr2) {
      return { error: 'Manager not found' };
    }

    const getManagerStats = (manager: typeof mgr1) => {
      const startDate = new Date(manager.startDate);
      const endDate = manager.endDate ? new Date(manager.endDate) : new Date();

      console.log(`Manager: ${manager.name}`);
      console.log(`Start: ${startDate.toISOString()}`);

      const allManagerMatches = matches.filter((m) => {
        const matchDate = new Date(m.date);
        return matchDate >= startDate && matchDate <= endDate;
      });

      let managerMatches = allManagerMatches;

      if (params.matches) {
        managerMatches = allManagerMatches.slice(0, params.matches);
        console.log(`Taking first ${params.matches} matches for ${manager.name}`);
      } else if (params.months) {
        const monthsEndDate = addMonths(startDate, params.months);
        managerMatches = allManagerMatches.filter((m) => {
          const matchDate = new Date(m.date);
          return matchDate < monthsEndDate;
        });
        console.log(`Taking matches within first ${params.months} months for ${manager.name}`);
      }

      console.log(`Matches found for ${manager.name}: ${managerMatches.length}`);

      const wins = managerMatches.filter((m) => {
        if (m.homeTeam.id === 'liverpool') {
          return m.homeScore > m.awayScore;
        }
        return m.awayScore > m.homeScore;
      }).length;

      const draws = managerMatches.filter((m) => m.homeScore === m.awayScore).length;
      const losses = managerMatches.length - wins - draws;

      const goalsFor = managerMatches.reduce((sum, m) => {
        return sum + (m.homeTeam.id === 'liverpool' ? m.homeScore : m.awayScore);
      }, 0);

      const goalsAgainst = managerMatches.reduce((sum, m) => {
        return sum + (m.homeTeam.id === 'liverpool' ? m.awayScore : m.homeScore);
      }, 0);

      const points = wins * 3 + draws;
      const ppg = managerMatches.length > 0 ? points / managerMatches.length : 0;

      return {
        manager: manager.name,
        matches: managerMatches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        points,
        pointsPerGame: ppg.toFixed(2),
        winPercentage: ((wins / managerMatches.length) * 100).toFixed(1),
      };
    };

    const period = params.matches ? `First ${params.matches} matches` : `First ${params.months} months`;

    const result = {
      comparison: {
        period,
        manager1: getManagerStats(mgr1),
        manager2: getManagerStats(mgr2),
      },
    };

    console.log('compareManagers tool returning:', JSON.stringify(result, null, 2));

    return result;
  },
};
