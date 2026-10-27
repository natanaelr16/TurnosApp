import { makeDate } from '@/domain/time';
import type { Novelty, Shift } from '@/domain/types';

export const NOVELTY_LABELS: Record<Novelty['kind'], string> = {
  rest: 'Descanso remunerado',
  'paid-leave': 'Permiso remunerado',
  'unpaid-leave': 'Permiso no remunerado',
  sick: 'Incapacidad',
};

export const WARNING_LABELS: Record<string, string> = {
  EXTRA_DIARIO_EXCEDIDO: 'Aviso: más de 2 horas extra en la jornada.',
  EXTRA_SEMANAL_EXCEDIDO: 'Aviso: más de 12 horas extra en la semana.',
};

export interface FieldDraft { id: string; name: string; value: string; type: 'text' | 'number' }

export function fieldsFromDraft(fields: FieldDraft[]): NonNullable<Shift['fields']> {
  return fields.map((field) => {
    if (field.type === 'number' && (!/^-?\d+(?:[.,]\d+)?$/.test(field.value.trim()) || !Number.isFinite(Number(field.value.replace(',', '.'))))) {
      throw new Error(`Ingresa un número válido para ${field.name || 'el campo'}.`);
    }
    return { name: field.name.trim(), value: field.type === 'number' ? Number(field.value.replace(',', '.')) : field.value.trim() };
  });
}

export function pickerFromLocal(value: string): Date {
  const [year, month, day, hour, minute] = value.split(/[-T:]/).map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

export function localFromPicker(date: Date): string {
  return `${makeDate(date.getFullYear(), date.getMonth() + 1, date.getDate())}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
