import type { Season } from '~/schemas';

export interface StandingsEntry {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export function parseStandings(content: string, _season: Season): StandingsEntry[] {
  const lines = content.split('\n');
  const standings: StandingsEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('=') || trimmed.startsWith('#')) {
      continue;
    }

    const match = trimmed.match(/^\s*(\d+)\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)-(\d+)\s+(\d+)\s*$/);

    if (!match) {
      continue;
    }

    const [, pos, team, played, won, drawn, lost, gf, ga, points] = match;

    standings.push({
      position: parseInt(pos, 10),
      team: team.trim(),
      played: parseInt(played, 10),
      won: parseInt(won, 10),
      drawn: parseInt(drawn, 10),
      lost: parseInt(lost, 10),
      goalsFor: parseInt(gf, 10),
      goalsAgainst: parseInt(ga, 10),
      points: parseInt(points, 10),
    });
  }

  return standings;
}

export function getLiverpoolStanding(standings: StandingsEntry[]): StandingsEntry | null {
  return standings.find((entry) => entry.team.toLowerCase().includes('liverpool')) || null;
}
