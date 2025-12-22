import type { Manager } from '../schemas/manager';

export const LIVERPOOL_MANAGERS: Manager[] = [
  {
    id: 'benitez',
    name: 'Rafael Benítez',
    nationality: 'Spain',
    startDate: new Date('2004-06-16'),
    endDate: new Date('2010-06-03'),
    isInterim: false,
  },
  {
    id: 'hodgson',
    name: 'Roy Hodgson',
    nationality: 'England',
    startDate: new Date('2010-07-01'),
    endDate: new Date('2011-01-08'),
    isInterim: false,
  },
  {
    id: 'dalglish',
    name: 'Kenny Dalglish',
    nationality: 'Scotland',
    startDate: new Date('2011-01-08'),
    endDate: new Date('2012-05-16'),
    isInterim: false,
  },
  {
    id: 'rodgers',
    name: 'Brendan Rodgers',
    nationality: 'Northern Ireland',
    startDate: new Date('2012-06-01'),
    endDate: new Date('2015-10-04'),
    isInterim: false,
  },
  {
    id: 'klopp',
    name: 'Jürgen Klopp',
    nationality: 'Germany',
    startDate: new Date('2015-10-08'),
    endDate: new Date('2024-05-19'),
    isInterim: false,
  },
  {
    id: 'slot',
    name: 'Arne Slot',
    nationality: 'Netherlands',
    startDate: new Date('2024-06-01'),
    endDate: undefined,
    isInterim: false,
  },
];

export const MANAGER_TROPHIES: Record<string, string[]> = {
  benitez: ['Champions League (2005)', 'FA Cup (2006)', 'Community Shield (2006)'],
  hodgson: [],
  dalglish: ['League Cup (2012)'],
  rodgers: [],
  klopp: [
    'Champions League (2019)',
    'Premier League (2020)',
    'FA Cup (2022)',
    'League Cup (2022, 2024)',
    'Club World Cup (2019)',
    'UEFA Super Cup (2019)',
    'Community Shield (2022)',
  ],
  slot: ['Premier League (2025)'],
};
