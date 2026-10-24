import { easterSunday, holidaysOf, isHoliday, isRestDay } from '@/domain/holidays';

describe('festivos de Colombia (Ley 51 de 1983)', () => {
  test('domingo de Pascua', () => {
    expect(easterSunday(2025)).toBe('2025-04-20');
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(easterSunday(2027)).toBe('2027-03-28');
  });

  test('festivos 2026 completos (REGLAS_LEGALES §5)', () => {
    expect(holidaysOf(2026)).toEqual([
      '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
      '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
      '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
    ]);
  });

  test('2025: festivos trasladados y coincidencia San Pedro / Sagrado Corazón (30 jun)', () => {
    const h = holidaysOf(2025);
    expect(h).toEqual(expect.arrayContaining([
      '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18', '2025-06-02', '2025-06-23',
      '2025-06-30', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
    ]));
    expect(h).toHaveLength(17);
  });

  test('isHoliday / isRestDay', () => {
    expect(isHoliday('2026-11-02')).toBe(true);
    expect(isHoliday('2026-11-01')).toBe(false);
    expect(isRestDay('2026-11-01')).toBe(true); // domingo
    expect(isRestDay('2026-11-02')).toBe(true); // festivo lunes
    expect(isRestDay('2026-11-03')).toBe(false);
  });
});
