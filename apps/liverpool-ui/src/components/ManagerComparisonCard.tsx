import { Box, Card, CardContent, Grid, Paper, Typography } from '@mui/material';
import { z } from 'zod';

const ManagerStatsSchema = z.object({
  manager: z.string(),
  matches: z.number(),
  wins: z.number(),
  draws: z.number(),
  losses: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  points: z.number(),
  pointsPerGame: z.string(),
  winPercentage: z.string(),
});

const ManagerComparisonPropsSchema = z.object({
  comparison: z.object({
    period: z.string(),
    manager1: ManagerStatsSchema,
    manager2: ManagerStatsSchema,
  }),
});

type ManagerStats = {
  manager: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  pointsPerGame: string;
  winPercentage: string;
};

function ManagerComparisonCardComponent({
  comparison,
}: {
  comparison: {
    period: string;
    manager1: ManagerStats;
    manager2: ManagerStats;
  };
}): JSX.Element {
  if (!comparison) {
    return <Typography>Loading comparison data...</Typography>;
  }

  const { period, manager1, manager2 } = comparison;

  const StatRow = ({ label, val1, val2 }: { label: string; val1: string | number; val2: string | number }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
      <Typography variant="body2" sx={{ flex: 1, textAlign: 'center' }}>
        {val1}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1, textAlign: 'center' }}>
        {val2}
      </Typography>
    </Box>
  );

  return (
    <Card sx={{ maxWidth: 700, mx: 'auto', my: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', textAlign: 'center' }}>
          Manager Comparison
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          {period}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={5}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
              <Typography variant="h6">{manager1.manager}</Typography>
            </Paper>
          </Grid>
          <Grid size={2} />
          <Grid size={5}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
              <Typography variant="h6">{manager2.manager}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box>
          <StatRow label="Matches" val1={manager1.matches} val2={manager2.matches} />
          <StatRow label="Wins" val1={manager1.wins} val2={manager2.wins} />
          <StatRow label="Draws" val1={manager1.draws} val2={manager2.draws} />
          <StatRow label="Losses" val1={manager1.losses} val2={manager2.losses} />
          <StatRow label="Goals For" val1={manager1.goalsFor} val2={manager2.goalsFor} />
          <StatRow label="Goals Against" val1={manager1.goalsAgainst} val2={manager2.goalsAgainst} />
          <StatRow label="Points" val1={manager1.points} val2={manager2.points} />
          <StatRow label="PPG" val1={manager1.pointsPerGame} val2={manager2.pointsPerGame} />
          <StatRow label="Win %" val1={`${manager1.winPercentage}%`} val2={`${manager2.winPercentage}%`} />
        </Box>
      </CardContent>
    </Card>
  );
}

export const ManagerComparisonCard = {
  name: 'ManagerComparisonCard',
  description: 'Compare performance statistics of two managers',
  component: ManagerComparisonCardComponent,
  propsSchema: ManagerComparisonPropsSchema,
};
