import type { Match, SeasonStats } from '@liverpool/etl';

let matchesCache: Match[] | null = null;
let seasonStatsCache: SeasonStats[] | null = null;

export async function loadMatches(): Promise<Match[]> {
  if (matchesCache) {
    return matchesCache;
  }

  const response = await fetch('/.data/matches.json');
  const data = await response.json();
  matchesCache = data;
  return data;
}

export async function loadSeasonStats(): Promise<SeasonStats[]> {
  if (seasonStatsCache) {
    return seasonStatsCache;
  }

  const response = await fetch('/.data/season-stats.json');
  const data = await response.json();
  seasonStatsCache = data;
  return data;
}
