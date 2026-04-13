import { CssBaseline, ThemeProvider } from "@mui/material";
import {
  AppBar,
  Box,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { theme } from "./theme";
import type { WorkbookData } from "./types";
import defaultWorkbook from "./data/defaultWorkbook.json";
import { parseWorkbook } from "./utils/parseWorkbook";
import { useLocalStorageState } from "./hooks/useLocalStorage";
import FileLoader from "./components/FileLoader";
import StudyPlanTable from "./components/StudyPlanTable";
import VocabTable from "./components/VocabTable";
import GrammarTable from "./components/GrammarTable";
import ProgressView from "./components/ProgressView";

const STORAGE_KEY = "jlpt-n2-workbook-v1";

function safeWorkbook(v: unknown): WorkbookData {
  const d = v as WorkbookData;
  const def = defaultWorkbook as unknown as WorkbookData;
  return {
    StudyPlan: d?.StudyPlan ?? def.StudyPlan,
    Vocabulary: d?.Vocabulary ?? def.Vocabulary,
    Grammar: d?.Grammar ?? def.Grammar,
    Progress: d?.Progress ?? def.Progress,
  };
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [workbook, setWorkbook] = useLocalStorageState<WorkbookData>(
    STORAGE_KEY,
    safeWorkbook(defaultWorkbook),
  );

  const title = useMemo(() => {
    switch (tab) {
      case 0:
        return "Study Plan";
      case 1:
        return "Vocabulary";
      case 2:
        return "Grammar";
      case 3:
        return "Progress";
      default:
        return "JLPT N2 Planner";
    }
  }, [tab]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background:
            "linear-gradient(90deg, #4F46E5 0%, #7C3AED 45%, #EC4899 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.20)",
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 800 }}>
            JLPT N2 Study Planner
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Material UI + Excel import
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 600px at 20% 10%, rgba(79,70,229,0.12), transparent 60%)," +
            "radial-gradient(900px 500px at 90% 20%, rgba(236,72,153,0.12), transparent 60%)," +
            "linear-gradient(180deg, #F7F8FC 0%, #FFFFFF 100%)",
        }}
      >
        <Container sx={{ py: 3 }} maxWidth="lg">
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="h5">{title}</Typography>

                <FileLoader
                  onFile={async (file) => {
                    const parsed = await parseWorkbook(file);
                    setWorkbook(safeWorkbook(parsed));
                  }}
                />

                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mt: 1 }}
                >
                  <Tab label="Study Plan" />
                  <Tab label="Vocabulary" />
                  <Tab label="Grammar" />
                  <Tab label="Progress" />
                </Tabs>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2 }}>
              {tab === 0 && (
                <StudyPlanTable
                  rows={workbook.StudyPlan}
                  onChange={(StudyPlan) =>
                    setWorkbook({ ...workbook, StudyPlan })
                  }
                />
              )}
              {tab === 1 && (
                <VocabTable
                  rows={workbook.Vocabulary}
                  onChange={(Vocabulary) =>
                    setWorkbook({ ...workbook, Vocabulary })
                  }
                />
              )}
              {tab === 2 && (
                <GrammarTable
                  rows={workbook.Grammar}
                  onChange={(Grammar) => setWorkbook({ ...workbook, Grammar })}
                />
              )}
              {tab === 3 && <ProgressView studyPlan={workbook.StudyPlan} />}
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">Tips</Typography>
              <Typography variant="body2" color="text.secondary">
                • Mark items as completed/learned/mastered and your progress
                will update. • Data is stored in your browser (localStorage). •
                Use “Download Template” to get the original Excel file.
              </Typography>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
