// src/utils/parseIds.ts
function pad3(n: number) {
  return String(n).padStart(3, '0');
}

/**
 * Parse ID strings like:
 * - "V001–V005"
 * - "V001-V005"
 * - "V001, V003, V010"
 * - "V001–V005, V010–V012"
 * Returns array of IDs ["V001","V002",...]
 */
export function parseIdList(input: string, prefix: 'V' | 'G'): string[] {
  if (!input) return [];

  const s = input
    .replace(/\s+/g, '')
    .replace(/[—–]/g, '-') // normalize en dash
    .toUpperCase();

  const parts = s.split(',').filter(Boolean);
  const out: string[] = [];

  for (const p of parts) {
    // Range: V001-V005
    const rangeMatch = p.match(new RegExp(`^${prefix}(\\d{1,4})-${prefix}(\\d{1,4})$`));
    if (rangeMatch) {
      const a = Number(rangeMatch[1]);
      const b = Number(rangeMatch[2]);
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      for (let i = start; i <= end; i++) out.push(`${prefix}${pad3(i)}`);
      continue;
    }

    // Single: V015
    const singleMatch = p.match(new RegExp(`^${prefix}(\\d{1,4})$`));
    if (singleMatch) out.push(`${prefix}${pad3(Number(singleMatch[1]))}`);
  }

  // unique keep order
  return Array.from(new Set(out));
}