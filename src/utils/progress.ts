import dayjs from 'dayjs';
import type { StudyPlanRow } from '../types';

export function computeOverallCompletion(rows: StudyPlanRow[]): number {
  if (!rows.length) return 0;
  const done = rows.filter((r) => r['Completed (✔)']).length;
  return Math.round((done / rows.length) * 100);
}

export function groupByWeek(rows: StudyPlanRow[]) {
  if (!rows.length) return [] as { weekLabel: string; completion: number; done: number; total: number }[];

  const sorted = [...rows].sort((a, b) => (a.Date || '').localeCompare(b.Date || ''));
  const start = dayjs(sorted[0].Date);

  const map = new Map<number, { done: number; total: number }>();

  for (const r of rows) {
    const d = dayjs(r.Date);
    const weekIndex = d.diff(start, 'week');
    const cur = map.get(weekIndex) ?? { done: 0, total: 0 };
    cur.total += 1;
    if (r['Completed (✔)']) cur.done += 1;
    map.set(weekIndex, cur);
  }

  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekIndex, v]) => ({
      weekLabel: `Week ${weekIndex + 1}`,
      completion: Math.round((v.done / v.total) * 100),
      done: v.done,
      total: v.total,
    }));
}
