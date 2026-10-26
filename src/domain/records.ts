import { computeShifts, validateShifts } from './shift-calc';
import { dateFromDayNumber, datePart, dayNumber, toEpochMinutes } from './time';
import { NOVELTY_KINDS, type Novelty, type PeriodRange, type Settings, type Shift, type ShiftTemplate } from './types';

export function isLocalDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number(value.slice(0, 4)) >= 1000 && dateFromDayNumber(dayNumber(value)) === value;
}

export function isLocalDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) && isLocalDate(datePart(value));
}

export function applyTemplate(date: string, template: ShiftTemplate): Pick<Shift, 'start' | 'end'> {
  const start = `${date}T${template.startTime}`;
  const endMinutes = toEpochMinutes(start) + template.durationMinutes;
  const minute = ((endMinutes % 1440) + 1440) % 1440;
  const end = `${dateFromDayNumber(Math.floor(endMinutes / 1440))}T${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  return { start, end };
}

export function validateTemplate(template: ShiftTemplate): string[] {
  return !template.id.trim() || !template.name.trim() || template.name.length > 80 ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(template.startTime) || !Number.isInteger(template.durationMinutes) || template.durationMinutes < 1 || template.durationMinutes > 1440
    ? ['La plantilla necesita nombre, hora válida y duración entre 1 minuto y 24 horas.'] : [];
}

export function validateRecords(shifts: Shift[], novelties: Novelty[]): string[] {
  const errors: string[] = [];
  if (new Set(shifts.map((s) => s.id)).size !== shifts.length || new Set(novelties.map((n) => n.id)).size !== novelties.length) errors.push('Hay identificadores repetidos.');
  for (const s of shifts) {
    if (!s.id.trim() || !isLocalDateTime(s.start) || !isLocalDateTime(s.end)) errors.push('Revisa las fechas y horas del turno.');
    if ((s.note?.length ?? 0) > 1000) errors.push('La nota admite hasta 1000 caracteres.');
    const fields = s.fields ?? [];
    if (fields.length > 20) errors.push('Puedes añadir hasta 20 campos por turno.');
    if (fields.some((f) => !f.name.trim() || f.name.length > 80 || (typeof f.value === 'number' ? !Number.isFinite(f.value) : !f.value.trim() || f.value.length > 500))) errors.push('Cada campo necesita nombre y valor válido (máximo 80 y 500 caracteres).');
    if (new Set(fields.map((f) => f.name.trim().toLocaleLowerCase('es'))).size !== fields.length) errors.push('Los nombres de los campos no deben repetirse en el turno.');
  }
  if (!errors.length) {
    const messages = { FIN_ANTES_DE_INICIO: 'La salida debe ser posterior a la entrada.', DURACION_EXCESIVA: 'Un turno no puede superar 24 horas.', SUPERPUESTO: 'El turno se superpone con otro registrado.' };
    for (const e of validateShifts(shifts)) errors.push(messages[e.code]);
  }
  const dates = new Set<string>();
  for (const n of novelties) {
    if (!n.id.trim() || !isLocalDate(n.date) || !NOVELTY_KINDS.includes(n.kind)) errors.push('Revisa la fecha y el tipo de novedad.');
    if ((n.note?.length ?? 0) > 1000) errors.push('La nota admite hasta 1000 caracteres.');
    if (dates.has(n.date)) errors.push('Ya existe una novedad en esa fecha.');
    dates.add(n.date);
    if (shifts.some((s) => datePart(s.start) === n.date)) errors.push('No puedes registrar una novedad de jornada completa y un turno con la misma fecha de inicio.');
  }
  return [...new Set(errors)];
}

export function accruedForPeriod(shifts: Shift[], settings: Settings, period: PeriodRange) {
  const results = computeShifts(shifts, settings).filter((r) => datePart(r.shift.start) >= period.start && datePart(r.shift.start) <= period.end);
  return results.reduce((sum, r) => ({
    shiftCount: sum.shiftCount + 1,
    totalMinutes: sum.totalMinutes + r.totalMinutes,
    extraMinutes: sum.extraMinutes + r.extraMinutes,
    surcharges: sum.surcharges + r.surchargeTotal,
    extras: sum.extras + r.extraTotal,
  }), { shiftCount: 0, totalMinutes: 0, extraMinutes: 0, surcharges: 0, extras: 0 });
}

export function recordCoverage(shifts: Shift[], novelties: Novelty[], period: PeriodRange) {
  if (!isLocalDate(period.start) || !isLocalDate(period.end) || period.start > period.end) throw new Error('El periodo debe tener fechas válidas y estar en orden.');
  const registeredDates = new Set([...shifts.map((s) => datePart(s.start)), ...novelties.map((n) => n.date)]);
  const missingDates: string[] = [];
  let total = 0;
  const last = dayNumber(period.end);
  for (let day = dayNumber(period.start); day <= last; day++) {
    total++;
    const date = dateFromDayNumber(day);
    if (!registeredDates.has(date)) missingDates.push(date);
  }
  return { registered: total - missingDates.length, total, missingDates };
}
