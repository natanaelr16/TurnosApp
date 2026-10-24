import { formatCOP, formatFactor, formatMinutes, formatMonth, formatPeriod, formatShortDate, todayLocal } from '@/lib/format';

describe('formatos', () => {
  test('moneda', () => {
    expect(formatCOP(4_453_128)).toBe('$ 4.453.128');
    expect(formatCOP(999)).toBe('$ 999');
    expect(formatCOP(21_205.37)).toBe('$ 21.205');
    expect(formatCOP(-70_036)).toBe('−$ 70.036');
    expect(formatCOP(0)).toBe('$ 0');
  });

  test('duración', () => {
    expect(formatMinutes(450)).toBe('7 h 30 min');
    expect(formatMinutes(720)).toBe('12 h');
    expect(formatMinutes(45)).toBe('45 min');
  });

  test('fechas', () => {
    expect(formatShortDate('2026-10-24')).toBe('sáb 24 oct');
    expect(formatMonth(2026, 10)).toBe('octubre 2026');
    expect(formatPeriod('2026-10-01', '2026-10-15')).toBe('1 – 15 oct 2026');
    expect(todayLocal(new Date(2026, 9, 24, 23, 59))).toBe('2026-10-24');
  });

  test('factor', () => {
    expect(formatFactor(1.9)).toBe('1,90');
    expect(formatFactor(0.35)).toBe('0,35');
  });
});
