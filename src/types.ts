export type StudyPlanRow = {
  Date: string;
  Day: string;
  Focus: string;
  'Vocab IDs': string;
  'Grammar IDs': string;
  'Study Time (min)': number;
  'Completed (✔)': boolean;
  'Completion %': number;
  Notes: string;
};

export type VocabRow = {
  'Vocab ID': string;
  Word: string;
  Pronunciation: string;
  Meaning: string;
  Example: string;
  'Learned (✔)': boolean;
  'Review D+1': string | null;
  'Review D+7': string | null;
  'Review D+14': string | null;
};

export type GrammarRow = {
  'Grammar ID': string;
  Pattern: string;
  Meaning: string;
  Example: string;
  'Mastered (✔)': boolean;
};

export type ProgressRow = {
  Week: string;
  'Completion %': number;
};

export type WorkbookData = {
  StudyPlan: StudyPlanRow[];
  Vocabulary: VocabRow[];
  Grammar: GrammarRow[];
  Progress: ProgressRow[];
};
