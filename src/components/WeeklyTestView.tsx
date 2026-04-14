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

import type {
  WorkbookData,
  VocabRow,
  GrammarRow,
  StudyPlanRow,
} from "../types";
import { parseIdList } from "../utils/parseIds";

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

function getDueVocab(todayISO: string, vocab: VocabRow[]) {
  return vocab.filter((v) => v["Learned (✔)"] && v["Review D+7"] === todayISO);
}

function getLast7DaysGrammarIds(todayISO: string, studyPlan: StudyPlanRow[]) {
  const start = dayjs(todayISO).subtract(6, "day"); // include today => 7 days
  const startInclusive = start.subtract(1, "day");
  const endExclusive = dayjs(todayISO).add(1, "day");

  const ids: string[] = [];

  for (const r of studyPlan) {
    if (!r.Date) continue;
    const d = dayjs(r.Date);
    if (!d.isValid()) continue;

    if (d.isAfter(startInclusive) && d.isBefore(endExclusive)) {
      ids.push(...parseIdList(String(r["Grammar IDs"] || ""), "G"));
    }
  }

  return unique(ids);
}

function makeChoices(answer: string, pool: string[], count = 4) {
  const distractors = shuffle(pool.filter((x) => x && x !== answer)).slice(
    0,
    Math.max(0, count - 1),
  );
  return shuffle(unique([answer, ...distractors])).slice(0, count);
}

export default function WeeklyTestView({ workbook }: Props) {
  const todayISO = dayjs().format("YYYY-MM-DD");

  const dueVocab = useMemo(
    () => getDueVocab(todayISO, workbook.Vocabulary),
    [todayISO, workbook.Vocabulary],
  );

  const dueGrammarIds = useMemo(
    () => getLast7DaysGrammarIds(todayISO, workbook.StudyPlan),
    [todayISO, workbook.StudyPlan],
  );

  const dueGrammar = useMemo(() => {
    const set = new Set(dueGrammarIds);
    return workbook.Grammar.filter((g) => set.has(g["Grammar ID"]));
  }, [workbook.Grammar, dueGrammarIds]);

  const questions: Question[] = useMemo(() => {
    const vocabMeaningPool = workbook.Vocabulary.map((v) => v.Meaning).filter(
      Boolean,
    );
    const grammarMeaningPool = workbook.Grammar.map((g) => g.Meaning).filter(
      Boolean,
    );

    const q: Question[] = [];

    for (const v of dueVocab) {
      if (!v.Meaning) continue;
      q.push({
        kind: "vocab",
        id: v["Vocab ID"],
        prompt: v.Word,
        answer: v.Meaning,
        choices: makeChoices(v.Meaning, vocabMeaningPool, 4),
      });
    }

    for (const g of dueGrammar) {
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
  }, [dueVocab, dueGrammar, workbook.Vocabulary, workbook.Grammar]);

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const current = questions[idx];
  const total = questions.length;

  const vocabIds = useMemo(
    () => dueVocab.map((v) => v["Vocab ID"]),
    [dueVocab],
  );
  const grammarIds = useMemo(
    () => dueGrammar.map((g) => g["Grammar ID"]),
    [dueGrammar],
  );

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

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
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
              Items become testable when their D+7 review date is today.
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <Chip
              label={`Vocabulary due: ${dueVocab.length}`}
              sx={(t) => ({
                bgcolor: "#690000",
                color: "#ffffff",
                fontWeight: 800,
              })}
            />
            <Chip
              label={`Grammar due: ${dueGrammar.length}`}
              sx={(t) => ({
                bgcolor: "#005e5e",
                color: "#ffffff",
                fontWeight: 800,
              })}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {!started && !finished && (
          <Stack spacing={1.5}>
            {total === 0 ? (
              <Typography color="text.secondary">
                No items due for the weekly test today. ✅
              </Typography>
            ) : (
              <>
                <Typography>
                  You have <b>{total}</b> questions ready today.
                </Typography>
                <Button variant="contained" onClick={() => setStarted(true)}>
                  Start Test
                </Button>
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
                  color={current.kind === "vocab" ? "primary" : "info"}
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
                        ? "linear-gradient(90deg, #4F46E5, #EC4899)"
                        : "linear-gradient(90deg, #0EA5E9, #4F46E5)",
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

                  if (correct) setScore(newScore);

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
                color="primary"
              />
              <Chip
                label={`Grammar tested: ${grammarIds.length}`}
                color="info"
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
