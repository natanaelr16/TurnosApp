import { DEFAULT_SETTINGS } from '@/domain/defaults';
import type { AppData } from '@/domain/types';
import { buildPeriodReport } from '../period-report';

const data: AppData = { settings: { ...DEFAULT_SETTINGS, baseSalary: 2100000 }, templates: [], novelties: [], shifts: [
  { id: '1', start: '2026-10-01T06:00', end: '2026-10-01T18:00', fields: [{ name: 'Grúa', value: 'RTG19' }] },
  { id: '2', start: '2026-11-01T06:00', end: '2026-11-01T18:00', note: 'FUERA_DEL_PERIODO' },
] };
const period = { start: '2026-10-01', end: '2026-10-15' };

test('exporta el periodo seleccionado con sus importes reales y liquidación estimada', () => {
  const html = buildPeriodReport(data, period);
  expect(html).toContain('RTG19');
  expect(html).toContain('50.000');
  expect(html).not.toContain('FUERA_DEL_PERIODO');
  expect(html).toContain('Periodo incompleto');
  expect(html).toContain('No es un respaldo restaurable');
  expect(html).toContain('Neto estimado');
  expect(html).toContain('estimación');
});

test('escapa nombres, campos y notas para que no se ejecuten como HTML', () => {
  const html = buildPeriodReport({ ...data, shifts: [{ ...data.shifts[0], note: '<script>alert(1)</script>', fields: [{ name: '<img src=x>', value: '" onerror="x' }] }] }, period);
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<img src=x>');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('&quot;');
});
