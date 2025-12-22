import { Box, Container, Paper, TextField, Typography } from '@mui/material';
import { useTamboThread, useTamboThreadInput } from '@tambo-ai/react';

export function Chat(): JSX.Element {
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { thread } = useTamboThread();

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (value.trim()) {
      submit();
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Liverpool FC Stats
      </Typography>

      <Box sx={{ mb: 4, minHeight: '60vh' }}>
        {thread.messages.map((message) => (
          <Box key={message.id} sx={{ mb: 2 }}>
            <Paper sx={{ p: 2, bgcolor: message.role === 'user' ? 'grey.100' : 'white' }}>
              {Array.isArray(message.content) ? (
                message.content.map((part, i) =>
                  part.type === 'text' ? (
                    <Typography key={i} variant="body1">
                      {part.text}
                    </Typography>
                  ) : null,
                )
              ) : (
                <Typography variant="body1">{String(message.content)}</Typography>
              )}
            </Paper>
            {message.renderedComponent}
          </Box>
        ))}
      </Box>

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask about Liverpool FC stats..."
          disabled={isPending}
          variant="outlined"
        />
      </Paper>
    </Container>
  );
}
