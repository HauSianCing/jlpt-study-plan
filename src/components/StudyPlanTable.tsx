import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Checkbox, TextField, Chip } from "@mui/material";
import dayjs from "dayjs";

import AbcIcon from "@mui/icons-material/Abc";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import type { StudyPlanRow } from "../types";

type Props = {
  rows: StudyPlanRow[];
  onChange: (next: StudyPlanRow[]) => void;
};

export default function StudyPlanTable({ rows, onChange }: Props) {
  function applySequentialDates(
    currentRows: StudyPlanRow[],
    startIndex: number,
    startDateISO: string,
  ) {
    const base = dayjs(startDateISO);

    const next = [...currentRows];
    for (let i = startIndex; i < next.length; i++) {
      const d = base.add(i - startIndex, "day");
      next[i] = {
        ...next[i],
        Date: d.format("YYYY-MM-DD"),
        Day: d.format("dddd"), // keeps Day consistent with Date
      };
    }
    return next;
  }
  const columns: GridColDef[] = [
    {
      field: "Date",
      headerName: "Date",
      flex: 0.9,
      valueFormatter: (value) =>
        value ? dayjs(String(value)).format("YYYY-MM-DD") : "",
    },
    {
      field: "Day",
      headerName: "Day",
      flex: 0.7,
      renderCell: (params) => {
        // Use Day value if present, otherwise derive from Date
        const fromCell = String(params.value || "").trim();
        const fromDate =
          params.row?.Date && dayjs(String(params.row.Date)).isValid()
            ? dayjs(String(params.row.Date)).format("dddd")
            : "";

        const day = fromCell || fromDate || "—";

        const isWeekend = day === "Saturday" || day === "Sunday";

        // Pick colors (you can adjust)
        const stylesByDay: Record<
          string,
          { bg: string; fg: string; border: string }
        > = {
          Monday: {
            bg: "rgba(79,70,229,0.10)",
            fg: "#3730A3",
            border: "rgba(79,70,229,0.25)",
          },
          Tuesday: {
            bg: "rgba(14,165,233,0.10)",
            fg: "#075985",
            border: "rgba(14,165,233,0.25)",
          },
          Wednesday: {
            bg: "rgba(34,197,94,0.10)",
            fg: "#166534",
            border: "rgba(34,197,94,0.25)",
          },
          Thursday: {
            bg: "rgba(245,158,11,0.12)",
            fg: "#92400E",
            border: "rgba(245,158,11,0.30)",
          },
          Friday: {
            bg: "rgba(236,72,153,0.10)",
            fg: "#9D174D",
            border: "rgba(236,72,153,0.25)",
          },
          Saturday: {
            bg: "rgba(99,102,241,0.10)",
            fg: "#3730A3",
            border: "rgba(99,102,241,0.25)",
          },
          Sunday: {
            bg: "rgba(239,68,68,0.10)",
            fg: "#991B1B",
            border: "rgba(239,68,68,0.25)",
          },
        };

        const styles = stylesByDay[day] ?? {
          bg: isWeekend ? "rgba(239,68,68,0.08)" : "rgba(17,24,39,0.06)",
          fg: isWeekend ? "#991B1B" : "#374151",
          border: isWeekend ? "rgba(239,68,68,0.25)" : "rgba(17,24,39,0.10)",
        };

        return (
          <Chip
            size="small"
            label={day}
            variant="outlined"
            sx={{
              fontWeight: 800,
              backgroundColor: styles.bg,
              color: styles.fg,
              borderColor: styles.border,
            }}
          />
        );
      },
    },
    {
      field: "Focus",
      headerName: "Focus",
      flex: 1,
      renderCell: (params) => {
        const v = String(params.value || "");

        const isBoth = v.includes("Vocab") && v.includes("Grammar");
        const isVocab = v.includes("Vocab");
        const isGrammar = v.includes("Grammar");

        const icon = isBoth ? (
          <MenuBookIcon fontSize="small" />
        ) : (
          <AbcIcon fontSize="small" />
        );

        const bg = isBoth
          ? "linear-gradient(90deg, rgba(79,70,229,.18), rgba(236,72,153,.18))"
          : isVocab
            ? "rgba(79,70,229,.14)"
            : isGrammar
              ? "rgba(14,165,233,.14)"
              : "rgba(17,24,39,.08)";

        return (
          <Chip
            size="small"
            icon={icon}
            label={v || "—"}
            variant="outlined"
            sx={{
              fontWeight: 800,
              borderColor: "rgba(17,24,39,0.12)",
              background: bg,
            }}
          />
        );
      },
    },
    { field: "Vocab IDs", headerName: "Vocab IDs", flex: 1 },
    { field: "Grammar IDs", headerName: "Grammar IDs", flex: 1 },
    {
      field: "Study Time (min)",
      headerName: "Study (min)",
      type: "number",
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
            next[idx] = {
              ...next[idx],
              "Study Time (min)": Number.isFinite(val) ? val : 0,
            };
            onChange(next);
          }}
          inputProps={{ min: 0, style: { width: 90 } }}
        />
      ),
    },
    {
      field: "Completed (✔)",
      headerName: "Done",
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <Checkbox
          checked={Boolean(params.value)}
          onChange={(e) => {
            const idx = params.row.__index as number;
            const done = e.target.checked;

            let next = [...rows];

            // Update done state + completion %
            next[idx] = {
              ...next[idx],
              "Completed (✔)": done,
              "Completion %": done ? 100 : 0,
              DoneAt: done ? dayjs().toISOString() : null, 
            };

            // ✅ When checked: auto-fill Date for this row and all following rows
            if (done) {
              const existingDate = String(next[idx].Date || "").trim();

              // If current row already has a Date, use it as the anchor.
              // Otherwise use today.
              const anchor =
                existingDate && dayjs(existingDate).isValid()
                  ? existingDate
                  : dayjs().format("YYYY-MM-DD");

              next = applySequentialDates(next, idx, anchor);
            }

            onChange(next);
          }}
        />
      ),
    },
    {
      field: "Completion %",
      headerName: "%",
      type: "number",
      flex: 0.4,
      valueFormatter: (value) => `${value ?? 0}`,
    },
    {
      field: "Notes",
      headerName: "Notes",
      flex: 1.6,
      sortable: false,
      renderCell: (params) => (
        <TextField
          size="small"
          value={params.value ?? ""}
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
    <Box sx={{ width: "100%", minHeight: 560 }}>
      <DataGrid
        rows={gridRows}
        columns={columns}
        autoHeight
        disableRowSelectionOnClick
        getRowClassName={(params) =>
          params.row["Completed (✔)"] ? "row-done" : ""
        }
        sx={{
          "& .row-done": {
            backgroundColor: "rgba(34,197,94,0.10)",
          },
          "& .row-done:hover": {
            backgroundColor: "rgba(34,197,94,0.16)",
          },
        }}
      />
    </Box>
  );
}
