import dayjs from 'dayjs';

/**
 * Safely formats a value as YYYY-MM-DD.
 * Returns '' if value is null/undefined/empty or not a valid date.
 */
export function formatDateCell(value: unknown, format = 'YYYY-MM-DD'): string {
  if (value == null || value === '') return '';

  const d = dayjs(String(value));
  return d.isValid() ? d.format(format) : '';
}