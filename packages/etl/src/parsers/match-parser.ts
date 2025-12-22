import type { Match, Season, Team } from '~/schemas';
import { MatchSchema } from '~/schemas';

import { LIVERPOOL } from '../schemas/team';

export function parseMatchLine(line: string, season: Season, matchday: number, date: Date): Match | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const timeMatch = trimmed.match(/^(\d{2}\.\d{2})\s+(.+)$/);
  if (!timeMatch) {
    return null;
  }

  const [, kickoffTime, rest] = timeMatch;

  const scoreMatch = rest.match(/^(.+?)\s+(\d+)-(\d+)\s+\((\d+)-(\d+)\)\s+(.+)$/);
  if (!scoreMatch) {
    return null;
  }

  const [, homeTeamName, homeScore, awayScore, htHome, htAway, awayTeamName] = scoreMatch;

  const homeTeam = normalizeTeam(homeTeamName.trim());
  const awayTeam = normalizeTeam(awayTeamName.trim());

  const isLiverpoolMatch = homeTeam.id === 'liverpool' || awayTeam.id === 'liverpool';

  if (!isLiverpoolMatch) {
    return null;
  }

  const match: Match = {
    id: `${season.id}-md${matchday}-${homeTeam.id}-${awayTeam.id}`,
    season,
    matchday,
    date,
    kickoffTime,
    homeTeam,
    awayTeam,
    homeScore: parseInt(homeScore, 10),
    awayScore: parseInt(awayScore, 10),
    halfTimeHomeScore: parseInt(htHome, 10),
    halfTimeAwayScore: parseInt(htAway, 10),
  };

  return MatchSchema.parse(match);
}

function normalizeTeam(name: string): Team {
  const normalized = name.toLowerCase();

  if (normalized.includes('liverpool')) {
    return LIVERPOOL;
  }

  const id = normalized
    .replace(/\s+fc$/i, '')
    .replace(/\s+united$/i, '-united')
    .replace(/\s+city$/i, '-city')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  return {
    id,
    name,
    shortName: name.replace(/\s+FC$/i, ''),
  };
}
