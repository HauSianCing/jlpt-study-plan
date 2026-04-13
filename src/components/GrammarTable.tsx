import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Checkbox } from '@mui/material';
import type { GrammarRow } from '../types';

type Props = {
  rows: GrammarRow[];
  onChange: (next: GrammarRow[]) => void;
};

export default function GrammarTable({ rows, onChange }: Props) {
  const columns: GridColDef[] = [
    { field: 'Grammar ID', headerName: 'ID', flex: 0.6 },
    { field: 'Pattern', headerName: 'Pattern', flex: 1 },
    { field: 'Meaning', headerName: 'Meaning', flex: 1 },
    { field: 'Example', headerName: 'Example', flex: 1.4 },
    {
      field: 'Mastered (✔)',
      headerName: 'Mastered',
      flex: 0.7,
      sortable: false,
      renderCell: (params) => (
        <Checkbox
          checked={Boolean(params.value)}
          onChange={(e) => {
            const idx = params.row.__index as number;
            const next = [...rows];
            next[idx] = { ...next[idx], 'Mastered (✔)': e.target.checked };
            onChange(next);
          }}
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
