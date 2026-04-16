  import { useEffect, useMemo, useRef, useState } from "react";
  import {
    Box,
    Button,
    Chip,
    Divider,
    LinearProgress,
    Paper,
    Stack,
    Tooltip,
    Typography,
  } from "@mui/material";

  import TrendingUpIcon from "@mui/icons-material/TrendingUp";
  import CheckCircleIcon from "@mui/icons-material/CheckCircle";
  import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
  import EventAvailableIcon from "@mui/icons-material/EventAvailable";
  import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

  import dayjs from "dayjs";
  import confetti from "canvas-confetti";

  import type { StudyPlanRow } from "../types";
  import { computeOverallCompletion, groupByWeek } from "../utils/progress";

  type Props = {
    studyPlan: StudyPlanRow[];
  };

  const CONFETTI_KEY = "jlpt-confetti-100-shown-v1";
  const TEST_HISTORY_KEY = "jlpt-weekly-test-history-v1";

  type TestResult = {
    date: string; // YYYY-MM-DD
    score: number;
    total: number;
    vocabIds?: string[];
    grammarIds?: string[];
  };

  function safeNumber(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMinutes(totalMinutes: number) {
    const mins = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function loadTestHistory(): TestResult[] {
    try {
      const raw = localStorage.getItem(TEST_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as TestResult[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function ProgressRing({
    value,
    size = 140,
    thickness = 16,
  }: {
    value: number;
    size?: number;
    thickness?: number;
  }) {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `conic-gradient(
            #4F46E5 ${clamped * 3.6}deg,
            rgba(79,70,229,0.10) 0deg
          )`,
          position: "relative",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Box
          sx={{
            width: size - thickness * 2,
            height: size - thickness * 2,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 20%, rgba(236,72,153,0.10), transparent 55%), #fff",
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(17,24,39,0.08)",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
            {clamped}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
            completion
          </Typography>
        </Box>
      </Box>
    );
  }

  function getWeekColor(pct: number) {
    if (pct >= 80)
      return {
        bar: "linear-gradient(90deg, #22C55E, #16A34A)",
        chip: "success" as const,
      };
    if (pct >= 50)
      return {
        bar: "linear-gradient(90deg, #4F46E5, #EC4899)",
        chip: "primary" as const,
      };
    if (pct >= 20)
      return {
        bar: "linear-gradient(90deg, #0EA5E9, #4F46E5)",
        chip: "info" as const,
      };
    return {
      bar: "linear-gradient(90deg, #F59E0B, #EF4444)",
      chip: "warning" as const,
    };
  }

  function computeStreaks(rows: StudyPlanRow[]) {
    const doneDates = new Set<string>();

    for (const r of rows) {
      if (!r["Completed (✔)"]) continue;
      const iso = typeof r.Date === "string" ? r.Date : "";
      if (iso && dayjs(iso).isValid())
        doneDates.add(dayjs(iso).format("YYYY-MM-DD"));
    }

    const sorted = Array.from(doneDates).sort();
    if (sorted.length === 0) return { current: 0, best: 0 };

    let best = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = dayjs(sorted[i - 1]);
      const cur = dayjs(sorted[i]);
      if (cur.diff(prev, "day") === 1) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 1;
      }
    }

    const today = dayjs().format("YYYY-MM-DD");
    let anchor = today;

    if (!doneDates.has(today)) {
      const latest = sorted.filter((d) => d <= today).at(-1);
      if (!latest) return { current: 0, best };
      anchor = latest;
    }

    let current = 0;
    let d = dayjs(anchor);
    while (doneDates.has(d.format("YYYY-MM-DD"))) {
      current += 1;
      d = d.subtract(1, "day");
    }

    return { current, best };
  }

  function scoreMeta(score: number, total: number) {
    const pct = total ? Math.round((score / total) * 100) : 0;
    
      if (pct >= 90)
      return { label: "Excellent", emoji: "🏅", color: "#22C55E", chip: "success" as const };

    if (pct >= 80)
      return { label: "Great", emoji: "✨", color: "#4F46E5", chip: "primary" as const };

    if (pct >= 60)
      return { label: "Good", emoji: "🌱", color: "#13b0f8", chip: "info" as const };

    return { label: "Keep going", emoji: "🚀", color: "#F59E0B", chip: "warning" as const };

  }

  export default function ProgressView({ studyPlan }: Props) {
    const overall = computeOverallCompletion(studyPlan);
    const byWeek = groupByWeek(studyPlan);

    const total = studyPlan.length;
    const done = studyPlan.filter((r) => r["Completed (✔)"]).length;
    const remaining = Math.max(0, total - done);

    const totalStudiedMinutes = useMemo(() => {
      return studyPlan
        .filter((r) => r["Completed (✔)"] === true)
        .reduce((sum, r) => sum + safeNumber((r as any)["Study Time (min)"]), 0);
    }, [studyPlan]);

    const todayISO = dayjs().format("YYYY-MM-DD");
    const todayPlanned = studyPlan.filter((r) => r.Date === todayISO).length;
    const todayDone = studyPlan.filter(
      (r) => r.Date === todayISO && r["Completed (✔)"],
    ).length;

    const { current: currentStreak, best: bestStreak } = useMemo(
      () => computeStreaks(studyPlan),
      [studyPlan],
    );

    const [historyVersion, setHistoryVersion] = useState(0);
    const testHistory = useMemo(() => loadTestHistory(), [historyVersion]);
    const sortedHistory = useMemo(
      () =>
        testHistory
          .slice()
          .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
      [testHistory],
    );
    const latestTest = sortedHistory[0] ?? null;

    const firedRef = useRef(false);
    useEffect(() => {
      if (overall !== 100) return;
      if (firedRef.current) return;
      firedRef.current = true;

      const already = localStorage.getItem(CONFETTI_KEY) === "1";
      if (already) return;

      localStorage.setItem(CONFETTI_KEY, "1");

      confetti({
        particleCount: 180,
        spread: 80,
        origin: { y: 0.65 },
        colors: ["#4F46E5", "#EC4899", "#0EA5E9", "#22C55E", "#F59E0B"],
      });

      const t = window.setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 55,
          origin: { y: 0.55 },
          colors: ["#4F46E5", "#EC4899", "#0EA5E9"],
        });
      }, 350);

      return () => window.clearTimeout(t);
    }, [overall]);

    const headline =
      overall >= 80
        ? "Excellent pace — keep it up!"
        : overall >= 50
          ? "Nice progress — you’re halfway there."
          : overall >= 20
            ? "Good start — keep building consistency."
            : "Let’s get rolling — small steps count.";

    return (
      <Stack spacing={2}>
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            overflow: "hidden",
            position: "relative",
            background:
              "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(236,72,153,0.10), rgba(14,165,233,0.10))",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(900px 300px at 10% 20%, rgba(79,70,229,0.22), transparent 60%)," +
                "radial-gradient(900px 300px at 90% 40%, rgba(236,72,153,0.18), transparent 60%)",
            }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems="center"
            sx={{ position: "relative" }}
          >
            <ProgressRing value={overall} />

            <Stack spacing={1} sx={{ flex: 1, width: "100%" }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUpIcon sx={{ color: "#4F46E5" }} />
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  Progress Dashboard
                </Typography>
                <Chip
                  size="small"
                  label={`${done}/${total} done`}
                  color="primary"
                  sx={{ fontWeight: 800 }}
                />
                {overall === 100 && (
                  <Chip
                    size="small"
                    label="100% 🎉"
                    color="success"
                    sx={{ fontWeight: 900 }}
                  />
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {headline}
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ mt: 1 }}
              >
                <Paper sx={{ p: 1.5, borderRadius: 2, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon color="success" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {done}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 1.5, borderRadius: 2, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <HourglassBottomIcon color="warning" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Remaining
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {remaining}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 1.5, borderRadius: 2, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EventAvailableIcon color="info" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Today
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {todayDone}/{todayPlanned || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 1.5, borderRadius: 2, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalFireDepartmentIcon sx={{ color: "#F97316" }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Streak
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {currentStreak}{" "}
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          days (best {bestStreak})
                        </Typography>
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ mt: 1 }}
              >
                <Paper sx={{ p: 1.5, borderRadius: 2, flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 800 }}
                  >
                    Total studied time
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {formatMinutes(totalStudiedMinutes)}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 1.5, borderRadius: 2, flex: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="baseline"
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 800 }}
                    >
                      Latest weekly test
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setHistoryVersion((v) => v + 1)}
                    >
                      Refresh
                    </Button>
                  </Stack>
                  {latestTest ? (
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {latestTest.date} : {latestTest.score}/{latestTest.total}
                    </Typography>
                  ) : (
                    <Typography color="text.secondary">
                      No test results yet.
                    </Typography>
                  )}
                </Paper>
              </Stack>

              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Overall completion
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={overall}
                  sx={{
                    mt: 0.75,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: "rgba(17,24,39,0.08)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                      background: "linear-gradient(90deg, #4F46E5, #EC4899)",
                    },
                  }}
                />
              </Box>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Weekly test history
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setHistoryVersion((v) => v + 1)}
              >
                Refresh
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => {
                  localStorage.removeItem(TEST_HISTORY_KEY);
                  setHistoryVersion((v) => v + 1);
                }}
              >
                Clear
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {sortedHistory.length === 0 ? (
            <Typography color="text.secondary">No test results yet.</Typography>
          ) : (
            <Stack spacing={1.2}>
              {sortedHistory.map((t, i) => {
                const pct = t.total ? Math.round((t.score / t.total) * 100) : 0;
                const meta = scoreMeta(t.score, t.total);

                return (
                  <Paper
                    key={`${t.date}-${i}`}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      position: "relative",
                      overflow: "hidden",
                      borderColor: "rgba(17,24,39,0.10)",
                    }}
                  >
                    {/* left color accent */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 10,
                        background: meta.color,
                      }}
                    />

                    <Stack spacing={1} sx={{ pl: 1 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontWeight: 900 }}>
                            {t.date}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${meta.label} ${meta.emoji}`}
                            color={meta.chip}
                            sx={{ fontWeight: 800 }}
                          />
                        </Stack>

                        <Typography sx={{ fontWeight: 900 }}>
                          {t.score}/{t.total} ({pct}%)
                        </Typography>
                      </Stack>

                      {/* progress bar */}
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: "rgba(17,24,39,0.08)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${meta.color}, rgba(236,72,153,0.75))`,
                          },
                        }}
                      />

                      {/* small helper text */}
                      <Typography variant="caption" color="text.secondary">
                        Tip: Keep the momentum ⭐
                      </Typography>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Weekly breakdown
            </Typography>
            <Tooltip title="Based on your StudyPlan rows grouped by week.">
              <Chip
                size="small"
                label={`${byWeek.length} weeks`}
                variant="outlined"
              />
            </Tooltip>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1.4}>
            {byWeek.map((w) => {
              const color = getWeekColor(w.completion);
              return (
                <Stack key={w.weekLabel} spacing={0.75}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography sx={{ fontWeight: 800 }}>
                      {w.weekLabel}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        color={color.chip}
                        label={`${w.completion}%`}
                        sx={{ fontWeight: 900 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        ({w.done}/{w.total})
                      </Typography>
                    </Stack>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={w.completion}
                    sx={{
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: "rgba(17,24,39,0.06)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        background: color.bar,
                      },
                    }}
                  />
                </Stack>
              );
            })}

            {!byWeek.length && (
              <Typography variant="body2" color="text.secondary">
                No study plan rows available yet.
              </Typography>
            )}
          </Stack>
        </Paper>
      </Stack>
    );
  }
