  import { DataGrid, GridColDef } from '@mui/x-data-grid';
  import { Box, Checkbox } from '@mui/material';
  import type { VocabRow } from '../types';
  import { formatDateCell } from '../utils/formatters';
  import dayjs from 'dayjs';

  type Props = {
    rows: VocabRow[];
    onChange: (next: VocabRow[]) => void;
  };

  export default function VocabTable({ rows, onChange }: Props) {
    const columns: GridColDef[] = [
      { field: 'Vocab ID', headerName: 'ID', flex: 0.5 },
      { field: 'Word', headerName: 'Word', flex: 0.8 },
      { field: 'Pronunciation', headerName: 'Pronunciation', flex: 0.9 },
      { field: 'Meaning', headerName: 'Meaning', flex: 1 },
      { field: 'Example', headerName: 'Example', flex: 1.4 },
      {
    field: 'Learned (✔)',
    headerName: 'Learned',
    flex: 0.6,
    sortable: false,
    renderCell: (params) => (
      <Checkbox
        checked={Boolean(params.value)}
        onChange={(e) => {
          const idx = params.row.__index as number;
          const next = [...rows];
          const learned = e.target.checked;

          if (learned) {
            const base = dayjs(); // today
            next[idx] = {
              ...next[idx],
              'Learned (✔)': true,
              'Review D+1': base.add(1, 'day').format('YYYY-MM-DD'),
              'Review D+7': base.add(7, 'day').format('YYYY-MM-DD'),
              'Review D+14': base.add(14, 'day').format('YYYY-MM-DD'),
            };
          } else {
            // reset when unchecked
            next[idx] = {
              ...next[idx],
              'Learned (✔)': false,
              'Review D+1': null,
              'Review D+7': null,
              'Review D+14': null,
            };
          }

          onChange(next);
        }}
      />
    ),
  },
      {
        field: 'Review D+1',
        headerName: 'D+1',
        flex: 0.6,
        valueFormatter: (value) => formatDateCell(value),
      },
      {
        field: 'Review D+7',
        headerName: 'D+7',
        flex: 0.6,
        valueFormatter: (value) => formatDateCell(value),
      },
      {
        field: 'Review D+14',
        headerName: 'D+14',
        flex: 0.7,
        valueFormatter: (value) => formatDateCell(value),
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
