# Liverpool FC Data ETL & Generative UI Planning

## Project Overview

Build a TypeScript ETL package to parse Liverpool FC match data from the [openfootball/england](https://github.com/openfootball/england) repository (2004-05 onwards) and expose it via GraphQL for use with [Tambo](https://github.com/tambo-ai/tambo) generative UI.

---

## Data Source Analysis

### openfootball/england Format

The data is stored in plain text files with this structure:

```
= English Premier League 2004/05

Matchday 1
[Sat Aug/14]
  12.45  Tottenham Hotspur        1-1 (1-1)  Liverpool FC
  15.00  Aston Villa              2-0 (2-0)  Southampton FC
[Sun Aug/15]
  16.05  Chelsea FC               1-0 (1-0)  Manchester United
```

**Key observations:**
- Season header: `= English Premier League YYYY/YY`
- Matchday grouping: `Matchday N`
- Date format: `[Day Mon/DD]`
- Match format: `Time  HomeTeam  Score (HT-Score)  AwayTeam`
- Score format: `HomeGoals-AwayGoals (HalfTimeHome-HalfTimeAway)`

### Available Seasons (from 2004-05)
- `2004-05/1-premierleague.txt` through current season
- **Only parsing `1-premierleague.txt`** (ignore Championship, League One, etc.)

### League Standings Format (`.conf.txt`)

Each season folder has a `.conf.txt` with final league positions:

```
= English Premier League 2004/05    # no. 13

 1  Chelsea                 38  29  8  1  72-15  95
 2  Arsenal                 38  25  8  5  87-36  83
 5  Liverpool               38  17  7 14  52-41  58
...
```

**Format:** `Position  Team  Played  Won  Drawn  Lost  GF-GA  Points`

This gives us Liverpool's final league position and full season stats for each year.

---

## Data Model Design

### Core TypeScript Types

```typescript
interface Season {
  id: string;              // e.g., "2004-05"
  name: string;            // e.g., "English Premier League 2004/05"
  startYear: number;
  endYear: number;
}

interface Team {
  id: string;              // Normalized slug
  name: string;            // Display name e.g., "Liverpool FC"
  shortName?: string;      // e.g., "Liverpool"
}

interface Match {
  id: string;
  season: Season;
  matchday: number;
  date: Date;
  kickoffTime?: string;    // e.g., "12.45"
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  halfTimeHomeScore?: number;
  halfTimeAwayScore?: number;
  venue?: string;
}

interface MatchResult {
  match: Match;
  liverpoolResult: 'win' | 'draw' | 'loss';
  liverpoolGoalsFor: number;
  liverpoolGoalsAgainst: number;
  isHome: boolean;
}

interface SeasonStats {
  season: Season;
  leaguePosition: number;      // From .conf.txt (e.g., 5 for 2004-05)
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  homeRecord: { won: number; drawn: number; lost: number };
  awayRecord: { won: number; drawn: number; lost: number };
}

interface HeadToHead {
  opponent: Team;
  matches: Match[];
  liverpoolWins: number;
  liverpoolDraws: number;
  liverpoolLosses: number;
  liverpoolGoalsFor: number;
  liverpoolGoalsAgainst: number;
}

interface Manager {
  id: string;
  name: string;
  nationality: string;
  startDate: Date;
  endDate?: Date;          // undefined = current manager
  isInterim: boolean;
}

interface ManagerStats {
  manager: Manager;
  matches: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  winPercentage: number;
  pointsPerGame: number;
  trophies: string[];      // e.g., ["Champions League 2005", "FA Cup 2006"]
}
```

### Zod Schemas

```typescript
import { z } from 'zod';

export const SeasonSchema = z.object({
  id: z.string(),
  name: z.string(),
  startYear: z.number(),
  endYear: z.number(),
});

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().optional(),
});

export const MatchSchema = z.object({
  id: z.string(),
  season: SeasonSchema,
  matchday: z.number(),
  date: z.date(),
  kickoffTime: z.string().optional(),
  homeTeam: TeamSchema,
  awayTeam: TeamSchema,
  homeScore: z.number(),
  awayScore: z.number(),
  halfTimeHomeScore: z.number().optional(),
  halfTimeAwayScore: z.number().optional(),
  venue: z.string().optional(),
});

export const MatchResultSchema = z.object({
  match: MatchSchema,
  liverpoolResult: z.enum(['win', 'draw', 'loss']),
  liverpoolGoalsFor: z.number(),
  liverpoolGoalsAgainst: z.number(),
  isHome: z.boolean(),
});

export const RecordSchema = z.object({
  won: z.number(),
  drawn: z.number(),
  lost: z.number(),
});

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

export const HeadToHeadSchema = z.object({
  opponent: TeamSchema,
  matches: z.array(MatchSchema),
  liverpoolWins: z.number(),
  liverpoolDraws: z.number(),
  liverpoolLosses: z.number(),
  liverpoolGoalsFor: z.number(),
  liverpoolGoalsAgainst: z.number(),
});

export const ManagerSchema = z.object({
  id: z.string(),
  name: z.string(),
  nationality: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isInterim: z.boolean(),
});

export const ManagerStatsSchema = z.object({
  manager: ManagerSchema,
  matches: z.number(),
  won: z.number(),
  drawn: z.number(),
  lost: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  winPercentage: z.number(),
  pointsPerGame: z.number(),
  trophies: z.array(z.string()),
});

// Infer TypeScript types from schemas
export type Season = z.infer<typeof SeasonSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type MatchResult = z.infer<typeof MatchResultSchema>;
export type Record = z.infer<typeof RecordSchema>;
export type SeasonStats = z.infer<typeof SeasonStatsSchema>;
export type HeadToHead = z.infer<typeof HeadToHeadSchema>;
export type Manager = z.infer<typeof ManagerSchema>;
export type ManagerStats = z.infer<typeof ManagerStatsSchema>;
```

---

## Manager Data (Static)

This data is **not** in openfootball and must be maintained manually:

```typescript
const LIVERPOOL_MANAGERS: Manager[] = [
  {
    id: "benitez",
    name: "Rafael Benítez",
    nationality: "Spain",
    startDate: new Date("2004-06-16"),
    endDate: new Date("2010-06-03"),
    isInterim: false,
  },
  {
    id: "hodgson",
    name: "Roy Hodgson",
    nationality: "England",
    startDate: new Date("2010-07-01"),
    endDate: new Date("2011-01-08"),
    isInterim: false,
  },
  {
    id: "dalglish",
    name: "Kenny Dalglish",
    nationality: "Scotland",
    startDate: new Date("2011-01-08"),
    endDate: new Date("2012-05-16"),
    isInterim: false,  // Started as caretaker, made permanent
  },
  {
    id: "rodgers",
    name: "Brendan Rodgers",
    nationality: "Northern Ireland",
    startDate: new Date("2012-06-01"),
    endDate: new Date("2015-10-04"),
    isInterim: false,
  },
  {
    id: "klopp",
    name: "Jürgen Klopp",
    nationality: "Germany",
    startDate: new Date("2015-10-08"),
    endDate: new Date("2024-05-19"),
    isInterim: false,
  },
  {
    id: "slot",
    name: "Arne Slot",
    nationality: "Netherlands",
    startDate: new Date("2024-06-01"),
    endDate: undefined,  // Current manager
    isInterim: false,
  },
];
```

### Manager Trophies (2004-05 onwards)

| Manager | Trophies |
|---------|----------|
| Benítez | Champions League (2005), FA Cup (2006), Community Shield (2006) |
| Hodgson | - |
| Dalglish | League Cup (2012) |
| Rodgers | - |
| Klopp | Champions League (2019), Premier League (2020), FA Cup (2022), League Cup (2022, 2024), Club World Cup (2019), UEFA Super Cup (2019), Community Shield (2022) |
| Slot | Premier League (2025) |

---

## GraphQL Schema Design

```graphql
type Query {
  # Season queries
  seasons: [Season!]!
  season(id: String!): Season
  
  # Manager queries
  managers: [Manager!]!
  manager(id: String!): Manager
  managerAtDate(date: DateTime!): Manager
  
  # Match queries
  matches(
    seasonId: String
    opponent: String
    result: MatchResultFilter
    venue: VenueFilter
    fromDate: DateTime
    toDate: DateTime
    lastYears: Int
    limit: Int
    offset: Int
  ): MatchConnection!
  
  match(id: String!): Match
  
  # Statistics
  seasonStats(
    seasonId: String!
    fromDate: DateTime
    toDate: DateTime
  ): SeasonStats!
  
  allTimeStats(
    fromDate: DateTime
    toDate: DateTime
    lastYears: Int
  ): AllTimeStats!
  
  headToHead(
    opponent: String!
    managerId: String        # Optional: filter by manager tenure (e.g., "klopp")
    fromDate: DateTime       # Optional: all date params are optional
    toDate: DateTime
    lastYears: Int
  ): HeadToHead!
  
  managerStats(
    managerId: String!
    fromDate: DateTime
    toDate: DateTime
  ): ManagerStats!
  
  compareManagers(
    managerIds: [String!]!
    fromDate: DateTime
    toDate: DateTime
    lastYears: Int
  ): ManagerComparison!
  
  # Partial tenure comparison (e.g., first 6 months)
  managerStatsByPeriod(
    managerId: String!
    months: Int              # First N months of tenure
    startDate: DateTime      # Or custom date range
    endDate: DateTime
  ): ManagerStats!
  
  compareManagerPeriods(
    comparisons: [ManagerPeriodInput!]!
  ): ManagerComparison!
  
  # Aggregations
  biggestWins(
    fromDate: DateTime
    toDate: DateTime
    lastYears: Int
    limit: Int
  ): [Match!]!
  
  biggestLosses(
    fromDate: DateTime
    toDate: DateTime
    lastYears: Int
    limit: Int
  ): [Match!]!
  
  # Search
  searchMatches(
    query: String!
    fromDate: DateTime
    toDate: DateTime
    lastYears: Int
  ): [Match!]!
}

type Season {
  id: String!
  name: String!
  startYear: Int!
  endYear: Int!
  matches: [Match!]!
  stats: SeasonStats!
}

type Team {
  id: String!
  name: String!
  shortName: String
}

type Match {
  id: String!
  season: Season!
  matchday: Int!
  date: DateTime!
  kickoffTime: String
  homeTeam: Team!
  awayTeam: Team!
  homeScore: Int!
  awayScore: Int!
  halfTimeHomeScore: Int
  halfTimeAwayScore: Int
  liverpoolResult: MatchResult!
  isLiverpoolHome: Boolean!
  manager: Manager!           # Derived from match date
}

type SeasonStats {
  season: Season!
  played: Int!
  won: Int!
  drawn: Int!
  lost: Int!
  goalsFor: Int!
  goalsAgainst: Int!
  goalDifference: Int!
  points: Int!
  homeRecord: Record!
  awayRecord: Record!
}

type Record {
  won: Int!
  drawn: Int!
  lost: Int!
}

type HeadToHead {
  opponent: Team!
  totalMatches: Int!
  liverpoolWins: Int!
  draws: Int!
  liverpoolLosses: Int!
  liverpoolGoalsFor: Int!
  liverpoolGoalsAgainst: Int!
  matches: [Match!]!
}

type Manager {
  id: String!
  name: String!
  nationality: String!
  startDate: DateTime!
  endDate: DateTime
  isInterim: Boolean!
  stats: ManagerStats!
  matches: [Match!]!
}

type ManagerStats {
  manager: Manager!
  totalMatches: Int!
  won: Int!
  drawn: Int!
  lost: Int!
  goalsFor: Int!
  goalsAgainst: Int!
  winPercentage: Float!
  pointsPerGame: Float!
  trophies: [String!]!
}

type ManagerComparison {
  managers: [ManagerStats!]!
}

input ManagerPeriodInput {
  managerId: String!
  months: Int                # First N months of tenure (e.g., 6)
  startDate: DateTime        # Or custom date range
  endDate: DateTime
}

enum MatchResult {
  WIN
  DRAW
  LOSS
}

enum VenueFilter {
  HOME
  AWAY
  ALL
}

type MatchConnection {
  edges: [MatchEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type MatchEdge {
  node: Match!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

---

## Tambo Integration Design

### Generative UI Components

Register these components with Tambo for AI-driven rendering:

```typescript
// 1. Match Card - Display single match
const MatchCard: TamboComponent = {
  name: "MatchCard",
  description: "Displays a single Liverpool FC match with score, date, and result",
  component: MatchCardComponent,
  propsSchema: z.object({
    match: MatchSchema,
  }),
};

// 2. Season Summary - Stats overview
const SeasonSummary: TamboComponent = {
  name: "SeasonSummary",
  description: "Shows Liverpool's season statistics including points, goals, and record",
  component: SeasonSummaryComponent,
  propsSchema: z.object({
    stats: SeasonStatsSchema,
  }),
};

// 3. Match List - Multiple matches
const MatchList: TamboComponent = {
  name: "MatchList",
  description: "Displays a list of Liverpool FC matches with filtering",
  component: MatchListComponent,
  propsSchema: z.object({
    matches: z.array(MatchSchema),
    title: z.string().optional(),
  }),
};

// 4. Head to Head - Rivalry stats
const HeadToHeadView: TamboComponent = {
  name: "HeadToHeadView",
  description: "Shows Liverpool's record against a specific opponent",
  component: HeadToHeadComponent,
  propsSchema: z.object({
    data: HeadToHeadSchema,
  }),
};

// 5. Stats Chart - Visualizations
const StatsChart: TamboComponent = {
  name: "StatsChart",
  description: "Displays charts showing Liverpool's performance metrics",
  component: StatsChartComponent,
  propsSchema: z.object({
    data: z.array(z.object({ name: z.string(), value: z.number() })),
    type: z.enum(["line", "bar", "pie"]),
    title: z.string(),
  }),
};

// 6. Comparison Table
const ComparisonTable: TamboComponent = {
  name: "ComparisonTable",
  description: "Compares Liverpool's stats across multiple seasons",
  component: ComparisonTableComponent,
  propsSchema: z.object({
    seasons: z.array(SeasonStatsSchema),
  }),
};

// 7. Manager Card - Single manager stats
const ManagerCard: TamboComponent = {
  name: "ManagerCard",
  description: "Displays a Liverpool FC manager's tenure, record, and trophies",
  component: ManagerCardComponent,
  propsSchema: z.object({
    manager: ManagerSchema,
    stats: ManagerStatsSchema,
  }),
};

// 8. Manager Comparison - Compare multiple managers
const ManagerComparison: TamboComponent = {
  name: "ManagerComparison",
  description: "Compares statistics between Liverpool FC managers side by side",
  component: ManagerComparisonComponent,
  propsSchema: z.object({
    managers: z.array(ManagerStatsSchema),
  }),
};

// 9. Manager Timeline - Visual timeline of managers
const ManagerTimeline: TamboComponent = {
  name: "ManagerTimeline",
  description: "Shows a visual timeline of Liverpool FC managers and their tenures",
  component: ManagerTimelineComponent,
  propsSchema: z.object({
    managers: z.array(ManagerSchema),
  }),
};
```

### Example User Queries → UI Responses

| User Query | Tambo Response |
|------------|----------------|
| "How did Liverpool do in 2004-05?" | `SeasonSummary` with full season stats |
| "Show me the last 5 matches against Man United" | `MatchList` with head-to-head filter |
| "What's Liverpool's record at Anfield this season?" | `StatsChart` with home record pie chart |
| "Biggest Liverpool wins ever" | `MatchList` sorted by goal difference |
| "Compare 2004-05 and 2005-06 seasons" | `ComparisonTable` with both seasons |
| "How does Klopp compare to Benítez?" | `ManagerComparison` with both managers' stats |
| "What was Klopp's win percentage?" | `ManagerCard` with Klopp's full record |
| "Who won the most trophies?" | `ManagerComparison` sorted by trophy count |
| "Show me all Liverpool managers" | `ManagerTimeline` with all managers |
| "Matches under Rodgers" | `MatchList` filtered by manager tenure |
| **"Compare Slot's first 6 months to Klopp's first 6 months"** | `ManagerComparison` with partial tenure stats |

### Local Tools for Tambo

```typescript
const tools: TamboTool[] = [
  {
    name: "getLiverpoolMatches",
    description: "Fetches Liverpool FC matches with optional filters",
    tool: async (params: { seasonId?: string; opponent?: string; limit?: number }) => {
      return graphqlClient.query(GET_MATCHES, params);
    },
    toolSchema: z.function()
      .args(z.object({
        seasonId: z.string().optional(),
        opponent: z.string().optional(),
        limit: z.number().optional(),
      }))
      .returns(z.array(MatchSchema)),
  },
  {
    name: "getSeasonStats",
    description: "Gets Liverpool's statistics for a specific season",
    tool: async (seasonId: string) => {
      return graphqlClient.query(GET_SEASON_STATS, { seasonId });
    },
    toolSchema: z.function()
      .args(z.string())
      .returns(SeasonStatsSchema),
  },
  {
    name: "getHeadToHead",
    description: "Gets Liverpool's head-to-head record against an opponent",
    tool: async (opponent: string) => {
      return graphqlClient.query(GET_HEAD_TO_HEAD, { opponent });
    },
    toolSchema: z.function()
      .args(z.string())
      .returns(HeadToHeadSchema),
  },
  {
    name: "getManagers",
    description: "Gets all Liverpool FC managers",
    tool: async () => {
      return graphqlClient.query(GET_MANAGERS);
    },
    toolSchema: z.function()
      .args(z.void())
      .returns(z.array(ManagerSchema)),
  },
  {
    name: "getManagerStats",
    description: "Gets a specific manager's statistics and record",
    tool: async (managerId: string) => {
      return graphqlClient.query(GET_MANAGER_STATS, { managerId });
    },
    toolSchema: z.function()
      .args(z.string())
      .returns(ManagerStatsSchema),
  },
  {
    name: "compareManagers",
    description: "Compares statistics between multiple Liverpool FC managers",
    tool: async (managerIds: string[]) => {
      return graphqlClient.query(COMPARE_MANAGERS, { managerIds });
    },
    toolSchema: z.function()
      .args(z.array(z.string()))
      .returns(z.array(ManagerStatsSchema)),
  },
  {
    name: "getMatchesByManager",
    description: "Gets Liverpool FC matches during a specific manager's tenure",
    tool: async (params: { managerId: string; limit?: number }) => {
      return graphqlClient.query(GET_MATCHES_BY_MANAGER, params);
    },
    toolSchema: z.function()
      .args(z.object({
        managerId: z.string(),
        limit: z.number().optional(),
      }))
      .returns(z.array(MatchSchema)),
  },
  {
    name: "compareManagerPeriods",
    description: "Compares managers over specific time periods (e.g., first 6 months of each tenure)",
    tool: async (comparisons: Array<{ managerId: string; months?: number }>) => {
      return graphqlClient.query(COMPARE_MANAGER_PERIODS, { comparisons });
    },
    toolSchema: z.function()
      .args(z.array(z.object({
        managerId: z.string(),
        months: z.number().optional(),  // First N months, defaults to full tenure
      })))
      .returns(z.array(ManagerStatsSchema)),
  },
];
```

---

## Package Structure

```
packages/etl/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── src/
│   ├── index.ts                 # Main exports
│   ├── parser/
│   │   ├── index.ts
│   │   ├── match-parser.ts      # Parse match lines
│   │   ├── season-parser.ts     # Parse season files
│   │   └── __tests__/
│   │       ├── match-parser.test.ts
│   │       └── season-parser.test.ts
│   ├── filters/
│   │   ├── index.ts
│   │   └── liverpool-filter.ts  # Filter Liverpool matches only
│   ├── transformers/
│   │   ├── index.ts
│   │   ├── stats-calculator.ts  # Calculate season/all-time stats
│   │   └── head-to-head.ts      # H2H calculations
│   ├── types/
│   │   ├── index.ts
│   │   ├── match.ts
│   │   ├── season.ts
│   │   ├── team.ts
│   │   ├── manager.ts
│   │   └── stats.ts
│   ├── managers/
│   │   ├── index.ts
│   │   ├── managers.ts          # Static manager data
│   │   ├── trophies.ts          # Trophy data by manager
│   │   └── manager-resolver.ts  # Get manager for match date
│   ├── graphql/
│   │   ├── index.ts
│   │   ├── schema.ts            # GraphQL schema definition
│   │   ├── resolvers.ts         # Query resolvers
│   │   └── types.ts             # GraphQL type definitions
│   ├── data/
│   │   └── .gitkeep             # Cloned openfootball data goes here
│   └── utils/
│       ├── date.ts
│       ├── team-normalizer.ts   # Normalize team names
│       └── id-generator.ts
├── scripts/
│   ├── fetch-data.ts            # Clone/update openfootball repo
│   └── build-database.ts        # Parse and build JSON/SQLite
└── data/
    └── liverpool.json           # Processed Liverpool data
```

---

## Implementation Phases

### Phase 1: Core ETL (Current Focus)
- [ ] Set up package with TypeScript config
- [ ] Implement match line parser
- [ ] Implement season file parser
- [ ] Liverpool match filter
- [ ] Basic stats calculator
- [ ] Unit tests for parsers

### Phase 2: GraphQL Layer
- [ ] Define GraphQL schema
- [ ] Implement resolvers
- [ ] Add pagination support
- [ ] Query filtering/sorting

### Phase 3: Tambo Integration
- [ ] Create React components for match display
- [ ] Register components with Tambo
- [ ] Implement local tools
- [ ] Add context helpers

### Phase 4: Enhanced Features
- [ ] Historical data back to 1992 (Premier League era)
- [ ] Cup competitions (FA Cup, League Cup, Champions League)
- [ ] Player goalscorer data (if available)
- [ ] Performance visualizations

---

## Technical Decisions

### 1. Data Persistence Strategy (DECISION NEEDED)

**Dataset Size Estimate:**
- ~20 seasons (2004-05 to 2024-25)
- ~38 PL matches/season = ~760 matches
- + Cup competitions = ~1,200 total matches
- 6 managers, ~50 teams

#### Option A: JSON Files (Static)
```
data/
├── matches.json      # All Liverpool matches
├── managers.json     # Manager data + stats
├── seasons.json      # Season summaries
└── teams.json        # Team reference data
```
| Pros | Cons |
|------|------|
| Zero dependencies | No querying - load all into memory |
| Easy to version control | Rebuild entire file on updates |
| Simple deployment | No indexing for complex queries |
| Works with Tambo out of the box | |

#### Option B: SQLite (Embedded Database)
```
data/liverpool.db
├── matches (id, season_id, date, home_team, away_team, ...)
├── managers (id, name, start_date, end_date, ...)
├── seasons (id, name, start_year, end_year)
└── teams (id, name, short_name)
```
| Pros | Cons |
|------|------|
| SQL queries with JOINs | Extra dependency (better-sqlite3) |
| Indexes for fast lookups | Slightly more complex setup |
| Single file, portable | |
| Good for date-range queries | |

#### Option C: PostgreSQL (External Database)
| Pros | Cons |
|------|------|
| Full relational power | Requires running DB server |
| Scales to larger datasets | More infrastructure |
| Production-ready | Overkill for this dataset size |

#### Option D: In-Memory Only (No Persistence)
| Pros | Cons |
|------|------|
| Fastest queries | Must parse on every startup |
| No dependencies | No persistence across restarts |
| Good for dev/testing | Not suitable for production |

**Recommendation:** 

For this use case, I'd suggest **Option B (SQLite)** because:
- Date-range queries for manager tenure comparison are natural with SQL
- Single file is easy to distribute and version
- `better-sqlite3` is synchronous and fast
- Can still export to JSON for Tambo if needed

**Or Option A (JSON)** if you want:
- Zero database dependencies
- Simpler codebase
- Data loaded into memory at startup, queried with JS

---

### 2. Other Technical Decisions

**GraphQL Server**: Standalone vs integrated?
- Recommendation: Export schema/resolvers for integration flexibility

**Data Fetching**: Clone repo vs fetch raw files?
- Recommendation: Fetch raw files via GitHub API for specific seasons

**Team Name Normalization**: How to handle variations?
- "Liverpool FC", "Liverpool", "LFC" → normalize to canonical form

**Date Parsing**: Handle partial dates?
- Some matches only have day/month, need to infer year from season

---

## Sample Data Parsing

### Input (from openfootball)
```
[Sat Aug/14]
  12.45  Tottenham Hotspur        1-1 (1-1)  Liverpool FC
```

### Parsed Output
```json
{
  "id": "2004-05-md1-tot-liv",
  "season": { "id": "2004-05", "name": "English Premier League 2004/05" },
  "matchday": 1,
  "date": "2004-08-14T12:45:00Z",
  "kickoffTime": "12:45",
  "homeTeam": { "id": "tottenham", "name": "Tottenham Hotspur" },
  "awayTeam": { "id": "liverpool", "name": "Liverpool FC" },
  "homeScore": 1,
  "awayScore": 1,
  "halfTimeHomeScore": 1,
  "halfTimeAwayScore": 1,
  "liverpoolResult": "draw",
  "isLiverpoolHome": false
}
```

---

## Dependencies

```json
{
  "dependencies": {
    "zod": "^4.x",
    "date-fns": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^4.x",
    "@types/node": "^25.x"
  },
  "peerDependencies": {
    "graphql": "^16.x"
  }
}
```

---

## AWS Deployment Architecture

### Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  CloudFront  │───▶│   S3 Bucket  │    │   Tambo AI   │       │
│  │    (CDN)     │    │ (React App)  │    │   (Cloud)    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                                       │                │
│         ▼                                       ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ API Gateway  │───▶│    Lambda    │───▶│ RDS Postgres │       │
│  │  (GraphQL)   │    │  (Resolvers) │    │ or DynamoDB  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Option 1: Serverless (Recommended for Cost)

**Database: DynamoDB**
- Pay-per-request pricing (cheap for low traffic)
- No server management
- Single-table design for matches/managers/seasons

**API: Lambda + API Gateway**
- GraphQL via Apollo Server Lambda
- Scales to zero when not in use
- ~$0/month at low traffic

**Frontend: S3 + CloudFront**
- Static React app hosting
- Global CDN distribution
- ~$1-5/month

**Estimated Cost:** $5-20/month at low-moderate traffic

```
packages/
├── etl/                    # Data parsing (runs locally or in CI)
├── graphql-lambda/         # Lambda GraphQL handler
└── apps/
    └── liverpool-ui/       # Tambo React app → S3
```

### Option 2: Container-Based (Simpler Code)

**Database: RDS PostgreSQL (or Aurora Serverless v2)**
- Standard SQL, simpler queries
- Aurora Serverless scales to near-zero
- ~$15-50/month minimum

**API: App Runner or ECS Fargate**
- Run GraphQL server as container
- Auto-scaling
- ~$10-30/month minimum

**Frontend: Amplify Hosting**
- Git-based deployments
- Built-in CI/CD
- ~$5/month

**Estimated Cost:** $30-80/month

### Option 3: Hybrid (Best Balance)

**Database: PostgreSQL on RDS (smallest instance)**
- `db.t4g.micro` = ~$12/month
- Or use Neon/Supabase free tier for dev

**API: Lambda + API Gateway**
- Connect Lambda to RDS
- Use RDS Proxy for connection pooling

**Frontend: S3 + CloudFront**

**Estimated Cost:** $15-30/month

---

### Persistence Decision Update

Given AWS hosting, **SQLite won't work** (Lambda is stateless). Options are:

| Database | Pros | Cons | Cost |
|----------|------|------|------|
| **DynamoDB** | Serverless, scales to zero | NoSQL, different query patterns | Pay-per-use |
| **RDS PostgreSQL** | SQL queries, familiar | Always-on cost | ~$12+/month |
| **Aurora Serverless v2** | Scales down, SQL | Min 0.5 ACU = ~$43/month | $43+/month |
| **Neon (external)** | Generous free tier, PostgreSQL | External service | Free tier available |
| **PlanetScale (external)** | Serverless MySQL | External service | Free tier available |

**DECISION: JSON in-memory**

- Parse data to JSON file at build time
- Lambda loads JSON at cold start, queries in-memory
- Simple, no database dependencies
- Good enough for ~760 Premier League matches
- Can migrate to DynamoDB/PostgreSQL later if needed

---

### Scheduled ETL for Current Season Updates

The current season (e.g., `2025-26/`) gets updated regularly on GitHub. We need a daily job to check for new match data.

**Solution: EventBridge + Lambda**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   EventBridge   │────▶│  ETL Lambda     │────▶│    S3 Bucket    │
│  (Daily Cron)   │     │  (Fetch/Parse)  │     │ (liverpool.json)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  GraphQL Lambda │
                                                │  (reads JSON)   │
                                                └─────────────────┘
```

**EventBridge Rule (Cron):**
```
cron(0 6 * * ? *)   # Run daily at 6 AM UTC
```

**ETL Lambda Flow:**
1. Fetch `2025-26/1-premierleague.txt` from GitHub raw URL
2. Compare hash/content with previous version in S3
3. If changed:
   - Parse new matches
   - Merge with existing `liverpool.json`
   - Upload updated JSON to S3
4. GraphQL Lambda automatically gets new data on next cold start

**Alternative: GitHub Webhook (Real-time)**
- GitHub webhook on push to `openfootball/england`
- Triggers Lambda immediately when data changes
- More complex setup, but faster updates

**Recommended:** Start with EventBridge daily cron (simpler), add webhook later if needed.

**Cost:** ~$0.01/month (one Lambda invocation per day)

---

### Deployment Strategy

**Phase 1: Local Development**
- JSON files for data
- Local GraphQL server
- Tambo dev server

**Phase 2: Deploy to AWS**
- Upload JSON to S3 (or seed DynamoDB)
- Deploy Lambda GraphQL
- Deploy React app to S3/CloudFront

**Phase 3: Add Scheduled ETL**
- Deploy ETL Lambda
- Create EventBridge rule (daily cron)
- S3 trigger to invalidate CloudFront cache (optional)

**Infrastructure as Code:**
```
infrastructure/
├── terraform/           # Or CDK/SAM/Pulumi
│   ├── main.tf
│   ├── lambda.tf
│   ├── api-gateway.tf
│   ├── s3.tf
│   ├── cloudfront.tf
│   └── eventbridge.tf   # Daily ETL schedule
```

---

## Testing Strategy

### 1. Zod Schema Validation

All parsed data validated against Zod schemas:

```typescript
import { MatchSchema, SeasonStatsSchema } from './types';

const validatedMatch = MatchSchema.parse(parsedMatch);
const validatedStats = SeasonStatsSchema.parse(seasonStats);
```

### 2. Unit Tests (Vitest)

```typescript
// src/parsers/__tests__/match-parser.test.ts
import { describe, test, expect } from 'vitest';
import { parseMatchLine } from '../match-parser';

describe('parseMatchLine', () => {
  test('parses Liverpool home win correctly', () => {
    const line = '16.05  Liverpool FC  2-1 (1-0)  Chelsea FC';
    const match = parseMatchLine(line, season, matchday, date);
    
    expect(match.homeTeam.name).toBe('Liverpool FC');
    expect(match.homeScore).toBe(2);
    expect(match.awayScore).toBe(1);
    expect(match.halfTimeHomeScore).toBe(1);
    expect(match.halfTimeAwayScore).toBe(0);
  });

  test('parses Liverpool away loss correctly', () => {
    const line = '20.45  Manchester United  3-0 (2-0)  Liverpool FC';
    const match = parseMatchLine(line, season, matchday, date);
    
    expect(match.awayTeam.name).toBe('Liverpool FC');
    expect(match.homeScore).toBe(3);
    expect(match.awayScore).toBe(0);
  });
});

// src/parsers/__tests__/standings-parser.test.ts
test('parses .conf.txt standings correctly', () => {
  const standings = parseStandings(conf2004);
  const liverpool = standings.find(t => t.team.id === 'liverpool');
  
  expect(liverpool.position).toBe(5);
  expect(liverpool.played).toBe(38);
  expect(liverpool.points).toBe(58);
  expect(liverpool.won).toBe(17);
});
```

### 3. Data Sanity Checks

```typescript
// scripts/validate-data.ts
import { parseAllSeasons } from './parse-all';

const data = await parseAllSeasons();

// Match count
console.assert(data.matches.length >= 760, 'Expected ~760+ PL matches');

// Liverpool in every match
data.matches.forEach(match => {
  console.assert(
    match.homeTeam.id === 'liverpool' || match.awayTeam.id === 'liverpool',
    `Match ${match.id} missing Liverpool`
  );
});

// Season stats integrity
data.seasons.forEach(season => {
  const { played, won, drawn, lost, points } = season.stats;
  console.assert(played === won + drawn + lost, `${season.id}: played !== W+D+L`);
  console.assert(points === won * 3 + drawn, `${season.id}: points mismatch`);
  console.assert(season.stats.leaguePosition >= 1 && season.stats.leaguePosition <= 20);
});

// Manager tenure dates don't overlap
const managers = data.managers.sort((a, b) => a.startDate - b.startDate);
for (let i = 0; i < managers.length - 1; i++) {
  const current = managers[i];
  const next = managers[i + 1];
  console.assert(
    current.endDate && current.endDate <= next.startDate,
    `Manager overlap: ${current.name} / ${next.name}`
  );
}
```

### 4. Snapshot Testing

```typescript
// src/__tests__/snapshots.test.ts
test('2004-05 season snapshot', () => {
  const season = parseSeasonFile('2004-05');
  expect(season).toMatchSnapshot();
});

test('manager data snapshot', () => {
  expect(LIVERPOOL_MANAGERS).toMatchSnapshot();
});
```

### 5. Known Data Verification

```typescript
// Verify specific known results
const istanbul2005 = data.matches.find(m => 
  m.date.getFullYear() === 2005 && 
  m.opponent?.name === 'AC Milan' &&
  m.season.id === '2004-05'
);

// Champions League final - won on penalties (3-3 AET)
expect(istanbul2005?.homeScore).toBe(3);
expect(istanbul2005?.awayScore).toBe(3);

// 2019-20 Premier League title season
const season2019 = data.seasons.find(s => s.id === '2019-20');
expect(season2019?.stats.leaguePosition).toBe(1);
expect(season2019?.stats.points).toBe(99);
```

### Test Commands

```bash
# Run all tests
pnpm --filter @liverpool/etl test

# Run with coverage
pnpm --filter @liverpool/etl test --coverage

# Watch mode
pnpm --filter @liverpool/etl dev
```

---

## Next Steps

1. **Review this planning doc** - refine data model and queries
2. **Initialize the package** - set up TypeScript, testing
3. **Implement parsers** - start with match line parser
4. **Fetch sample data** - get 2004-05 season to test with
5. **Build GraphQL schema** - once data model is confirmed
6. **Create Tambo app** - separate app in `apps/` folder
7. **Deploy to AWS** - Lambda + S3 + CloudFront

---

## Decisions Made

| Decision | Choice |
|----------|--------|
| **Persistence** | JSON in-memory |
| **Data scope** | Premier League only (`1-premierleague.txt`) |
| **League positions** | From `.conf.txt` files |
| **AWS architecture** | Serverless (Lambda + S3 + CloudFront) |
| **ETL schedule** | EventBridge daily cron |
| **UI library** | MUI (Material-UI) v6 with Tambo |

---

## Open Questions

1. Which seasons to include initially? (2004-05 to present = ~20 seasons)
2. Any specific queries/visualizations you'd like prioritized?
