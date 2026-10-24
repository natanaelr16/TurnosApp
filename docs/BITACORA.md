# Bitácora de sesiones

Registro cronológico (más reciente arriba). Una entrada por sesión de trabajo.
Formato: fecha, objetivo, qué se hizo, verificación ejecutada, pendientes.

---

## 2026-10-24 — Requisitos: auxilio de transporte opcional y onboarding
- **Objetivo:** incorporar pedidos del usuario antes de programar.
- **Hecho:** PRD F0 (onboarding guiado) y F1 (auxilio Sí/No manual); REGLAS_LEGALES §6 (auxilio solo si está
  activado); ARQUITECTURA (modelo `transportAllowance`, redirección a `onboarding/`); DISENO (pantallas de
  onboarding); ROADMAP; decisiones D-009 y D-010.
- **Verificación:** no aplica (solo documentación).
- **Pendientes:** respuesta del usuario sobre límite diario y almacenamiento local; Fase 1.

## 2026-10-24 — Fase 0: fundaciones
- **Objetivo:** crear el proyecto, la documentación y el sistema de agentes.
- **Hecho:**
  - Proyecto Expo SDK 58 creado en `~/Developer/TurnosApp`.
  - Docs: `PRD`, `REGLAS_LEGALES` (normativa vigente a oct-2026 verificada en fuentes oficiales), `ARQUITECTURA`, `DISENO`, `CUMPLIMIENTO`, `ROADMAP`, `DECISIONES`, `ESTADO`.
  - Agentes Devin: `legal-reviewer`, `ui-designer`, `qa-tester`, `store-compliance`.
  - Skills: `/iniciar-sesion`, `/cerrar-sesion`, `/nueva-funcionalidad`, `/verificar`, `/revision-legal`, `/revision-ui`, `/actualizar-normativa`.
  - Hooks: al iniciar sesión se inyecta `ESTADO.md`; al terminar se bloquea una vez si hubo cambios en código sin actualizar `ESTADO.md`.
- **Verificación:** no aplica (sin lógica de negocio todavía).
- **Pendientes:** Fase 1 (motor de cálculo).
