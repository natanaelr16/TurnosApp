# Estado actual del proyecto

> Memoria viva del proyecto. **Todo agente la lee al iniciar y la actualiza al terminar.**
> Mantenerla corta (máx. ~60 líneas). El detalle histórico va en `BITACORA.md`.

**Última actualización:** 2026-10-24
**Fase actual:** Fase 0 — Fundaciones (ver `ROADMAP.md`)

## Qué existe hoy
- Proyecto Expo SDK 58 (Expo Router, TypeScript estricto) creado desde la plantilla `default`.
- Documentación base en `docs/` (PRD, reglas legales, arquitectura, diseño, cumplimiento, roadmap).
- Configuración de agentes Devin: `AGENTS.md`, `.devin/agents/`, `.devin/skills/`, `.devin/hooks.v1.json`.
- Las pantallas de la plantilla (`src/app/index.tsx`, `explore.tsx`) siguen sin cambios y se reemplazan en la Fase 2.

## En curso
- Nada en curso.

## Siguiente paso
1. Fase 1: instalar Jest (`npx expo install jest-expo jest @types/jest --dev`) y construir el motor de cálculo en `src/domain/` siguiendo `REGLAS_LEGALES.md`, con pruebas primero.

## Requisitos agregados recientemente
- Auxilio de transporte = interruptor manual Sí/No con valor editable; el usuario NO lo tiene incluido (D-009).
- Onboarding guiado obligatorio al primer uso (PRD F0, D-010). Se construye en Fase 3; el motor
  (Fase 1) debe recibir `transportAllowance.enabled/amount` desde la configuración.

## Decisiones pendientes con el usuario
- Confirmar el límite diario de horas ordinarias de su contrato (por defecto 8 h/día y 42 h/semana, configurable).
- Confirmar que los datos se guardan solo en el teléfono (se asumió así, ver D-002).

## Bloqueos / riesgos
- Ninguno.
