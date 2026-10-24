---
name: iniciar-sesion
description: Retoma el proyecto - lee estado, roadmap y bitácora, verifica el repo y propone el siguiente paso
allowed-tools:
  - read
  - grep
  - glob
  - exec
permissions:
  allow:
    - Exec(git status)
    - Exec(git log)
---

Retoma el trabajo en TurnosApp:

1. Lee `docs/ESTADO.md`, `docs/ROADMAP.md` y las 2 entradas más recientes de `docs/BITACORA.md`.
2. Ejecuta `git status --short` y `git log --oneline -5` para detectar trabajo sin commitear o
   diferencias con lo que dice ESTADO.md.
3. Si ESTADO.md no coincide con la realidad del repo, señálalo.
4. Responde al usuario en español, breve:
   - **Dónde vamos:** fase y último avance (2–3 líneas).
   - **Pendiente del usuario:** decisiones o acciones que solo él puede hacer.
   - **Siguiente paso propuesto:** 1–3 tareas concretas del ROADMAP.
5. Pregunta si avanzamos con el siguiente paso propuesto u otra cosa. No empieces a programar sin confirmación.
