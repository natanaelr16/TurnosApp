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
│   ├── backup-crypto.ts   # Cifrado opcional del respaldo (AES-256 + HMAC, crypto-es; D-038)
│   ├── types.ts
│   └── __tests__/
├── data/           # SQLite: db.ts (tipo Db), migrations.ts, repository.ts, testing/ (SQLite de Node para pruebas)
├── lib/            # Formatos de presentación (moneda, horas, fechas)
└── constants/      # Tema (colores semánticos, espaciado, radios)
```

Rutas actuales: `src/app/_layout.tsx` (SQLiteProvider + AppDataProvider + Stack.Protected),
`src/app/onboarding.tsx`, `src/app/(tabs)/_layout.tsx` (NativeTabs, cambio instantáneo, D-035) con `index` (Calendario),
`historial`, `resumen`, `ajustes`; modales protegidos `registro.tsx`, `plantillas.tsx` y `detalle.tsx`.
Calendario es una grilla fija (SafeAreaView, sin ScrollView); `lib/calendar.ts` genera semanas/colores
con índice memoizado de registros. Recupera fecha actual al enfocar/reanudar y al cambiar el día.
Modo año (D-022): tocar el nombre del mes muestra 12 `MiniMonth` con los mismos colores y puntito
de segunda marca; tocar una miniatura abre la grilla de ese mes. Flechas cambian mes o año según el modo.
Estado global: `src/hooks/use-app-data.tsx` (`useAppData()`), con error/reintento de carga inicial.
Componentes base: `src/components/ui.tsx` (`Screen` con footer opcional y soporte de teclado).
Formularios F0/F1: `src/components/settings-fields.tsx` comparte campos/opciones; `src/lib/settings-form.ts`
convierte borradores y valida entradas (sin cálculos legales). `completeOnboarding` en el repositorio guarda
settings + plantillas en una transacción; la acción homónima del provider recarga los datos al terminar.
F2: `record-fields.tsx` usa selectores nativos de `@expo/ui/community/datetime-picker` (sin dependencias nuevas).
`record-card.tsx` es una fila/tarjeta consultable de Historial con horas extra/recargos.
`detalle.tsx` consulta registros de una fecha (calendario) o por id (historial), sin abrir edición.
`shift-breakdown.tsx` muestra minutos/importes por categoría; edición se abre como acción explícita.
`period-selector.tsx` comparte navegación compacta por periodo entre Historial/Resumen.
`hooks/use-period-pdf.ts` pide consentimiento, genera PDF con expo-print y comparte con
expo-sharing; recibe kind 'turnos' (Historial) o 'liquidacion' (Resumen).
`lib/period-report.ts` genera tres PDFs: `buildShiftsReport` (badges de color del
calendario), `buildPayrollReport` (liquidación con recargos índigo y extras verde) y
`buildBackupReport` (portada de respaldo); escapa todos los datos de usuario.
`hooks/use-backup.ts` concentra exportar (PDF + JSON incrustado) e importar/restaurar
(elegir PDF, validar, confirmar, reemplazar); lo usan Ajustes y el onboarding (D-034).
`lib/backup-file.ts` (F7, D-033) incrusta el JSON de respaldo tras `%%EOF` del PDF
(`attachBackupToPdf`) y lo extrae (`readBackupFromPdf`); Ajustes → Datos exporta el PDF
restaurable y restaura con `expo-document-picker` ~58.0.4 + `expo-file-system` ~58.0.13,
reemplazando todos los datos vía `repository.replaceAppData`.
`lib/record-form.ts` convierte valores texto/número y fechas de selectores sin `toISOString`;
exporta `NOVELTY_LABELS` y `WARNING_LABELS` (avisos de extras compartidos por registro y detalle).
`registro.tsx` emite háptico de éxito al guardar con `expo-haptics` ~58.0.7 (D-022) y ofrece
chips de turnos programados + formato de hora 12/24 global (`settings.timeFormat`, D-025)
formateado por `lib/format.ts → formatTime`. Calendario con swipe de meses, scroll de años,
selector de década, popover por pulsación larga y eliminación con basurita animada usando
`@expo/vector-icons` ^15.0.2 (D-024); eliminación también en `/detalle`. Resumen muestra el
cuadro de liquidación por factor de `payroll.liquidationTable` (D-026).
`domain/records.ts` valida registros/plantillas, aplica plantillas, calcula cobertura y acumulados sin neto.
`repository.saveRecord` valida contra datos actuales y guarda en una transacción.

Persistencia: `settings` es una fila única con el JSON de `AppSettings` (fácil de versionar junto al
respaldo); `shifts`, `shift_templates` y `novelties` son tablas. Esquema v2: migración transaccional
v1→v2 añade `shifts.fields_json` y `novelties` sin alterar registros anteriores.
Nueva migración = subir `DATABASE_VERSION` y agregar un bloque `if (version === N)` con prueba.
Respaldo formato 2 incluye novedades/campos; `parseBackup` migra formato 1 a novedades vacías (D-018).

**Regla de dependencias:** `app → hooks → (domain, data)`. `domain` no importa nada del proyecto
fuera de sí mismo. `data` puede importar tipos de `domain`.

## Modelo de datos (borrador)
- `Shift { id, start: 'YYYY-MM-DDTHH:mm', end: 'YYYY-MM-DDTHH:mm', note?, fields?: { name, value: string|number }[] }`
  (`created_at`/`updated_at` solo se mantienen en SQLite).
- `Novelty { id, date: 'YYYY-MM-DD', kind: 'rest'|'paid-leave'|'unpaid-leave'|'sick', note? }`.
  Una por fecha de inicio de jornada, incompatible con turnos que comiencen ese día (D-019).
- `AppData { settings, shifts, templates, novelties }`.
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
   No se usa actualmente en Resumen: todavía proyecta quincena ×2 y no aplica novedades.
   Resumen usa `recordCoverage` internamente para un aviso breve, sin mostrar faltantes (D-020).
   Historial/detalle/PDF usan los cálculos de turnos/acumulados; F6 sigue pendiente.

## Seguridad de dependencias (pendiente)
`npm audit --omit=dev` reportó 5 entradas high por Expo CLI/code-signing/node-forge y zod
(también usado en lint). No aplicar `npm audit fix --force`: sugiere bajar Expo a SDK 44.
Revisar actualización compatible antes de publicar; no se han cambiado overrides ni políticas.

## Comandos
```bash
npx expo start          # servidor de desarrollo (i = iOS, a = Android)
npx expo start --go --lan --port 8083  # alternativa probada si localhost falla por IPv4/IPv6
npm test                # pruebas (Jest, una pasada) · npm run test:watch (modo vigilancia)
npx expo lint           # lint (ESLint 9, eslint.config.js)
npm run typecheck       # verificación de tipos (tsc --noEmit)
npx expo-doctor         # salud del proyecto
npx eas-cli build --platform ios --profile production   # build de tienda (requiere eas.json + cuenta Apple)
```

Distribución: `eas.json` define perfiles `development`/`preview`/`production` (autoIncrement).
`eas.json → submit.production.ios`: `ascAppId` 6828459921 + llave ASC API local
(`~/Downloads/AuthKey_QX47VJDJBL.p8`, issuer 116e6061-…, team J2W4AY4LP6) →
`npx eas-cli submit --platform ios --profile production --id <buildId> --non-interactive`.
App Store Connect también operable vía API con JWT ES256 firmado con la misma llave
(ej.: adjuntar build a la versión: `PATCH /v1/appStoreVersions/{id}/relationships/build`).
Identidad: `com.natanaelr16.turnosapp` (iOS y Android, app.json); íconos en `assets/images/`
(icon.png 1024, splash-icon.png, adaptativos Android). Política de privacidad: `docs/POLITICA_PRIVACIDAD.md`.

Notas: las pruebas se nombran `*-test.ts` (convención de `jest-expo`). `expo-env.d.ts` lo genera
`npx expo start` y está en `.gitignore`.
