# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-24
**Fase actual:** Fase 1 — Motor de cálculo **completada**. Próxima: Fase 2 (ver `ROADMAP.md`).

## Qué existe hoy
- Proyecto Expo SDK 58 (Expo Router, TypeScript estricto). Pantallas aún de la plantilla.
- Documentación en `docs/` y configuración de agentes Devin (`AGENTS.md`, `.devin/`).
- **Motor de cálculo** en `src/domain/` (TypeScript puro), 50 pruebas en verde:
  - `holidays.ts` festivos de Colombia · `legal-params.ts` parámetros por fecha/año, FSP, tabla de retención
  - `shift-calc.ts` `computeShifts()` minuto a minuto (diurno/nocturno, dominical/festivo, extras por
    8 h/día o 42 h/semana), avisos de 2 h/día y 12 h/semana, `validateShifts()`
  - `payroll.ts` `periodFor()`, `computePeriod()` (básico, recargos, extras, auxilio opcional, salud,
    pensión, FSP, retención estimada), `withholdingMonthly()`
- Usuario confirmó: 8 h ordinarias/día (resto extra), cálculo según hora real de entrada y salida.

## En curso
- Nada.

## Siguiente paso
1. Fase 2: `expo-sqlite` (tablas `settings`, `shifts`, `shift_templates`), navegación por pestañas,
   tema con colores semánticos, eliminar pantallas de ejemplo de la plantilla.
2. Fase 3 empieza por el onboarding (F0).

## Problemas conocidos
- `npx tsc --noEmit` reporta 1 error y `npx expo lint` 1 error, ambos en código de ejemplo de la plantilla
  (`src/components/app-tabs.web.tsx`, `src/hooks/use-color-scheme.web.ts`). Se resuelven al eliminar
  la plantilla en Fase 2. `src/domain/` está limpio.
- `expo-env.d.ts` es generado e ignorado por git; si falta, `npx expo start` lo recrea.
- Los subagentes personalizados (`.devin/agents/`) solo cargan si la sesión de Devin se abre dentro de
  `~/Developer/TurnosApp`.

## UI debe recordar (de la revisión legal)
- Mostrar aviso si el año del periodo no tiene parámetros cargados (`hasYearlyParams`).
- Mostrar avisos `EXTRA_DIARIO_EXCEDIDO` / `EXTRA_SEMANAL_EXCEDIDO` y errores de `validateShifts`.

## Decisiones pendientes con el usuario
- Confirmar que los datos se guardan solo en el teléfono (se asumió así, ver D-002).

## Bloqueos / riesgos
- Ninguno.
