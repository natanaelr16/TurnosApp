import { DEFAULT_SETTINGS } from '@/domain/defaults';
import { payEstimate } from '@/domain/payroll';
import { computeShifts } from '@/domain/shift-calc';
import type { AppData } from '@/domain/types';
import { formatCOP } from '@/lib/format';
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
  test('turnos y novedades van mezclados en orden de fecha', () => {
    const mezcla: AppData = { ...data,
      shifts: [
        { id: '1', start: '2026-10-01T06:00', end: '2026-10-01T18:00' },
        { id: '2', start: '2026-10-10T06:00', end: '2026-10-10T18:00' },
      ],
      novelties: [{ id: 'n1', date: '2026-10-05', kind: 'sick' }] };
    const html = buildShiftsReport(mezcla, period);
    const i1 = html.indexOf('2026-10-01'), iN = html.indexOf('2026-10-05'), i2 = html.indexOf('2026-10-10');
    expect(i1).toBeGreaterThan(-1);
    expect(i1).toBeLessThan(iN);
    expect(iN).toBeLessThan(i2);
  });
});

describe('PDF de liquidación estimada', () => {
  test('la 2ª quincena usa el mes completo para FSP/retención (no solo sus turnos)', () => {
    const alta = { ...data, settings: { ...data.settings, baseSalary: 14_000_000 }, shifts: Array.from({ length: 20 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return { id: `s${i}`, start: `2026-10-${day}T06:00`, end: `2026-10-${day}T18:00` };
    }) };
    const q2 = { start: '2026-10-16', end: '2026-10-31' };
    const esperada = payEstimate(computeShifts(alta.shifts, alta.settings), [], alta.settings, q2).withholding;
    expect(esperada).toBeGreaterThan(0);
    const html = buildPayrollReport(alta, q2);
    expect(html).toContain(`-${formatCOP(esperada)}`);
  });
  test('muestra la bonificación de la otra quincena cuando ya se devengó', () => {
    const conBono = { ...data, settings: { ...data.settings, extraIncome: { '2026-10-01': 500_000 } } };
    const html = buildPayrollReport(conBono, { start: '2026-10-16', end: '2026-10-31' });
    expect(html).toContain('otra quincena');
    expect(html).toContain('500.000');
  });
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

describe('PDF de liquidación de mes completo (D-036)', () => {
  test('suma bonificaciones de ambas quincenas, muestra siempre FSP/retención y no parte los valores', () => {
    const conBonos = { ...data, settings: { ...data.settings, extraIncome: { '2026-10-01': 100_000, '2026-10-16': 200_000 } } };
    const html = buildPayrollReport(conBonos, { start: '2026-10-01', end: '2026-10-31' });
    expect(html).toContain('300.000');
    expect(html).toContain('Fondo de solidaridad');
    expect(html).toContain('Retención en la fuente');
    expect(html).toContain('class="num"');
    expect(html).not.toContain('2ª quincena</td>');
  });
});

describe('PDF de liquidación: incapacidad aparte y proyección', () => {
  test('la incapacidad va en su propia fila, sin sumarse al básico, y la 1ª quincena proyecta FSP/retención', () => {
    const conIncap = { ...data, novelties: [{ id: 'n1', date: '2026-10-05', kind: 'sick' as const }] };
    const html = buildPayrollReport(conIncap, period);
    expect(html).toContain('Incapacidad (1 día al 75 % del promedio)');
    expect(html).toContain('Proyección de fin de mes');
    expect(html).toContain('IBC del mes');
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
