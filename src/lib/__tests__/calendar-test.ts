import { calendarDays, dayKinds } from '../calendar';

test('calendario completo incluye semanas enteras y días reales', () => {
  const days = calendarDays(2026, 8);
  expect(days).toHaveLength(42);
  expect(days.filter(Boolean)).toHaveLength(31);
  expect(days[5]).toBe('2026-08-01');
});

test('distingue día, noche, descanso y novedad; una noche marca su jornada de inicio', () => {
  const shifts = [{ id: 's', start: '2026-10-25T18:00', end: '2026-10-26T06:00' }];
  expect(dayKinds('2026-10-25', shifts, [])).toEqual(['night']);
  expect(dayKinds('2026-10-26', shifts, [{ id: 'n', date: '2026-10-26', kind: 'rest' }])).toEqual(['rest']);
  expect(dayKinds('2026-10-27', [], [{ id: 'n', date: '2026-10-27', kind: 'sick' }])).toEqual(['novelty']);
  expect(dayKinds('2026-10-25', [...shifts, { id: 's2', start: '2026-10-25T06:00', end: '2026-10-25T10:00' }], [])).toEqual(['day', 'night']);
});
