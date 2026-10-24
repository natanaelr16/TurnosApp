import { computeShifts, validateShifts } from '@/domain/shift-calc';
import type { Settings, Shift } from '@/domain/types';

const settings: Settings = {
  baseSalary: 3_000_000,
  dailyLimitHours: 8,
  weeklyLimitHours: 42,
  payPeriod: 'mensual',
  transportAllowance: { enabled: false },
};

const shift = (start: string, end: string, id = start): Shift => ({ id, start, end });
const one = (s: Shift, cfg: Settings = settings) => computeShifts([s], cfg)[0];

// Salario 3.000.000 ÷ 210 = 14.285,714 por hora (desde 2026-07-15).
describe('cálculo de un turno (REGLAS_LEGALES §3–4)', () => {
  test('lunes 06–18: 8 h ordinarias diurnas + 4 h extra diurna', () => {
    const r = one(shift('2026-10-19T06:00', '2026-10-19T18:00'));
    expect(r.minutes.ordinaryDay).toBe(480);
    expect(r.minutes.extraDay).toBe(240);
    expect(r.amounts.extraDay).toBe(71_429); // 4 × 1,25 × VH
    expect(r.total).toBe(71_429);
    expect(r.hourValue).toBeCloseTo(14_285.714, 2);
  });

  test('lunes 18 → martes 06: nocturno desde las 19:00 y extras nocturnas después de 8 h', () => {
    const r = one(shift('2026-10-19T18:00', '2026-10-20T06:00'));
    expect(r.minutes.ordinaryDay).toBe(60); // 18–19
    expect(r.minutes.ordinaryNight).toBe(420); // 19–02
    expect(r.minutes.extraNight).toBe(240); // 02–06
    expect(r.amounts.ordinaryNight).toBe(35_000); // 7 × 0,35 × VH
    expect(r.amounts.extraNight).toBe(100_000); // 4 × 1,75 × VH
    expect(r.surchargeTotal).toBe(35_000);
    expect(r.extraTotal).toBe(100_000);
    expect(r.total).toBe(135_000);
  });

  test('sábado 18 → domingo 06: las horas después de medianoche son dominicales', () => {
    const r = one(shift('2026-10-24T18:00', '2026-10-25T06:00'));
    expect(r.minutes.ordinaryDay).toBe(60);
    expect(r.minutes.ordinaryNight).toBe(300); // sáb 19–24
    expect(r.minutes.ordinaryNightHoliday).toBe(120); // dom 00–02
    expect(r.minutes.extraNightHoliday).toBe(240); // dom 02–06
    expect(r.amounts.ordinaryNight).toBe(25_000); // 5 × 0,35
    expect(r.amounts.ordinaryNightHoliday).toBe(64_286); // 2 × (1 + 0,90 + 0,35) = 2 × 2,25
    expect(r.amounts.extraNightHoliday).toBe(151_429); // 4 × (1,75 + 0,90)
    expect(r.total).toBe(240_715);
  });

  test('festivo (lunes 2 nov 2026) 06–18', () => {
    const r = one(shift('2026-11-02T06:00', '2026-11-02T18:00'));
    expect(r.minutes.ordinaryDayHoliday).toBe(480);
    expect(r.minutes.extraDayHoliday).toBe(240);
    expect(r.amounts.ordinaryDayHoliday).toBe(217_143); // 8 × 1,90
    expect(r.amounts.extraDayHoliday).toBe(122_857); // 4 × (1,25 + 0,90)
  });

  test('opción solo-recargo para horas ordinarias dominicales (D-013)', () => {
    const cfg: Settings = { ...settings, holidayOrdinaryPay: 'solo-recargo' };
    expect(one(shift('2026-11-02T06:00', '2026-11-02T14:00'), cfg).amounts.ordinaryDayHoliday).toBe(102_857); // 8 × 0,90
    const noche = one(shift('2026-10-24T18:00', '2026-10-25T06:00'), cfg);
    expect(noche.amounts.ordinaryNightHoliday).toBe(35_714); // 2 × 1,25
    expect(noche.amounts.extraNightHoliday).toBe(151_429); // las extras no cambian
  });

  test('turno corto de 4 h diurno entre semana: sin recargos', () => {
    const r = one(shift('2026-10-21T14:00', '2026-10-21T18:00'));
    expect(r.minutes.ordinaryDay).toBe(240);
    expect(r.total).toBe(0);
    expect(r.warnings).toEqual([]);
  });

  test('frontera 18:59 / 19:00 y 05:59 / 06:00', () => {
    const tarde = one(shift('2026-10-21T18:59', '2026-10-21T19:01'));
    expect([tarde.minutes.ordinaryDay, tarde.minutes.ordinaryNight]).toEqual([1, 1]);
    const madrugada = one(shift('2026-10-21T05:59', '2026-10-21T06:01'));
    expect([madrugada.minutes.ordinaryNight, madrugada.minutes.ordinaryDay]).toEqual([1, 1]);
  });

  test('antes del 2025-12-25 la noche empezaba a las 21:00 (divisor 220)', () => {
    const r = one(shift('2025-12-01T18:00', '2025-12-01T22:00'));
    expect(r.minutes.ordinaryDay).toBe(180);
    expect(r.minutes.ordinaryNight).toBe(60);
    expect(r.amounts.ordinaryNight).toBe(4_773); // 0,35 × 3.000.000/220
  });

  test('recargo dominical 80 % antes del 2026-07-01 y 90 % después', () => {
    expect(one(shift('2026-06-28T06:00', '2026-06-28T14:00')).amounts.ordinaryDayHoliday).toBe(196_364); // 8 × 1,80 ÷ 220
    expect(one(shift('2026-07-05T06:00', '2026-07-05T14:00')).amounts.ordinaryDayHoliday).toBe(207_273); // 8 × 1,90 ÷ 220
    expect(one(shift('2026-07-19T06:00', '2026-07-19T14:00')).amounts.ordinaryDayHoliday).toBe(217_143); // 8 × 1,90 ÷ 210
  });

  test('turno que cruza un cambio de vigencia: 24 dic 2025 (noche 21:00) → 25 dic festivo (noche 19:00, dominical 80 %)', () => {
    const r = one(shift('2025-12-24T20:00', '2025-12-25T02:00'));
    expect(r.minutes.ordinaryDay).toBe(60); // 20–21
    expect(r.minutes.ordinaryNight).toBe(180); // 21–24
    expect(r.minutes.ordinaryNightHoliday).toBe(120); // 00–02 del 25
    expect(r.amounts.ordinaryNight).toBe(14_318); // 3 × 0,35 × 3.000.000/220
    expect(r.amounts.ordinaryNightHoliday).toBe(58_636); // 2 × (1 + 0,80 + 0,35) × 3.000.000/220
  });

  test('divisor de la fecha de inicio para todo el turno (D-011): 14 → 15 jul 2026', () => {
    expect(one(shift('2026-07-14T18:00', '2026-07-15T06:00')).hourValue).toBeCloseTo(3_000_000 / 220, 6);
  });

  test('el primer minuto después de completar 42 h semanales ya es extra', () => {
    const turnos = ['19', '20', '21', '22', '23'].map((d) => shift(`2026-10-${d}T06:00`, `2026-10-${d}T14:00`));
    const r = computeShifts([...turnos, shift('2026-10-24T06:00', '2026-10-24T08:00'), shift('2026-10-24T09:00', '2026-10-24T09:01')], settings);
    expect(r[5].extraMinutes).toBe(0);
    expect(r[6].minutes.extraDay).toBe(1);
  });

  test('porcentajes configurados por el usuario reemplazan los de ley', () => {
    const r = one(shift('2026-10-19T18:00', '2026-10-20T06:00'), { ...settings, overrides: { nightPct: 40 } });
    expect(r.amounts.ordinaryNight).toBe(40_000);
  });

  test('divisor personalizado', () => {
    const r = one(shift('2026-10-19T06:00', '2026-10-19T18:00'), { ...settings, monthlyDivisor: 240 });
    expect(r.hourValue).toBe(12_500);
    expect(r.amounts.extraDay).toBe(62_500);
  });

  test('aviso al superar 2 h extra diarias', () => {
    expect(one(shift('2026-10-19T06:00', '2026-10-19T18:00')).warnings).toContain('EXTRA_DIARIO_EXCEDIDO');
    expect(one(shift('2026-10-19T06:00', '2026-10-19T16:00')).warnings).toEqual([]);
  });
});

// Cifras de una planilla real de nómina del usuario (salario 4.453.128 → VH 21.205).
describe('coincide con planilla real de nómina', () => {
  const real: Settings = { ...settings, baseSalary: 4_453_128 };
  const sum = (rs: ReturnType<typeof computeShifts>, c: keyof (typeof rs)[0]['amounts']) =>
    rs.reduce((s, r) => s + r.amounts[c], 0);

  test('valor hora 21.205', () => {
    expect(Math.round(one(shift('2026-09-01T06:00', '2026-09-01T07:00'), real).hourValue)).toBe(21_205);
  });

  test('1–15 sep 2026: dominical 9 h = 362.612 y nocturno festivo 5 h = 238.560', () => {
    const r = computeShifts([
      shift('2026-09-06T06:00', '2026-09-06T14:00'), // domingo
      shift('2026-09-13T18:00', '2026-09-14T06:00'), // domingo → lunes
    ], real);
    expect(sum(r, 'ordinaryDayHoliday')).toBe(362_612);
    expect(sum(r, 'ordinaryNightHoliday')).toBe(238_560);
    expect(r[1].minutes.ordinaryNight).toBe(120); // lunes 00–02
    expect(r[1].minutes.extraNight).toBe(240); // lunes 02–06
  });

  test('15–31 jul 2026: sábado 18 → domingo 06 = 95.424 + 224.777', () => {
    const r = one(shift('2026-07-18T18:00', '2026-07-19T06:00'), real);
    expect(r.amounts.ordinaryNightHoliday).toBe(95_424); // 2 h × 2,25
    expect(r.amounts.extraNightHoliday).toBe(224_777); // 4 h × 2,65
  });

  test('extras y recargos entre semana: factores 1,25 / 0,35 / 1,75', () => {
    const r = computeShifts([
      shift('2026-09-01T06:00', '2026-09-01T18:00'),
      shift('2026-09-03T18:00', '2026-09-04T06:00'),
    ], real);
    expect(sum(r, 'extraDay')).toBe(106_027); // 4 h × 1,25 (planilla: 12 h = 318.081)
    expect(sum(r, 'ordinaryNight')).toBe(51_953); // 7 h × 0,35
    expect(sum(r, 'extraNight')).toBe(148_438); // 4 h × 1,75 (planilla: 20 h = 742.188)
  });

  test('turno 14:00–21:00: 5 h diurnas y 2 h nocturnas (desde las 19:00)', () => {
    const r = one(shift('2026-10-08T14:00', '2026-10-08T21:00'), real);
    expect([r.minutes.ordinaryDay, r.minutes.ordinaryNight]).toEqual([300, 120]);
  });
});

describe('extras por límite semanal (D-004)', () => {
  test('seis turnos de 8 h (lun–sáb): el sábado solo 2 h son ordinarias', () => {
    const days = ['19', '20', '21', '22', '23', '24'];
    const results = computeShifts(days.map((d) => shift(`2026-10-${d}T06:00`, `2026-10-${d}T14:00`)), settings);
    results.slice(0, 5).forEach((r) => expect(r.extraMinutes).toBe(0));
    const sabado = results[5];
    expect(sabado.minutes.ordinaryDay).toBe(120);
    expect(sabado.minutes.extraDay).toBe(360);
    expect(sabado.warnings).toContain('EXTRA_DIARIO_EXCEDIDO');
    expect(sabado.warnings).not.toContain('EXTRA_SEMANAL_EXCEDIDO');
  });

  test('la semana se reinicia el lunes', () => {
    const turnos = ['19', '20', '21', '22', '23', '24'].map((d) => shift(`2026-10-${d}T06:00`, `2026-10-${d}T14:00`));
    const lunes = computeShifts([...turnos, shift('2026-10-26T06:00', '2026-10-26T14:00')], settings)[6];
    expect(lunes.extraMinutes).toBe(0);
  });

  test('aviso al superar 12 h extra semanales', () => {
    const turnos = ['19', '20', '21', '22'].map((d) => shift(`2026-10-${d}T06:00`, `2026-10-${d}T18:00`));
    const r = computeShifts(turnos, settings);
    expect(r[3].warnings).toContain('EXTRA_SEMANAL_EXCEDIDO'); // 4 × 4 h = 16 h
    expect(r[2].warnings).not.toContain('EXTRA_SEMANAL_EXCEDIDO'); // 12 h exactas
  });

  test('dos turnos que inician el mismo día comparten el límite diario (06–18 y luego 18–06 = 24 h)', () => {
    const r = computeShifts([
      shift('2026-10-19T06:00', '2026-10-19T18:00', 'dia'),
      shift('2026-10-19T18:00', '2026-10-20T06:00', 'noche'),
    ], settings);
    expect(r[1].extraMinutes).toBe(720);
  });

  test('el orden de entrada no importa: se procesan cronológicamente', () => {
    const a = shift('2026-10-19T06:00', '2026-10-19T18:00', 'a');
    const b = shift('2026-10-20T06:00', '2026-10-20T18:00', 'b');
    const r = computeShifts([b, a], settings);
    expect(r.map((x) => x.shift.id)).toEqual(['a', 'b']);
  });
});

describe('validación de turnos', () => {
  test('salida debe ser posterior a la entrada', () => {
    expect(validateShifts([shift('2026-10-19T18:00', '2026-10-19T18:00')])).toEqual([
      { shiftId: '2026-10-19T18:00', code: 'FIN_ANTES_DE_INICIO' },
    ]);
  });

  test('máximo 24 h', () => {
    expect(validateShifts([shift('2026-10-19T06:00', '2026-10-20T06:01')])[0].code).toBe('DURACION_EXCESIVA');
  });

  test('exactamente 24 h es válido', () => {
    expect(validateShifts([shift('2026-10-19T06:00', '2026-10-20T06:00')])).toEqual([]);
  });

  test('turnos superpuestos', () => {
    const errores = validateShifts([
      shift('2026-10-19T06:00', '2026-10-19T18:00', 'a'),
      shift('2026-10-19T17:00', '2026-10-20T05:00', 'b'),
    ]);
    expect(errores).toEqual([{ shiftId: 'b', code: 'SUPERPUESTO', otherShiftId: 'a' }]);
  });

  test('turnos consecutivos no se superponen', () => {
    expect(validateShifts([
      shift('2026-10-19T06:00', '2026-10-19T18:00', 'a'),
      shift('2026-10-19T18:00', '2026-10-20T06:00', 'b'),
    ])).toEqual([]);
  });
});
