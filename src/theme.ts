import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4F46E5' },   // Indigo
    secondary: { main: '#EC4899' }, // Pink
    success: { main: '#22C55E' },   // Green
    warning: { main: '#F59E0B' },   // Amber
    info: { main: '#0EA5E9' },      // Sky
    background: {
      default: '#F7F8FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'].join(','),
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(17,24,39,0.06)',
          boxShadow: '0 8px 24px rgba(17,24,39,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 4,
          borderRadius: 999,
          background: 'linear-gradient(90deg, #4F46E5, #EC4899)',
        },
      },
    },
  },
});
