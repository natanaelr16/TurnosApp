import { fspPercent, hasYearlyParams, legalRatesOn, yearlyParams } from '@/domain/legal-params';

describe('parámetros legales por fecha', () => {
  test('divisor y jornada (Ley 2101 de 2021)', () => {
    expect(legalRatesOn('2023-07-14').divisor).toBe(240);
    expect(legalRatesOn('2023-07-15').divisor).toBe(235);
    expect(legalRatesOn('2024-07-15').divisor).toBe(230);
    expect(legalRatesOn('2026-07-14').divisor).toBe(220);
    expect(legalRatesOn('2026-07-15').divisor).toBe(210);
    expect(legalRatesOn('2026-07-15').weeklyHours).toBe(42);
  });

  test('inicio de jornada nocturna (Ley 2466 de 2025)', () => {
    expect(legalRatesOn('2025-12-24').nightStartMinute).toBe(21 * 60);
    expect(legalRatesOn('2025-12-25').nightStartMinute).toBe(19 * 60);
    expect(legalRatesOn('2025-12-25').nightEndMinute).toBe(6 * 60);
  });

  test('recargo dominical gradual', () => {
    expect(legalRatesOn('2025-06-30').sundayPct).toBe(75);
    expect(legalRatesOn('2025-07-01').sundayPct).toBe(80);
    expect(legalRatesOn('2026-06-30').sundayPct).toBe(80);
    expect(legalRatesOn('2026-07-01').sundayPct).toBe(90);
    expect(legalRatesOn('2027-07-01').sundayPct).toBe(100);
  });

  test('porcentajes fijos del Art. 168 CST', () => {
    const r = legalRatesOn('2026-10-24');
    expect([r.nightPct, r.extraDayPct, r.extraNightPct]).toEqual([35, 25, 75]);
  });

  test('parámetros anuales', () => {
    expect(yearlyParams(2026)).toEqual({ smmlv: 1_750_905, transportAllowance: 249_095, uvt: 52_374 });
    expect(yearlyParams(2025)).toEqual({ smmlv: 1_423_500, transportAllowance: 200_000, uvt: 49_799 });
  });

  test('Fondo de Solidaridad Pensional — Ley 100 (hasta 2027-03-31)', () => {
    const d = '2026-10-01';
    expect(fspPercent(3.99, d)).toBe(0);
    expect(fspPercent(4, d)).toBe(1);
    expect(fspPercent(15.99, d)).toBe(1);
    expect(fspPercent(16, d)).toBe(1.2);
    expect(fspPercent(19, d)).toBe(1.8);
    expect(fspPercent(20, d)).toBe(1.8);
    expect(fspPercent(20.01, d)).toBe(2);
  });

  test('Fondo de Solidaridad Pensional — Ley 2381 (desde 2027-04-01)', () => {
    const d = '2027-04-01';
    expect(fspPercent(4, d)).toBe(1.5);
    expect(fspPercent(7, d)).toBe(1.8);
    expect(fspPercent(11, d)).toBe(2.5);
    expect(fspPercent(20, d)).toBe(2.8);
    expect(fspPercent(21, d)).toBe(3);
    expect(fspPercent(3.99, d)).toBe(0);
    expect(fspPercent(6.99, d)).toBe(1.5);
    expect(fspPercent(18.99, d)).toBe(2.5);
    expect(fspPercent(19, d)).toBe(2.8);
  });

  test('año sin parámetros cargados usa el último conocido y se puede detectar', () => {
    expect(yearlyParams(2028)).toEqual(yearlyParams(2026));
    expect(hasYearlyParams(2026)).toBe(true);
    expect(hasYearlyParams(2028)).toBe(false);
  });
});
