import { MANUAL_STANDINGS } from '../src/data/standings';
import { createSeason, parseSeasonFile } from '../src/parsers/season-parser';
import { getLiverpoolStanding, parseStandings } from '../src/parsers/standings-parser';
import type { Match } from '../src/schemas/match';
import type { SeasonStats } from '../src/schemas/stats';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/openfootball/england/master';

const SEASONS = [
  '2004-05',
  '2005-06',
  '2006-07',
  '2007-08',
  '2008-09',
  '2009-10',
  '2010-11',
  '2011-12',
  '2012-13',
  '2013-14',
  '2014-15',
  '2015-16',
  '2016-17',
  '2017-18',
  '2018-19',
  '2019-20',
  '2020-21',
  '2021-22',
  '2022-23',
  '2023-24',
  '2024-25',
];

async function fetchSeasonData(seasonId: string) {
  const matchesUrl = `${GITHUB_RAW_BASE}/${seasonId}/1-premierleague.txt`;
  const standingsUrl = `${GITHUB_RAW_BASE}/${seasonId}/.conf.txt`;

  const matchesRes = await fetch(matchesUrl);
  if (!matchesRes.ok) {
    throw new Error(`Failed to fetch matches for ${seasonId}`);
  }

  const matches = await matchesRes.text();

  if (MANUAL_STANDINGS[seasonId]) {
    return { matches, standings: '' };
  }

  const standingsRes = await fetch(standingsUrl);
  if (!standingsRes.ok) {
    throw new Error(`Failed to fetch standings for ${seasonId}`);
  }

  return {
    matches,
    standings: await standingsRes.text(),
  };
}

async function main() {
  console.log('Parsing Liverpool FC data...\n');

  const allMatches: Match[] = [];
  const allSeasonStats: SeasonStats[] = [];

  for (const seasonId of SEASONS) {
    try {
      console.log(`Parsing ${seasonId}...`);

      const season = createSeason(seasonId);
      const data = await fetchSeasonData(seasonId);

      const matches = parseSeasonFile(data.matches, season);

      let liverpoolStanding;
      if (MANUAL_STANDINGS[seasonId]) {
        liverpoolStanding = MANUAL_STANDINGS[seasonId];
      } else {
        const standings = parseStandings(data.standings, season);
        liverpoolStanding = getLiverpoolStanding(standings);
      }

      if (!liverpoolStanding) {
        console.error(`  ✗ Liverpool not found in standings`);
        continue;
      }

      allMatches.push(...matches);

      const homeMatches = matches.filter((m) => m.homeTeam.id === 'liverpool');
      const awayMatches = matches.filter((m) => m.awayTeam.id === 'liverpool');

      const homeRecord = {
        won: homeMatches.filter((m) => m.homeScore > m.awayScore).length,
        drawn: homeMatches.filter((m) => m.homeScore === m.awayScore).length,
        lost: homeMatches.filter((m) => m.homeScore < m.awayScore).length,
      };

      const awayRecord = {
        won: awayMatches.filter((m) => m.awayScore > m.homeScore).length,
        drawn: awayMatches.filter((m) => m.awayScore === m.homeScore).length,
        lost: awayMatches.filter((m) => m.awayScore < m.homeScore).length,
      };

      const seasonStats: SeasonStats = {
        season,
        leaguePosition: liverpoolStanding.position,
        played: liverpoolStanding.played,
        won: liverpoolStanding.won,
        drawn: liverpoolStanding.drawn,
        lost: liverpoolStanding.lost,
        goalsFor: liverpoolStanding.goalsFor,
        goalsAgainst: liverpoolStanding.goalsAgainst,
        goalDifference: liverpoolStanding.goalsFor - liverpoolStanding.goalsAgainst,
        points: liverpoolStanding.points,
        homeRecord,
        awayRecord,
      };

      allSeasonStats.push(seasonStats);

      console.log(`  ✓ ${matches.length} Liverpool matches`);
      console.log(`  ✓ Position: ${liverpoolStanding.position}, Points: ${liverpoolStanding.points}`);
      console.log(`  ✓ W:${liverpoolStanding.won} D:${liverpoolStanding.drawn} L:${liverpoolStanding.lost}`);
      console.log(`  ✓ GF:${liverpoolStanding.goalsFor} GA:${liverpoolStanding.goalsAgainst}`);

      if (matches.length > 0) {
        const firstMatch = matches[0];
        const lastMatch = matches[matches.length - 1];
        console.log(
          `  First: ${firstMatch.homeTeam.name} ${firstMatch.homeScore}-${firstMatch.awayScore} ${firstMatch.awayTeam.name}`,
        );
        console.log(
          `  Last:  ${lastMatch.homeTeam.name} ${lastMatch.homeScore}-${lastMatch.awayScore} ${lastMatch.awayTeam.name}`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`  ✗ Error: ${error.message}`);
      }
    }
  }

  console.log(`\n✓ Total: ${allMatches.length} matches across ${allSeasonStats.length} seasons`);
  console.log(`✓ Titles: ${allSeasonStats.filter((s) => s.leaguePosition === 1).length}`);

  const fs = await import('fs/promises');
  const path = await import('path');

  const dataDir = path.join(process.cwd(), '../../.data');
  await fs.mkdir(dataDir, { recursive: true });

  await fs.writeFile(path.join(dataDir, 'matches.json'), JSON.stringify(allMatches, null, 2), 'utf-8');

  await fs.writeFile(path.join(dataDir, 'season-stats.json'), JSON.stringify(allSeasonStats, null, 2), 'utf-8');

  console.log(`\n✓ Data saved to ${dataDir}/`);
}

main().catch(console.error);
