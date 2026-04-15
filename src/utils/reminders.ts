import dayjs from "dayjs";

export type DueItem = {
  type: "vocab" | "grammar";
  id: string;
  title: string; // Word or Pattern
  dueLabel: "D+1" | "D+7" | "D+14";
  dueDate: string; // YYYY-MM-DD
  overdueDays: number; // 0 if due today
};

function pickNextDue(todayISO: string, dates: Array<{ label: "D+1" | "D+7" | "D+14"; date?: string | null }>) {
  const today = dayjs(todayISO);
  // keep only valid dates
  const valid = dates
    .filter((x) => x.date && dayjs(String(x.date)).isValid())
    .map((x) => ({ label: x.label, d: dayjs(String(x.date)) }));

  if (valid.length === 0) return null;

  // due today or overdue: pick the *most recent* due date <= today (closest overdue)
  const dueOrOverdue = valid
    .filter((x) => x.d.isSame(today, "day") || x.d.isBefore(today, "day"))
    .sort((a, b) => b.d.valueOf() - a.d.valueOf())[0];

  if (dueOrOverdue) {
    const overdueDays = Math.max(0, today.diff(dueOrOverdue.d, "day"));
    return { label: dueOrOverdue.label, date: dueOrOverdue.d.format("YYYY-MM-DD"), overdueDays };
  }

  // otherwise not due yet (future only) -> return null (we only notify due/overdue)
  return null;
}

export function getVocabDue(todayISO: string, vocab: any[]): DueItem[] {
  const out: DueItem[] = [];

  for (const v of vocab) {
    if (!v["Learned (✔)"]) continue;

    const next = pickNextDue(todayISO, [
      { label: "D+1", date: v["Review D+1"] },
      { label: "D+7", date: v["Review D+7"] },
      { label: "D+14", date: v["Review D+14"] },
    ]);

    if (!next) continue;

    out.push({
      type: "vocab",
      id: v["Vocab ID"],
      title: v.Word,
      dueLabel: next.label,
      dueDate: next.date,
      overdueDays: next.overdueDays,
    });
  }

  return out;
}

export function getGrammarDue(todayISO: string, grammar: any[]): DueItem[] {
  const out: DueItem[] = [];

  for (const g of grammar) {
    if (!g["Mastered (✔)"]) continue;

    const next = pickNextDue(todayISO, [
      { label: "D+1", date: g["Review D+1"] },
      { label: "D+7", date: g["Review D+7"] },
      { label: "D+14", date: g["Review D+14"] },
    ]);

    if (!next) continue;

    out.push({
      type: "grammar",
      id: g["Grammar ID"],
      title: g.Pattern,
      dueLabel: next.label,
      dueDate: next.date,
      overdueDays: next.overdueDays,
    });
  }

  return out;
}