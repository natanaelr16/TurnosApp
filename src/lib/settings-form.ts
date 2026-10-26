import { yearlyParams } from '@/domain/legal-params';
import type { AppSettings, RateOverrides } from '@/domain/types';

export const RATE_FIELDS = ['nightPct', 'sundayPct', 'extraDayPct', 'extraNightPct'] as const;
export type SettingsDraft = {
  salary: string;
  allowanceEnabled: boolean | null;
  allowance: string;
  payPeriod: AppSettings['payPeriod'];
  daily: string;
  weekly: string;
  divisor: string;
  holidayPay: 'completa' | 'solo-recargo';
} & Record<keyof RateOverrides, string>;
export type DraftErrors = Partial<Record<keyof SettingsDraft, string>>;

export function draftFromSettings(settings: AppSettings, date: string): SettingsDraft {
  return {
    salary: settings.baseSalary ? String(settings.baseSalary) : '',
    allowanceEnabled: settings.transportAllowance.enabled,
    allowance: String(settings.transportAllowance.amount ?? yearlyParams(Number(date.slice(0, 4))).transportAllowance),
    payPeriod: settings.payPeriod,
    daily: String(settings.dailyLimitHours),
    weekly: String(settings.weeklyLimitHours),
    divisor: settings.monthlyDivisor === undefined ? '' : String(settings.monthlyDivisor),
    holidayPay: settings.holidayOrdinaryPay ?? 'completa',
    nightPct: String(settings.overrides?.nightPct ?? ''),
    sundayPct: String(settings.overrides?.sundayPct ?? ''),
    extraDayPct: String(settings.overrides?.extraDayPct ?? ''),
    extraNightPct: String(settings.overrides?.extraNightPct ?? ''),
  };
}

const numeric = (text: string) => Number(text.replace(',', '.'));

export function validateSettingsDraft(draft: SettingsDraft): DraftErrors {
  const errors: DraftErrors = {};
  const check = (key: keyof SettingsDraft, min: number, max: number, integer = false, optional = false) => {
    const text = String(draft[key]);
    if (optional && text === '') return;
    const value = numeric(text);
    if (!/^\d+(?:[.,]\d+)?$/.test(text) || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isSafeInteger(value))) {
      errors[key] = `Ingresa ${integer ? 'un número entero' : 'un número'} entre ${min} y ${max}.`;
    }
  };
  check('salary', 1, Number.MAX_SAFE_INTEGER, true);
  if (draft.allowanceEnabled === null) errors.allowanceEnabled = 'Elige Sí o No para continuar.';
  if (draft.allowanceEnabled) check('allowance', 0, Number.MAX_SAFE_INTEGER, true);
  check('daily', 1, 24);
  check('weekly', 1, 168);
  check('divisor', 1, 744, false, true);
  RATE_FIELDS.forEach((key) => check(key, 0, 1000, false, true));
  return errors;
}

export function settingsFromDraft(draft: SettingsDraft, previous: AppSettings): AppSettings {
  const overrides: RateOverrides = {};
  RATE_FIELDS.forEach((key) => { if (draft[key] !== '') overrides[key] = numeric(draft[key]); });
  return {
    ...previous,
    baseSalary: numeric(draft.salary),
    transportAllowance: { enabled: draft.allowanceEnabled === true, ...(draft.allowanceEnabled ? { amount: numeric(draft.allowance) } : {}) },
    payPeriod: draft.payPeriod,
    dailyLimitHours: numeric(draft.daily),
    weeklyLimitHours: numeric(draft.weekly),
    monthlyDivisor: draft.divisor === '' ? undefined : numeric(draft.divisor),
    holidayOrdinaryPay: draft.holidayPay,
    overrides,
  };
}
