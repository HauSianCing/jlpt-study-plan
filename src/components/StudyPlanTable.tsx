import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Checkbox, TextField } from '@mui/material';
import dayjs from 'dayjs';
import type { StudyPlanRow } from '../types';

type Props = {
  rows: StudyPlanRow[];
  onChange: (next: StudyPlanRow[]) => void;
};

export default function StudyPlanTable({ rows, onChange }: Props) {
  const columns: GridColDef[] = [
    {
      field: 'Date',
      headerName: 'Date',
      flex: 0.9,
      valueFormatter: (value) => (value ? dayjs(String(value)).format('YYYY-MM-DD') : ''),
    },
    { field: 'Day', headerName: 'Day', flex: 0.7 },
    { field: 'Focus', headerName: 'Focus', flex: 1 },
    { field: 'Vocab IDs', headerName: 'Vocab IDs', flex: 1 },
    { field: 'Grammar IDs', headerName: 'Grammar IDs', flex: 1 },
    {
      field: 'Study Time (min)',
      headerName: 'Study (min)',
      type: 'number',
      flex: 0.7,
      renderCell: (params) => (
        <TextField
          size="small"
          type="number"
          value={params.value ?? 0}
          onChange={(e) => {
            const val = Number(e.target.value);
            const idx = params.row.__index as number;
            const next = [...rows];
            next[idx] = { ...next[idx], 'Study Time (min)': Number.isFinite(val) ? val : 0 };
            onChange(next);
          }}
          inputProps={{ min: 0, style: { width: 90 } }}
        />
      ),
    },
    {
      field: 'Completed (✔)',
      headerName: 'Done',
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <Checkbox
          checked={Boolean(params.value)}
          onChange={(e) => {
            const idx = params.row.__index as number;
            const next = [...rows];
            const done = e.target.checked;
            next[idx] = {
              ...next[idx],
              'Completed (✔)': done,
              'Completion %': done ? 100 : 0,
            };
            onChange(next);
          }}
        />
      ),
    },
    {
      field: 'Completion %',
      headerName: '%',
      type: 'number',
      flex: 0.4,
      valueFormatter: (value) => `${value ?? 0}`,
    },
    {
      field: 'Notes',
      headerName: 'Notes',
      flex: 1.6,
      sortable: false,
      renderCell: (params) => (
        <TextField
          size="small"
          value={params.value ?? ''}
          onChange={(e) => {
            const idx = params.row.__index as number;
            const next = [...rows];
            next[idx] = { ...next[idx], Notes: e.target.value };
            onChange(next);
          }}
          placeholder="Add notes"
          fullWidth
        />
      ),
    },
  ];

  const gridRows = rows.map((r, i) => ({ id: i, __index: i, ...r }));

  return (
    <Box sx={{ width: '100%', minHeight: 560 }}>
      <DataGrid
        rows={gridRows}
        columns={columns}
        disableRowSelectionOnClick
        autoHeight
        initialState={{ pagination: { paginationModel: { pageSize: 30, page: 0 } } }}
        pageSizeOptions={[10, 30, 50]}
      />
    </Box>
  );
}
