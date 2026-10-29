import { hasYearlyParams } from '@/domain/legal-params';
import { basicPayDetail, payEstimate, SICK_DAY_PCT } from '@/domain/payroll';
import { accruedForPeriod, recordCoverage } from '@/domain/records';
import { computeShifts } from '@/domain/shift-calc';
import type { AppData, PeriodRange } from '@/domain/types';
import { formatCOP, formatMinutes, formatPeriod } from '@/lib/format';
import { NOVELTY_LABELS } from '@/lib/record-form';

const escape = (value: string | number) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export function buildPeriodReport(data: AppData, period: PeriodRange): string {
  const coverage = recordCoverage(data.shifts, data.novelties, period);
  const accrued = accruedForPeriod(data.shifts, data.settings, period);
  const results = computeShifts(data.shifts, data.settings).filter((r) => r.shift.start.slice(0, 10) >= period.start && r.shift.start.slice(0, 10) <= period.end);
  const rows = results.map((r) => `<tr><td>${escape(r.shift.start.replace('T', ' '))}<br>${escape(r.shift.end.replace('T', ' '))}</td><td>${escape(formatMinutes(r.totalMinutes))}</td><td>${escape(formatMinutes(r.extraMinutes))}</td><td>${escape(formatCOP(r.surchargeTotal))}</td><td>${escape(formatCOP(r.extraTotal))}</td><td>${(r.shift.fields ?? []).map((f) => `${escape(f.name)}: ${escape(f.value)}`).join('<br>')}${r.shift.note ? `<p>${escape(r.shift.note)}</p>` : ''}</td></tr>`).join('');
  const novelties = data.novelties.filter((n) => n.date >= period.start && n.date <= period.end).map((n) => `<li>${escape(n.date)} — ${escape(NOVELTY_LABELS[n.kind])}${n.note ? `: ${escape(n.note)}` : ''}</li>`).join('');
  const basic = basicPayDetail(results, data.novelties, data.settings, period);
  const extraIncome = data.settings.extraIncome?.[period.start] ?? 0;
  const ym = period.start.slice(0, 7);
  const monthExtraIncome = (data.settings.extraIncome?.[`${ym}-01`] ?? 0) + (data.settings.extraIncome?.[`${ym}-16`] ?? 0);
  const estimate = payEstimate(results, data.novelties, data.settings, period, extraIncome, monthExtraIncome);
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>TurnosApp — acumulados</title><style>
    @page { margin: 22px; } body { font: 12px sans-serif; color: #111418; } h1 { font-size: 22px; } h2 { font-size: 16px; }
    table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    thead { display: table-header-group; } tr { break-inside: avoid; } .notice { padding: 12px; background: #f1f5f9; } p, li { white-space: pre-wrap; }
    </style></head><body><h1>TurnosApp — informe de acumulados</h1><p>${escape(formatPeriod(period.start, period.end))}</p>
    <p class="notice">${coverage.missingDates.length ? 'Periodo incompleto' : 'Registros completos'} · Valores informativos. La liquidación mostrada es una estimación y puede diferir de la nómina oficial. No es un respaldo restaurable.</p>
    <h2>Acumulado de turnos registrados</h2><p>Horas: ${escape(formatMinutes(accrued.totalMinutes))} · Horas extra: ${escape(formatMinutes(accrued.extraMinutes))}</p>
    <p>Recargos: ${escape(formatCOP(accrued.surcharges))} · Extras: ${escape(formatCOP(accrued.extras))}</p>
    <h2>Salario básico del periodo</h2>
    <p>Días pagos completos: ${escape(basic.paidDays)} × ${escape(formatCOP(basic.daily))} = <b>${escape(formatCOP(basic.fullAmount))}</b>${basic.sickDays ? `<br>Incapacidad: ${escape(basic.sickDays)} ${basic.sickDays === 1 ? 'día' : 'días'} al ${SICK_DAY_PCT} % del promedio (${escape(formatCOP(basic.sickDaily))}/día) = <b>${escape(formatCOP(basic.sickAmount))}</b>` : ''}${basic.unpaidDays ? `<br>Permiso no remunerado: ${escape(basic.unpaidDays)} ${basic.unpaidDays === 1 ? 'día' : 'días'} sin pago` : ''}</p>
    <p>Básico del periodo: <b>${escape(formatCOP(basic.amount))}</b> · Recargos + extras: <b>${escape(formatCOP(accrued.surcharges + accrued.extras))}</b> · Total: <b>${escape(formatCOP(basic.amount + accrued.surcharges + accrued.extras))}</b></p>
    <h2>Liquidación estimada</h2>
    <table><thead><tr><th>Concepto</th><th>Valor</th></tr></thead><tbody>
      ${estimate.extraIncome ? `<tr><td>Ingreso adicional</td><td>${escape(formatCOP(estimate.extraIncome))}</td></tr>` : ''}
      <tr><td>Devengado del periodo</td><td>${escape(formatCOP(estimate.gross))}</td></tr>
      <tr><td>Salud (4 %)</td><td>-${escape(formatCOP(estimate.health))}</td></tr>
      <tr><td>Pensión (4 %)</td><td>-${escape(formatCOP(estimate.pension))}</td></tr>
      ${estimate.solidarityFund ? `<tr><td>Fondo de solidaridad</td><td>-${escape(formatCOP(estimate.solidarityFund))}</td></tr>` : ''}
      ${estimate.withholding ? `<tr><td>Retención en la fuente</td><td>-${escape(formatCOP(estimate.withholding))}</td></tr>` : ''}
      <tr><td><b>Neto estimado</b></td><td><b>${escape(formatCOP(estimate.net))}</b></td></tr>
    </tbody></table>
    <p>Estimado, puede diferir de la nómina oficial. FSP y retención solo en la segunda quincena (o mes completo).</p>
    <table><thead><tr><th>Entrada / salida</th><th>Horas</th><th>H. extra</th><th>Recargos</th><th>Extras</th><th>Datos opcionales</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Sin turnos registrados.</td></tr>'}</tbody></table>
    ${novelties ? `<h2>Descansos y novedades</h2><ul>${novelties}</ul><p>Descansos y permisos remunerados pagan el día completo; incapacidad paga el ${SICK_DAY_PCT} % del promedio diario devengado; permiso no remunerado no paga.</p>` : ''}
    ${hasYearlyParams(Number(period.start.slice(0, 4))) ? '' : '<p>No hay parámetros legales cargados para este año; se usan los últimos conocidos.</p>'}
    <p>Los datos adicionales no afectan los cálculos. Conserva este documento con cuidado: contiene información laboral privada.</p></body></html>`;
}
