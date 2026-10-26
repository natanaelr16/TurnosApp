import { DEFAULT_SETTINGS } from '../defaults';
import { accruedForPeriod, applyTemplate, recordCoverage, validateRecords, validateTemplate } from '../records';
import { computeShifts } from '../shift-calc';
import type { Novelty, Shift } from '../types';

const shift: Shift = { id: 's', start: '2026-10-25T18:00', end: '2026-10-26T06:00' };
const rest: Novelty = { id: 'n', date: '2026-10-26', kind: 'rest' };

test('plantilla nocturna cruza medianoche y fin de año sin convertir a zona local', () => {
  expect(applyTemplate('2026-12-31', { id: 't', name: 'Noche', startTime: '18:00', durationMinutes: 720 })).toEqual({ start: '2026-12-31T18:00', end: '2027-01-01T06:00' });
});

test('valida fechas reales, orden, 24 horas y superposiciones', () => {
  expect(validateRecords([shift], [])).toEqual([]);
  expect(validateRecords([{ ...shift, start: '2026-02-30T18:00' }], []).length).toBeGreaterThan(0);
  expect(validateRecords([{ ...shift, end: '2026-10-25T17:00' }], []).length).toBeGreaterThan(0);
  expect(validateRecords([{ ...shift, end: '2026-10-26T19:00' }], []).length).toBeGreaterThan(0);
  expect(validateRecords([shift, { ...shift, id: 's2' }], []).length).toBeGreaterThan(0);
  expect(validateRecords([shift, { id: 's2', start: shift.end, end: '2026-10-26T10:00' }], [])).toEqual([]);
});

test('novedad pertenece a la fecha de jornada: permite descanso tras noche, no el mismo inicio', () => {
  expect(validateRecords([shift], [rest])).toEqual([]);
  expect(validateRecords([shift], [{ ...rest, date: '2026-10-25' }]).length).toBeGreaterThan(0);
  expect(validateRecords([], [rest, { ...rest, id: 'n2' }]).length).toBeGreaterThan(0);
  expect(validateRecords([], [{ ...rest, date: '2026-02-30' }]).length).toBeGreaterThan(0);
});

test('campos alfanuméricos y numéricos no afectan horas ni importes', () => {
  const fields = [{ name: 'Grúa', value: 'RTG19' }, { name: 'Movimientos', value: 42 }];
  expect(validateRecords([{ ...shift, fields }], [])).toEqual([]);
  const settings = { ...DEFAULT_SETTINGS, baseSalary: 3000000 };
  const plain = computeShifts([shift], settings)[0];
  const enriched = computeShifts([{ ...shift, fields }], settings)[0];
  expect(enriched.minutes).toEqual(plain.minutes);
  expect(enriched.amounts).toEqual(plain.amounts);
  expect(enriched.total).toBe(plain.total);
});

test('rechaza campos vacíos, repetidos o con números no finitos', () => {
  for (const fields of [[{ name: '', value: 'x' }], [{ name: 'Grúa', value: '' }], [{ name: 'Grúa', value: '19' }, { name: ' grúa ', value: '20' }], [{ name: 'N', value: Infinity }]]) {
    expect(validateRecords([{ ...shift, fields }], []).length).toBeGreaterThan(0);
  }
});

test('valida límites de plantilla: nombre, hora y duración de 1 minuto a 24 horas', () => {
  const template = { id: 't', name: 'Día', startTime: '06:00', durationMinutes: 1 };
  expect(validateTemplate(template)).toEqual([]);
  expect(validateTemplate({ ...template, durationMinutes: 1440 })).toEqual([]);
  for (const patch of [{ name: '' }, { startTime: '24:00' }, { durationMinutes: 0 }, { durationMinutes: 1441 }, { durationMinutes: 1.5 }]) expect(validateTemplate({ ...template, ...patch }).length).toBeGreaterThan(0);
});

test('límites de 20 campos, nombre 80, valor 500 y nota 1000', () => {
  const fields = Array.from({ length: 20 }, (_, i) => ({ name: `Campo ${i}`, value: 'x' }));
  expect(validateRecords([{ ...shift, fields, note: 'x'.repeat(1000) }], [])).toEqual([]);
  expect(validateRecords([{ ...shift, fields: [...fields, { name: 'Extra', value: 'x' }] }], []).length).toBeGreaterThan(0);
  expect(validateRecords([{ ...shift, note: 'x'.repeat(1001) }], []).length).toBeGreaterThan(0);
  expect(validateRecords([{ ...shift, fields: [{ name: 'x'.repeat(81), value: 'x' }] }], []).length).toBeGreaterThan(0);
  expect(validateRecords([{ ...shift, fields: [{ name: 'x', value: 'x'.repeat(501) }] }], []).length).toBeGreaterThan(0);
});

test('cobertura rechaza periodos inválidos o invertidos', () => {
  expect(() => recordCoverage([], [], { start: '2026-02-30', end: '2026-03-01' })).toThrow();
  expect(() => recordCoverage([], [], { start: '2026-03-02', end: '2026-03-01' })).toThrow();
});

test('cobertura atraviesa fin de año sin contar registros fuera del periodo', () => {
  expect(recordCoverage([], [{ ...rest, date: '2026-12-31' }, { ...rest, id: '2', date: '2027-01-01' }, rest], { start: '2026-12-31', end: '2027-01-02' })).toEqual({ registered: 2, total: 3, missingDates: ['2027-01-02'] });
});

test('acumulado muestra solo horas y adicionales del periodo, sin básico ni deducciones', () => {
  const accrued = accruedForPeriod([{ id: 'x', start: '2026-10-01T06:00', end: '2026-10-01T18:00' }], { ...DEFAULT_SETTINGS, baseSalary: 2100000 }, { start: '2026-10-01', end: '2026-10-15' });
  expect(accrued).toEqual({ shiftCount: 1, totalMinutes: 720, extraMinutes: 240, surcharges: 0, extras: 50000 });
});

test('cobertura cuenta días de inicio y novedades, no infiere descansos ni duplica jornadas', () => {
  const coverage = recordCoverage([shift, { id: 'x', start: '2026-10-25T06:00', end: '2026-10-25T10:00' }], [rest], { start: '2026-10-25', end: '2026-10-27' });
  expect(coverage).toEqual({ registered: 2, total: 3, missingDates: ['2026-10-27'] });
});
