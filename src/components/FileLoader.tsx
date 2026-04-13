import { Button, Stack, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';

type Props = {
  onFile: (file: File) => void;
};

export default function FileLoader({ onFile }: Props) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
      <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
        Import Excel
        <input
          hidden
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </Button>
      <Button variant="outlined" startIcon={<DownloadIcon />} href="/JLPT_N2_Complete_Study_Plan.xlsx">
        Download Template
      </Button>
      <Typography variant="body2" color="text.secondary">
        Your edits are saved locally in this browser.
      </Typography>
    </Stack>
  );
}
