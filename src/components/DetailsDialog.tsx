import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type DetailItem = {
  label: string;
  value?: string | number | boolean | null;
  highlight?: boolean; // optional for emphasis
};

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  chips?: { label: string; color?: 'default' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'; variant?: 'filled' | 'outlined' }[];
  items: DetailItem[];
  onClose: () => void;

  /** NEW: choose a theme accent for the dialog */
  accent?: 'vocab' | 'grammar';
};

function accentStyles(accent: Props['accent']) {
  return {
    gradient: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 55%, #EC4899 100%)',
    glow: 'rgba(236,72,153,0.18)',
    badge: 'secondary' as const,
  };
}

export default function DetailsDialog({
  open,
  title,
  subtitle,
  chips,
  items,
  onClose,
  accent = 'vocab',
}: Props) {
  const a = accentStyles(accent);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {/* Gradient header */}
      <DialogTitle
        sx={{
          fontWeight: 900,
          color: '#fff',
          background: a.gradient,
          position: 'relative',
          overflow: 'hidden',
          pb: 1.5,
        }}
      >
        {/* soft glow */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(800px 220px at 10% 30%, ${a.glow}, transparent 60%)`,
            opacity: 0.9,
          }}
        />

        <Box sx={{ position: 'relative' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 900, flex: 1 }}>
              {title}
            </Typography>

            <Chip
              size="small"
              label={accent === 'grammar' ? 'Grammar' : 'Vocabulary'}
              color={a.badge}
              sx={{ fontWeight: 900, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }}
            />

            <IconButton
              onClick={onClose}
              sx={{
                ml: 1,
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.14)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
              }}
              aria-label="Close"
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          {subtitle && (
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          background:
            'radial-gradient(900px 260px at 20% 10%, rgba(79,70,229,0.06), transparent 60%),' +
            'radial-gradient(900px 260px at 90% 10%, rgba(236,72,153,0.06), transparent 60%),' +
            '#fff',
        }}
      >
        <Stack spacing={1.6}>
          {/* Chips row */}
          {chips?.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {chips.map((c) => (
                <Chip
                  key={c.label}
                  size="small"
                  label={c.label}
                  color={c.color ?? 'default'}
                  variant={c.variant ?? 'filled'}
                  sx={{ fontWeight: 800, mb: 0.5 }}
                />
              ))}
            </Stack>
          ) : null}

          <Divider />

          {/* Details sections */}
          <Stack spacing={1.2}>
            {items.map((it) => (
              <Paper
                key={it.label}
                variant="outlined"
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  borderColor: 'rgba(17,24,39,0.10)',
                  background: it.highlight
                    ? 'linear-gradient(90deg, rgba(79,70,229,0.08), rgba(236,72,153,0.06))'
                    : 'rgba(17,24,39,0.02)',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800,  px: '15px' }}>
                  {it.label}
                </Typography>

                <Typography sx={{ fontWeight: 800, mt: 0.2,  px: '15px' }}>
                  {it.value === null || it.value === undefined || it.value === '' ? '—' : String(it.value)}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}