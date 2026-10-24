---
name: revision-legal
description: Audita el motor de cálculo (src/domain) contra docs/REGLAS_LEGALES.md usando el agente legal-reviewer
agent: legal-reviewer
---

Audita el motor de cálculo de TurnosApp:

- Compara `src/domain/` y sus pruebas con `docs/REGLAS_LEGALES.md`, sección por sección.
- Verifica fechas de vigencia (divisor 210 desde 2026-07-15, nocturno desde 19:00 desde 2025-12-25,
  dominical 90 % desde 2026-07-01 y 100 % desde 2027-07-01), festivos, extras diarios/semanales,
  deducciones, FSP y retención en la fuente.
- Calcula a mano al menos 3 casos y compáralos con las pruebas.
- Ejecuta las pruebas.

Entrega el veredicto (APROBADO / CAMBIOS REQUERIDOS), los hallazgos con archivo:línea y las pruebas faltantes.
