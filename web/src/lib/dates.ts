export function madridToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function addDays(day: string, days: number): string {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function dateWindow(period: string, today = madridToday()): [string, string | null] {
  if (period === 'today') return [today, today];
  if (period === 'tomorrow') { const next = addDays(today, 1); return [next, next]; }
  if (period === 'weekend') {
    const day = new Date(today + 'T12:00:00Z').getUTCDay();
    return [addDays(today, day === 0 || day === 6 ? 0 : (5 - day + 7) % 7), addDays(today, (7 - day) % 7)];
  }
  if (period === 'week') return [today, addDays(today, 6)];
  return [today, null];
}
