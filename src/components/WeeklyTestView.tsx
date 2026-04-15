import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";

import type { WorkbookData, StudyPlanRow } from "../types";
import { parseIdList } from "../utils/parseIds";
import { chipSx } from "../utils/chipSx";

type Props = {
  workbook: WorkbookData;
};

type Question =
  | {
      kind: "vocab";
      id: string;
      prompt: string; // Word
      answer: string; // Meaning
      choices: string[];
    }
  | {
      kind: "grammar";
      id: string;
      prompt: string; // Pattern
      answer: string; // Meaning
      choices: string[];
    };

type TestResult = {
  date: string; // YYYY-MM-DD
  score: number;
  total: number;
  vocabIds: string[];
  grammarIds: string[];
};

const HISTORY_KEY = "jlpt-weekly-test-history-v1";

/**
 * ✅ Unlock rule:
 * - set to 1 if you want the test available as soon as any task is done
 */
const REQUIRED_DONE_TASKS = 7;

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

/**
 * ✅ DoneAt-based filter:
 * Returns rows completed within last N days based on DoneAt timestamp (actual completion time).
 */
function getDoneRowsLastNDays(studyPlan: StudyPlanRow[], days: number) {
  const now = dayjs();
  const start = now.subtract(days, "day");

  return studyPlan.filter((r) => {
    if (r["Completed (✔)"] !== true) return false;

    const doneAt = (r as any).DoneAt as string | null | undefined;
    if (!doneAt) return false;

    const d = dayjs(doneAt);
    return d.isValid() && d.isAfter(start);
  });
}

/** Collect vocab/grammar IDs from StudyPlan rows (supports ranges via parseIdList). */
function collectIdsFromStudyPlan(rows: StudyPlanRow[]) {
  const vocab: string[] = [];
  const grammar: string[] = [];

  for (const r of rows) {
    vocab.push(...parseIdList(String(r["Vocab IDs"] || ""), "V"));
    grammar.push(...parseIdList(String(r["Grammar IDs"] || ""), "G"));
  }

  return {
    vocabIds: unique(vocab),
    grammarIds: unique(grammar),
  };
}

/** Build multiple-choice options. */
function makeChoices(answer: string, pool: string[], count = 4) {
  const distractors = shuffle(pool.filter((x) => x && x !== answer)).slice(
    0,
    Math.max(0, count - 1),
  );
  return shuffle(unique([answer, ...distractors])).slice(0, count);
}

export default function WeeklyTestView({ workbook }: Props) {
  const allTotal = workbook.StudyPlan.length;
  const allDone = workbook.StudyPlan.filter(
    (r) => r["Completed (✔)"] === true,
  ).length;
  const todayISO = dayjs().format("YYYY-MM-DD");

  // ✅ Done rows in last 7 days based on DoneAt
  const doneRows = useMemo(
    () => getDoneRowsLastNDays(workbook.StudyPlan, 7),
    [workbook.StudyPlan],
  );

  const doneCount = doneRows.length;
  const unlocked = doneCount >= REQUIRED_DONE_TASKS;

  // Helpful warning: completed rows missing DoneAt won't count
  const completedButMissingDoneAt = useMemo(() => {
    return workbook.StudyPlan.filter(
      (r) => r["Completed (✔)"] === true && !(r as any).DoneAt,
    ).length;
  }, [workbook.StudyPlan]);

  // ✅ Extract IDs from done rows
  const { vocabIds, grammarIds } = useMemo(
    () => collectIdsFromStudyPlan(doneRows),
    [doneRows],
  );

  // ✅ Get actual vocab/grammar items to test
  const testVocab = useMemo(() => {
    const set = new Set(vocabIds);
    return workbook.Vocabulary.filter((v) => set.has(v["Vocab ID"]));
  }, [workbook.Vocabulary, vocabIds]);

  const testGrammar = useMemo(() => {
    const set = new Set(grammarIds);
    return workbook.Grammar.filter((g) => set.has(g["Grammar ID"]));
  }, [workbook.Grammar, grammarIds]);

  // ✅ Build questions
  const questions: Question[] = useMemo(() => {
    const vocabMeaningPool = workbook.Vocabulary.map((v) => v.Meaning).filter(
      Boolean,
    );
    const grammarMeaningPool = workbook.Grammar.map((g) => g.Meaning).filter(
      Boolean,
    );

    const q: Question[] = [];

    for (const v of testVocab) {
      if (!v.Meaning) continue;
      q.push({
        kind: "vocab",
        id: v["Vocab ID"],
        prompt: v.Word,
        answer: v.Meaning,
        choices: makeChoices(v.Meaning, vocabMeaningPool, 4),
      });
    }

    for (const g of testGrammar) {
      if (!g.Meaning) continue;
      q.push({
        kind: "grammar",
        id: g["Grammar ID"],
        prompt: g.Pattern,
        answer: g.Meaning,
        choices: makeChoices(g.Meaning, grammarMeaningPool, 4),
      });
    }

    return shuffle(q);
  }, [testVocab, testGrammar, workbook.Vocabulary, workbook.Grammar]);

  // ✅ UI state
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const current = questions[idx];
  const total = questions.length;

  // ✅ History
  const history: TestResult[] = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem(HISTORY_KEY) || "[]",
      ) as TestResult[];
    } catch {
      return [];
    }
  }, [finished]);

  const saveResult = (result: TestResult) => {
    const next = [...history.filter((h) => h.date !== result.date), result];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const reset = () => {
    setStarted(false);
    setFinished(false);
    setIdx(0);
    setScore(0);
    setSelected("");
  };

  // Colors (match your app)
  const vocabColor = "#f3841c";
  const gramColor = "#57bff0";
  const mainColor = "#4F46E5";

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Stack spacing={0.3}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Weekly Test
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This test is based on tasks you actually completed in the last 7
              days.
            </Typography>
            {completedButMissingDoneAt > 0 && (
              <Typography
                variant="caption"
                sx={{ fontWeight: 800, color: "warning.main" }}
              >
                ⚠️ {completedButMissingDoneAt} completed rows have no DoneAt and
                won’t be counted. (Set DoneAt when checking Done.)
              </Typography>
            )}
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <Chip
              label={`StudyPlan done: ${allDone}/${allTotal}`}
              sx={chipSx(mainColor)}
            />
            <Chip
              label={`Vocab in test: ${testVocab.length}`}
              sx={chipSx(vocabColor)}
            />
            <Chip
              label={`Grammar in test: ${testGrammar.length}`}
              sx={chipSx(gramColor)}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Not started */}
        {!started && !finished && (
          <Stack spacing={1.5}>
            {total === 0 ? (
              <Typography color="text.secondary">
                No questions yet. Mark some StudyPlan tasks Done so they count
                in the last 7 days. ✅
              </Typography>
            ) : (
              <>
                <Typography>
                  You have <b>{total}</b> questions ready.
                </Typography>

                <Button
                  variant="contained"
                  disabled={!unlocked}
                  onClick={() => setStarted(true)}
                >
                  Start Test
                </Button>

                {!unlocked && (
                  <Typography variant="body2" color="text.secondary">
                    Complete at least <b>{REQUIRED_DONE_TASKS}</b> tasks within
                    the last 7 days to unlock the test.
                  </Typography>
                )}
              </>
            )}

            {history.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  Past results
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.8 }}>
                  {history
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5)
                    .map((h) => (
                      <Typography
                        key={h.date}
                        variant="body2"
                        color="text.secondary"
                      >
                        {h.date}: {h.score}/{h.total}
                      </Typography>
                    ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}

        {/* Quiz */}
        {started && !finished && current && (
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography sx={{ fontWeight: 900 }}>
                  Question {idx + 1} / {total}
                </Typography>
                <Chip
                  size="small"
                  label={
                    current.kind === "vocab"
                      ? `Vocab ${current.id}`
                      : `Grammar ${current.id}`
                  }
                  sx={
                    current.kind === "vocab"
                      ? chipSx(vocabColor)
                      : chipSx(gramColor)
                  }
                />
              </Stack>

              <LinearProgress
                variant="determinate"
                value={Math.round(((idx + 1) / total) * 100)}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "rgba(17,24,39,0.08)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    background:
                      current.kind === "vocab"
                        ? `linear-gradient(90deg, ${vocabColor}, #EC4899)`
                        : `linear-gradient(90deg, ${gramColor}, #13b0f8)`,
                  },
                }}
              />
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 900 }}
              >
                Prompt
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                {current.prompt}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Choose the correct meaning.
              </Typography>
            </Paper>

            <Stack spacing={1}>
              {current.choices.map((c) => (
                <Button
                  key={c}
                  variant={selected === c ? "contained" : "outlined"}
                  onClick={() => setSelected(c)}
                  sx={{ justifyContent: "flex-start", textAlign: "left" }}
                >
                  {c}
                </Button>
              ))}
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" onClick={reset}>
                Cancel
              </Button>
              <Button
                variant="contained"
                disabled={!selected}
                onClick={() => {
                  const correct = selected === current.answer;
                  const newScore = correct ? score + 1 : score;

                  setScore(newScore);
                  setSelected("");

                  if (idx + 1 >= total) {
                    saveResult({
                      date: todayISO,
                      score: newScore,
                      total,
                      vocabIds,
                      grammarIds,
                    });
                    setFinished(true);
                  } else {
                    setIdx((x) => x + 1);
                  }
                }}
              >
                Submit
              </Button>
            </Stack>
          </Stack>
        )}

        {/* Finished */}
        {finished && (
          <Stack spacing={1.5}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Result
            </Typography>
            <Typography>
              Score: <b>{score}</b> / <b>{total}</b>
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={`Vocab tested: ${vocabIds.length}`}
                sx={chipSx(vocabColor)}
              />
              <Chip
                label={`Grammar tested: ${grammarIds.length}`}
                sx={chipSx(gramColor)}
              />
              <Chip
                label={
                  score === total
                    ? "Perfect! 🎉"
                    : score >= Math.ceil(total * 0.7)
                      ? "Great! ✅"
                      : "Keep going 💪"
                }
                color={score === total ? "success" : "warning"}
              />
            </Stack>

            <Button variant="contained" onClick={reset}>
              Back
            </Button>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
