import * as XLSX from 'xlsx';
import type { WorkbookData, StudyPlanRow, VocabRow, GrammarRow, ProgressRow } from '../types';
import { excelSerialToDate, toISODate } from './excel';

function normalizeCheck(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.trim() === '✔' || v.trim().toLowerCase() === 'true';
  return false;
}

function normalizeDate(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (v instanceof Date) return toISODate(v);
  if (typeof v === 'number') return toISODate(excelSerialToDate(v));
  if (typeof v === 'string') return v;
  return null;
}

export async function parseWorkbook(file: File): Promise<WorkbookData> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const get = (name: string) => XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[name], { defval: '' });

  const spRaw = get('StudyPlan');
  const vocabRaw = get('Vocabulary');
  const grammarRaw = get('Grammar');
  const progressRaw = get('Progress');

  const StudyPlan: StudyPlanRow[] = spRaw.map((r) => ({
    Date: normalizeDate(r['Date']) ?? '',
    Day: r['Day'] ?? '',
    Focus: r['Focus'] ?? '',
    'Vocab IDs': r['Vocab IDs'] ?? '',
    'Grammar IDs': r['Grammar IDs'] ?? '',
    'Study Time (min)': Number(r['Study Time (min)'] ?? 0),
    'Completed (✔)': normalizeCheck(r['Completed (✔)']),
    'Completion %': Number(r['Completion %'] ?? 0),
    Notes: r['Notes'] ?? '',
  }));

  const Vocabulary: VocabRow[] = vocabRaw.map((r) => ({
    'Vocab ID': r['Vocab ID'] ?? '',
    Word: r['Word'] ?? '',
    Pronunciation: r['Pronunciation'] ?? '',
    Meaning: r['Meaning'] ?? '',
    Example: r['Example'] ?? '',
    'Learned (✔)': normalizeCheck(r['Learned (✔)']),
    'Review D+1': normalizeDate(r['Review D+1']),
    'Review D+7': normalizeDate(r['Review D+7']),
    'Review D+14': normalizeDate(r['Review D+14']),
  }));

  
const Grammar: GrammarRow[] = grammarRaw.map((r) => ({
  'Grammar ID': r['Grammar ID'] ?? '',
  Pattern: r['Pattern'] ?? '',
  Meaning: r['Meaning'] ?? '',
  Example: r['Example'] ?? '',
  'Mastered (✔)': normalizeCheck(r['Mastered (✔)']),

  // ✅ parse if columns exist, otherwise null
  'Review D+1': normalizeDate(r['Review D+1']),
  'Review D+7': normalizeDate(r['Review D+7']),
  'Review D+14': normalizeDate(r['Review D+14']),
}));


  const Progress: ProgressRow[] = progressRaw.map((r) => ({
    Week: String(r['Week'] ?? ''),
    'Completion %': Number(r['Completion %'] ?? 0),
  }));

  return { StudyPlan, Vocabulary, Grammar, Progress };
}
