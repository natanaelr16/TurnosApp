# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-24
**Fase actual:** Fase 2 — Datos y estructura **completada**. Próxima: Fase 3 (ver `ROADMAP.md`).

## Qué existe hoy
- **Motor** `src/domain/` validado contra planilla real (D-013) + `backup.ts` (formato de respaldo
  versionado, validación estricta, combinar turnos) + `defaults.ts` + `factorTable()`.
- **Datos** `src/data/`: SQLite (`expo-sqlite`), migraciones por `PRAGMA user_version`, repositorio
  (settings como JSON, shifts, shift_templates sembradas "Día 06–18"/"Noche 18–06"), restaurar atómico,
  borrar todo. Probado con SQLite real de Node (`src/data/testing/node-sqlite-db.ts`).
- **App**: `AppDataProvider` (`src/hooks/use-app-data.tsx`) carga todo y expone acciones.
  Navegación: `Stack.Protected` → `onboarding` (si no hay `onboardingCompletedAt`) o `(tabs)` con
  pestañas nativas Calendario / Historial / Resumen / Ajustes.
  - Resumen ya calcula el periodo actual con el motor. Ajustes muestra configuración, tabla de factores
    y "Borrar todos mis datos".
  - Onboarding es **temporal**: botón "Continuar con datos de ejemplo" (salario 3.000.000).
- Componentes base `src/components/ui.tsx` (Screen con `scroll`, Card, ValueRow, Button con `disabled`,
  EmptyState con acción) y tema con colores semánticos claro/oscuro (contraste AA revisado).
- Plantilla de Expo eliminada. Verificación: 80 pruebas ✅, tsc ✅, lint ✅, expo-doctor 20/20 ✅.
- Usuario confirmó datos solo en el teléfono + respaldo PDF (F7, D-014).
- **Repo en GitHub:** https://github.com/natanaelr16/TurnosApp (`main` sincronizada).
- **Config Devin:** `model: adaptive` + `subagent_model: swe` en `~/.config/devin/config.json`
  (ahorro de créditos; sesiones cortas, `/ask` para preguntas, `@` para archivos).

## Siguiente paso
0. Crear simulador **iPhone Pro Max (18)** (`xcrun simctl`) y probar la app en pantalla grande.
1. Fase 3: onboarding real (F0) → Ajustes editables (F1) → crear/editar turno con plantillas (F2) →
   calendario (F3) → detalle (F4) → historial (F5, usar `Screen scroll={false}` + FlatList) → resumen (F6).
2. Fase 3.6: respaldo PDF (validar librería para incrustar JSON en PDF con Expo SDK 58).

## Problemas conocidos / pendientes de verificar
- Las capturas de pantalla del simulador desde el agente salen negras (limitación del entorno); la
  verificación visual la hace el usuario en la ventana del Simulator.
- Verificar en iPhone real que el padding inferior (`BottomTabInset`) no deja hueco con tabs nativas.
- `AppDataProvider` recarga toda la BD tras cada cambio (aceptable hoy; optimizar si hay cientos de turnos).
- Subagentes de `.devin/agents/` solo cargan si la sesión de Devin se abre en `~/Developer/TurnosApp`.

## UI debe recordar
- Aviso si el año no tiene parámetros (`hasYearlyParams`); avisos de extras y errores de `validateShifts`.
- Al exportar PDF, aviso de privacidad (CUMPLIMIENTO).

## Decisiones pendientes con el usuario
- Ninguna.

## Bloqueos / riesgos
- Ninguno.
