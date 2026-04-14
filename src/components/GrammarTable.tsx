import { DataGrid, GridColDef } from "@mui/x-data-grid";
import type { GrammarRow } from "../types";
import { Box, Checkbox, Link } from "@mui/material";
import { useMemo, useState } from "react";
import DetailsDialog from "./DetailsDialog";

type Props = {
  rows: GrammarRow[];
  onChange: (next: GrammarRow[]) => void;
};

export default function GrammarTable({ rows, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = useMemo(() => {
    if (selectedIndex == null) return null;
    return rows[selectedIndex] ?? null;
  }, [rows, selectedIndex]);

  const columns: GridColDef[] = [
    {
      field: "Grammar ID",
      headerName: "ID",
      flex: 0.6,
      sortable: false,
      renderCell: (params) => (
        <Link
          component="button"
          underline="hover"
          sx={{ fontWeight: 900 }}
          onClick={() => {
            const idx = params.row.__index as number;
            setSelectedIndex(idx);
            setOpen(true);
          }}
        >
          {String(params.value ?? "—")}
        </Link>
      ),
    },
    { field: "Pattern", headerName: "Pattern", flex: 1 },
    { field: "Meaning", headerName: "Meaning", flex: 1 },
    { field: "Example", headerName: "Example", flex: 1.4 },
    {
      field: "Mastered (✔)",
      headerName: "Mastered",
      flex: 0.7,
      sortable: false,
      renderCell: (params) => (
        <Checkbox
          checked={Boolean(params.value)}
          onChange={(e) => {
            const idx = params.row.__index as number;
            const next = [...rows];
            next[idx] = { ...next[idx], "Mastered (✔)": e.target.checked };
            onChange(next);
          }}
        />
      ),
    },
  ];

  const gridRows = rows.map((r, i) => ({ id: i, __index: i, ...r }));

  return (
    <Box sx={{ width: "100%", minHeight: 560 }}>
      <DataGrid
        rows={gridRows}
        columns={columns}
        disableRowSelectionOnClick
        autoHeight
        initialState={{
          pagination: { paginationModel: { pageSize: 30, page: 0 } },
        }}
        pageSizeOptions={[10, 30, 50]}
      />
      {selected && (
        <DetailsDialog
          open={open}
          onClose={() => setOpen(false)}
          title={`Grammar: ${selected["Grammar ID"]}`}
          subtitle="Details for this grammar pattern"
          chips={[selected["Mastered (✔)"] ? "Mastered" : "Not mastered"]}
          items={[
            { label: "Pattern", value: selected.Pattern },
            { label: "Meaning", value: selected.Meaning },
            { label: "Example", value: selected.Example },
          ]}
        />
      )}
    </Box>
  );
}
