# Arquitectura

## Stack
- **Expo SDK 58**, React Native 0.88, React 19, TypeScript estricto, Expo Router (rutas en `src/app/`).
- **Persistencia:** `expo-sqlite` (local, D-002).
- **Pruebas:** Jest con `jest-expo`; pruebas del dominio en `src/domain/__tests__/*-test.ts`.
- Dependencias nuevas: solo con `npx expo install <paquete>` y registrando el motivo en `DECISIONES.md`.

## Capas y carpetas

```
src/
├── app/            # Pantallas (Expo Router). Solo UI y navegación, sin lógica de cálculo.
├── components/     # Componentes visuales reutilizables.
├── hooks/          # Hooks de React (conectan UI con datos/dominio).
├── domain/         # Motor de cálculo PURO (sin React/Expo). Fuente: docs/REGLAS_LEGALES.md
│   ├── legal-params.ts   # Parámetros por fecha (SMMLV, UVT, divisor, %), tablas
│   ├── holidays.ts       # Festivos de Colombia
│   ├── time.ts           # Utilidades de fecha/hora local (YYYY-MM-DDTHH:mm)
│   ├── shift-calc.ts     # Clasificación minuto a minuto y valor de cada turno
│   ├── payroll.ts        # Resumen de periodo, deducciones, retención
│   ├── types.ts
│   └── __tests__/
├── data/           # SQLite: db.ts (tipo Db), migrations.ts, repository.ts, testing/ (SQLite de Node para pruebas)
├── lib/            # Formatos de presentación (moneda, horas, fechas)
└── constants/      # Tema (colores semánticos, espaciado, radios)
```

Rutas actuales: `src/app/_layout.tsx` (SQLiteProvider + AppDataProvider + Stack.Protected),
`src/app/onboarding.tsx`, `src/app/(tabs)/_layout.tsx` (NativeTabs) con `index` (Calendario),
`historial`, `resumen`, `ajustes`. Estado global: `src/hooks/use-app-data.tsx` (`useAppData()`).
Componentes base: `src/components/ui.tsx`.

Persistencia: `settings` es una fila única con el JSON de `AppSettings` (fácil de versionar junto al
respaldo); `shifts` y `shift_templates` son tablas. Nueva migración = subir `DATABASE_VERSION` y
agregar un bloque `if (version === N)` en `migrations.ts`, con prueba.

**Regla de dependencias:** `app → hooks → (domain, data)`. `domain` no importa nada del proyecto
fuera de sí mismo. `data` puede importar tipos de `domain`.

## Modelo de datos (borrador)
- `Shift { id, start: 'YYYY-MM-DDTHH:mm', end: 'YYYY-MM-DDTHH:mm', note?, createdAt, updatedAt }`
- `Settings { baseSalary, monthlyDivisor?, dailyLimitHours, weeklyLimitHours, payPeriod: 'quincenal'|'mensual',
  overrides: { nightPct?, sundayPct?, extraDayPct?, extraNightPct? },
  holidayOrdinaryPay?: 'completa' | 'solo-recargo',
  transportAllowance: { enabled: boolean, amount?: number /* por defecto el legal del año */ },
  monthlyDeductions?, onboardingCompletedAt?: string, legalNoticeAcceptedAt?: string }`
- Si no existe `Settings` u `onboardingCompletedAt` está vacío, `src/app/_layout.tsx` redirige a
  `src/app/onboarding/` (Expo Router) antes de mostrar las pestañas (D-010).
- `ShiftTemplate { id, name, startTime: 'HH:mm', durationMinutes }`

Los resultados de cálculo **no se guardan**: se recalculan desde los turnos y la configuración,
así un cambio de salario o de porcentaje se refleja en todo el historial.

## Flujo de cálculo
1. `computeShifts(shifts, settings)` → recorre minuto a minuto en orden cronológico, clasifica
   (diurno/nocturno, dominical/festivo, ordinario/extra) y valora cada turno.
2. `computePeriod(shiftResults, settings, periodo)` → devengado, IBC, deducciones, neto.

## Comandos
```bash
npx expo start          # servidor de desarrollo (i = iOS, a = Android)
npm test                # pruebas (Jest, una pasada) · npm run test:watch (modo vigilancia)
npx expo lint           # lint (ESLint 9, eslint.config.js)
npm run typecheck       # verificación de tipos (tsc --noEmit)
npx expo-doctor         # salud del proyecto
```

Notas: las pruebas se nombran `*-test.ts` (convención de `jest-expo`). `expo-env.d.ts` lo genera
`npx expo start` y está en `.gitignore`.
