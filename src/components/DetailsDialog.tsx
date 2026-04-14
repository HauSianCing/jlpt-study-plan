import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type DetailItem = { label: string; value?: string | number | boolean | null };

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  chips?: string[];
  items: DetailItem[];
  onClose: () => void;
};

export default function DetailsDialog({
  open,
  title,
  subtitle,
  chips,
  items,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {title}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 10, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.5}>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}

          {chips?.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {chips.map((c) => (
                <Chip key={c} label={c} size="small" />
              ))}
            </Stack>
          ) : null}

          <Divider />

          <Stack spacing={1.1}>
            {items.map((it) => (
              <Stack key={it.label} spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                  {it.label}
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {it.value === null ||
                  it.value === undefined ||
                  it.value === ""
                    ? "—"
                    : String(it.value)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
