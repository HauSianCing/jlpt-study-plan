import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { WorkbookData } from "../types";
import { getVocabDue, getGrammarDue } from "../utils/reminders";

type Props = { workbook: WorkbookData };

export default function ReviewReminders({ workbook }: Props) {
  const todayISO = dayjs().format("YYYY-MM-DD");
  const vocabDue = getVocabDue(todayISO, workbook.Vocabulary);
  const grammarDue = getGrammarDue(todayISO, workbook.Grammar);

  const totalDue = vocabDue.length + grammarDue.length;

  if (totalDue === 0) {
    return (
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          ✅ No reviews due today.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 1.5, borderRadius: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography sx={{ fontWeight: 900 }}>
            Reviews due today / overdue:
          </Typography>
          <Chip label={`Total: ${totalDue}`} color="warning" />
          <Chip
            label={`Vocab: ${vocabDue.length}`}
            sx={(t) => ({
              bgcolor: "#f3841c",
              color: t.palette.getContrastText("#f3841c"),
              fontWeight: 800,
            })}
          />
          <Chip
            label={`Grammar: ${grammarDue.length}`}
            sx={(t) => ({
              bgcolor: "#57bff0",
              color: t.palette.getContrastText("#57bff0"),
              fontWeight: 800,
            })}
          />
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Tip: Open Vocabulary/Grammar tabs to review items.
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
