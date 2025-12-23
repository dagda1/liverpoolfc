import { Box, Card, CardContent, Chip, Divider, Typography } from '@mui/material';
import { z } from 'zod';

const RecentMatchSchema = z.object({
  date: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  score: z.string(),
});

const HeadToHeadPropsSchema = z.object({
  opponent: z.string(),
  matches: z.number(),
  wins: z.number(),
  draws: z.number(),
  losses: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  recentMatches: z.array(RecentMatchSchema).optional(),
});

function HeadToHeadCardComponent({
  opponent,
  matches,
  wins,
  draws,
  losses,
  goalsFor,
  goalsAgainst,
  recentMatches,
}: {
  opponent: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  recentMatches?: Array<{ date: string; homeTeam: string; awayTeam: string; score: string }>;
}): JSX.Element {
  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', my: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Liverpool vs {opponent}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
          <Chip label={`${wins}W`} color="success" />
          <Chip label={`${draws}D`} />
          <Chip label={`${losses}L`} color="error" />
        </Box>

        <Typography variant="body1" sx={{ my: 1 }}>
          <strong>Matches:</strong> {matches}
        </Typography>
        <Typography variant="body1" sx={{ my: 1 }}>
          <strong>Goals:</strong> {goalsFor} - {goalsAgainst}
        </Typography>

        {recentMatches && recentMatches.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Recent Matches
            </Typography>
            {recentMatches.map((match, idx) => (
              <Typography key={idx} variant="body2" sx={{ my: 0.5 }}>
                {match.homeTeam} {match.score} {match.awayTeam}
              </Typography>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const HeadToHeadCard = {
  name: 'HeadToHeadCard',
  description: 'Display head-to-head record against an opponent',
  component: HeadToHeadCardComponent,
  propsSchema: HeadToHeadPropsSchema,
};
