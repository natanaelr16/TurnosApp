/** Fecha y hora local de Colombia: 'YYYY-MM-DDTHH:mm' (D-006). */
export type LocalDateTime = string;
/** Fecha local: 'YYYY-MM-DD'. */
export type LocalDate = string;

export interface Shift {
  id: string;
  start: LocalDateTime;
  end: LocalDateTime;
  note?: string;
}

/** Porcentajes (35 = 35 %) que el usuario puede sobrescribir (D-005). */
export interface RateOverrides {
  nightPct?: number;
  sundayPct?: number;
  extraDayPct?: number;
  extraNightPct?: number;
}

export type PayPeriodType = 'quincenal' | 'mensual';

export interface Settings {
  baseSalary: number;
  /** Divisor mensual personalizado; si falta se usa el legal según la fecha. */
  monthlyDivisor?: number;
  dailyLimitHours: number;
  weeklyLimitHours: number;
  payPeriod: PayPeriodType;
  overrides?: RateOverrides;
  /** Horas ordinarias en domingo/festivo: hora + recargo (por defecto) o solo recargo (D-013). */
  holidayOrdinaryPay?: 'completa' | 'solo-recargo';
  /** Interruptor manual (D-009). `amount` por defecto: el legal del año. */
  transportAllowance: { enabled: boolean; amount?: number };
  /** Deducciones mensuales para retención (dependientes, vivienda, etc.). */
  monthlyDeductions?: number;
}

export const MINUTE_CATEGORIES = [
  'ordinaryDay',
  'ordinaryNight',
  'ordinaryDayHoliday',
  'ordinaryNightHoliday',
  'extraDay',
  'extraNight',
  'extraDayHoliday',
  'extraNightHoliday',
] as const;

export type MinuteCategory = (typeof MINUTE_CATEGORIES)[number];
export type ByCategory = Record<MinuteCategory, number>;

export type ShiftWarning = 'EXTRA_DIARIO_EXCEDIDO' | 'EXTRA_SEMANAL_EXCEDIDO';

export interface ShiftResult {
  shift: Shift;
  hourValue: number;
  totalMinutes: number;
  extraMinutes: number;
  minutes: ByCategory;
  /** Pesos adicionales al salario por categoría (redondeados). */
  amounts: ByCategory;
  surchargeTotal: number;
  extraTotal: number;
  total: number;
  warnings: ShiftWarning[];
}

export interface ShiftValidationError {
  shiftId: string;
  code: 'FIN_ANTES_DE_INICIO' | 'DURACION_EXCESIVA' | 'SUPERPUESTO';
  otherShiftId?: string;
}

export interface PeriodRange {
  start: LocalDate;
  end: LocalDate;
}

export interface PeriodSummary {
  period: PeriodRange;
  shiftCount: number;
  minutes: ByCategory;
  basePay: number;
  surcharges: number;
  extras: number;
  transportAllowance: number;
  gross: number;
  contributionBase: number;
  health: number;
  pension: number;
  solidarityFund: number;
  withholding: number;
  totalDeductions: number;
  net: number;
}
