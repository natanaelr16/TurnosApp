/** Fecha y hora local de Colombia: 'YYYY-MM-DDTHH:mm' (D-006). */
export type LocalDateTime = string;
/** Fecha local: 'YYYY-MM-DD'. */
export type LocalDate = string;

export interface Shift {
  id: string;
  start: LocalDateTime;
  end: LocalDateTime;
  note?: string;
  fields?: { name: string; value: string | number }[];
}

export const NOVELTY_KINDS = ['rest', 'paid-leave', 'unpaid-leave', 'sick'] as const;
export interface Novelty {
  id: string;
  date: LocalDate;
  kind: typeof NOVELTY_KINDS[number];
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
  /** Formato de hora de toda la app; por defecto 24 h (D-025). */
  timeFormat?: '12h' | '24h';
  /** Ingresos adicionales por periodo (bonificación bimestral, variable). Clave: inicio
   *  del periodo `YYYY-MM-DD`. Suma al devengado completo: afecta IBC (salud/pensión)
   *  y la base de FSP/retención — D-030. */
  extraIncome?: Record<string, number>;
  /** Fechas de inicio de periodos cerrados/liquidados: bloquean crear, editar y
   *  eliminar registros en ese periodo hasta reabrirlo (D-032). */
  closedPeriods?: string[];
  /** Protección opcional del respaldo con contraseña (D-038). La clave maestra es
   *  local: NUNCA se exporta dentro del PDF (se quita al crear el respaldo). */
  backupProtection?: {
    masterKey: string;
    pwdWrap: { iter: number; salt: string; iv: string; ct: string; tag: string };
    recWrap: { iter: number; salt: string; iv: string; ct: string; tag: string };
    updatedAt: string;
  };
}

/** Configuración completa guardada en el teléfono (cálculo + estado del onboarding). */
export interface AppSettings extends Settings {
  onboardingCompletedAt?: string;
  legalNoticeAcceptedAt?: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  /** 'HH:mm' */
  startTime: string;
  durationMinutes: number;
}

/** Todo lo que la app persiste y lo que contiene un respaldo (D-014). */
export interface AppData {
  settings: AppSettings;
  shifts: Shift[];
  novelties: Novelty[];
  templates: ShiftTemplate[];
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
