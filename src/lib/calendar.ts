import { dayOfWeek, daysInMonth, makeDate } from '@/domain/time';
import type { Novelty, Shift } from '@/domain/types';

export const CALENDAR_KINDS = {
  day: { label: 'Día', mark: 'D', background: '#BAE6FD', text: '#0C4A6E' },
  night: { label: 'Noche', mark: 'N', background: '#172554', text: '#FFFFFF' },
  rest: { label: 'Descanso', mark: 'L', background: '#DCFCE7', text: '#14532D' },
  novelty: { label: 'Novedad', mark: 'V', background: '#EDE9FE', text: '#4C1D95' },
} as const;
export type CalendarKind = keyof typeof CALENDAR_KINDS;

export function calendarDays(year: number, month: number): (string | null)[] {
  const offset = (dayOfWeek(makeDate(year, month, 1)) + 6) % 7;
  const count = daysInMonth(year, month);
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) => i < offset || i >= offset + count ? null : makeDate(year, month, i - offset + 1));
}

export function calendarMarkers(shifts: Shift[], novelties: Novelty[]): Map<string, CalendarKind[]> {
  const byDate = new Map<string, Set<CalendarKind>>();
  const add = (date: string, kind: CalendarKind) => {
    if (!byDate.has(date)) byDate.set(date, new Set());
    byDate.get(date)!.add(kind);
  };
  shifts.forEach((s) => { const hour = Number(s.start.slice(11, 13)); add(s.start.slice(0, 10), hour >= 18 || hour < 6 ? 'night' : 'day'); });
  novelties.forEach((n) => add(n.date, n.kind === 'rest' ? 'rest' : 'novelty'));
  return new Map([...byDate].map(([date, kinds]) => [date, (Object.keys(CALENDAR_KINDS) as CalendarKind[]).filter((key) => kinds.has(key))]));
}

export function dayKinds(date: string, shifts: Shift[], novelties: Novelty[]): CalendarKind[] {
  return calendarMarkers(shifts, novelties).get(date) ?? [];
}
