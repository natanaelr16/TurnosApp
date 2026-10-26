import { hasYearlyParams } from '@/domain/legal-params';
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
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>TurnosApp — acumulados</title><style>
    @page { margin: 22px; } body { font: 12px sans-serif; color: #111418; } h1 { font-size: 22px; } h2 { font-size: 16px; }
    table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    thead { display: table-header-group; } tr { break-inside: avoid; } .notice { padding: 12px; background: #f1f5f9; } p, li { white-space: pre-wrap; }
    </style></head><body><h1>TurnosApp — informe de acumulados</h1><p>${escape(formatPeriod(period.start, period.end))}</p>
    <p class="notice">${coverage.missingDates.length ? 'Periodo incompleto' : 'Registros completos'} · Valores informativos. No incluye liquidación salarial neta, aportes ni retención. El cálculo de novedades y descuentos mensuales aún está pendiente. No es un respaldo restaurable.</p>
    <h2>Acumulado de turnos registrados</h2><p>Horas: ${escape(formatMinutes(accrued.totalMinutes))} · Horas extra: ${escape(formatMinutes(accrued.extraMinutes))}</p>
    <p>Recargos: ${escape(formatCOP(accrued.surcharges))} · Extras: ${escape(formatCOP(accrued.extras))}</p>
    <table><thead><tr><th>Entrada / salida</th><th>Horas</th><th>H. extra</th><th>Recargos</th><th>Extras</th><th>Datos opcionales</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Sin turnos registrados.</td></tr>'}</tbody></table>
    ${novelties ? `<h2>Descansos y novedades</h2><ul>${novelties}</ul><p>Descansos incluidos en el básico. Ajustes salariales por permisos/incapacidad no calculados.</p>` : ''}
    ${hasYearlyParams(Number(period.start.slice(0, 4))) ? '' : '<p>No hay parámetros legales cargados para este año; se usan los últimos conocidos.</p>'}
    <p>Los campos opcionales no afectan los cálculos. Conserva este documento con cuidado: contiene información laboral privada.</p></body></html>`;
}
