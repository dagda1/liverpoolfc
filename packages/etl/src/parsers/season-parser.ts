import { parseMatchLine } from '~/parsers/match-parser';
import type { Match, Season } from '~/schemas';
import { SeasonSchema } from '~/schemas';

export function createSeason(seasonId: string): Season {
  const [startYear, endYear] = seasonId.split('-');
  const fullStartYear = startYear.length === 2 ? parseInt(`20${startYear}`, 10) : parseInt(startYear, 10);
  const fullEndYear = endYear.length === 2 ? parseInt(`20${endYear}`, 10) : parseInt(endYear, 10);

  const season: Season = {
    id: seasonId,
    name: `English Premier League ${fullStartYear}/${String(fullEndYear).slice(-2)}`,
    startYear: fullStartYear,
    endYear: fullEndYear,
  };

  return SeasonSchema.parse(season);
}

export function parseSeasonFile(content: string, season: Season): Match[] {
  const lines = content.split(/\r?\n/);
  const matches: Match[] = [];

  let currentMatchday = 0;
  let currentDate: Date | null = null;
  let currentYear = season.startYear;
  let lastKickoffTime: string | undefined;
  let lastMonth: number | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    const matchdayMatch = trimmed.match(/^(?:»\s+)?Matchday\s+(\d+)/i);
    if (matchdayMatch) {
      currentMatchday = parseInt(matchdayMatch[1], 10);
      continue;
    }

    const dateMatch = trimmed.match(/^\[(\w+)\s+(\w+)\/(\d+)\]/);
    if (dateMatch) {
      const [, , month, day] = dateMatch;
      currentDate = parseDate(month, parseInt(day, 10), season.startYear);
      continue;
    }

    const newDateMatchWithYear = trimmed.match(/^(\w+)\s+(\w+)\/(\d+)\s+(\d{4})$/);
    if (newDateMatchWithYear) {
      const [, , month, day, year] = newDateMatchWithYear;
      const parsedYear = parseInt(year, 10);
      currentYear = parsedYear;
      currentDate = parseDateWithExplicitYear(month, parseInt(day, 10), parsedYear);
      const monthIndex = getMonthIndex(month);
      lastMonth = monthIndex;
      continue;
    }

    const newDateMatchNoYear = trimmed.match(/^(\w+)\s+(\w+)\/(\d+)$/);
    if (newDateMatchNoYear) {
      const [, , month, day] = newDateMatchNoYear;
      const monthIndex = getMonthIndex(month);

      if (lastMonth !== null && lastMonth >= 7 && monthIndex < 7) {
        currentYear++;
      }

      lastMonth = monthIndex;
      currentDate = parseDateWithExplicitYear(month, parseInt(day, 10), currentYear);
      continue;
    }

    if (currentDate && currentMatchday > 0) {
      const match = parseMatchLine(line, season, currentMatchday, currentDate, lastKickoffTime);
      if (match) {
        matches.push(match);
        lastKickoffTime = match.kickoffTime;
      }
    }
  }

  return matches;
}

function getMonthIndex(month: string): number {
  const monthMap: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const monthIndex = monthMap[month.toLowerCase().slice(0, 3)];
  if (monthIndex === undefined) {
    throw new Error(`Unknown month: ${month}`);
  }

  return monthIndex;
}

function parseDateWithExplicitYear(month: string, day: number, year: number): Date {
  const monthIndex = getMonthIndex(month);
  return new Date(year, monthIndex, day);
}

function parseDate(month: string, day: number, year: number): Date {
  const monthMap: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const monthIndex = monthMap[month.toLowerCase().slice(0, 3)];
  if (monthIndex === undefined) {
    throw new Error(`Unknown month: ${month}`);
  }

  const adjustedYear = monthIndex >= 7 ? year : year + 1;

  return new Date(adjustedYear, monthIndex, day);
}
