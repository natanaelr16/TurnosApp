import type { AppSettings, ShiftTemplate } from './types';

/** Valores por defecto antes del onboarding (PRD F0). El salario 0 obliga a configurarlo. */
export const DEFAULT_SETTINGS: AppSettings = {
  baseSalary: 0,
  dailyLimitHours: 8,
  weeklyLimitHours: 42,
  payPeriod: 'quincenal',
  transportAllowance: { enabled: false },
  holidayOrdinaryPay: 'completa',
};

export const DEFAULT_TEMPLATES: ShiftTemplate[] = [
  { id: 'tpl-dia', name: 'Día 06–18', startTime: '06:00', durationMinutes: 12 * 60 },
  { id: 'tpl-noche', name: 'Noche 18–06', startTime: '18:00', durationMinutes: 12 * 60 },
];
