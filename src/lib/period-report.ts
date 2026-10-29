import { hasYearlyParams } from '@/domain/legal-params';
import { basicPayDetail, liquidationTable, payEstimate, SICK_DAY_PCT } from '@/domain/payroll';
import { accruedForPeriod, recordCoverage } from '@/domain/records';
import { computeShifts } from '@/domain/shift-calc';
import type { AppData, PeriodRange } from '@/domain/types';
import { CALENDAR_KINDS, type CalendarKind } from '@/lib/calendar';
import { formatCOP, formatMinutes, formatPeriod } from '@/lib/format';
import { NOVELTY_LABELS } from '@/lib/record-form';

const escape = (value: string | number) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

// Colores semánticos del tema claro (constants/theme.ts): recargo índigo, extra verde.
const SURCHARGE_COLOR = '#4F46E5';
const EXTRA_COLOR = '#15803D';

const BASE_CSS = `
  @page { margin: 22px; } body { font: 12px sans-serif; color: #111418; } h1 { font-size: 22px; } h2 { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
  thead { display: table-header-group; } tr { break-inside: avoid; } .notice { padding: 12px; background: #f1f5f9; } p, li { white-space: pre-wrap; }
  .badge { display: inline-block; border-radius: 6px; padding: 1px 7px; font-weight: 700; }
`;

const page = (title: string, body: string) => `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${escape(title)}</title><style>${BASE_CSS}</style></head><body>${body}</body></html>`;

const badge = (kind: CalendarKind) => {
  const p = CALENDAR_KINDS[kind];
  return `<span class="badge" style="background:${p.background};color:${p.text}">${p.mark} ${escape(p.label)}</span>`;
};

const kindOf = (hourStart: number): CalendarKind => (hourStart >= 18 || hourStart < 6 ? 'night' : 'day');

const periodResults = (data: AppData, period: PeriodRange) =>
  computeShifts(data.shifts, data.settings).filter((r) => {
    const d = r.shift.start.slice(0, 10);
    return d >= period.start && d <= period.end;
  });

const estimate = (data: AppData, period: PeriodRange) => {
  const results = periodResults(data, period);
  const ym = period.start.slice(0, 7);
  const monthExtra = (data.settings.extraIncome?.[`${ym}-01`] ?? 0) + (data.settings.extraIncome?.[`${ym}-16`] ?? 0);
  return payEstimate(results, data.novelties, data.settings, period, data.settings.extraIncome?.[period.start] ?? 0, monthExtra);
};

const yearWarning = (period: PeriodRange) =>
  hasYearlyParams(Number(period.start.slice(0, 4))) ? '' : '<p>No hay parámetros legales cargados para este año; se usan los últimos conocidos.</p>';

/** PDF de turnos del periodo: planilla con los colores del calendario (D/N/L/V). */
export function buildShiftsReport(data: AppData, period: PeriodRange): string {
  const coverage = recordCoverage(data.shifts, data.novelties, period);
  const accrued = accruedForPeriod(data.shifts, data.settings, period);
  const rows = periodResults(data, period).map((r) => {
    const kind = kindOf(Number(r.shift.start.slice(11, 13)));
    return `<tr><td>${badge(kind)}<br>${escape(r.shift.start.slice(0, 10))}</td><td>${escape(r.shift.start.slice(11))} → ${escape(r.shift.end.slice(11))}</td><td>${escape(formatMinutes(r.totalMinutes))}</td><td>${escape(formatMinutes(r.extraMinutes))}</td><td style="color:${SURCHARGE_COLOR}">${escape(formatCOP(r.surchargeTotal))}</td><td style="color:${EXTRA_COLOR}">${escape(formatCOP(r.extraTotal))}</td><td>${(r.shift.fields ?? []).map((f) => `${escape(f.name)}: ${escape(f.value)}`).join('<br>')}${r.shift.note ? `<p>${escape(r.shift.note)}</p>` : ''}</td></tr>`;
  }).join('');
  const noveltyRows = data.novelties
    .filter((n) => n.date >= period.start && n.date <= period.end)
    .map((n) => `<tr><td>${badge(n.kind === 'rest' ? 'rest' : 'novelty')}<br>${escape(n.date)}</td><td colspan="2">${escape(NOVELTY_LABELS[n.kind])}</td><td colspan="4">${n.note ? escape(n.note) : ''}</td></tr>`).join('');
  const legend = Object.entries(CALENDAR_KINDS).map(([key, p]) => `<span class="badge" style="background:${p.background};color:${p.text}">${p.mark}</span> ${escape(p.label)}`).join(' · ');
  return page('TurnosApp — planilla de turnos', `
    <h1>TurnosApp — planilla de turnos</h1><p>${escape(formatPeriod(period.start, period.end))}</p>
    <p>${legend}</p>
    <p class="notice">${coverage.missingDates.length ? 'Periodo incompleto: hay días sin registrar.' : 'Registros completos.'} Informe de turnos; la liquidación está en el PDF de liquidación.</p>
    <h2>Acumulado del periodo</h2>
    <p>Horas trabajadas: <b>${escape(formatMinutes(accrued.totalMinutes))}</b> · Horas extra: <b>${escape(formatMinutes(accrued.extraMinutes))}</b></p>
    <p>Recargos: <b style="color:${SURCHARGE_COLOR}">${escape(formatCOP(accrued.surcharges))}</b> · Extras: <b style="color:${EXTRA_COLOR}">${escape(formatCOP(accrued.extras))}</b></p>
    <table><thead><tr><th>Día / tipo</th><th>Entrada → salida</th><th>Horas</th><th>H. extra</th><th>Recargos</th><th>Extras</th><th>Datos opcionales</th></tr></thead>
    <tbody>${rows}${noveltyRows}${rows || noveltyRows ? '' : '<tr><td colspan="7">Sin registros en el periodo.</td></tr>'}</tbody></table>
    ${yearWarning(period)}
    <p>Los datos adicionales no afectan los cálculos. Conserva este documento con cuidado: contiene información laboral privada.</p>`);
}

/** PDF de liquidación salarial estimada: recargos en índigo y extras en verde, como en la app. */
export function buildPayrollReport(data: AppData, period: PeriodRange): string {
  const results = periodResults(data, period);
  const basic = basicPayDetail(results, data.novelties, data.settings, period);
  const accrued = accruedForPeriod(data.shifts, data.settings, period);
  const table = liquidationTable(results, data.settings, period);
  const est = estimate(data, period);
  const isExtra = (category: string) => category.startsWith('extra');
  const factorRows = table.rows.filter((r) => r.hours > 0).map((r) => {
    const color = isExtra(r.category) ? EXTRA_COLOR : SURCHARGE_COLOR;
    return `<tr><td>${escape(r.label)} <span style="color:${color}">(× ${escape(r.factor.toFixed(2))})</span></td><td>${escape(r.hours.toFixed(2))}</td><td style="color:${color}">${escape(formatCOP(r.amount))}</td></tr>`;
  }).join('');
  return page('TurnosApp — liquidación estimada', `
    <h1>TurnosApp — liquidación estimada del periodo</h1><p>${escape(formatPeriod(period.start, period.end))}</p>
    <p class="notice">Valores informativos: la liquidación es una estimación y puede diferir de la nómina oficial.</p>
    <h2>Salario básico del periodo</h2>
    <p>Días pagos completos: ${escape(basic.paidDays)} × ${escape(formatCOP(basic.daily))} = <b>${escape(formatCOP(basic.fullAmount))}</b>${basic.sickDays ? `<br>Incapacidad: ${escape(basic.sickDays)} ${basic.sickDays === 1 ? 'día' : 'días'} al ${SICK_DAY_PCT} % del promedio (${escape(formatCOP(basic.sickDaily))}/día) = <b>${escape(formatCOP(basic.sickAmount))}</b>` : ''}${basic.unpaidDays ? `<br>Permiso no remunerado: ${escape(basic.unpaidDays)} ${basic.unpaidDays === 1 ? 'día' : 'días'} sin pago` : ''}</p>
    <p>Básico del periodo: <b>${escape(formatCOP(basic.amount))}</b></p>
    <h2>Recargos y extras</h2>
    <table><thead><tr><th>Concepto (factor)</th><th>Horas</th><th>Valor</th></tr></thead>
    <tbody>${factorRows || '<tr><td colspan="3">Sin recargos ni extras en el periodo.</td></tr>'}
      <tr><td><b>Total recargos + extras</b></td><td><b>${escape(formatMinutes(table.workedMinutes))} trabajadas</b></td><td><b>${escape(formatCOP(table.totalAmount))}</b></td></tr>
    </tbody></table>
    <h2>Liquidación estimada</h2>
    <table><thead><tr><th>Concepto</th><th>Valor</th></tr></thead><tbody>
      <tr><td>Básico + recargos + extras</td><td>${escape(formatCOP(basic.amount + accrued.surcharges + accrued.extras))}</td></tr>
      ${est.extraIncome ? `<tr><td>Ingreso adicional (bonificación)</td><td>${escape(formatCOP(est.extraIncome))}</td></tr>` : ''}
      <tr><td>Devengado del periodo</td><td><b>${escape(formatCOP(est.gross))}</b></td></tr>
      <tr><td>Salud (4 %)</td><td>-${escape(formatCOP(est.health))}</td></tr>
      <tr><td>Pensión (4 %)</td><td>-${escape(formatCOP(est.pension))}</td></tr>
      ${est.solidarityFund ? `<tr><td>Fondo de solidaridad</td><td>-${escape(formatCOP(est.solidarityFund))}</td></tr>` : ''}
      ${est.withholding ? `<tr><td>Retención en la fuente</td><td>-${escape(formatCOP(est.withholding))}</td></tr>` : ''}
      <tr><td><b>Neto estimado</b></td><td><b>${escape(formatCOP(est.net))}</b></td></tr>
    </tbody></table>
    <p>Estimado, puede diferir de la nómina oficial. FSP y retención solo en la segunda quincena (o mes completo). Descansos y permisos remunerados pagan el día completo; incapacidad paga el ${SICK_DAY_PCT} % del promedio diario devengado; permiso no remunerado no paga.</p>
    ${yearWarning(period)}
    <p>Conserva este documento con cuidado: contiene información laboral privada.</p>`);
}

/** PDF de respaldo: portada distinta que acompaña al JSON incrustado tras %%EOF (D-033). */
export function buildBackupReport(data: AppData, exportedAt: string): string {
  const dates = data.shifts.map((s) => s.start.slice(0, 10)).sort();
  const first = dates[0], last = dates[dates.length - 1];
  return page('TurnosApp — respaldo', `
    <h1>Respaldo de TurnosApp</h1>
    <p class="notice">Este PDF es tu <b>respaldo restaurable</b>: lleva todos tus datos incrustados de forma invisible. Para restaurarlo instala TurnosApp y usa <b>"Ya tengo un respaldo"</b> en la configuración inicial o <b>Ajustes → Datos → Restaurar desde PDF</b>.</p>
    <h2>Contenido del respaldo</h2>
    <table><tbody>
      <tr><td>Exportado</td><td>${escape(exportedAt)}</td></tr>
      <tr><td>Turnos</td><td>${escape(data.shifts.length)}</td></tr>
      <tr><td>Novedades</td><td>${escape(data.novelties.length)}</td></tr>
      <tr><td>Plantillas</td><td>${escape(data.templates.length)}</td></tr>
      <tr><td>Rango</td><td>${first ? `${escape(first)} a ${escape(last!)}` : 'Sin turnos'}</td></tr>
      <tr><td>Salario base</td><td>${escape(formatCOP(data.settings.baseSalary))}</td></tr>
    </tbody></table>
    <p>Guárdalo en un lugar seguro (Archivos, Drive, correo). Contiene toda tu información laboral: compártelo solo contigo.</p>`);
}
