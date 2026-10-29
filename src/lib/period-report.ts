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
  .badge { display: inline-block; border-radius: 6px; padding: 1px 7px; font-weight: 700; white-space: nowrap; }
  .num { white-space: nowrap; overflow-wrap: normal; text-align: right; } b, td b { white-space: nowrap; }
`;

const isMonthSpan = (period: PeriodRange) => Number(period.end.slice(8, 10)) - Number(period.start.slice(8, 10)) + 1 > 16;

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
  const own = isMonthSpan(period) ? monthExtra : (data.settings.extraIncome?.[period.start] ?? 0);
  return payEstimate(results, data.novelties, data.settings, period, own, monthExtra);
};

const yearWarning = (period: PeriodRange) =>
  hasYearlyParams(Number(period.start.slice(0, 4))) ? '' : '<p>No hay parámetros legales cargados para este año; se usan los últimos conocidos.</p>';

/** PDF de turnos del periodo: planilla con los colores del calendario (D/N/L/V). */
export function buildShiftsReport(data: AppData, period: PeriodRange): string {
  const coverage = recordCoverage(data.shifts, data.novelties, period);
  const accrued = accruedForPeriod(data.shifts, data.settings, period);
  const rows = periodResults(data, period).map((r) => {
    const kind = kindOf(Number(r.shift.start.slice(11, 13)));
    return `<tr><td class="num">${badge(kind)}<br>${escape(r.shift.start.slice(0, 10))}</td><td class="num">${escape(r.shift.start.slice(11))} → ${escape(r.shift.end.slice(11))}</td><td class="num">${escape(formatMinutes(r.totalMinutes))}</td><td class="num">${escape(formatMinutes(r.extraMinutes))}</td><td class="num" style="color:${SURCHARGE_COLOR}">${escape(formatCOP(r.surchargeTotal))}</td><td class="num" style="color:${EXTRA_COLOR}">${escape(formatCOP(r.extraTotal))}</td><td>${(r.shift.fields ?? []).map((f) => `${escape(f.name)}: ${escape(f.value)}`).join('<br>')}${r.shift.note ? `<p>${escape(r.shift.note)}</p>` : ''}</td></tr>`;
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
    return `<tr><td>${escape(r.label)} <span style="color:${color};white-space:nowrap">(× ${escape(r.factor.toFixed(2))})</span></td><td class="num">${escape(r.hours.toFixed(2))}</td><td class="num" style="color:${color}">${escape(formatCOP(r.amount))}</td></tr>`;
  }).join('');
  const lastFraction = isMonthSpan(period) || data.settings.payPeriod === 'mensual' || Number(period.start.slice(8, 10)) >= 16;
  const money = (v: number) => `<td class="num">${escape(formatCOP(v))}</td>`;
  const minus = (v: number) => `<td class="num">-${escape(formatCOP(v))}</td>`;
  const tail = (v: number) => (lastFraction ? minus(v) : '<td class="num">2ª quincena</td>');
  return page('TurnosApp — liquidación estimada', `
    <h1>TurnosApp — liquidación estimada del periodo</h1><p>${escape(formatPeriod(period.start, period.end))}</p>
    <p class="notice">Valores informativos: la liquidación es una estimación y puede diferir de la nómina oficial.</p>
    <h2>Salario básico del periodo</h2>
    <p>Días pagos completos: ${escape(basic.paidDays)} × ${escape(formatCOP(basic.daily))} = <b>${escape(formatCOP(basic.fullAmount))}</b>${basic.sickDays ? `<br>Incapacidad: ${escape(basic.sickDays)} ${basic.sickDays === 1 ? 'día' : 'días'} al ${SICK_DAY_PCT} % del promedio (${escape(formatCOP(basic.sickDaily))}/día) = <b>${escape(formatCOP(basic.sickAmount))}</b>` : ''}${basic.unpaidDays ? `<br>Permiso no remunerado: ${escape(basic.unpaidDays)} ${basic.unpaidDays === 1 ? 'día' : 'días'} sin pago` : ''}</p>
    <p>Salario básico: <b>${escape(formatCOP(basic.fullAmount))}</b>${basic.sickDays ? ` · Incapacidad (aparte): <b>${escape(formatCOP(basic.sickAmount))}</b>` : ''}</p>
    <h2>Recargos y extras</h2>
    <table><thead><tr><th>Concepto (factor)</th><th>Horas</th><th>Valor</th></tr></thead>
    <tbody>${factorRows || '<tr><td colspan="3">Sin recargos ni extras en el periodo.</td></tr>'}
      <tr><td><b>Total recargos + extras</b></td><td class="num"><b>${escape(formatMinutes(table.workedMinutes))}</b></td><td class="num"><b>${escape(formatCOP(table.totalAmount))}</b></td></tr>
    </tbody></table>
    <h2>Liquidación estimada</h2>
    <table><thead><tr><th>Concepto</th><th class="num">Valor</th></tr></thead><tbody>
      <tr><td>Salario básico</td>${money(basic.fullAmount)}</tr>
      ${basic.sickDays ? `<tr><td>Incapacidad (${escape(basic.sickDays)} ${basic.sickDays === 1 ? 'día' : 'días'} al ${SICK_DAY_PCT} % del promedio)</td>${money(basic.sickAmount)}</tr>` : ''}
      <tr><td>Recargos + extras</td>${money(accrued.surcharges + accrued.extras)}</tr>
      ${est.transportAllowance ? `<tr><td>Auxilio de transporte</td>${money(est.transportAllowance)}</tr>` : ''}
      ${est.extraIncome ? `<tr><td>Ingreso adicional (bonificación)</td>${money(est.extraIncome)}</tr>` : ''}
      <tr><td><b>Devengado del periodo</b></td><td class="num"><b>${escape(formatCOP(est.gross))}</b></td></tr>
      <tr><td>Salud (4 %)</td>${minus(est.health)}</tr>
      <tr><td>Pensión (4 %)</td>${minus(est.pension)}</tr>
      <tr><td>Fondo de solidaridad</td>${tail(est.solidarityFund)}</tr>
      <tr><td>Retención en la fuente</td>${tail(est.withholding)}</tr>
      <tr><td><b>Neto estimado</b></td><td class="num"><b>${escape(formatCOP(est.net))}</b></td></tr>
    </tbody></table>
    ${lastFraction ? '' : `<p>Proyección de fin de mes con lo registrado: fondo de solidaridad <b>${escape(formatCOP(est.monthSolidarityFund ?? 0))}</b> · retención en la fuente <b>${escape(formatCOP(est.monthWithholding ?? 0))}</b> (se descuentan en la segunda quincena).</p>`}
    <p>IBC del mes: <b>${escape(formatCOP(est.monthBase ?? 0))}</b> — fondo de solidaridad desde ${escape(formatCOP(est.fspThreshold ?? 0))} (4 salarios mínimos). Base gravable: <b>${escape(Math.round(est.taxableUvt ?? 0))} UVT</b> — retención desde 95 UVT.</p>
    <p>Estimado, puede diferir de la nómina oficial. Fondo de solidaridad y retención se liquidan en la segunda quincena (o en el mes completo) sobre el mes real, según la Ley 797 de 2003 y el Art. 383 del Estatuto Tributario. Descansos y permisos remunerados pagan el día completo; incapacidad paga el ${SICK_DAY_PCT} % del promedio diario devengado; permiso no remunerado no paga.</p>
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
