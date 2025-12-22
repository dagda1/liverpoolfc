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
  '2025-26',
];

async function fetchSeasonData(seasonId: string): Promise<{ matches: string; standings: string }> {
  const matchesUrl = `${GITHUB_RAW_BASE}/${seasonId}/1-premierleague.txt`;
  const standingsUrl = `${GITHUB_RAW_BASE}/${seasonId}/.conf.txt`;

  const [matchesRes, standingsRes] = await Promise.all([fetch(matchesUrl), fetch(standingsUrl)]);

  if (!matchesRes.ok) {
    throw new Error(`Failed to fetch matches for ${seasonId}: ${matchesRes.statusText}`);
  }

  if (!standingsRes.ok) {
    throw new Error(`Failed to fetch standings for ${seasonId}: ${standingsRes.statusText}`);
  }

  const [matches, standings] = await Promise.all([matchesRes.text(), standingsRes.text()]);

  return { matches, standings };
}

async function main() {
  console.log('Fetching Liverpool FC data from openfootball/england...\n');

  for (const seasonId of SEASONS) {
    try {
      console.log(`Fetching ${seasonId}...`);
      const data = await fetchSeasonData(seasonId);

      console.log(`  ✓ Matches: ${data.matches.split('\n').length} lines`);
      console.log(`  ✓ Standings: ${data.standings.split('\n').length} lines`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`  ✗ Error: ${error.message}`);
      }
    }
  }

  console.log('\nFetch complete!');
}

main().catch(console.error);
