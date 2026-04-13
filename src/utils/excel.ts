export function excelSerialToDate(serial: number): Date {
  const utcDays = serial - 25569;
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

export function toISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
