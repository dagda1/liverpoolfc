import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { TamboProvider } from '@tambo-ai/react';

import { components } from './components';
import { Chat } from './components/Chat';
import { tools } from './tools';

const theme = createTheme({
  palette: {
    primary: {
      main: '#C8102E',
    },
    secondary: {
      main: '#00B2A9',
    },
  },
});

export function App(): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TamboProvider apiKey={import.meta.env.VITE_TAMBO_API_KEY} components={components} tools={tools}>
        <Chat />
      </TamboProvider>
    </ThemeProvider>
  );
}
