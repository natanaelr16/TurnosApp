import { computePeriod, liquidationTable, periodFor, withholdingMonthly } from '@/domain/payroll';
import { computeShifts } from '@/domain/shift-calc';
import type { Settings } from '@/domain/types';

const settings: Settings = {
  baseSalary: 3_000_000,
  dailyLimitHours: 8,
  weeklyLimitHours: 42,
  payPeriod: 'mensual',
  transportAllowance: { enabled: false },
};

describe('periodos de pago', () => {
  test('quincenas y meses', () => {
    expect(periodFor('2026-10-15', 'quincenal')).toEqual({ start: '2026-10-01', end: '2026-10-15' });
    expect(periodFor('2026-10-16', 'quincenal')).toEqual({ start: '2026-10-16', end: '2026-10-31' });
    expect(periodFor('2026-02-20', 'quincenal')).toEqual({ start: '2026-02-16', end: '2026-02-28' });
    expect(periodFor('2026-10-20', 'mensual')).toEqual({ start: '2026-10-01', end: '2026-10-31' });
  });
});

describe('resumen del periodo (REGLAS_LEGALES §6–7)', () => {
  test('mes con dos turnos, sin auxilio: salud y pensión 4 %, sin FSP ni retención', () => {
    const shifts = computeShifts([
      { id: 'a', start: '2026-10-19T06:00', end: '2026-10-19T18:00' },
      { id: 'b', start: '2026-10-21T18:00', end: '2026-10-22T06:00' },
      { id: 'fuera', start: '2026-11-03T06:00', end: '2026-11-03T18:00' },
    ], settings);
    const p = computePeriod(shifts, settings, periodFor('2026-10-01', 'mensual'));
    expect(p.shiftCount).toBe(2);
    expect(p.basePay).toBe(3_000_000);
    expect(p.surcharges).toBe(35_000);
    expect(p.extras).toBe(171_429);
    expect(p.transportAllowance).toBe(0);
    expect(p.contributionBase).toBe(3_206_429);
    expect(p.health).toBe(128_257);
    expect(p.pension).toBe(128_257);
    expect(p.solidarityFund).toBe(0);
    expect(p.withholding).toBe(0);
    expect(p.gross).toBe(3_206_429);
    expect(p.net).toBe(2_949_915);
  });

  test('salario alto: FSP 1 % y retención estimada procedimiento 1', () => {
    const cfg = { ...settings, baseSalary: 12_000_000 };
    const p = computePeriod([], cfg, periodFor('2026-10-01', 'mensual'));
    expect(p.health).toBe(480_000);
    expect(p.pension).toBe(480_000);
    expect(p.solidarityFund).toBe(120_000);
    expect(p.withholding).toBe(617_000); // base 8.190.000 → 156,38 UVT → (b−150)×28 % + 10 UVT = 617.232
    expect(p.net).toBe(10_303_000);
  });

  test('quincena con auxilio de transporte activado (no es base de aportes)', () => {
    const cfg: Settings = { ...settings, baseSalary: 1_750_905, payPeriod: 'quincenal', transportAllowance: { enabled: true } };
    const p = computePeriod([], cfg, periodFor('2026-10-01', 'quincenal'));
    expect(p.basePay).toBe(875_453);
    expect(p.transportAllowance).toBe(124_548);
    expect(p.contributionBase).toBe(875_453);
    expect(p.health).toBe(35_018);
    expect(p.gross).toBe(1_000_001);
    expect(p.net).toBe(929_965);
  });

  test('auxilio desactivado: no se suma aunque el salario sea bajo (D-009)', () => {
    const cfg: Settings = { ...settings, baseSalary: 1_750_905, transportAllowance: { enabled: false } };
    expect(computePeriod([], cfg, periodFor('2026-10-01', 'mensual')).transportAllowance).toBe(0);
  });

  test('auxilio con valor personalizado', () => {
    const cfg: Settings = { ...settings, transportAllowance: { enabled: true, amount: 300_000 } };
    expect(computePeriod([], cfg, periodFor('2026-10-01', 'mensual')).transportAllowance).toBe(300_000);
  });

  test('quincena con salario alto: FSP y retención sobre el mes proyectado (D-012)', () => {
    const cfg: Settings = { ...settings, baseSalary: 12_000_000, payPeriod: 'quincenal' };
    const p = computePeriod([], cfg, periodFor('2026-10-16', 'quincenal'));
    expect(p.basePay).toBe(6_000_000);
    expect(p.solidarityFund).toBe(60_000);
    expect(p.withholding).toBe(308_500); // 617.000 ÷ 2
  });

  test('auxilio de transporte sí entra en la base de retención, no en el IBC (D-012)', () => {
    const cfg: Settings = { ...settings, baseSalary: 12_000_000, transportAllowance: { enabled: true } };
    const p = computePeriod([], cfg, periodFor('2026-10-01', 'mensual'));
    expect(p.contributionBase).toBe(12_000_000);
    expect(p.withholding).toBe(withholdingMonthly({ laborIncome: 12_249_095, nonTaxable: 1_080_000, deductions: 0, uvt: 52_374 }));
    expect(p.withholding).toBeGreaterThan(617_000);
  });

  test('IBC mínimo de 1 SMMLV', () => {
    const cfg = { ...settings, baseSalary: 1_000_000 };
    const p = computePeriod([], cfg, periodFor('2026-10-01', 'mensual'));
    expect(p.contributionBase).toBe(1_750_905);
    expect(p.health).toBe(70_036);
  });
});

describe('cuadro de liquidación del periodo (D-024, planilla real oct 1–15 2026)', () => {
  const real: Settings = { baseSalary: 4_453_128, dailyLimitHours: 8, weeklyLimitHours: 42, payPeriod: 'quincenal', transportAllowance: { enabled: false } };
  const results = computeShifts([
    { id: '1', start: '2026-10-01T06:00', end: '2026-10-01T18:00' },
    { id: '2', start: '2026-10-02T06:00', end: '2026-10-02T18:00' },
    { id: '3', start: '2026-10-03T18:00', end: '2026-10-04T06:00' },
    { id: '4', start: '2026-10-04T18:00', end: '2026-10-05T06:00' },
    { id: '7', start: '2026-10-07T14:00', end: '2026-10-07T22:00' },
    { id: '8', start: '2026-10-08T14:00', end: '2026-10-08T21:00' },
    { id: '9', start: '2026-10-09T18:00', end: '2026-10-10T06:00' },
  ], real);
  const table = liquidationTable(results, real, { start: '2026-10-01', end: '2026-10-15' });
  const row = (c: string) => table.rows.find((r) => r.category === c)!;

  test('horas por factor como la planilla', () => {
    expect(row('extraDay').hours).toBe(8);
    expect(row('ordinaryNight').hours).toBe(19);
    expect(row('extraNight').hours).toBe(8);
    expect(row('ordinaryDayHoliday').hours).toBe(1);
    expect(row('extraDayHoliday').hours).toBe(0);
    expect(row('ordinaryNightHoliday').hours).toBe(7);
    expect(row('extraNightHoliday').hours).toBe(4);
    expect(table.workedMinutes).toBe(75 * 60);
  });

  test('valores cercanos a la planilla (±40 por redondeo del valor hora)', () => {
    const planilla = { extraDay: 212_054, ordinaryNight: 141_016, extraNight: 296_875, ordinaryDayHoliday: 40_290, ordinaryNightHoliday: 333_985, extraNightHoliday: 224_777 };
    for (const [category, valor] of Object.entries(planilla)) {
      expect(Math.abs(row(category).amount - valor)).toBeLessThanOrEqual(40);
    }
    expect(Math.abs(table.totalAmount - 1_248_996)).toBeLessThanOrEqual(80);
  });
});

describe('retención en la fuente (estimada)', () => {
  const uvt = 52_374;
  test('sin retención por debajo de 95 UVT de base', () => {
    expect(withholdingMonthly({ laborIncome: 5_000_000, nonTaxable: 400_000, deductions: 0, uvt })).toBe(0);
  });

  test('base exactamente 95 UVT → sin retención', () => {
    // subtotal 6.634.040 − 25 % exenta = 4.975.530 = 95 UVT
    expect(withholdingMonthly({ laborIncome: 6_634_040, nonTaxable: 0, deductions: 0, uvt })).toBe(0);
  });

  test('tope conjunto de 1.340 UVT anuales cuando el 40 % no limita', () => {
    // subtotal 30.000.000; deducciones 7.000.000 + exenta 3.447.955 → tope 5.848.430 (< 40 % = 12.000.000)
    const base = 30_000_000 - (1340 / 12) * uvt;
    const esperado = Math.round((((base / uvt - 360) * 0.33 + 69) * uvt) / 1000) * 1000;
    expect(withholdingMonthly({ laborIncome: 30_000_000, nonTaxable: 0, deductions: 7_000_000, uvt })).toBe(esperado);
  });

  test('tope de renta exenta 790 UVT anuales', () => {
    // subtotal 40.000.000 → 25 % = 10.000.000 > tope 3.447.955 → base ≈ 697,9 UVT (tramo 640–945)
    const base = 40_000_000 - (790 / 12) * uvt;
    const esperado = Math.round((((base / uvt - 640) * 0.35 + 162) * uvt) / 1000) * 1000;
    expect(withholdingMonthly({ laborIncome: 40_000_000, nonTaxable: 0, deductions: 0, uvt })).toBe(esperado);
  });

  test('límite del 40 % con deducciones altas', () => {
    // subtotal 10.000.000; deducciones 3.500.000; exenta 25 % de 6.500.000 = 1.625.000 → suma 5.125.000 > 40 % = 4.000.000
    const base = 6_000_000;
    const esperado = Math.round((((base / uvt - 95) * 0.19) * uvt) / 1000) * 1000;
    expect(withholdingMonthly({ laborIncome: 10_000_000, nonTaxable: 0, deductions: 3_500_000, uvt })).toBe(esperado);
  });
});
