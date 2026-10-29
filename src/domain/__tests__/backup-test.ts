import { BACKUP_FORMAT, createBackup, mergeShifts, parseBackup } from '@/domain/backup';
import { DEFAULT_SETTINGS, DEFAULT_TEMPLATES } from '@/domain/defaults';
import type { AppData } from '@/domain/types';

const data: AppData = {
  settings: { ...DEFAULT_SETTINGS, baseSalary: 4_453_128, onboardingCompletedAt: '2026-10-24T10:00:00.000Z' },
  shifts: [
    { id: 'b', start: '2026-10-03T18:00', end: '2026-10-04T06:00' },
    { id: 'a', start: '2026-10-01T06:00', end: '2026-10-01T18:00', note: 'Turno día' },
  ],
  templates: DEFAULT_TEMPLATES,
  novelties: [],
};

describe('respaldo embebido en PDF (D-014)', () => {
  test('ida y vuelta conserva todos los datos', () => {
    const r = parseBackup(createBackup(data, '2026-10-24T12:00:00.000Z'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.data).toEqual(data);
    expect(r.backup.format).toBe(BACKUP_FORMAT);
    expect(r.summary).toEqual({
      shiftCount: 2,
      firstDate: '2026-10-01',
      lastDate: '2026-10-03',
      baseSalary: 4_453_128,
      exportedAt: '2026-10-24T12:00:00.000Z',
    });
  });

  test('conserva campos nuevos: bonificaciones, periodos cerrados y formato de hora', () => {
    const conExtras: AppData = {
      ...data,
      settings: {
        ...data.settings,
        timeFormat: '12h',
        extraIncome: { '2026-10-01': 792_657 },
        closedPeriods: ['2026-10-01'],
      },
    };
    const r = parseBackup(createBackup(conExtras, '2026-10-25T12:00:00Z'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.backup.data).toEqual(conExtras);
  });

  test('migra formato 1 a 2 sin perder turnos antiguos', () => {
    const raw = JSON.parse(createBackup(data, '2026-10-25T12:00:00Z'));
    raw.format = 1;
    delete raw.data.novelties;
    const result = parseBackup(JSON.stringify(raw));
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.backup.format).toBe(2); expect(result.backup.data).toEqual(data); }
  });

  test('rechaza campos informativos inválidos y novedades en conflicto', () => {
    const raw = JSON.parse(createBackup(data, '2026-10-25T12:00:00Z'));
    raw.data.shifts[0].fields = [{ name: 'Grúa', value: {} }];
    expect(parseBackup(JSON.stringify(raw)).ok).toBe(false);
    delete raw.data.shifts[0].fields;
    raw.data.novelties = [{ id: 'n', date: '2026-10-03', kind: 'rest' }];
    expect(parseBackup(JSON.stringify(raw)).ok).toBe(false);
  });

  test('texto que no es JSON', () => {
    expect(parseBackup('%PDF-1.7 basura')).toEqual({ ok: false, error: 'JSON_INVALIDO' });
  });

  test('JSON de otra aplicación', () => {
    expect(parseBackup(JSON.stringify({ hola: 1 }))).toEqual({ ok: false, error: 'NO_ES_RESPALDO' });
  });

  test('respaldo de una versión más nueva de la app', () => {
    const futuro = JSON.parse(createBackup(data, '2026-10-24T12:00:00.000Z'));
    futuro.format = BACKUP_FORMAT + 1;
    expect(parseBackup(JSON.stringify(futuro))).toEqual({ ok: false, error: 'VERSION_NO_SOPORTADA' });
  });

  test.each([
    ['salario negativo', (b: any) => (b.data.settings.baseSalary = -1)],
    ['fecha mal formada', (b: any) => (b.data.shifts[0].start = '2026-10-03 18:00')],
    ['turno con fin antes del inicio', (b: any) => (b.data.shifts[0].end = '2026-10-03T17:00')],
    ['periodo de pago desconocido', (b: any) => (b.data.settings.payPeriod = 'semanal')],
    ['plantilla sin duración', (b: any) => delete b.data.templates[0].durationMinutes],
    ['auxilio sin enabled', (b: any) => (b.data.settings.transportAllowance = {})],
  ])('rechaza datos inválidos: %s', (_nombre, dañar) => {
    const b = JSON.parse(createBackup(data, '2026-10-24T12:00:00.000Z'));
    dañar(b);
    expect(parseBackup(JSON.stringify(b))).toEqual({ ok: false, error: 'DATOS_INVALIDOS' });
  });
});

describe('combinar turnos al restaurar', () => {
  test('agrega los nuevos, conserva los existentes y omite los que se superponen', () => {
    const existentes = [{ id: 'x', start: '2026-10-01T06:00', end: '2026-10-01T18:00' }];
    const r = mergeShifts(existentes, [
      { id: 'a', start: '2026-10-01T06:00', end: '2026-10-01T18:00' }, // se superpone con x
      { id: 'x', start: '2026-10-01T06:00', end: '2026-10-01T18:00' }, // mismo id: ya existe
      { id: 'c', start: '2026-10-05T06:00', end: '2026-10-05T18:00' },
    ]);
    expect(r.shifts.map((s) => s.id)).toEqual(['x', 'c']);
    expect(r.skipped.map((s) => s.id)).toEqual(['a']);
  });
});
