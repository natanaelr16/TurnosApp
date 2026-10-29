import { DEFAULT_SETTINGS } from '@/domain/defaults';
import type { AppData } from '@/domain/types';
import { buildBackupReport, buildPayrollReport, buildShiftsReport } from '../period-report';

const data: AppData = { settings: { ...DEFAULT_SETTINGS, baseSalary: 2100000 }, templates: [], novelties: [], shifts: [
  { id: '1', start: '2026-10-01T06:00', end: '2026-10-01T18:00', fields: [{ name: 'Grúa', value: 'RTG19' }] },
  { id: '2', start: '2026-11-01T06:00', end: '2026-11-01T18:00', note: 'FUERA_DEL_PERIODO' },
] };
const period = { start: '2026-10-01', end: '2026-10-15' };

describe('PDF de turnos', () => {
  test('exporta el periodo con badges de color del calendario', () => {
    const html = buildShiftsReport(data, period);
    expect(html).toContain('RTG19');
    expect(html).toContain('badge');
    expect(html).toContain('Periodo incompleto');
    expect(html).not.toContain('FUERA_DEL_PERIODO');
    expect(html).not.toContain('Neto estimado');
  });
});

describe('PDF de liquidación estimada', () => {
  test('incluye básico, factores coloreados, deducciones y neto', () => {
    const conNoche = { ...data, shifts: [...data.shifts, { id: '3', start: '2026-10-02T18:00', end: '2026-10-03T06:00' }] };
    const html = buildPayrollReport(conNoche, period);
    expect(html).toContain('Neto estimado');
    expect(html).toContain('Salud (4 %)');
    expect(html).toContain('#4F46E5'); // recargos índigo
    expect(html).toContain('#15803D'); // extras verde
    expect(html).toContain('estimación');
  });
});

describe('PDF de respaldo', () => {
  test('portada distinta con instrucciones de restauración', () => {
    const html = buildBackupReport(data, '2026-10-28T12:00:00Z');
    expect(html).toContain('Respaldo de TurnosApp');
    expect(html).toContain('Restaurar desde PDF');
    expect(html).toContain('2.100.000');
  });
});

test('escapa nombres, campos y notas para que no se ejecuten como HTML', () => {
  const html = buildShiftsReport({ ...data, shifts: [{ ...data.shifts[0], note: '<script>alert(1)</script>', fields: [{ name: '<img src=x>', value: '" onerror="x' }] }] }, period);
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<img src=x>');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('&quot;');
});
