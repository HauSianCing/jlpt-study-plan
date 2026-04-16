import { DataGrid, GridColDef } from "@mui/x-data-grid";
import type { GrammarRow } from "../types";
import { Box, Checkbox, Link } from "@mui/material";
import { useMemo, useState } from "react";
import DetailsDialog from "./DetailsDialog";
import dayjs from "dayjs";

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

            const mastered = e.target.checked;
            const base = dayjs(); // today

            const next = [...rows];

            next[idx] = {
              ...next[idx],
              "Mastered (✔)": mastered,
              "Review D+1": mastered
                ? base.add(1, "day").format("YYYY-MM-DD")
                : null,
              "Review D+7": mastered
                ? base.add(7, "day").format("YYYY-MM-DD")
                : null,
              "Review D+14": mastered
                ? base.add(14, "day").format("YYYY-MM-DD")
                : null,
            };

            onChange(next);
          }}
        />
      ),
    },

    {
      field: "Review D+1",
      headerName: "Rev D+1",
      flex: 0.6,
      valueFormatter: (value) =>
        value ? dayjs(String(value)).format("YYYY-MM-DD") : "",
    },
    {
      field: "Review D+7",
      headerName: "Rev D+7",
      flex: 0.6,
      valueFormatter: (value) =>
        value ? dayjs(String(value)).format("YYYY-MM-DD") : "",
    },
    {
      field: "Review D+14",
      headerName: "Rev D+14",
      flex: 0.7,
      valueFormatter: (value) =>
        value ? dayjs(String(value)).format("YYYY-MM-DD") : "",
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
          accent="grammar"
          title={`Grammar: ${selected["Grammar ID"]}`}
          subtitle="Details for this grammar pattern"
          chips={[
            {
              label: selected["Mastered (✔)"] ? "Mastered" : "Not mastered",
              color: selected["Mastered (✔)"] ? "success" : "warning",
            },
            {
              label: selected["Review D+1"]
                ? `Rev D+1: ${selected["Review D+1"]}`
                : "Rev D+1: —",
              color: "info",
              variant: "outlined",
            },
            {
              label: selected["Review D+7"]
                ? `Rev D+7: ${selected["Review D+7"]}`
                : "Rev D+7: —",
              color: "info",
              variant: "outlined",
            },
            {
              label: selected["Review D+14"]
                ? `Rev D+14: ${selected["Review D+14"]}`
                : "Rev D+14: —",
              color: "info",
              variant: "outlined",
            },
          ]}
          items={[
            { label: "Pattern", value: selected.Pattern, highlight: true },
            { label: "Meaning", value: selected.Meaning, highlight: true },
            { label: "Example", value: selected.Example },
          ]}
        />
      )}
    </Box>
  );
}
